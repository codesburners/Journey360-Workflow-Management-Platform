package com.journey360.controller;

import com.journey360.auth.FirebaseUser;
import com.journey360.service.GeminiService;
import com.journey360.service.PlacesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Transport controller — full port of transport_service.py.
 * Handles /api/transport/* routes for trains, flights, and buses.
 */
@RestController
@RequestMapping("/api/transport")
public class TransportController {

    private static final Logger log = LoggerFactory.getLogger(TransportController.class);

    @Value("${rapidapi.key:}")
    private String rapidApiKey;

    @Value("${aviationstack.key:}")
    private String aviationStackKey;

    @Autowired
    private WebClient webClient;

    @Autowired
    private PlacesService placesService;

    @Autowired
    private GeminiService geminiService;

    // ─── Static Data: Train Stations ─────────────────────────────────────
    private static final Map<String, Map<String, String>> TRAIN_STATIONS = new LinkedHashMap<>();
    static {
        TRAIN_STATIONS.put("mumbai", Map.of("code", "CSTM", "name", "Chhatrapati Shivaji Terminus", "city", "Mumbai"));
        TRAIN_STATIONS.put("pune", Map.of("code", "PUNE", "name", "Pune Junction", "city", "Pune"));
        TRAIN_STATIONS.put("delhi", Map.of("code", "NDLS", "name", "New Delhi Railway Station", "city", "Delhi"));
        TRAIN_STATIONS.put("new delhi",
                Map.of("code", "NDLS", "name", "New Delhi Railway Station", "city", "New Delhi"));
        TRAIN_STATIONS.put("bangalore", Map.of("code", "SBC", "name", "Bangalore City Junction", "city", "Bangalore"));
        TRAIN_STATIONS.put("bengaluru", Map.of("code", "SBC", "name", "Bangalore City Junction", "city", "Bengaluru"));
        TRAIN_STATIONS.put("chennai", Map.of("code", "MAS", "name", "Chennai Central", "city", "Chennai"));
        TRAIN_STATIONS.put("kolkata", Map.of("code", "HWH", "name", "Howrah Junction", "city", "Kolkata"));
        TRAIN_STATIONS.put("hyderabad", Map.of("code", "SC", "name", "Secunderabad Junction", "city", "Hyderabad"));
        TRAIN_STATIONS.put("ahmedabad", Map.of("code", "ADI", "name", "Ahmedabad Junction", "city", "Ahmedabad"));
        TRAIN_STATIONS.put("jaipur", Map.of("code", "JP", "name", "Jaipur Junction", "city", "Jaipur"));
        TRAIN_STATIONS.put("lucknow", Map.of("code", "LKO", "name", "Lucknow Junction", "city", "Lucknow"));
        TRAIN_STATIONS.put("goa", Map.of("code", "MAO", "name", "Madgaon Junction", "city", "Goa"));
        TRAIN_STATIONS.put("varanasi", Map.of("code", "BSB", "name", "Varanasi Junction", "city", "Varanasi"));
        TRAIN_STATIONS.put("agra", Map.of("code", "AGC", "name", "Agra Cantt", "city", "Agra"));
        TRAIN_STATIONS.put("coimbatore", Map.of("code", "CBE", "name", "Coimbatore Junction", "city", "Coimbatore"));
        TRAIN_STATIONS.put("nagpur", Map.of("code", "NGP", "name", "Nagpur Junction", "city", "Nagpur"));
        TRAIN_STATIONS.put("bhopal", Map.of("code", "BPL", "name", "Bhopal Junction", "city", "Bhopal"));
        TRAIN_STATIONS.put("patna", Map.of("code", "PNBE", "name", "Patna Junction", "city", "Patna"));
        TRAIN_STATIONS.put("chandigarh", Map.of("code", "CDG", "name", "Chandigarh Junction", "city", "Chandigarh"));
        TRAIN_STATIONS.put("indore", Map.of("code", "INDB", "name", "Indore Junction", "city", "Indore"));
        TRAIN_STATIONS.put("visakhapatnam",
                Map.of("code", "VSKP", "name", "Visakhapatnam Junction", "city", "Visakhapatnam"));
        TRAIN_STATIONS.put("surat", Map.of("code", "ST", "name", "Surat Railway Station", "city", "Surat"));
        TRAIN_STATIONS.put("london", Map.of("code", "LON", "name", "London Paddington", "city", "London"));
        TRAIN_STATIONS.put("paris", Map.of("code", "PLY", "name", "Gare de Lyon", "city", "Paris"));
        TRAIN_STATIONS.put("tokyo", Map.of("code", "TYO", "name", "Tokyo Station", "city", "Tokyo"));
        TRAIN_STATIONS.put("new york", Map.of("code", "NYP", "name", "Penn Station", "city", "New York"));
        TRAIN_STATIONS.put("berlin", Map.of("code", "BER", "name", "Berlin Hauptbahnhof", "city", "Berlin"));
        TRAIN_STATIONS.put("singapore", Map.of("code", "SIN", "name", "Tanjong Pagar", "city", "Singapore"));
        TRAIN_STATIONS.put("dubai", Map.of("code", "DXB", "name", "Dubai Metro Central", "city", "Dubai"));
        TRAIN_STATIONS.put("sydney", Map.of("code", "SYD", "name", "Sydney Central", "city", "Sydney"));
    }

