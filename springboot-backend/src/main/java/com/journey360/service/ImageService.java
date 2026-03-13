package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class ImageService {

    private static final Logger log = LoggerFactory.getLogger(ImageService.class);

    @Value("${serpapi.api.key:}")
    private String serpApiKey;

    private final WebClient webClient;

    private static final List<String> BAD_DOMAINS = List.of(
            "fbsbx", "facebook.com", "instagram.com", "lookaside");

    public ImageService(WebClient webClient) {
        this.webClient = webClient;
    }

    @SuppressWarnings("unchecked")
    public String getDestinationImage(String query) {
        if (serpApiKey == null || serpApiKey.isBlank()) {
            log.warn("SERPAPI_API_KEY missing, skipping image fetch.");
            return null;
        }

        try {
            Map response = webClient.get()
                    .uri("https://serpapi.com/search", uriBuilder -> uriBuilder
                            .queryParam("engine", "google_images")
                            .queryParam("q", query + " tourism")
                            .queryParam("api_key", serpApiKey)
                            .queryParam("num", 10)
                            .queryParam("safe", "active")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return null;

            List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("images_results");
            if (results == null)
                return null;

            for (Map<String, Object> result : results) {
                String imageUrl = (String) result.get("original");
                if (imageUrl != null) {
                    String lowerUrl = imageUrl.toLowerCase();
                    if (BAD_DOMAINS.stream().noneMatch(lowerUrl::contains)) {
                        return imageUrl;
                    }
                }
            }

            // Fallback: return first result even if from filtered domain
            if (!results.isEmpty()) {
                return (String) results.get(0).get("original");
            }

        } catch (Exception e) {
            log.warn("Image fetch error for {}: {}", query, e.getMessage());
        }

        return null;
    }
}
