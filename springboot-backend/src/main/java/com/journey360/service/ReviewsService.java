package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ReviewsService {

    private static final Logger log = LoggerFactory.getLogger(ReviewsService.class);

    @Value("${serpapi.api.key:}")
    private String serpApiKey;

    @Value("${foursquare.api.key:}")
    private String foursquareKey;

    private final WebClient webClient;

    // In-memory cache: key = "placeName|destination" -> {data, timestamp}
    private final Map<String, CacheEntry> reviewsCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL = 86400_000L; // 24 hours in millis

    private record CacheEntry(Map<String, Object> data, long timestamp) {
    }

    public ReviewsService(WebClient webClient) {
        this.webClient = webClient;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getPlaceReviews(String placeName, String destination) {
        String cacheKey = placeName.toLowerCase().trim() + "|" + destination.toLowerCase().trim();

        // Check cache
        CacheEntry cached = reviewsCache.get(cacheKey);
        if (cached != null && System.currentTimeMillis() - cached.timestamp() < CACHE_TTL) {
            Map<String, Object> result = new LinkedHashMap<>(cached.data());
            result.put("cached", true);
            return result;
        }

        // Try SerpAPI first
        Map<String, Object> result = fetchSerpApi(placeName, destination);

        // Fallback to Foursquare
        if (result == null) {
            result = fetchFoursquare(placeName, destination);
        }

        if (result == null)
            return null;

        // Cache it
        reviewsCache.put(cacheKey, new CacheEntry(result, System.currentTimeMillis()));

        log.info("REVIEWS: {}★ ({} reviews) for '{}' via {}",
                result.get("rating"), result.get("totalReviews"), placeName, result.get("source"));

        Map<String, Object> response = new LinkedHashMap<>(result);
        response.put("cached", false);
        return response;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchSerpApi(String placeName, String destination) {
        if (serpApiKey == null || serpApiKey.isBlank())
            return null;

        try {
            String query = placeName + ", " + destination;
            Map response = webClient.get()
                    .uri("https://serpapi.com/search", b -> b
                            .queryParam("engine", "google_maps")
                            .queryParam("q", query)
                            .queryParam("api_key", serpApiKey)
                            .queryParam("type", "search")
                            .queryParam("hl", "en")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return null;

            List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("local_results");
            if (results == null || results.isEmpty())
                return null;

            Map<String, Object> first = results.get(0);
            return Map.of(
                    "rating", first.getOrDefault("rating", 0),
                    "totalReviews", first.getOrDefault("reviews", 0),
                    "source", "google");
        } catch (Exception e) {
            log.warn("REVIEWS [SerpAPI]: Error for '{}': {}", placeName, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchFoursquare(String placeName, String destination) {
        if (foursquareKey == null || foursquareKey.isBlank())
            return null;

        try {
            // Step 1: Search
            Map searchResp = webClient.get()
                    .uri("https://api.foursquare.com/v3/places/search", b -> b
                            .queryParam("query", placeName)
                            .queryParam("near", destination)
                            .queryParam("limit", 1)
                            .build())
                    .header("Authorization", foursquareKey)
                    .header("Accept", "application/json")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (searchResp == null)
                return null;
            List<Map<String, Object>> results = (List<Map<String, Object>>) searchResp.get("results");
            if (results == null || results.isEmpty())
                return null;

            String fsqId = (String) results.get(0).get("fsq_id");
            if (fsqId == null)
                return null;

            // Step 2: Get details
            Map detail = webClient.get()
                    .uri("https://api.foursquare.com/v3/places/" + fsqId, b -> b
                            .queryParam("fields", "rating,stats")
                            .build())
                    .header("Authorization", foursquareKey)
                    .header("Accept", "application/json")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (detail == null)
                return null;

            Number rawRating = (Number) detail.get("rating");
            if (rawRating == null)
                return null;

            Map<String, Object> stats = (Map<String, Object>) detail.getOrDefault("stats", Map.of());

            return Map.of(
                    "rating", Math.round(rawRating.doubleValue() / 2 * 10.0) / 10.0,
                    "totalReviews", stats.getOrDefault("total_ratings", 0),
                    "source", "foursquare");
        } catch (Exception e) {
            log.warn("REVIEWS [Foursquare]: Error for '{}': {}", placeName, e.getMessage());
            return null;
        }
    }
}