    // ─── Static Data: Airports ─────────────────────────────────────
    private static final Map<String, String> AIRPORTS = new LinkedHashMap<>();
    static {
        AIRPORTS.put("mumbai", "BOM");
        AIRPORTS.put("delhi", "DEL");
        AIRPORTS.put("new delhi", "DEL");
        AIRPORTS.put("bangalore", "BLR");
        AIRPORTS.put("bengaluru", "BLR");
        AIRPORTS.put("chennai", "MAA");
        AIRPORTS.put("kolkata", "CCU");
        AIRPORTS.put("hyderabad", "HYD");
        AIRPORTS.put("pune", "PNQ");
        AIRPORTS.put("goa", "GOI");
        AIRPORTS.put("jaipur", "JAI");
        AIRPORTS.put("ahmedabad", "AMD");
        AIRPORTS.put("lucknow", "LKO");
        AIRPORTS.put("kochi", "COK");
        AIRPORTS.put("varanasi", "VNS");
        AIRPORTS.put("coimbatore", "CJB");
        AIRPORTS.put("srinagar", "SXR");
        AIRPORTS.put("london", "LHR");
        AIRPORTS.put("paris", "CDG");
        AIRPORTS.put("tokyo", "NRT");
        AIRPORTS.put("new york", "JFK");
        AIRPORTS.put("los angeles", "LAX");
        AIRPORTS.put("dubai", "DXB");
        AIRPORTS.put("singapore", "SIN");
        AIRPORTS.put("bangkok", "BKK");
        AIRPORTS.put("sydney", "SYD");
        AIRPORTS.put("berlin", "TXL");
        AIRPORTS.put("rome", "FCO");
        AIRPORTS.put("amsterdam", "AMS");
        AIRPORTS.put("toronto", "YYZ");
        AIRPORTS.put("johannesburg", "JNB");
        AIRPORTS.put("doha", "DOH");
    }

    // ─── Geocode ─────────────────────────────────────
    @GetMapping("/geocode")
    public Map<String, Object> geocode(@RequestParam String query,
            @AuthenticationPrincipal FirebaseUser user) {
        double[] coords = placesService.getCoordinates(query);
        if (coords != null) {
            return Map.of("lat", coords[0], "lng", coords[1], "name", query);
        }
        return Map.of("error", "Location not found: " + query);
    }

