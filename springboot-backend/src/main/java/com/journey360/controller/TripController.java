package com.journey360.controller;

import com.journey360.auth.FirebaseUser;
import com.journey360.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TripController {

    @Autowired
    private TripService tripService;

    @PostMapping("/trip/create")
    public Map<String, Object> createTrip(@RequestBody Map<String, Object> data,
            @AuthenticationPrincipal FirebaseUser user) {
        return tripService.createTrip(data, user);
    }

    @GetMapping("/trips")
    public List<Map<String, Object>> listTrips(@AuthenticationPrincipal FirebaseUser user) {
        return tripService.listTrips(user);
    }
}
