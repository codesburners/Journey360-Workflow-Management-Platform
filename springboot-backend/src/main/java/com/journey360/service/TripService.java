package com.journey360.service;

import com.journey360.auth.FirebaseUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class TripService {

    private static final Logger log = LoggerFactory.getLogger(TripService.class);

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private ImageService imageService;

    public Map<String, Object> createTrip(Map<String, Object> data, FirebaseUser user) {
        try {
            log.info("create_trip called by {}", user.email());

            String tripId = UUID.randomUUID().toString();

            // Calculate days from dates
            int days = 3;
            if (data.containsKey("start_date") && data.containsKey("end_date")) {
                try {
                    LocalDate d1 = LocalDate.parse((String) data.get("start_date"));
                    LocalDate d2 = LocalDate.parse((String) data.get("end_date"));
                    days = (int) ChronoUnit.DAYS.between(d1, d2) + 1;
                    if (days <= 0)
                        days = 1;
                } catch (Exception e) {
                    days = 3;
                }
            }

            // Sanitize destination
            String destination = (String) data.get("destination");
            if (destination != null) {
                destination = destination.replace("Kolkatta", "Kolkata").replace("Banglore", "Bengaluru");
            }

            // Fetch image
            String imageUrl = null;
            try {
                imageUrl = imageService.getDestinationImage(destination);
            } catch (Exception e) {
                log.warn("Failed to fetch image for {}: {}", destination, e.getMessage());
            }

            Map<String, Object> trip = new LinkedHashMap<>();
            trip.put("trip_id", tripId);
            trip.put("user_id", user.uid());
            trip.put("destination", destination);
            trip.put("start_date", data.get("start_date"));
            trip.put("end_date", data.get("end_date"));
            trip.put("days", days);
            trip.put("budget", data.get("budget"));
            trip.put("interests", data.get("interests"));
            trip.put("travel_pace", data.getOrDefault("travel_pace", "Balanced"));
            trip.put("status", "CREATED");
            trip.put("image_url", imageUrl);

            mongoTemplate.insert(trip, "trips");

            // Remove MongoDB _id for response (convert ObjectId to string)
            Object mongoId = trip.get("_id");
            if (mongoId != null) {
                trip.put("_id", mongoId.toString());
            }

            return trip;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("CRITICAL UNHANDLED ERROR in create_trip: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Trip creation failed: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listTrips(FirebaseUser user) {
        log.info("Fetching trips for user {}", user.uid());

        Query query = new Query(Criteria.where("user_id").is(user.uid()))
                .with(Sort.by(Sort.Direction.DESC, "_id"));

        List<Map> results = mongoTemplate.find(query, Map.class, "trips");
        List<Map<String, Object>> trips = new ArrayList<>();

        for (Map raw : results) {
            Map<String, Object> trip = new LinkedHashMap<>(raw);
            Object mongoId = trip.get("_id");
            if (mongoId != null) {
                trip.put("_id", mongoId.toString());
            }
            trips.add(trip);
        }

        return trips;
    }
}
