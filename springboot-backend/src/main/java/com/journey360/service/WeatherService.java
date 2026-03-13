package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class WeatherService {

    private static final Logger log = LoggerFactory.getLogger(WeatherService.class);

    @Value("${openweather.api.key:}")
    private String apiKey;

    private final WebClient webClient;

    public WeatherService(WebClient webClient) {
        this.webClient = webClient;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getWeather(String city) {
        if (apiKey == null || apiKey.isBlank()) {
            return Map.of(
                    "weather", java.util.List.of(Map.of("description", "unknown")),
                    "main", Map.of("temp", 25.0));
        }

        try {
            Map response = webClient.get()
                    .uri("http://api.openweathermap.org/data/2.5/weather", uriBuilder -> uriBuilder
                            .queryParam("q", city)
                            .queryParam("appid", apiKey)
                            .queryParam("units", "metric")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                return response;
            }
        } catch (Exception e) {
            log.warn("Weather API Error: {}", e.getMessage());
        }

        return Map.of(
                "weather", java.util.List.of(Map.of("description", "clear sky")),
                "main", Map.of("temp", 25.0));
    }
}
