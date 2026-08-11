package com.blogvibe.service;

import com.blogvibe.dto.ModerationResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AIService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;

    public AIService(ObjectMapper objectMapper, 
                     @Value("${google.gemini.api.key:}") String geminiApiKey) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
        this.geminiApiKey = geminiApiKey;
    }

    public ModerationResponse moderateBlog(String title, String content) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("Gemini API key is missing. Skipping moderation.");
            // Default to approved if no key is provided, or you could return an error.
            // But per requirements, "If Gemini is unavailable, return an appropriate error instead of publishing automatically."
            return ModerationResponse.builder()
                    .approved(false)
                    .reason("Moderation service is currently unavailable due to missing configuration.")
                    .confidence(0)
                    .categories(new HashMap<>())
                    .build();
        }

        String prompt = buildPrompt(title, content);

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            )
        );

        List<String> endpointUrls = List.of(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=",
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=",
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key="
        );

        try {
            org.springframework.web.client.HttpStatusCodeException lastHttpException = null;

            for (String baseUrl : endpointUrls) {
                try {
                    String url = baseUrl + geminiApiKey.trim();
                    
                    String responseStr = restClient.post()
                            .uri(url)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(requestBody)
                            .retrieve()
                            .body(String.class);

                    return parseResponse(responseStr);

                } catch (org.springframework.web.client.HttpStatusCodeException e) {
                    lastHttpException = e;
                    int status = e.getStatusCode().value();
                    if (status == 404 || status == 429) {
                        log.warn("Gemini endpoint {} returned {}, trying next candidate model...", baseUrl, status);
                        continue; // Try next model if 404 or 429 (limit 0)
                    }
                    // If it's a structural error (e.g. 400 bad key, 401, 403), throw to outer catch
                    throw e;
                }
            }

            if (lastHttpException != null) {
                throw lastHttpException;
            }
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("HTTP Error from Gemini API: status={}, body={}", e.getStatusCode(), errorBody, e);
            
            String detailedReason = "Gemini API Error (" + e.getStatusCode().value() + "): ";
            if (errorBody != null && errorBody.contains("message")) {
                try {
                    var errNode = objectMapper.readTree(errorBody).path("error").path("message");
                    if (!errNode.isMissingNode()) {
                        detailedReason += errNode.asText();
                    } else {
                        detailedReason += errorBody;
                    }
                } catch (Exception ex) {
                    detailedReason += errorBody;
                }
            } else {
                detailedReason += e.getStatusText();
            }

            return ModerationResponse.builder()
                    .approved(false)
                    .reason(detailedReason)
                    .confidence(0)
                    .categories(new HashMap<>())
                    .build();
        } catch (RestClientException e) {
            log.error("Error communicating with Gemini API", e);
            return ModerationResponse.builder()
                    .approved(false)
                    .reason("AI Moderation Service connection failed: " + e.getMessage())
                    .confidence(0)
                    .categories(new HashMap<>())
                    .build();
        } catch (Exception e) {
            log.error("Error parsing Gemini API response", e);
            return ModerationResponse.builder()
                    .approved(false)
                    .reason("Internal error while processing moderation results: " + e.getMessage())
                    .confidence(0)
                    .categories(new HashMap<>())
                    .build();
        }

        return ModerationResponse.builder()
                .approved(false)
                .reason("No available Gemini model could process the request.")
                .confidence(0)
                .categories(new HashMap<>())
                .build();
    }

    private String buildPrompt(String title, String content) {
        return "You are an AI content moderation system.\n" +
                "Analyze the blog below.\n" +
                "Determine whether it is safe to publish.\n" +
                "Consider:\n" +
                "Hate speech\n" +
                "Violence\n" +
                "Terrorism\n" +
                "Harassment\n" +
                "Adult content\n" +
                "Illegal activities\n" +
                "Drugs\n" +
                "Self harm\n" +
                "Fake medical information\n" +
                "Dangerous misinformation\n" +
                "Religious extremism\n" +
                "Political violence\n" +
                "Spam\n" +
                "Fraud\n\n" +
                "Return ONLY valid JSON.\n" +
                "Example:\n" +
                "{\n" +
                "  \"approved\": true,\n" +
                "  \"confidence\": 97,\n" +
                "  \"reason\": \"Educational and safe content.\",\n" +
                "  \"categories\": {\n" +
                "    \"hateSpeech\": false,\n" +
                "    \"violence\": false,\n" +
                "    \"adult\": false,\n" +
                "    \"illegal\": false,\n" +
                "    \"misinformation\": false,\n" +
                "    \"spam\": false\n" +
                "  }\n" +
                "}\n\n" +
                "Blog Title:\n" + title + "\n\n" +
                "Blog Content:\n" + content;
    }

    private ModerationResponse parseResponse(String responseStr) throws Exception {
        // Extract the text part from Gemini's response
        var root = objectMapper.readTree(responseStr);
        String text = root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();

        // Gemini sometimes wraps JSON in markdown blocks like ```json ... ```
        String json = text.trim();
        if (json.startsWith("```json")) {
            json = json.substring(7);
        } else if (json.startsWith("```")) {
            json = json.substring(3);
        }
        if (json.endsWith("```")) {
            json = json.substring(0, json.length() - 3);
        }
        
        return objectMapper.readValue(json.trim(), ModerationResponse.class);
    }
}
