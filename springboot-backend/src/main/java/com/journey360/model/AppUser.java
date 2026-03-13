package com.journey360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class AppUser {

    @Id
    private String id;

    private String uid;
    private String email;
    private String name;
    private String phone;
    private String bio;
    private String dob;

    @Field("photo_url")
    private String photoUrl;

    private Map<String, Object> preferences;

    @Field("two_factor_enabled")
    @Builder.Default
    private boolean twoFactorEnabled = false;

    @Field("two_factor_secret")
    private String twoFactorSecret;

    @Field("created_at")
    private String createdAt;

    @Field("last_login")
    private java.util.Date lastLogin;
}
