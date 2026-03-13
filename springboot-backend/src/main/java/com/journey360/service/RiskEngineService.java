package com.journey360.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RiskEngineService {

    public Map<String, Object> calculateRisk(List<Map<String, Object>> news) {
        if (news == null || news.isEmpty()) {
            return Map.of(
                    "score", 10,
                    "level", "Low",
                    "reason", "No recent safety incidents reported.");
        }

        int score = 0;
        Set<String> reasons = new LinkedHashSet<>();

        for (Map<String, Object> n : news) {
            String severity = (String) n.getOrDefault("severity", "Low");
            switch (severity) {
                case "High" -> {
                    score += 30;
                    reasons.add("High severity incidents detected");
                }
                case "Medium" -> {
                    score += 15;
                    reasons.add("Moderate safety concerns reported");
                }
                default -> score += 5;
            }
        }

        score = Math.min(score, 100);

        String level;
        if (score >= 70)
            level = "High";
        else if (score >= 35)
            level = "Medium";
        else
            level = "Low";

        return Map.of(
                "score", score,
                "level", level,
                "reason", reasons.isEmpty() ? "Minor incidents reported" : String.join(", ", reasons));
    }
}
