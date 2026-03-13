package com.journey360.auth;

import java.util.Map;

/**
 * Represents the authenticated Firebase user extracted from the JWT token.
 */
public record FirebaseUser(String uid, String email, String name) {

    public Map<String, Object> toMap() {
        return Map.of(
                "uid", uid != null ? uid : "",
                "email", email != null ? email : "",
                "name", name != null ? name : "");
    }
}
