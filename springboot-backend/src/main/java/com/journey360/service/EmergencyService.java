package com.journey360.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EmergencyService {

    private static final Map<String, Map<String, String>> COUNTRY_EMERGENCY = new LinkedHashMap<>();

    static {
        COUNTRY_EMERGENCY.put("default", Map.of("number", "112", "label", "Emergency Services"));
        // Asia
        COUNTRY_EMERGENCY.put("India", Map.of("number", "112", "label", "National Emergency"));
        COUNTRY_EMERGENCY.put("Japan", Map.of("number", "110 / 119", "label", "Police / Fire & Ambulance"));
        COUNTRY_EMERGENCY.put("China", Map.of("number", "110 / 120 / 119", "label", "Police / Ambulance / Fire"));
        COUNTRY_EMERGENCY.put("Singapore", Map.of("number", "999", "label", "Emergency Services"));
        COUNTRY_EMERGENCY.put("UAE", Map.of("number", "999", "label", "Police Emergency"));
        COUNTRY_EMERGENCY.put("Sri Lanka", Map.of("number", "119", "label", "Emergency Services"));
        // Europe
        COUNTRY_EMERGENCY.put("France", Map.of("number", "112", "label", "European Emergency"));
        COUNTRY_EMERGENCY.put("Germany", Map.of("number", "112", "label", "European Emergency"));
        COUNTRY_EMERGENCY.put("Italy", Map.of("number", "112", "label", "European Emergency"));
        COUNTRY_EMERGENCY.put("Spain", Map.of("number", "112", "label", "European Emergency"));
        COUNTRY_EMERGENCY.put("Netherlands", Map.of("number", "112", "label", "European Emergency"));
        COUNTRY_EMERGENCY.put("Switzerland", Map.of("number", "112", "label", "European Emergency"));
        COUNTRY_EMERGENCY.put("Sweden", Map.of("number", "112", "label", "European Emergency"));
        COUNTRY_EMERGENCY.put("UK", Map.of("number", "999", "label", "Emergency Services"));
        COUNTRY_EMERGENCY.put("Ireland", Map.of("number", "112 / 999", "label", "Emergency Services"));
        // Americas
        COUNTRY_EMERGENCY.put("USA", Map.of("number", "911", "label", "Emergency Services"));
        COUNTRY_EMERGENCY.put("Canada", Map.of("number", "911", "label", "Emergency Services"));
        COUNTRY_EMERGENCY.put("Mexico", Map.of("number", "911", "label", "Emergency Services"));
        COUNTRY_EMERGENCY.put("Brazil", Map.of("number", "190 / 192 / 193", "label", "Police / Ambulance / Fire"));
        // Oceania
        COUNTRY_EMERGENCY.put("Australia", Map.of("number", "000", "label", "Emergency Services"));
        COUNTRY_EMERGENCY.put("New Zealand", Map.of("number", "111", "label", "Emergency Services"));
        // Africa
        COUNTRY_EMERGENCY.put("South Africa", Map.of("number", "10111", "label", "Police Emergency"));
        COUNTRY_EMERGENCY.put("Kenya", Map.of("number", "999 / 112", "label", "Emergency Services"));
    }

    public Map<String, Object> getEmergencyNumbers(String country) {
        Map<String, String> data = COUNTRY_EMERGENCY.get(country);

        // Case-insensitive fallback
        if (data == null) {
            for (var entry : COUNTRY_EMERGENCY.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(country)) {
                    data = entry.getValue();
                    break;
                }
            }
        }

        if (data == null) {
            data = COUNTRY_EMERGENCY.get("default");
        }

        return Map.of("primary", Map.of(
                "number", data.get("number"),
                "label", data.get("label"),
                "callable", true,
                "tel", "tel:" + data.get("number")));
    }
}
