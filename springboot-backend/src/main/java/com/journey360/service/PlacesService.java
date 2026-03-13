package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class PlacesService {

    private static final Logger log = LoggerFactory.getLogger(PlacesService.class);

    @Value("${openroute.api.key:}")
    private String orsApiKey;

    private final WebClient webClient;

    private static final Map<String, double[]> FALLBACK_COORDS = Map.ofEntries(
            Map.entry("Chennai", new double[] { 13.0827, 80.2707 }),
            Map.entry("Kerala", new double[] { 10.8505, 76.2711 }),
            Map.entry("Delhi", new double[] { 28.6139, 77.2090 }),
            Map.entry("Mumbai", new double[] { 19.0760, 72.8777 }),
            Map.entry("Bengaluru", new double[] { 12.9716, 77.5946 }),
            Map.entry("Bangalore", new double[] { 12.9716, 77.5946 }),
            Map.entry("Tirupati", new double[] { 13.6288, 79.4192 }),
            Map.entry("China", new double[] { 35.8617, 104.1954 }),
            Map.entry("Beijing", new double[] { 39.9042, 116.4074 }),
            Map.entry("Shanghai", new double[] { 31.2304, 121.4737 }),
            Map.entry("London", new double[] { 51.5074, -0.1278 }),
            Map.entry("Paris", new double[] { 48.8566, 2.3522 }),
            Map.entry("New York", new double[] { 40.7128, -74.0060 }),
            Map.entry("Tokyo", new double[] { 35.6762, 139.6503 }),
            Map.entry("Dubai", new double[] { 25.2048, 55.2708 }),
            Map.entry("Singapore", new double[] { 1.3521, 103.8198 }));

    public PlacesService(WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Returns [latitude, longitude] or null.
     */
    @SuppressWarnings("unchecked")
    public double[] getCoordinates(String placeName) {
        // Check fallbacks first
        if (FALLBACK_COORDS.containsKey(placeName)) {
            return FALLBACK_COORDS.get(placeName);
        }

        // Try OpenRouteService
        if (orsApiKey != null && !orsApiKey.isBlank()) {
            try {
                Map response = webClient.get()
                        .uri("https://api.openrouteservice.org/geocode/search", b -> b
                                .queryParam("text", placeName)
                                .queryParam("api_key", orsApiKey)
                                .queryParam("size", 1)
                                .build())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response != null) {
                    List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");
                    if (features != null && !features.isEmpty()) {
                        Map<String, Object> geometry = (Map<String, Object>) features.get(0).get("geometry");
                        List<Number> coords = (List<Number>) geometry.get("coordinates");
                        return new double[] { coords.get(1).doubleValue(), coords.get(0).doubleValue() };
                    }
                }
            } catch (Exception e) {
                log.warn("ORS Geocoding Error: {}", e.getMessage());
            }
        }

        // Fallback: Nominatim
        try {
            log.info("Falling back to Nominatim for {}...", placeName);
            List response = webClient.get()
                    .uri("https://nominatim.openstreetmap.org/search", b -> b
                            .queryParam("q", placeName)
                            .queryParam("format", "json")
                            .queryParam("limit", 1)
                            .build())
                    .header("User-Agent", "Journey360_Student_Project/1.0")
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();

            if (response != null && !response.isEmpty()) {
                Map<String, Object> first = (Map<String, Object>) response.get(0);
                double lat = Double.parseDouble(first.get("lat").toString());
                double lon = Double.parseDouble(first.get("lon").toString());
                log.info("Nominatim success for {}: {}, {}", placeName, lat, lon);
                return new double[] { lat, lon };
            }
        } catch (Exception e) {
            log.warn("Nominatim Geocoding Error: {}", e.getMessage());
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getPlaces(String destination, String interest) {
        double[] coords = getCoordinates(destination);
        if (coords == null) {
            return List.of();
        }

        if (orsApiKey == null || orsApiKey.isBlank()) {
            return List.of();
        }

        try {
            Map response = webClient.get()
                    .uri("https://api.openrouteservice.org/geocode/search", b -> b
                            .queryParam("text", interest)
                            .queryParam("focus.point.lat", coords[0])
                            .queryParam("focus.point.lon", coords[1])
                            .queryParam("boundary.circle.radius", 20)
                            .queryParam("size", 20)
                            .queryParam("api_key", orsApiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return List.of();

            List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");
            if (features == null)
                return List.of();

            List<Map<String, Object>> places = new ArrayList<>();
            for (Map<String, Object> feature : features) {
                Map<String, Object> props = (Map<String, Object>) feature.get("properties");
                Map<String, Object> geom = (Map<String, Object>) feature.get("geometry");
                List<Number> featureCoords = (List<Number>) geom.get("coordinates");

                Map<String, Object> place = new LinkedHashMap<>();
                place.put("name", props.getOrDefault("name", "Unknown"));
                place.put("lat", featureCoords.get(1).doubleValue());
                place.put("lng", featureCoords.get(0).doubleValue());
                place.put("address", props.getOrDefault("label", "No address"));
                places.add(place);
            }
            return places;
        } catch (Exception e) {
            log.warn("Places API Error: {}", e.getMessage());
        }

        return List.of();
    }
}
