package com.journey360.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Core AI itinerary service. Translates Python ai/itinerary.py +
 * ai/regeneration.py
 */
@Service
public class ItineraryService {

    private static final Logger log = LoggerFactory.getLogger(ItineraryService.class);
    private static final String CURRENCY_SYMBOL = "₹";

    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private PlacesService placesService;
    @Autowired
    private WeatherService weatherService;
    @Autowired
    private HotelsService hotelsService;
    @Autowired
    private RestaurantsService restaurantsService;
    @Autowired
    private GeminiService geminiService;

    private final Gson gson = new Gson();

    // ==================================================================
    // Generate Itinerary
    // ==================================================================
    @SuppressWarnings("unchecked")
    public Map<String, Object> generateItinerary(Map<String, Object> trip) {
        // Sanitize destination
        String dest = ((String) trip.get("destination"))
                .replace("Kolkatta", "Kolkata").replace("Banglore", "Bengaluru")
                .replace("kerela", "Kerala").replace("Kerela", "Kerala");
        trip.put("destination", dest);

        int duration = trip.containsKey("days") ? ((Number) trip.get("days")).intValue() : 3;

        // 1. Check cache
        Map<String, Object> cached = findCachedItinerary(dest, duration);
        if (cached != null) {
            return cloneCachedItinerary(cached, trip);
        }

        log.info(">>> ITINERARY GENERATION ENGINE V2.2 <<<");
        log.info("STARTING ITINERARY GENERATION for {} ({} days)", dest, duration);

        // 2. Gather places
        List<String> interests = (List<String>) trip.getOrDefault("interests", List.of());
        List<String> searchInterests = new ArrayList<>(interests);
        if (searchInterests.stream()
                .noneMatch(x -> x.contains("Food") || x.contains("Dining") || x.contains("Restaurants")))
            searchInterests.add("Restaurants");
        if (searchInterests.stream().noneMatch(x -> x.contains("Hotels") || x.contains("Accommodation")))
            searchInterests.add("Hotels");
        if (searchInterests.size() > 3)
            searchInterests = searchInterests.subList(0, 3);
        if (searchInterests.stream().noneMatch(x -> x.contains("Attractions") || x.contains("Sightseeing")))
            searchInterests.add("Top Attractions");

        List<Map<String, Object>> allPlaces = new ArrayList<>();
        for (String interest : searchInterests) {
            allPlaces.addAll(placesService.getPlaces(dest, interest));
        }

        List<Map<String, Object>> promptPlaces = new ArrayList<>(allPlaces.subList(0, Math.min(50, allPlaces.size())));

        // 3. Fetch real hotels & restaurants
        String checkIn = normalizeDate((String) trip.get("start_date"));
        String checkOut = normalizeDate((String) trip.get("end_date"));
        if (checkIn == null)
            checkIn = LocalDate.now().plusDays(7).format(DateTimeFormatter.ISO_DATE);
        if (checkOut == null)
            checkOut = LocalDate.now().plusDays(7 + duration).format(DateTimeFormatter.ISO_DATE);

        List<Map<String, Object>> realHotels = hotelsService.searchHotels(dest, checkIn, checkOut);
        List<Map<String, Object>> realRestaurants = restaurantsService.searchRestaurants(dest);

        // Add hotels and restaurants to prompt places
        if (realHotels != null) {
            for (Map<String, Object> h : realHotels.subList(0, Math.min(10, realHotels.size()))) {
                Map<String, Object> place = new LinkedHashMap<>();
                place.put("name", h.get("name"));
                place.put("category", "hotel");
                place.put("description", truncate((String) h.getOrDefault("description", ""), 100));
                place.put("lat", h.get("lat"));
                place.put("lng", h.get("lng"));
                promptPlaces.add(place);
            }
        }
        if (realRestaurants != null) {
            for (Map<String, Object> r : realRestaurants.subList(0, Math.min(15, realRestaurants.size()))) {
                Map<String, Object> place = new LinkedHashMap<>();
                place.put("name", r.get("name"));
                place.put("category", "food");
                place.put("description", r.getOrDefault("type", "Restaurant") + " - " +
                        truncate((String) r.getOrDefault("description", ""), 100));
                place.put("lat", r.get("lat"));
                place.put("lng", r.get("lng"));
                promptPlaces.add(place);
            }
        }

        // 4. Build prompt and call LLM
        Map<String, Object> weather = weatherService.getWeather(dest);
        String prompt = buildItineraryPrompt(trip, promptPlaces, weather, CURRENCY_SYMBOL, "English");

        Map<String, Object> rawItinerary;
        try {
            rawItinerary = geminiService.callLlm(prompt, false);
            if (rawItinerary == null) {
                rawItinerary = getMockItinerary(trip, dest, duration);
            }
        } catch (Exception e) {
            log.error("CRITICAL: AI Generation failed ({}). Falling back to Mock.", e.getMessage());
            rawItinerary = getMockItinerary(trip, dest, duration);
        }

        // 5. Uniqueness filter
        Set<String> seenNames = new HashSet<>();
        List<Map<String, Object>> days = (List<Map<String, Object>>) rawItinerary.getOrDefault("days", List.of());
        for (Map<String, Object> day : days) {
            List<Map<String, Object>> places = (List<Map<String, Object>>) day.getOrDefault("places", List.of());
            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Map<String, Object> place : places) {
                String name = ((String) place.getOrDefault("name", "")).trim().toLowerCase();
                boolean isHotel = "hotel".equals(place.get("category"));
                if (!isHotel && seenNames.contains(name))
                    continue;
                filtered.add(place);
                if (!isHotel && !name.isEmpty())
                    seenNames.add(name);
            }
            if (filtered.size() < 3 && !places.isEmpty())
                filtered = places;
            day.put("places", filtered);
        }

