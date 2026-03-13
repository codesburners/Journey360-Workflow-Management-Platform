package com.journey360.config;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Loads .env file from project root into system properties,
 * making them available to Spring's ${...} property resolution.
 */
@Configuration
public class DotEnvConfig {

    @PostConstruct
    public void loadDotEnv() {
        Path envFile = Path.of(System.getProperty("user.dir"), ".env");
        if (!Files.exists(envFile)) {
            envFile = Path.of(System.getProperty("user.dir")).getParent().resolve(".env");
        }
        if (!Files.exists(envFile))
            return;

        try {
            Files.readAllLines(envFile).stream()
                    .filter(line -> !line.isBlank() && !line.startsWith("#") && line.contains("="))
                    .forEach(line -> {
                        int idx = line.indexOf('=');
                        String key = line.substring(0, idx).trim();
                        String value = line.substring(idx + 1).trim();
                        // Only set if not already set (environment variables take precedence)
                        if (System.getenv(key) == null && System.getProperty(key) == null) {
                            System.setProperty(key, value);
                        }
                    });
        } catch (IOException e) {
            // Silently ignore
        }
    }
}
