package com.journey360.service;

import com.google.firebase.auth.FirebaseAuth;
import com.journey360.auth.FirebaseUser;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NotificationService notificationService;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getProfile(FirebaseUser user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("uid", user.uid());
        result.put("email", user.email());
        result.put("created_at", Instant.now().toString());
        result.put("two_factor_enabled", false);

        try {
            Query query = new Query(Criteria.where("uid").is(user.uid()));
            Map dbUser = mongoTemplate.findOne(query, Map.class, "users");

            if (dbUser != null) {
                dbUser.remove("_id");
                result.putAll(dbUser);
            }
        } catch (Exception e) {
            log.error("Error fetching profile: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }

        log.info("Returning profile for {}", result.get("email"));
        return result;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> updateProfile(Map<String, Object> updateData, FirebaseUser user) {
        try {
            // Filter null values
            Map<String, Object> cleanData = new LinkedHashMap<>();
            for (var entry : updateData.entrySet()) {
                if (entry.getValue() != null) {
                    cleanData.put(entry.getKey(), entry.getValue());
                }
            }
            cleanData.put("email", user.email());
            cleanData.put("uid", user.uid());

            Update update = new Update();
            cleanData.forEach(update::set);

            mongoTemplate.upsert(
                    Query.query(Criteria.where("uid").is(user.uid())),
                    update,
                    "users");

            // Return updated document
            Map dbUser = mongoTemplate.findOne(
                    Query.query(Criteria.where("uid").is(user.uid())),
                    Map.class, "users");

            Map<String, Object> finalUser = new LinkedHashMap<>();
            finalUser.put("uid", user.uid());
            finalUser.put("email", user.email());
            finalUser.put("created_at", Instant.now().toString());
            finalUser.put("two_factor_enabled", false);

            if (dbUser != null) {
                dbUser.remove("_id");
                finalUser.putAll(dbUser);
            }

            return finalUser;
        } catch (Exception e) {
            log.error("Error updating profile: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public Map<String, String> deleteAccount(FirebaseUser user) {
        String uid = user.uid();

        // 1. Delete from MongoDB Users
        mongoTemplate.remove(Query.query(Criteria.where("uid").is(uid)), "users");

        // 2. Delete from MongoDB Trips
        mongoTemplate.remove(Query.query(Criteria.where("user_id").is(uid)), "trips");

        // 3. Delete from Firebase Auth
        try {
            FirebaseAuth.getInstance().deleteUser(uid);
        } catch (Exception e) {
            log.error("Error deleting firebase user: {}", e.getMessage());
        }

        return Map.of("message", "Account deleted successfully");
    }

    public Map<String, String> testNotification(FirebaseUser user) {
        notificationService.sendEmail(
                user.email(),
                "Test Notification from Journey360",
                "Hello " + (user.name() != null ? user.name() : "Traveler") +
                        ", this is a test notification verifying your settings are active.");
        return Map.of("message", "Test notification sent (check server logs)");
    }

    public Map<String, String> setup2fa(FirebaseUser user) {
        DefaultSecretGenerator secretGenerator = new DefaultSecretGenerator();
        String secret = secretGenerator.generate();

        // Generate otpauth URI
        String uri = String.format("otpauth://totp/Journey360:%s?secret=%s&issuer=Journey360",
                user.email(), secret);

        // Store secret in DB
        mongoTemplate.upsert(
                Query.query(Criteria.where("uid").is(user.uid())),
                new Update().set("two_factor_secret", secret).set("two_factor_enabled", false),
                "users");

        return Map.of("secret", secret, "otpauth_url", uri);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> verify2fa(String code, FirebaseUser user) {
        Map dbUser = mongoTemplate.findOne(
                Query.query(Criteria.where("uid").is(user.uid())),
                Map.class, "users");

        if (dbUser == null || dbUser.get("two_factor_secret") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "2FA not set up. Call /setup first.");
        }

        String secret = (String) dbUser.get("two_factor_secret");

        DefaultCodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, new SystemTimeProvider());

        if (verifier.isValidCode(secret, code)) {
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("uid").is(user.uid())),
                    new Update().set("two_factor_enabled", true),
                    "users");
            return Map.of("message", "2FA Enabled Successfully", "enabled", true);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
    }

    public Map<String, Object> disable2fa(FirebaseUser user) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("uid").is(user.uid())),
                new Update().set("two_factor_enabled", false).set("two_factor_secret", null),
                "users");
        return Map.of("message", "2FA Disabled", "enabled", false);
    }
}
