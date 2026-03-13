package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class HotelsService {

    private static final Logger log = LoggerFactory.getLogger(HotelsService.class);

    @Value("${serpapi.api.key:}")
    private String serpApiKey;

    private final WebClient webClient;
    private final PlacesService placesService;

    public HotelsService(WebClient webClient, PlacesService placesService) {
        this.webClient = webClient;
        this.placesService = placesService;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchHotels(String location, String checkInDate, String checkOutDate) {
        if (serpApiKey == null || serpApiKey.isBlank()) {
            log.warn("SERPAPI_API_KEY not found");
            return List.of();
        }

        // Default dates if not provided
        if (checkInDate == null || checkInDate.isBlank()) {
            checkInDate = LocalDate.now().plusDays(7).format(DateTimeFormatter.ISO_DATE);
        }
        if (checkOutDate == null || checkOutDate.isBlank()) {
            checkOutDate = LocalDate.now().plusDays(9).format(DateTimeFormatter.ISO_DATE);
        }

        final String cin = checkInDate;
        final String cout = checkOutDate;

        try {
            log.info("Searching hotels in {} ({} to {})...", location, cin, cout);

            Map response = webClient.get()
                    .uri("https://serpapi.com/search", b -> b
                            .queryParam("engine", "google_hotels")
                            .queryParam("q", "Hotels in " + location)
                            .queryParam("api_key", serpApiKey)
                            .queryParam("hl", "en")
                            .queryParam("gl", "in")
                            .queryParam("currency", "INR")
                            .queryParam("check_in_date", cin)
                            .queryParam("check_out_date", cout)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return List.of();

            List<Map<String, Object>> properties = (List<Map<String, Object>>) response.get("properties");
            if (properties == null)
                return List.of();

            List<Map<String, Object>> hotels = new ArrayList<>();
            for (Map<String, Object> prop : properties.subList(0, Math.min(5, properties.size()))) {
                Double lat = null, lng = null;
                Map<String, Object> gps = (Map<String, Object>) prop.get("gps_coordinates");
                if (gps != null) {
                    lat = ((Number) gps.get("latitude")).doubleValue();
                    lng = ((Number) gps.get("longitude")).doubleValue();
                }

                if (lat == null || lng == null) {
                    double[] coords = placesService.getCoordinates(prop.get("name") + " " + location);
                    if (coords != null) {
                        lat = coords[0];
                        lng = coords[1];
                    }
                }

                Map<String, Object> ratePerNight = (Map<String, Object>) prop.get("rate_per_night");
                Map<String, Object> totalRate = (Map<String, Object>) prop.get("total_rate");

                Map<String, Object> hotel = new LinkedHashMap<>();
                hotel.put("name", prop.get("name"));
                hotel.put("description", truncate((String) prop.getOrDefault("description",
                        "Premium accommodation found via Google Hotels."), 100));
                hotel.put("rate_per_night", ratePerNight != null ? ratePerNight.get("lowest") : null);
                hotel.put("total_rate", totalRate != null ? totalRate.get("lowest") : null);
                hotel.put("rating", prop.get("overall_rating"));
                hotel.put("reviews", prop.get("reviews"));

                List amenities = (List) prop.getOrDefault("amenities", List.of());
                hotel.put("amenities", amenities.subList(0, Math.min(3, amenities.size())));
                hotel.put("link", prop.get("link"));
                hotel.put("lat", lat);
                hotel.put("lng", lng);
                hotels.add(hotel);
            }

            return hotels;
        } catch (Exception e) {
            log.error("Error searching hotels: {}", e.getMessage());
            return List.of();
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null)
            return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen);
    }
}