    // ─── Trains ─────────────────────────────────────
    @GetMapping("/trains")
    @SuppressWarnings("unchecked")
    public Map<String, Object> getTrains(@RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Double distance,
            @AuthenticationPrincipal FirebaseUser user) {
        Map<String, String> srcStation = resolveStation(origin);
        Map<String, String> dstStation = resolveStation(destination);

        if (srcStation == null || dstStation == null) {
            return Map.of(
                    "trains", List.of(),
                    "source", Map.of("city", origin, "code", "UNKNOWN"),
                    "destination", Map.of("city", destination, "code", "UNKNOWN"),
                    "message", "Station not found for one or both cities.");
        }

        if (date == null || date.isBlank()) {
            date = LocalDate.now().plusDays(3).format(DateTimeFormatter.ISO_DATE);
        }

        // Try live IRCTC API
        List<Map<String, Object>> trains = fetchTrainsLive(srcStation, dstStation, date);

        // Fallback to AI-generated
        if (trains.isEmpty()) {
            trains = generateTrainsFallback(origin, destination, date);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", srcStation);
        result.put("destination", dstStation);
        result.put("date_queried", date);
        result.put("trains", trains);
        result.put("total_found", trains.size());
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchTrainsLive(Map<String, String> src, Map<String, String> dst, String date) {
        if (rapidApiKey == null || rapidApiKey.isBlank())
            return List.of();

        try {
            Map response = webClient.get()
                    .uri("https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations", b -> b
                            .queryParam("fromStationCode", src.get("code"))
                            .queryParam("toStationCode", dst.get("code"))
                            .queryParam("dateOfJourney", date.replace("-", ""))
                            .build())
                    .header("x-rapidapi-host", "irctc1.p.rapidapi.com")
                    .header("x-rapidapi-key", rapidApiKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null)
                return List.of();

            Object data = response.get("data");
            if (data instanceof List && !((List) data).isEmpty()) {
                return (List<Map<String, Object>>) data;
            }
        } catch (Exception e) {
            log.warn("IRCTC API error: {}", e.getMessage());
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> generateTrainsFallback(String origin, String destination, String date) {
        String prompt = String.format(
                """
                            Generate 3 realistic train schedules between %s and %s.
                            Return JSON array:
                            [{"train_name":"","train_number":"","departure":"HH:MM","arrival":"HH:MM","duration":"Xh Ym","classes":["SL","3A","2A","1A"],"days_of_week":["Mon","Wed","Fri"]}]
                            JSON only. No markdown.
                        """,
                origin, destination);

        try {
            String result = geminiService.callGeminiForText(prompt);
            if (result != null && result.contains("[")) {
                String jsonStr = result.contains("```") ? result.split("```")[1].replaceFirst("json", "").strip()
                        : result.strip();

                com.google.gson.Gson gson = new com.google.gson.Gson();
                List<Map<String, Object>> trains = gson.fromJson(jsonStr,
                        new com.google.gson.reflect.TypeToken<List<Map<String, Object>>>() {
                        }.getType());
                if (trains != null) {
                    for (Map<String, Object> t : trains)
                        t.put("source", "AI Generated");
                    return trains;
                }
            }
        } catch (Exception e) {
            log.warn("Train AI fallback failed: {}", e.getMessage());
        }
        return List.of();
    }

    // ─── Flights ─────────────────────────────────────
    @GetMapping("/flights")
    @SuppressWarnings("unchecked")
    public Map<String, Object> getFlights(@RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal FirebaseUser user) {
        String srcCode = resolveAirport(origin);
        String dstCode = resolveAirport(destination);

        if (srcCode == null || dstCode == null) {
            return Map.of(
                    "flights", List.of(),
                    "source", Map.of("city", origin, "iata", "UNKNOWN"),
                    "destination", Map.of("city", destination, "iata", "UNKNOWN"),
                    "message", "Airport not found for one or both cities.");
        }

        if (date == null || date.isBlank()) {
            date = LocalDate.now().plusDays(3).format(DateTimeFormatter.ISO_DATE);
        }

        List<Map<String, Object>> flights = List.of();

        // AviationStack
        if (aviationStackKey != null && !aviationStackKey.isBlank()) {
            try {
                final String d = date;
                Map response = webClient.get()
                        .uri("http://api.aviationstack.com/v1/flights", b -> b
                                .queryParam("access_key", aviationStackKey)
                                .queryParam("dep_iata", srcCode)
                                .queryParam("arr_iata", dstCode)
                                .queryParam("flight_date", d)
                                .queryParam("limit", 10)
                                .build())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response != null) {
                    List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                    if (data != null && !data.isEmpty()) {
                        flights = new ArrayList<>();
                        for (Map<String, Object> f : data) {
                            Map<String, Object> dep = (Map<String, Object>) f.get("departure");
                            Map<String, Object> arr = (Map<String, Object>) f.get("arrival");
                            Map<String, Object> airline = (Map<String, Object>) f.get("airline");
                            Map<String, Object> flight = (Map<String, Object>) f.get("flight");

                            Map<String, Object> flightData = new LinkedHashMap<>();
                            flightData.put("airline", airline != null ? airline.get("name") : "Unknown");
                            flightData.put("flight_number", flight != null ? flight.get("iata") : "N/A");
                            flightData.put("departure_time", dep != null ? dep.get("scheduled") : "N/A");
                            flightData.put("arrival_time", arr != null ? arr.get("scheduled") : "N/A");
                            flightData.put("dep_airport", dep != null ? dep.get("airport") : "");
                            flightData.put("arr_airport", arr != null ? arr.get("airport") : "");
                            flightData.put("status", f.getOrDefault("flight_status", "scheduled"));
                            flightData.put("source", "AviationStack Live Data");
                            flights.add(flightData);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("AviationStack error: {}", e.getMessage());
            }
        }

        // AI fallback
        if (flights.isEmpty()) {
            flights = generateFlightsFallback(origin, destination, srcCode, dstCode, date);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", Map.of("city", origin, "iata", srcCode));
        result.put("destination", Map.of("city", destination, "iata", dstCode));
        result.put("date_queried", date);
        result.put("flights", flights);
        result.put("total_found", flights.size());
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> generateFlightsFallback(String origin, String dest,
            String srcCode, String dstCode, String date) {
        String prompt = String.format(
                """
                            Generate 5 realistic flight schedules from %s (%s) to %s (%s) for %s.
                            Return JSON array:
                            [{"airline":"","flight_number":"","departure_time":"HH:MM","arrival_time":"HH:MM","duration":"Xh Ym","price":"₹NNNN"}]
                            JSON only.
                        """,
                origin, srcCode, dest, dstCode, date);

        try {
            String result = geminiService.callGeminiForText(prompt);
            if (result != null && result.contains("[")) {
                String jsonStr = result.contains("```") ? result.split("```")[1].replaceFirst("json", "").strip()
                        : result.strip();

                com.google.gson.Gson gson = new com.google.gson.Gson();
                List<Map<String, Object>> flights = gson.fromJson(jsonStr,
                        new com.google.gson.reflect.TypeToken<List<Map<String, Object>>>() {
                        }.getType());
                if (flights != null) {
                    for (Map<String, Object> f : flights)
                        f.put("source", "AI Generated");
                    return flights;
                }
            }
        } catch (Exception e) {
            log.warn("Flight AI fallback failed: {}", e.getMessage());
        }
        return List.of();
    }

    // ─── Buses ─────────────────────────────────────
    @GetMapping("/buses")
    @SuppressWarnings("unchecked")
    public Map<String, Object> getBuses(@RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal FirebaseUser user) {
        if (date == null || date.isBlank()) {
            date = LocalDate.now().plusDays(3).format(DateTimeFormatter.ISO_DATE);
        }

        List<Map<String, Object>> buses = generateBusesFallback(origin, destination, date);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", Map.of("city", origin));
        result.put("destination", Map.of("city", destination));
        result.put("date_queried", date);
        result.put("buses", buses);
        result.put("total_found", buses.size());
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> generateBusesFallback(String origin, String destination, String date) {
        String prompt = String.format(
                """
                            Generate 5 realistic bus schedules between %s and %s for %s.
                            Include operators like RedBus, VRL, KSRTC, MSRTC, SRS.
                            Return JSON array:
                            [{"operator":"","bus_type":"AC Sleeper|Non-AC|Volvo","departure_time":"HH:MM","arrival_time":"HH:MM","duration":"Xh Ym","price":"₹NNN","amenities":["WiFi","Charging","Blanket"],"rating":4.2}]
                            JSON only.
                        """,
                origin, destination, date);

        try {
            String result = geminiService.callGeminiForText(prompt);
            if (result != null && result.contains("[")) {
                String jsonStr = result.contains("```") ? result.split("```")[1].replaceFirst("json", "").strip()
                        : result.strip();

                com.google.gson.Gson gson = new com.google.gson.Gson();
                List<Map<String, Object>> buses = gson.fromJson(jsonStr,
                        new com.google.gson.reflect.TypeToken<List<Map<String, Object>>>() {
                        }.getType());
                if (buses != null) {
                    for (Map<String, Object> b : buses)
                        b.put("source", "AI Generated");
                    return buses;
                }
            }
        } catch (Exception e) {
            log.warn("Bus AI fallback failed: {}", e.getMessage());
        }
        return List.of();
    }

    // ─── Resolver Helpers ─────────────────────────────────────
    private Map<String, String> resolveStation(String city) {
        String key = city.toLowerCase().trim();
        return TRAIN_STATIONS.get(key);
    }

    private String resolveAirport(String city) {
        String key = city.toLowerCase().trim();
        return AIRPORTS.get(key);
    }
}
