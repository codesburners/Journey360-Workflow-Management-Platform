package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class NewsService {

    private static final Logger log = LoggerFactory.getLogger(NewsService.class);

    @Value("${news.api.key:}")
    private String newsApiKey;

    private final WebClient webClient;

    private static final List<String> SAFETY_KEYWORDS = List.of(
            "crime", "shooting", "attack", "riot",
            "protest", "flood", "earthquake",
            "fire", "explosion", "terror", "alert");

    private static final Map<String, String> SEVERITY_MAP = Map.of(
            "earthquake", "High",
            "attack", "High",
            "terror", "High",
            "riot", "High",
            "flood", "High",
            "fire", "Medium",
            "protest", "Medium",
            "crime", "Medium");

    public NewsService(WebClient webClient) {
        this.webClient = webClient;
    }

    private String detectSeverity(String text) {
        String lower = text.toLowerCase();
        for (var entry : SEVERITY_MAP.entrySet()) {
            if (lower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "Low";
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getSafetyNews(String city, String country) {
        return getSafetyNews(city, country, 5);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getSafetyNews(String city, String country, int limit) {
        if (newsApiKey == null || newsApiKey.isBlank()) {
            throw new RuntimeException("NEWS_API_KEY missing");
        }

        String fromDate = LocalDate.now().minusDays(3).format(DateTimeFormatter.ISO_DATE);
        String keywordsJoined = String.join(" OR ", SAFETY_KEYWORDS);
        String query = city + " " + country + " AND (" + keywordsJoined + ")";

        try {
            List<Map<String, Object>> articlesRaw = fetchArticles(query, fromDate, limit);

            // Fallback: National search if local is empty
            String regionTag = "Local";
            if (articlesRaw.isEmpty() && country != null && !country.isBlank()) {
                log.info("No local news for {}, trying {} national news", city, country);
                query = country + " AND (" + keywordsJoined + ")";
                articlesRaw = fetchArticles(query, fromDate, limit);
                regionTag = "National";
            }

            List<Map<String, Object>> articles = new ArrayList<>();
            for (Map<String, Object> a : articlesRaw) {
                String text = a.getOrDefault("title", "") + " " + a.getOrDefault("description", "");
                Map<String, Object> source = (Map<String, Object>) a.getOrDefault("source", Map.of());
                String publishedAt = (String) a.getOrDefault("publishedAt", "");

                Map<String, Object> article = new LinkedHashMap<>();
                article.put("title", a.get("title"));
                article.put("source", source.get("name"));
                article.put("link", a.get("url"));
                article.put("published", publishedAt.contains("T") ? publishedAt.split("T")[0] : publishedAt);
                article.put("severity", detectSeverity(text));
                article.put("summary", a.get("description"));
                article.put("region", regionTag);
                articles.add(article);
            }

            return articles;
        } catch (Exception e) {
            log.error("News Fetch Error: {}", e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchArticles(String query, String fromDate, int limit) {
        try {
            Map response = webClient.get()
                    .uri("https://newsapi.org/v2/everything", b -> b
                            .queryParam("q", query)
                            .queryParam("from", fromDate)
                            .queryParam("language", "en")
                            .queryParam("sortBy", "publishedAt")
                            .queryParam("pageSize", limit)
                            .queryParam("apiKey", newsApiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return List.of();

            int status = response.containsKey("status") && "ok".equals(response.get("status")) ? 200 : 0;
            if (status == 0) {
                log.warn("NewsAPI returned non-ok status");
                return List.of();
            }

            List<Map<String, Object>> articles = (List<Map<String, Object>>) response.get("articles");
            return articles != null ? articles : List.of();
        } catch (Exception e) {
            log.warn("NewsAPI request failed: {}", e.getMessage());
            return List.of();
        }
    }
}