        // 6. Coordinate repair
        repairCoordinates(days, dest);

        // 7. Fill missing days
        if (days.size() < duration) {
            for (int d = days.size() + 1; d <= duration; d++) {
                days.add(Map.of(
                        "dayNumber", d,
                        "weatherNote", "Explore the local area at your own pace.",
                        "totalDayCost", 0,
                        "places", List.of(Map.of(
                                "name", "Area Exploration (Day " + d + ")",
                                "category", "attraction",
                                "estimatedCost", 0,
                                "timeSlot", "morning",
                                "duration", "flexible",
                                "description", "A placeholder to help you navigate the city center."))));
            }
        }

        // 8. Cost summary
        Map<String, Object> costSummary = calculateCosts(days);

        // 9. Force real hotels
        List<Map<String, Object>> finalHotels;
        if (realHotels != null && !realHotels.isEmpty()) {
            finalHotels = new ArrayList<>();
            for (Map<String, Object> h : realHotels.subList(0, Math.min(5, realHotels.size()))) {
                Map<String, Object> hotel = new LinkedHashMap<>();
                hotel.put("name", h.get("name"));
                hotel.put("rating", h.getOrDefault("rating", 4.5));
                hotel.put("vibe", "Recommended");
                hotel.put("description",
                        truncate((String) h.getOrDefault("description", "A great place to stay"), 100));
                hotel.put("price", CURRENCY_SYMBOL + h.getOrDefault("rate_per_night", "3500"));
                hotel.put("bookingUrl", h.get("link"));
                hotel.put("lat", h.get("lat"));
                hotel.put("lng", h.get("lng"));
                finalHotels.add(hotel);
            }
        } else {
            finalHotels = (List<Map<String, Object>>) rawItinerary.getOrDefault("topHotels", List.of());
        }

