package com.blogvibe.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:./uploads/images}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/uploads/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .allowCredentials(false);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path imagesPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path uploadsPath = imagesPath.getParent() != null ? imagesPath.getParent() : imagesPath;
        
        try {
            Files.createDirectories(imagesPath);
        } catch (Exception ignored) {}

        String imagesLocation = imagesPath.toUri().toString();
        if (!imagesLocation.endsWith("/")) {
            imagesLocation = imagesLocation + "/";
        }

        String uploadsLocation = uploadsPath.toUri().toString();
        if (!uploadsLocation.endsWith("/")) {
            uploadsLocation = uploadsLocation + "/";
        }

        String imagesPathStr = "file:" + imagesPath.toString().replace("\\", "/") + "/";
        String uploadsPathStr = "file:" + uploadsPath.toString().replace("\\", "/") + "/";

        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations(
                        "file:./uploads/images/",
                        "file:./backend/uploads/images/",
                        "file:../uploads/images/",
                        imagesLocation,
                        imagesPathStr
                );

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                        "file:./uploads/",
                        "file:./backend/uploads/",
                        "file:../uploads/",
                        uploadsLocation,
                        uploadsPathStr
                );
    }
}
