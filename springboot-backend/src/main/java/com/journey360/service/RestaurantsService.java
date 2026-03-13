package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class RestaurantsService {

    private static final Logger log = LoggerFactory.getLogger(RestaurantsService.class);

    @Value("${serpapi.api.key:}")
    private String serpApiKey;

    private final WebClient webClient;

    public RestaurantsService(WebClient webClient) {
        this.webClient = webClient;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchRestaurants(String location) {
        if (serpApiKey == null || serpApiKey.isBlank()) {
            log.warn("SERPAPI_API_KEY not found");
            return List.of();
        }

        try {
            Map response = webClient.get()
                    .uri("https://serpapi.com/search", b -> b
                            .queryParam("engine", "google_local")
                            .queryParam("q", "best restaurants in " + location)
                            .queryParam("api_key", serpApiKey)
                            .queryParam("hl", "en")
                            .queryParam("gl", "in")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return List.of();

            List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("local_results");
            if (results == null)
                return List.of();

            List<Map<String, Object>> restaurants = new ArrayList<>();
            for (Map<String, Object> res : results.subList(0, Math.min(10, results.size()))) {
                Map<String, Object> gps = (Map<String, Object>) res.get("gps_coordinates");

                Map<String, Object> restaurant = new LinkedHashMap<>();
                restaurant.put("name", res.get("title"));
                restaurant.put("rating", res.get("rating"));
                restaurant.put("reviews", res.get("reviews"));
                restaurant.put("type", res.get("type"));
                restaurant.put("address", res.get("address"));
                restaurant.put("lat", gps != null ? gps.get("latitude") : null);
                restaurant.put("lng", gps != null ? gps.get("longitude") : null);
                restaurant.put("description", res.getOrDefault("description",
                        "Highly rated local dining in " + location + "."));
                restaurants.add(restaurant);
            }

            return restaurants;
        } catch (Exception e) {
            log.error("Error searching restaurants: {}", e.getMessage());
            return List.of();
        }
    }
}