        // 10. Build final itinerary
        String now = Instant.now().toString();
        Map<String, Object> itineraryData = new LinkedHashMap<>();
        itineraryData.put("itineraryId", UUID.randomUUID().toString());
        itineraryData.put("tripId", trip.get("trip_id"));
        itineraryData.put("userId", trip.get("user_id"));
        itineraryData.put("destination", dest);
        itineraryData.put("safetyAdvisory",
                rawItinerary.getOrDefault("safetyAdvisory", "Standard safety precautions apply."));
        itineraryData.put("travelTips", rawItinerary.getOrDefault("travelTips", List.of()));
        itineraryData.put("topHotels", finalHotels);
        itineraryData.put("days", days);
        itineraryData.put("costSummary", costSummary);
        itineraryData.put("currencySymbol", CURRENCY_SYMBOL);
        itineraryData.put("currencyCode", "INR");
        itineraryData.put("aiVersion", rawItinerary.getOrDefault("_used_model", "gemini-2.0-flash"));
        itineraryData.put("generatedFrom", "initial");
        itineraryData.put("lastPromptUsed", prompt);
        itineraryData.put("createdAt", now);
        itineraryData.put("updatedAt", now);
        itineraryData.put("interests", trip.getOrDefault("interests", List.of()));

        // Save to DB
        try {
            mongoTemplate.insert(itineraryData, "itineraries");
            itineraryData.remove("_id");
        } catch (Exception e) {
            log.error("Failed to save itinerary to DB: {}", e.getMessage());
        }

