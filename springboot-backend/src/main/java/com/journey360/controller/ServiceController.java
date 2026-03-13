package com.journey360.controller;

import com.journey360.auth.FirebaseUser;
import com.journey360.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Proxied API controllers for Weather, Hotels, Restaurants, Emergency, and
 * Reviews.
 * These match the FastAPI service routes exactly.
 */
@RestController
public class ServiceController {

    @Autowired
    private WeatherService weatherService;
    @Autowired
    private HotelsService hotelsService;
    @Autowired
    private RestaurantsService restaurantsService;
    @Autowired
    private EmergencyService emergencyService;
    @Autowired
    private ReviewsService reviewsService;
    @Autowired
    private PlacesService placesService;
    @Autowired
    private NewsService newsService;

    // ===== Weather =====
    @GetMapping("/api/weather")
    public Map<String, Object> getWeather(@RequestParam String city,
            @AuthenticationPrincipal FirebaseUser user) {
        return weatherService.getWeather(city);
    }

    // ===== Hotels =====
    @GetMapping("/api/hotels/search")
    public List<Map<String, Object>> searchHotels(
            @RequestParam String location,
            @RequestParam(required = false, name = "check_in") String checkIn,
            @RequestParam(required = false, name = "check_out") String checkOut,
            @AuthenticationPrincipal FirebaseUser user) {
        return hotelsService.searchHotels(location, checkIn, checkOut);
    }

    // ===== Restaurants =====
    @GetMapping("/api/restaurants/search")
    public List<Map<String, Object>> searchRestaurants(
            @RequestParam String location,
            @AuthenticationPrincipal FirebaseUser user) {
        return restaurantsService.searchRestaurants(location);
    }

    // ===== Emergency =====
    @GetMapping("/api/emergency/numbers")
    public Map<String, Object> getEmergencyNumbers(@RequestParam String country,
            @AuthenticationPrincipal FirebaseUser user) {
        return emergencyService.getEmergencyNumbers(country);
    }

    // ===== Reviews =====
    @GetMapping("/api/reviews")
    public Map<String, Object> getReviews(@RequestParam("place_name") String placeName,
            @RequestParam String destination,
            @AuthenticationPrincipal FirebaseUser user) {
        Map<String, Object> result = reviewsService.getPlaceReviews(placeName, destination);
        if (result == null)
            return Map.of("rating", "", "totalReviews", "");
        return result;
    }

    // ===== Places / Geocoding =====
    @GetMapping("/api/places/geocode")
    public Map<String, Object> geocode(@RequestParam String query,
            @AuthenticationPrincipal FirebaseUser user) {
        double[] coords = placesService.getCoordinates(query);
        if (coords == null)
            return Map.of("error", "Location not found");
        return Map.of("lat", coords[0], "lng", coords[1], "query", query);
    }

    @GetMapping("/api/places/search")
    public List<Map<String, Object>> searchPlaces(@RequestParam String destination,
            @RequestParam String interest,
            @AuthenticationPrincipal FirebaseUser user) {
        return placesService.getPlaces(destination, interest);
    }

    // ===== News =====
    @GetMapping("/api/news/safety")
    public Map<String, Object> getSafetyNews(@RequestParam String city,
            @RequestParam(required = false, defaultValue = "") String country,
            @AuthenticationPrincipal FirebaseUser user) {
        try {
            List<Map<String, Object>> articles = newsService.getSafetyNews(city, country);
            return Map.of("articles", articles);
        } catch (Exception e) {
            return Map.of("articles", List.of(), "error", e.getMessage());
        }
    }
}
