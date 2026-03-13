package com.journey360.controller;

import com.journey360.auth.FirebaseUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "message", "Journey360 backend is running",
                "version", "3.1.0",
                "api_prefix", "/api/v1");
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "healthy",
                "version", "3.1.0");
    }

    @GetMapping("/api/v1/test-auth")
    public Map<String, Object> testAuth(@AuthenticationPrincipal FirebaseUser user) {
        Map<String, Object> response = new HashMap<>();

        try {
            Map<String, Object> userData = new HashMap<>();
            userData.put("uid", user.uid());
            userData.put("email", user.email());
            userData.put("last_login", new Date());

            mongoTemplate.upsert(
                    Query.query(Criteria.where("uid").is(user.uid())),
                    new Update()
                            .set("uid", user.uid())
                            .set("email", user.email())
                            .set("last_login", new Date()),
                    "users");

            response.put("message", "Authenticated & Saved to DB!");
            response.put("user", user.toMap());
        } catch (Exception e) {
            response.put("message", "Authenticated but DB not connected");
            response.put("user", user.toMap());
        }

        return response;
    }
}
