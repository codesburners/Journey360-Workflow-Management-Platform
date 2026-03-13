package com.journey360.service;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * Service to call Google Gemini API for generative AI tasks.
 * Replaces: ai/itinerary.py call_llm(), ai/assistant.py, ai/post_trip.py
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final Gson gson = new Gson();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${app.mock-ai:false}")
    private boolean mockAi;

    @Value("${app.offline-mode:false}")
    private boolean offlineMode;

    private final WebClient webClient;
    private final OpenRouterClient openRouterClient;

    public GeminiService(WebClient webClient, OpenRouterClient openRouterClient) {
        this.webClient = webClient;
        this.openRouterClient = openRouterClient;
    }

    /**
     * Multi-model LLM orchestrator: tries Gemini models via REST API first,
     * then falls back to OpenRouter models.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> callLlm(String prompt, boolean rawJson) {
        if (mockAi || offlineMode)
            return null; // Caller handles mock fallback

        List<String> models = List.of(
                "google/gemini-2.0-flash",
                "google/gemini-2.0-flash-lite",
                "google/gemini-1.5-flash",
                "google/gemini-1.5-pro",
                "openrouter/google/gemini-2.0-flash-lite:free",
                "openrouter/google/gemini-2.0-flash:free",
                "openrouter/meta-llama/llama-3.3-70b-instruct:free",
                "openrouter/deepseek/deepseek-r1:free");

        int maxRetries = 3;
        int retryDelay = 2000; // ms

        for (int attempt = 0; attempt < maxRetries; attempt++) {
            for (String modelName : models) {
                try {
                    log.info("Sending request to {} - Attempt {}...", modelName, attempt + 1);

                    String resText;

                    if (modelName.startsWith("google/") && !modelName.contains("openrouter")) {
                        // Call Gemini REST API directly
                        String googleModelId = modelName.replace("google/", "");
                        resText = callGeminiRestApi(googleModelId, prompt);
                    } else {
                        // Use OpenRouter
                        String orModelId = modelName.replace("openrouter/", "");
                        resText = openRouterClient.callOpenRouter(prompt, orModelId);
                    }

                    if (resText == null || resText.isBlank()) {
                        log.warn("Model {} returned empty. Trying next model...", modelName);
                        continue;
                    }

                    // Clean up markdown
                    String text = resText.strip();
                    if (text.contains("```")) {
                        if (text.contains("```json")) {
                            text = text.split("```json")[1].split("```")[0];
                        } else {
                            String[] parts = text.split("```");
                            if (parts.length >= 2)
                                text = parts[1];
                        }
                    }
                    text = text.strip();

                    // Parse JSON with repair
                    Map<String, Object> parsed;
                    try {
                        parsed = gson.fromJson(text, new TypeToken<Map<String, Object>>() {
                        }.getType());
                    } catch (JsonSyntaxException e) {
                        log.warn("JSON parsing failed. Attempting repair...");
                        text = repairJson(text);
                        parsed = gson.fromJson(text, new TypeToken<Map<String, Object>>() {
                        }.getType());
                    }

                    if (parsed == null)
                        throw new RuntimeException("AI returned null");

                    log.info("JSON parsed successfully from {}.", modelName);
                    parsed.put("_used_model", modelName);
                    return parsed;

                } catch (Exception e) {
                    String errStr = e.getMessage() != null ? e.getMessage() : "";
                    log.warn("Model {} failed: {}", modelName, errStr);

                    if (errStr.toLowerCase().contains("429") || errStr.toLowerCase().contains("quota") ||
                            errStr.toLowerCase().contains("resource_exhausted") ||
                            errStr.toLowerCase().contains("limit")) {
                        continue;
                    }
                    if (errStr.toLowerCase().contains("connection") || errStr.toLowerCase().contains("timeout") ||
                            errStr.toLowerCase().contains("503") || errStr.toLowerCase().contains("502")) {
                        continue;
                    }
                    continue;
                }
            }

            // All models failed for this attempt
            if (attempt < maxRetries - 1) {
                log.warn("All models failed on attempt {}. Waiting {}ms...", attempt + 1, retryDelay);
                try {
                    Thread.sleep(retryDelay);
                } catch (InterruptedException ignored) {
                }
                retryDelay *= 2;
            }
        }

        throw new RuntimeException("AI orchestration failed: All providers returned errors.");
    }

    /**
     * Simple Gemini call for text generation (chat/assistant/post-trip).
     */
    public String callGeminiForText(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank())
            return null;

        List<String> models = List.of("gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro");

        for (String model : models) {
            try {
                String result = callGeminiRestApi(model, prompt);
                if (result != null && !result.isBlank()) {
                    return result.strip();
                }
            } catch (Exception e) {
                log.warn("Gemini {} failed: {}", model, e.getMessage());
            }
        }
        return null;
    }

    /**
     * Calls Gemini REST API (v1beta) directly.
     */
    @SuppressWarnings("unchecked")
    private String callGeminiRestApi(String model, String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank())
            return null;

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, geminiApiKey);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", 0.7));

        try {
            Map response = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return null;

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates == null || candidates.isEmpty())
                return null;

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null)
                return null;

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty())
                return null;

            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.warn("Gemini REST API ({}) error: {}", model, e.getMessage());
            return null;
        }
    }

    /**
     * Attempts to repair a truncated JSON string.
     */
    private String repairJson(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank())
            return jsonStr;

        Deque<Character> stack = new ArrayDeque<>();
        boolean inString = false;
        boolean escaped = false;

        String clean = jsonStr.strip();

        for (char c : clean.toCharArray()) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c == '\\') {
                escaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (c == '{')
                    stack.push('}');
                else if (c == '[')
                    stack.push(']');
                else if ((c == '}' || c == ']') && !stack.isEmpty() && stack.peek() == c)
                    stack.pop();
            }
        }

        StringBuilder repaired = new StringBuilder(clean);
        if (inString)
            repaired.append('"');

        String trimmed = repaired.toString().strip();
        if (trimmed.endsWith(":"))
            repaired.append(" null");
        else if (trimmed.endsWith(","))
            repaired.deleteCharAt(repaired.length() - 1);

        while (!stack.isEmpty())
            repaired.append(stack.pop());

        return repaired.toString();
    }
}
