package com.journey360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
@EnableAsync
public class Journey360Application {

    public static void main(String[] args) {
        // Load .env BEFORE Spring Boot starts so ${...} placeholders resolve
        loadDotEnv();
        SpringApplication.run(Journey360Application.class, args);
    }

    private static void loadDotEnv() {
        Path envFile = Path.of(System.getProperty("user.dir"), ".env");
        if (!Files.exists(envFile)) {
            envFile = Path.of(System.getProperty("user.dir")).getParent().resolve(".env");
        }
        if (!Files.exists(envFile)) {
            System.out.println("[Journey360] No .env file found. Using system environment variables.");
            return;
        }

        try {
            System.out.println("[Journey360] Loading .env from: " + envFile);
            Files.readAllLines(envFile).stream()
                    .filter(line -> !line.isBlank() && !line.startsWith("#") && line.contains("="))
                    .forEach(line -> {
                        int idx = line.indexOf('=');
                        String key = line.substring(0, idx).trim();
                        String value = line.substring(idx + 1).trim();
                        // Remove surrounding quotes if present
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                        }
                        // Only set if not already in environment
                        if (System.getenv(key) == null) {
                            System.setProperty(key, value);
                        }
                    });
            System.out.println("[Journey360] .env loaded successfully.");
        } catch (IOException e) {
            System.err.println("[Journey360] Failed to load .env: " + e.getMessage());
        }
    }
}
