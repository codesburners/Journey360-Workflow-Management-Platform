package com.journey360.service;

import com.journey360.auth.FirebaseUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class SavedPlaceService {

    private static final Logger log = LoggerFactory.getLogger(SavedPlaceService.class);

    @Autowired
    private MongoTemplate mongoTemplate;

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getSavedPlaces(FirebaseUser user) {
        Query query = new Query(new Criteria().orOperator(
                Criteria.where("user_id").is(user.uid()),
                Criteria.where("userId").is(user.uid())));

        List<Map> docs = mongoTemplate.find(query, Map.class, "saved_places");
        List<Map<String, Object>> places = new ArrayList<>();

        for (Map doc : docs) {
            Map<String, Object> place = new LinkedHashMap<>(doc);
            place.remove("_id");

            // Normalize legacy camelCase keys
            if (place.containsKey("placeId") && !place.containsKey("place_id")) {
                place.put("place_id", place.remove("placeId"));
            }
            if (place.containsKey("savedAt") && !place.containsKey("saved_at")) {
                place.put("saved_at", place.remove("savedAt"));
            }
            if (place.containsKey("userId") && !place.containsKey("user_id")) {
                place.put("user_id", place.remove("userId"));
            }

            places.add(place);
        }

        return places;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> savePlace(Map<String, Object> place, FirebaseUser user) {
        place.put("user_id", user.uid());
        place.put("uid", user.uid());

        String placeId = (String) place.getOrDefault("place_id",
                place.getOrDefault("placeId", ""));

        // Check for duplicates
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("user_id").is(user.uid()),
                new Criteria().orOperator(
                        Criteria.where("place_id").is(placeId),
                        Criteria.where("placeId").is(placeId))));

        Map existing = mongoTemplate.findOne(query, Map.class, "saved_places");
        if (existing != null) {
            existing.remove("_id");
            if (existing.containsKey("placeId") && !existing.containsKey("place_id")) {
                existing.put("place_id", existing.remove("placeId"));
            }
            return existing;
        }

        if (place.get("saved_at") == null) {
            place.put("saved_at", new Date());
        }

        mongoTemplate.insert(place, "saved_places");
        place.remove("_id");
        return place;
    }

    public Map<String, String> removePlace(String placeId, FirebaseUser user) {
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("user_id").is(user.uid()),
                new Criteria().orOperator(
                        Criteria.where("place_id").is(placeId),
                        Criteria.where("placeId").is(placeId))));

        var result = mongoTemplate.remove(query, "saved_places");

        if (result.getDeletedCount() == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found");
        }

        return Map.of("message", "Place removed successfully");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Boolean> checkIsSaved(String placeId, FirebaseUser user) {
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("user_id").is(user.uid()),
                new Criteria().orOperator(
                        Criteria.where("place_id").is(placeId),
                        Criteria.where("placeId").is(placeId))));

        boolean exists = mongoTemplate.exists(query, "saved_places");
        return Map.of("is_saved", exists);
    }
}
