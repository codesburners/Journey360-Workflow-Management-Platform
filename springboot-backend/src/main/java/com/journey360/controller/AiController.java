package com.journey360.controller;

import com.journey360.auth.FirebaseUser;
import com.journey360.service.*;
import com.journey360.util.GeoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);
    private static final Pattern INJECTION_PATTERN = Pattern.compile(
            "(?i)(ignore previous|forget all|system prompt|you are now)");

    @Autowired
    private ItineraryService itineraryService;
    @Autowired
    private GeminiService geminiService;
    @Autowired
    private ReviewsService reviewsService;
    @Autowired
    private NewsService newsService;
    @Autowired
    private RiskEngineService riskEngineService;
    @Autowired
    private EmergencyService emergencyService;
    @Autowired
    private WeatherService weatherService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private MongoTemplate mongoTemplate;

    // --- Input Sanitization ---
    private String sanitizeText(String text, int maxLength) {
        if (text == null || text.isBlank())
            return "";
        text = text.strip();
        if (text.length() > maxLength)
            text = text.substring(0, maxLength);
        return INJECTION_PATTERN.matcher(text).replaceAll("");
    }

    private String validateTripId(String tripId) {
        if (tripId == null || tripId.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip ID is required");
        tripId = tripId.strip();
        if (tripId.length() > 100)
            tripId = tripId.substring(0, 100);
        if (!tripId.matches("^[a-zA-Z0-9_-]+$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid trip ID format");
        return tripId;
    }

    // ===================== Place Reviews =====================
    @GetMapping("/ai/place-reviews")
    public Map<String, Object> placeReviews(@RequestParam("place_name") String placeName,
            @RequestParam String destination,
            @AuthenticationPrincipal FirebaseUser user) {
        Map<String, Object> result = reviewsService.getPlaceReviews(placeName, destination);
        if (result == null) {
            return Map.of("rating", "", "totalReviews", "");
        }
        return result;
    }

    // ===================== AR Nearby =====================
    @SuppressWarnings("unchecked")
    @GetMapping("/ai/itinerary/ar-nearby")
    public List<Map<String, Object>> arNearby(@RequestParam("trip_id") String tripId,
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") double radius,
            @AuthenticationPrincipal FirebaseUser user) {
        Map trip = findTrip(tripId, user);
        if (trip == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found");

        Map itinerary = mongoTemplate.findOne(
                Query.query(Criteria.where("tripId").is(tripId)), Map.class, "itineraries");
        if (itinerary == null)
            return List.of();

        List<Map<String, Object>> nearbyPlaces = new ArrayList<>();
        List<Map<String, Object>> days = (List<Map<String, Object>>) itinerary.getOrDefault("days", List.of());

        for (Map<String, Object> day : days) {
            List<Map<String, Object>> places = (List<Map<String, Object>>) day.getOrDefault("places", List.of());
            for (Map<String, Object> place : places) {
                Number pLat = (Number) place.get("lat");
                Number pLng = (Number) place.get("lng");
                if (pLat != null && pLng != null) {
                    double dist = GeoUtils.haversine(lat, lng, pLat.doubleValue(), pLng.doubleValue());
                    if (dist <= radius) {
                        Map<String, Object> nearby = new LinkedHashMap<>(place);
                        nearby.put("distance", Math.round(dist * 10.0) / 10.0);
                        nearbyPlaces.add(nearby);
                    }
                }
            }
        }
        return nearbyPlaces;
    }

    // ===================== Generate Itinerary =====================
    @PostMapping("/ai/itinerary/generate")
    @SuppressWarnings("unchecked")
    public Map<String, Object> generate(@RequestParam("trip_id") String tripId,
            @AuthenticationPrincipal FirebaseUser user) {
        tripId = validateTripId(tripId);
        Map trip = findTrip(tripId, user);
        if (trip == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found");

        try {
            Map<String, Object> itinerary = itineraryService.generateItinerary(trip);

            // Background email notification
            try {
                if (user.email() != null && !user.email().isBlank()) {
                    String dest = (String) trip.getOrDefault("destination", "Your Trip");
                    notificationService.sendTripItineraryEmail(user.email(), dest, itinerary);
                }
            } catch (Exception e) {
                log.warn("Failed to queue notification: {}", e.getMessage());
            }

            return itinerary;
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Quota exceeded") || msg.contains("429")) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "AI is currently at capacity. Please try again in 30 seconds.");
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Itinerary generation failed: " + msg);
        }
    }

    // ===================== Get Itinerary =====================
    @GetMapping("/trip/{tripId}/itinerary")
    @SuppressWarnings("unchecked")
    public Map<String, Object> getItinerary(@PathVariable String tripId,
            @AuthenticationPrincipal FirebaseUser user) {
        Map trip = findTrip(tripId, user);
        if (trip == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found or not authorized");

        Map itinerary = mongoTemplate.findOne(
                Query.query(Criteria.where("tripId").is(tripId)), Map.class, "itineraries");
        if (itinerary == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Itinerary not generated yet");

        itinerary.remove("_id");
        return itinerary;
    }

    // ===================== Regenerate Itinerary =====================
    @PostMapping("/ai/itinerary/regenerate")
    @SuppressWarnings("unchecked")
    public Map<String, Object> regenerate(@RequestBody Map<String, Object> data,
            @AuthenticationPrincipal FirebaseUser user) {
        String tripId = validateTripId((String) data.getOrDefault("tripId", ""));
        String instruction = sanitizeText((String) data.getOrDefault("instruction", ""), 1000);
        Map<String, Object> constraints = (Map<String, Object>) data.getOrDefault("constraints", Map.of());

        if (instruction.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Instruction is required");

        Map trip = findTrip(tripId, user);
        if (trip == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found");

        Map existing = mongoTemplate.findOne(
                Query.query(Criteria.where("tripId").is(tripId)), Map.class, "itineraries");
        if (existing == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No existing itinerary to regenerate");

        try {
            Map<String, Object> updated = itineraryService.regenerateItinerary(trip, existing, instruction,
                    constraints);

            // Background email
            try {
                if (user.email() != null && !user.email().isBlank()) {
                    String dest = trip.getOrDefault("destination", "Your Trip") + " (Updated)";
                    notificationService.sendTripItineraryEmail(user.email(), (String) dest, updated);
                }
            } catch (Exception e) {
                log.warn("Failed to queue notification: {}", e.getMessage());
            }

            return Map.of("message", "Itinerary updated successfully", "updatedItinerary", updated);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("429") || msg.contains("ResourceExhausted")) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "AI is currently at capacity. Please try again in 30 seconds.");
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Regeneration failed: " + msg);
        }
    }

    // ===================== AI Chat =====================
    @PostMapping("/ai/chat")
    @SuppressWarnings("unchecked")
    public Map<String, String> chat(@RequestParam String message,
            @RequestParam(required = false) String trip_id,
            @AuthenticationPrincipal FirebaseUser user) {
        message = sanitizeText(message, 2000);
        if (message.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be empty");

        Map tripContext = null;
        if (trip_id != null && !trip_id.isBlank()) {
            trip_id = validateTripId(trip_id);
            tripContext = findTrip(trip_id, user);
        }

        String systemPrompt = "You are Journey360 AI, a helpful travel assistant. ";
        if (tripContext != null) {
            systemPrompt += "Context: planning trip to " + tripContext.getOrDefault("destination", "") +
                    " with budget " + tripContext.getOrDefault("budget", "") +
                    " and interests " + tripContext.getOrDefault("interests", "") + ". ";
        }
        systemPrompt += "Provide concise, helpful, and friendly advice.";

        String fullPrompt = systemPrompt + "\n\nUser: " + message;
        String reply = geminiService.callGeminiForText(fullPrompt);

        if (reply == null || reply.isBlank()) {
            reply = "I'm having trouble connecting to my travel brain right now. Please try again.";
        }

        return Map.of("reply", reply);
    }

    // ===================== Post-Trip Summary =====================
    @PostMapping("/ai/post-trip/summary")
    @SuppressWarnings("unchecked")
    public Map<String, String> postTripSummary(@RequestParam("trip_id") String tripId,
            @AuthenticationPrincipal FirebaseUser user) {
        Map trip = findTrip(tripId, user);
        if (trip == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found");

        String prompt = String.format("""
                    Create a beautiful, narrative travel summary based on this trip:
                    Destination: %s
                    Interests: %s
                    Budget: %s
                    The summary should look like a professional travel blog highlight.
                    Keep it around 150 words.
                """, trip.get("destination"), trip.get("interests"), trip.get("budget"));

        String reply = geminiService.callGeminiForText(prompt);
        if (reply != null && !reply.isBlank()) {
            return Map.of("summary", reply.strip());
        }
        return Map.of("summary",
                "Your journey was filled with amazing memories. Take a moment to reflect on your adventures!");
    }

    // ===================== Safety Assess =====================
    @PostMapping("/ai/safety/assess")
    public Map<String, Object> safetyAssess(@RequestParam String location,
            @AuthenticationPrincipal FirebaseUser user) {
        location = sanitizeText(location, 200);
        if (location.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location is required");

        String city = location, country = "";
        if (location.contains(",")) {
            String[] parts = location.split(",", 2);
            city = parts[0].trim();
            country = parts[1].trim();
        }

        List<Map<String, Object>> news = newsService.getSafetyNews(city, country);
        Map<String, Object> risk = riskEngineService.calculateRisk(news);

        List<Map<String, Object>> alerts = new ArrayList<>();
        for (Map<String, Object> n : news) {
            if ("High".equals(n.get("severity")))
                alerts.add(n);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("location", location);
        result.put("risk", risk);
        result.put("news", news);
        result.put("alerts", alerts);
        result.put("emergency", emergencyService.getEmergencyNumbers(location));
        result.put("generated_at", Instant.now().toString());
        result.put("ai_insight", risk.get("level") + " risk detected based on " +
                alerts.size() + " high-severity incidents in the last 48 hours.");
        return result;
    }

    // ===================== Safety Risk (GET) =====================
    @GetMapping("/ai/safety/risk")
    public Map<String, Object> safetyRisk(@RequestParam String location,
            @AuthenticationPrincipal FirebaseUser user) {
        location = location.strip();
        if (location.length() > 200)
            location = location.substring(0, 200);
        if (location.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location is required");

        String city = location, country = "";
        if (location.contains(",")) {
            String[] parts = location.split(",", 2);
            city = parts[0].trim();
            country = parts[1].trim();
        }

        List<Map<String, Object>> articles = newsService.getSafetyNews(city, country);
        return Map.of("location", location, "articles", articles);
    }

    // ===================== Dashboard Context =====================
    @GetMapping("/ai/dashboard/context")
    @SuppressWarnings("unchecked")
    public Map<String, Object> dashboardContext(@AuthenticationPrincipal FirebaseUser user) {
        // Get user trips sorted newest first
        Query query = new Query(Criteria.where("user_id").is(user.uid()))
                .with(Sort.by(Sort.Direction.DESC, "_id"));
        List<Map> userTrips = mongoTemplate.find(query, Map.class, "trips");

        if (userTrips.isEmpty())
            return null;

        Map<String, Object> activeTrip = userTrips.get(0);
        String tripId = (String) activeTrip.get("trip_id");

        // Weather
        Map<String, Object> weather = weatherService.getWeather(
                (String) activeTrip.getOrDefault("destination", "Tokyo"));

        // Itinerary
        Map itinerary = mongoTemplate.findOne(
                Query.query(Criteria.where("tripId").is(tripId)), Map.class, "itineraries");

        if (itinerary == null) {
            itinerary = mongoTemplate.findOne(
                    new Query(new Criteria().andOperator(
                            Criteria.where("destination").is(activeTrip.get("destination")),
                            Criteria.where("userId").is(user.uid()))),
                    Map.class, "itineraries");
        }

        List<Map<String, Object>> schedule = new ArrayList<>();
        Map<String, Object> nextActivity = null;

        if (itinerary != null) {
            List<Map<String, Object>> days = (List<Map<String, Object>>) itinerary.getOrDefault("days", List.of());
            if (!days.isEmpty()) {
                Map<String, Object> firstDay = days.get(0);
                List<Map<String, Object>> places = (List<Map<String, Object>>) firstDay.getOrDefault("places",
                        List.of());

                for (Map<String, Object> p : places) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("title", p.get("name"));
                    item.put("time", p.getOrDefault("time", "Anytime"));
                    item.put("location", p.getOrDefault("location", activeTrip.get("destination")));
                    item.put("description", p.get("description"));
                    schedule.add(item);
                }

                if (!schedule.isEmpty())
                    nextActivity = schedule.get(0);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("trip_id", tripId);
        result.put("destination", activeTrip.get("destination"));
        result.put("startDate", activeTrip.get("start_date"));
        result.put("weather", weather);
        result.put("next_activity", nextActivity);
        result.put("schedule", schedule.subList(0, Math.min(5, schedule.size())));
        return result;
    }

    // ===================== Helpers =====================
    @SuppressWarnings("unchecked")
    private Map findTrip(String tripId, FirebaseUser user) {
        return mongoTemplate.findOne(
                Query.query(new Criteria().andOperator(
                        Criteria.where("trip_id").is(tripId),
                        Criteria.where("user_id").is(user.uid()))),
                Map.class, "trips");
    }
}