        log.info("COMPLETED ITINERARY GENERATION");
        return itineraryData;
    }

    // ==================================================================
    // Regenerate Itinerary
    // ==================================================================
    @SuppressWarnings("unchecked")
    public Map<String, Object> regenerateItinerary(Map<String, Object> trip,
            Map<String, Object> existingItinerary,
            String instruction,
            Map<String, Object> constraints) {
        log.info("STARTING ITINERARY REGENERATION for {}", trip.get("destination"));

        String prompt = buildRegenerationPrompt(trip, existingItinerary, instruction, constraints);

        Map<String, Object> rawItinerary;
        try {
            rawItinerary = geminiService.callLlm(prompt, false);
        } catch (Exception e) {
            log.error("Regeneration AI failed: {}", e.getMessage());
            rawItinerary = existingItinerary;
        }

        if (rawItinerary == null)
            rawItinerary = existingItinerary;

        List<Map<String, Object>> rawDays = (List<Map<String, Object>>) rawItinerary.getOrDefault("days",
                existingItinerary.getOrDefault("days", List.of()));

        // Coordinate repair
        repairCoordinates(rawDays, (String) trip.get("destination"));

        // Cost summary
        Map<String, Object> costSummary = calculateCosts(rawDays);

        String itineraryId = (String) existingItinerary.get("itineraryId");

        Map<String, Object> updateFields = new LinkedHashMap<>();
        updateFields.put("days", rawDays);
        updateFields.put("topHotels",
                rawItinerary.getOrDefault("topHotels", existingItinerary.getOrDefault("topHotels", List.of())));
        updateFields.put("safetyAdvisory", rawItinerary.getOrDefault("safetyAdvisory",
                existingItinerary.getOrDefault("safetyAdvisory", "Standard precautions.")));
        updateFields.put("travelTips",
                rawItinerary.getOrDefault("travelTips", existingItinerary.getOrDefault("travelTips", List.of())));
        updateFields.put("costSummary", costSummary);
        updateFields.put("currencySymbol", CURRENCY_SYMBOL);
        updateFields.put("currencyCode", "INR");
        updateFields.put("generatedFrom", "regenerate");
        updateFields.put("lastPromptUsed", prompt);
        updateFields.put("updatedAt", Instant.now().toString());

        // Update in DB
        Update update = new Update();
        updateFields.forEach(update::set);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("itineraryId").is(itineraryId)),
                update,
                "itineraries");

        // Fetch the full updated doc
        Map itinerary = mongoTemplate.findOne(
                Query.query(Criteria.where("itineraryId").is(itineraryId)),
                Map.class, "itineraries");
        if (itinerary != null)
            itinerary.remove("_id");

        log.info("COMPLETED ITINERARY REGENERATION");
        return itinerary;
    }

    // ==================================================================
    // Helpers
    // ==================================================================

    @SuppressWarnings("unchecked")
    private Map<String, Object> findCachedItinerary(String destination, int days) {
        try {
            Query query = new Query(new Criteria().andOperator(
                    Criteria.where("destination").regex("^" + destination + "$", "i"),
                    Criteria.where("days").size(days),
                    Criteria.where("generatedFrom").is("initial"))).with(Sort.by(Sort.Direction.DESC, "createdAt"))
                    .limit(1);

            Map cached = mongoTemplate.findOne(query, Map.class, "itineraries");
            if (cached != null) {
                log.info("Cache HIT! Found itinerary {}", cached.get("itineraryId"));
                return cached;
            }
        } catch (Exception e) {
            log.warn("Cache lookup failed: {}", e.getMessage());
        }
        log.info("Cache MISS.");
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> cloneCachedItinerary(Map<String, Object> cached, Map<String, Object> trip) {
        String newId = UUID.randomUUID().toString();
        log.info("Reusing cached itinerary. New ID: {}", newId);

        Map<String, Object> clone = new LinkedHashMap<>(cached);
        clone.remove("_id");
        clone.put("itineraryId", newId);
        clone.put("tripId", trip.get("trip_id"));
        clone.put("userId", trip.get("user_id"));
        clone.put("createdAt", Instant.now().toString());
        clone.put("updatedAt", Instant.now().toString());
        clone.put("isCachedResult", true);

        try {
            mongoTemplate.insert(clone, "itineraries");
            clone.remove("_id");
        } catch (Exception e) {
            log.warn("Failed to save cloned itinerary: {}", e.getMessage());
        }

        return clone;
    }

    @SuppressWarnings("unchecked")
    private void repairCoordinates(List<Map<String, Object>> days, String destination) {
        log.info("Verifying coordinates for all places...");
        for (Map<String, Object> day : days) {
            List<Map<String, Object>> places = (List<Map<String, Object>>) day.getOrDefault("places", List.of());
            for (Map<String, Object> place : places) {
                try {
                    Object pLat = place.get("lat");
                    Object pLng = place.get("lng");
                    String name = (String) place.get("name");

                    boolean needsRepair = (pLat == null || pLng == null);
                    if (!needsRepair && pLat instanceof Number && pLng instanceof Number) {
                        needsRepair = ((Number) pLat).doubleValue() == 0 && ((Number) pLng).doubleValue() == 0;
                    }

                    if (needsRepair && name != null && !name.contains("Explore")) {
                        double[] coords = placesService.getCoordinates(name + ", " + destination);
                        if (coords != null) {
                            place.put("lat", coords[0]);
                            place.put("lng", coords[1]);
                        } else {
                            double[] destCoords = placesService.getCoordinates(destination);
                            if (destCoords != null) {
                                place.put("lat", destCoords[0]);
                                place.put("lng", destCoords[1]);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Coord repair failed for {}: {}", place.get("name"), e.getMessage());
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> calculateCosts(List<Map<String, Object>> days) {
        double food = 0, stay = 0, activities = 0, transport = 0;

        for (Map<String, Object> day : days) {
            double dayItemSum = 0;
            List<Map<String, Object>> places = (List<Map<String, Object>>) day.getOrDefault("places", List.of());

            for (Map<String, Object> place : places) {
                double cost = parseCost(place.get("estimatedCost"));
                String category = ((String) place.getOrDefault("category", "")).toLowerCase();

                switch (category) {
                    case "food" -> food += cost;
                    case "hotel" -> stay += cost;
                    default -> activities += cost;
                }
                dayItemSum += cost;
            }

            double dayTransport = Math.round(dayItemSum * 0.15 * 100.0) / 100.0;
            transport += dayTransport;
            day.put("totalDayCost", Math.round((dayItemSum + dayTransport) * 100.0) / 100.0);
        }

        double total = Math.round((food + stay + activities + transport) * 100.0) / 100.0;
        return Map.of(
                "food", Math.round(food * 100.0) / 100.0,
                "stay", Math.round(stay * 100.0) / 100.0,
                "activities", Math.round(activities * 100.0) / 100.0,
                "transport", Math.round(transport * 100.0) / 100.0,
                "total", total);
    }

    private double parseCost(Object costRaw) {
        if (costRaw == null)
            return 0;
        if (costRaw instanceof Number)
            return ((Number) costRaw).doubleValue();
        if (costRaw instanceof String) {
            try {
                String clean = ((String) costRaw).replace(CURRENCY_SYMBOL, "").replace("$", "").replace(",", "").trim();
                return clean.isEmpty() ? 0 : Double.parseDouble(clean);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    private String normalizeDate(String date) {
        if (date == null)
            return null;
        if (date.contains("T"))
            return date.split("T")[0];
        if (date.contains(" "))
            return date.split(" ")[0];
        return date;
    }

    private String truncate(String s, int max) {
        if (s == null)
            return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getMockItinerary(Map<String, Object> trip, String dest, int duration) {
        double[] coords = placesService.getCoordinates(dest);
        double lat = coords != null ? coords[0] : 0;
        double lng = coords != null ? coords[1] : 0;

        List<Map<String, Object>> mockDays = new ArrayList<>();
        for (int d = 1; d <= duration; d++) {
            mockDays.add(new LinkedHashMap<>(Map.of(
                    "dayNumber", d,
                    "weatherNote", "A wonderful day for exploration in " + dest + ".",
                    "totalDayCost", 0.0,
                    "places", List.of(
                            Map.of("name", "Local Breakfast Spot", "category", "food", "estimatedCost", 500, "timeSlot",
                                    "breakfast", "duration", "1h", "lat", lat + 0.001, "lng", lng - 0.001,
                                    "description", "Enjoy local breakfast on Day " + d, "safetyRating", "High"),
                            Map.of("name", dest + " Landmark " + d, "category", "attraction", "estimatedCost", 200,
                                    "timeSlot", "morning", "duration", "2h", "lat", lat + 0.005, "lng", lng + 0.005,
                                    "description", "Famous local landmark.", "safetyRating", "High"),
                            Map.of("name", "Local Lunch " + d, "category", "food", "estimatedCost", 800, "timeSlot",
                                    "lunch", "duration", "1h", "lat", lat - 0.005, "lng", lng + 0.008, "description",
                                    "Authentic local lunch.", "safetyRating", "High"),
                            Map.of("name", dest + " Park " + d, "category", "attraction", "estimatedCost", 200,
                                    "timeSlot", "afternoon", "duration", "2h", "lat", lat + 0.003, "lng", lng - 0.003,
                                    "description", "Beautiful local park.", "safetyRating", "High"),
                            Map.of("name", "Fine Dining " + d, "category", "food", "estimatedCost", 1200, "timeSlot",
                                    "dinner", "duration", "2h", "lat", lat + 0.003, "lng", lng - 0.008, "description",
                                    "Fine dining experience.", "safetyRating", "High"),
                            Map.of("name", "Local Hotel", "category", "hotel", "estimatedCost", 3500, "timeSlot",
                                    "evening", "duration", "overnight", "lat", lat, "lng", lng, "description",
                                    "Comfortable stay.", "safetyRating", "High")))));
        }

        Map<String, Object> mock = new LinkedHashMap<>();
        mock.put("safetyAdvisory",
                "NOTICE: This is a stabilized fallback itinerary. Please try 'Regenerate' for premium AI results.");
        mock.put("travelTips", List.of("Carry a water bottle", "Use local transport"));
        mock.put("topHotels",
                List.of(Map.of("name", "Local Recommended Stay", "price", CURRENCY_SYMBOL + "3500", "description",
                        "Highly rated local accommodation.", "lat", lat, "lng", lng, "rating", 4.5, "vibe",
                        "Comfort")));
        mock.put("days", mockDays);
        mock.put("is_mock", true);
        return mock;
    }

    private String buildItineraryPrompt(Map<String, Object> trip, List<Map<String, Object>> places,
            Map<String, Object> weather, String currencySymbol, String language) {
        String placesStr = gson.toJson(places);
        String weatherStr = gson.toJson(weather);
        int duration = trip.containsKey("days") ? ((Number) trip.get("days")).intValue() : 3;
        int budget = trip.containsKey("budget") ? ((Number) trip.get("budget")).intValue() : 1000;
        String budgetLevel = (String) trip.getOrDefault("budget_level", "Balanced");
        String pace = (String) trip.getOrDefault("travel_pace", "Balanced");
        String interests = trip.containsKey("interests") ? String.join(", ", (List<String>) trip.get("interests")) : "";

        return String.format(
                """
                        You are 'Journey360 AI', a premium travel consultant.
                        Create a masterpiece %d-day itinerary in %s.

                        CRITICAL: Generate exactly %d days. Each day separate in "days" array.

                        TRIP CONTEXT:
                        - Destination: %s
                        - Budget Level: %s (%s%d total for all %d days)
                        - Interests: %s
                        - Duration: %d days
                        - Pace: %s
                        - Local Currency: %s
                        - Current Weather: %s

                        LOCAL KNOWLEDGE:
                        %s

                        Return STRICT JSON only (no markdown):
                        {"safetyAdvisory":"...","travelTips":[],"topHotels":[{"name":"","rating":0,"vibe":"","description":"","price":"","lat":0,"lng":0}],"days":[{"dayNumber":1,"weatherNote":"","totalDayCost":0,"places":[{"name":"","category":"attraction|food|hotel","estimatedCost":0,"rating":0,"userRatingCount":0,"timeSlot":"breakfast|morning|lunch|afternoon|dinner|evening","duration":"","lat":0,"lng":0,"description":"","safetyRating":"High|Medium|Standard"}]}]}

                        GUIDELINES:
                        1. Exactly %d days. 5 items/day: Breakfast, Morning, Lunch, Afternoon, Dinner.
                        2. All prices in %s. Realistic local amounts.
                        3. REAL places only. Include lat/lng.
                        4. No duplicate restaurants/attractions across days.
                        5. NO markdown, NO placeholders.
                        """,
                duration, language, duration, trip.get("destination"), budgetLevel,
                currencySymbol, budget, duration, interests, duration, pace,
                currencySymbol, weatherStr, placesStr, duration, currencySymbol);
    }

    @SuppressWarnings("unchecked")
    private String buildRegenerationPrompt(Map<String, Object> trip, Map<String, Object> existing,
            String instruction, Map<String, Object> constraints) {
        String daysJson = gson.toJson(existing.getOrDefault("days", List.of()));
        String hotelsJson = gson.toJson(existing.getOrDefault("topHotels", List.of()));

        return String.format("""
                You are 'Journey360 AI'. Modify this itinerary for %s.

                Current Itinerary Days:
                %s

                Available Hotels:
                %s

                User Instruction: %s
                Constraints: %s

                Rules:
                1. Preserve original structure. Only update what's needed.
                2. Keep identical JSON structure. Update costs if activities change.
                3. Use hotels from the Available Hotels list only.
                4. Return STRICT JSON only (no markdown).
                """,
                trip.get("destination"), daysJson, hotelsJson, instruction, gson.toJson(constraints));
    }
}
