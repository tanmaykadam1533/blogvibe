package com.blogvibe.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.nio.file.*;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.dir:./uploads/images}")
    private String uploadDir;

    @Value("${r2.access-key-id:${R2_ACCESS_KEY_ID:${AWS_ACCESS_KEY_ID:}}}")
    private String accessKeyId;

    @Value("${r2.secret-access-key:${R2_SECRET_ACCESS_KEY:${AWS_SECRET_ACCESS_KEY:}}}")
    private String secretAccessKey;

    @Value("${r2.endpoint:${R2_ENDPOINT:${AWS_ENDPOINT_URL_S3:}}}")
    private String endpoint;

    @Value("${r2.account-id:${R2_ACCOUNT_ID:${CLOUDFLARE_ACCOUNT_ID:}}}")
    private String accountId;

    @Value("${r2.bucket-name:${R2_BUCKET_NAME:${R2_BUCKET:${AWS_S3_BUCKET:}}}}")
    private String bucketName;

    @Value("${r2.public-url:${R2_PUBLIC_URL:${R2_CUSTOM_DOMAIN:}}}")
    private String publicUrlPrefix;

    private S3Client s3Client;
    private boolean isR2Enabled = false;

    @PostConstruct
    public void init() {
        String resolvedAccessKey = getFirstNonEmpty(
                accessKeyId,
                System.getenv("R2_ACCESS_KEY_ID"),
                System.getenv("AWS_ACCESS_KEY_ID"),
                System.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
                System.getenv("R2_ACCESS_KEY")
        );

        String resolvedSecretKey = getFirstNonEmpty(
                secretAccessKey,
                System.getenv("R2_SECRET_ACCESS_KEY"),
                System.getenv("AWS_SECRET_ACCESS_KEY"),
                System.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
                System.getenv("R2_SECRET_KEY")
        );

        String resolvedBucket = getFirstNonEmpty(
                bucketName,
                System.getenv("R2_BUCKET_NAME"),
                System.getenv("R2_BUCKET"),
                System.getenv("AWS_S3_BUCKET"),
                System.getenv("S3_BUCKET_NAME"),
                System.getenv("BUCKET_NAME")
        );

        String resolvedEndpoint = getFirstNonEmpty(
                endpoint,
                System.getenv("R2_ENDPOINT"),
                System.getenv("R2_ENDPOINT_URL"),
                System.getenv("AWS_ENDPOINT_URL_S3"),
                System.getenv("AWS_ENDPOINT_URL")
        );

        String resolvedAccountId = getFirstNonEmpty(
                accountId,
                System.getenv("R2_ACCOUNT_ID"),
                System.getenv("CLOUDFLARE_ACCOUNT_ID")
        );

        if ((resolvedEndpoint == null || resolvedEndpoint.isBlank()) && resolvedAccountId != null && !resolvedAccountId.isBlank()) {
            resolvedEndpoint = "https://" + resolvedAccountId.trim() + ".r2.cloudflarestorage.com";
        }

        if (resolvedAccessKey != null && !resolvedAccessKey.isBlank() &&
                resolvedSecretKey != null && !resolvedSecretKey.isBlank() &&
                resolvedBucket != null && !resolvedBucket.isBlank() &&
                resolvedEndpoint != null && !resolvedEndpoint.isBlank()) {

            try {
                this.accessKeyId = resolvedAccessKey;
                this.secretAccessKey = resolvedSecretKey;
                this.bucketName = resolvedBucket;
                this.endpoint = resolvedEndpoint.trim();

                if (!this.endpoint.startsWith("http://") && !this.endpoint.startsWith("https://")) {
                    this.endpoint = "https://" + this.endpoint;
                }

                AwsBasicCredentials credentials = AwsBasicCredentials.create(this.accessKeyId, this.secretAccessKey);

                this.s3Client = S3Client.builder()
                        .endpointOverride(URI.create(this.endpoint))
                        .credentialsProvider(StaticCredentialsProvider.create(credentials))
                        .region(Region.of("auto"))
                        .serviceConfiguration(S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                        .build();

                this.isR2Enabled = true;
                log.info("Cloudflare R2 Object Storage successfully initialized! Bucket: {}, Endpoint: {}", this.bucketName, this.endpoint);
            } catch (Exception e) {
                log.error("Failed to initialize Cloudflare R2 S3Client, falling back to local file storage: {}", e.getMessage(), e);
                this.isR2Enabled = false;
            }
        } else {
            log.info("Cloudflare R2 environment variables not detected or incomplete. Using local disk storage.");
        }
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Cannot store empty file.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";

        String filename = UUID.randomUUID() + extension;

        if (isR2Enabled) {
            return storeInR2(file, filename);
        } else {
            return storeLocally(file, filename);
        }
    }

    private String storeInR2(MultipartFile file, String filename) {
        try {
            String contentType = file.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "image/jpeg";
            }

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filename)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String resolvedPublicUrl = getFirstNonEmpty(
                    publicUrlPrefix,
                    System.getenv("R2_PUBLIC_URL"),
                    System.getenv("R2_CUSTOM_DOMAIN"),
                    System.getenv("R2_PUBLIC_DOMAIN")
            );

            if (resolvedPublicUrl != null && !resolvedPublicUrl.isBlank()) {
                String base = resolvedPublicUrl.trim().replaceAll("/+$", "");
                if (!base.startsWith("http://") && !base.startsWith("https://")) {
                    base = "https://" + base;
                }
                return base + "/" + filename;
            }

            String cleanEndpoint = endpoint.replaceAll("/+$", "");
            return cleanEndpoint + "/" + bucketName + "/" + filename;
        } catch (Exception ex) {
            log.error("Error uploading file to Cloudflare R2: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to upload file to Cloudflare R2: " + ex.getMessage(), ex);
        }
    }

    private String storeLocally(MultipartFile file, String filename) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path targetLocation = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String apiBaseUrl = System.getenv("API_BASE_URL");
            if (apiBaseUrl != null && !apiBaseUrl.isBlank()) {
                return apiBaseUrl.trim().replaceAll("/+$", "") + "/uploads/images/" + filename;
            }
            return "/uploads/images/" + filename;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file locally: " + ex.getMessage(), ex);
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;

        String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

        if (isR2Enabled && (fileUrl.contains("cloudflarestorage.com") || fileUrl.startsWith("http"))) {
            try {
                DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(filename)
                        .build();
                s3Client.deleteObject(deleteObjectRequest);
                log.info("Deleted object from Cloudflare R2: {}", filename);
            } catch (Exception e) {
                log.warn("Failed to delete file from Cloudflare R2: {}", e.getMessage());
            }
        }

        try {
            Path filePath = Paths.get(uploadDir).resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}
    }

    private String getFirstNonEmpty(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) {
                return v.trim();
            }
        }
        return null;
    }

    public boolean isR2Enabled() {
        return isR2Enabled;
    }
}
