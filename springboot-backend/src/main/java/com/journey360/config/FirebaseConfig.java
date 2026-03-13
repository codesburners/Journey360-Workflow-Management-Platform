package com.journey360.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.credentials.path:firebase_key.json}")
    private String credentialsPath;

    @Value("${firebase.credentials.json:}")
    private String credentialsJson;

    @Value("${app.offline-mode:false}")
    private boolean offlineMode;

    @PostConstruct
    public void init() {
        if (offlineMode) {
            log.info("Firebase running in OFFLINE_MODE (No initialization)");
            return;
        }

        if (FirebaseApp.getApps().size() > 0) {
            log.info("Firebase already initialized");
            return;
        }

        try {
            InputStream serviceAccount = null;

            // Priority 1: Local file
            Path keyPath = Path.of(credentialsPath);
            if (!keyPath.isAbsolute()) {
                // resolve relative to the working directory
                keyPath = Path.of(System.getProperty("user.dir")).resolve(keyPath);
            }
            if (Files.exists(keyPath)) {
                serviceAccount = new FileInputStream(keyPath.toFile());
                log.info("Firebase initialized from file: {}", keyPath);
            }
            // Priority 2: Environment variable JSON string
            else if (credentialsJson != null && !credentialsJson.isBlank()) {
                serviceAccount = new ByteArrayInputStream(
                        credentialsJson.getBytes(StandardCharsets.UTF_8));
                log.info("Firebase initialized from FIREBASE_CREDENTIALS env var");
            }

            if (serviceAccount != null) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
            } else {
                log.warn("Firebase credentials not found. Firebase Admin not initialized.");
            }

        } catch (Exception e) {
            log.error("Error initializing Firebase: {}", e.getMessage());
        }
    }
}
