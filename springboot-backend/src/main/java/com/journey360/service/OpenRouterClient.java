package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class OpenRouterClient {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterClient.class);

    @Value("${openrouter.api.key:}")
    private String apiKey;

    private final WebClient webClient;

    public OpenRouterClient(WebClient webClient) {
        this.webClient = webClient;
    }

    @SuppressWarnings("unchecked")
    public String callOpenRouter(String prompt, String model) {
        return callOpenRouter(prompt, null, model);
    }

    @SuppressWarnings("unchecked")
    public String callOpenRouter(String prompt, String systemPrompt, String model) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OPENROUTER_API_KEY not found.");
            return null;
        }

        var messages = new java.util.ArrayList<Map<String, String>>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.7,
                "top_p", 0.95,
                "max_tokens", 8000);

        try {
            log.info("Calling OpenRouter ({})...", model);

            Map response = webClient.post()
                    .uri("https://openrouter.ai/api/v1/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "http://localhost:3000")
                    .header("X-Title", "Journey360")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return null;

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                log.warn("OpenRouter success but NO CHOICES returned. Full response: {}", response);
                return null;
            }

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = message != null ? (String) message.get("content") : null;

            if (content == null || content.isBlank()) {
                log.warn("OpenRouter success but EMPTY CONTENT.");
                return "";
            }

            log.info("OpenRouter call successful ({} chars).", content.length());
            return content;
        } catch (Exception e) {
            log.warn("OpenRouter exception: {}", e.getMessage());
            return null;
        }
    }
}
