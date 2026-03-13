package com.journey360.controller;

import com.journey360.auth.FirebaseUser;
import com.journey360.service.SavedPlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/saved-places")
public class SavedPlaceController {

    @Autowired
    private SavedPlaceService savedPlaceService;

    @GetMapping("")
    public List<Map<String, Object>> getSavedPlaces(@AuthenticationPrincipal FirebaseUser user) {
        return savedPlaceService.getSavedPlaces(user);
    }

    @PostMapping("")
    public Map<String, Object> savePlace(@RequestBody Map<String, Object> place,
            @AuthenticationPrincipal FirebaseUser user) {
        return savedPlaceService.savePlace(place, user);
    }

    @DeleteMapping("/{placeId}")
    public Map<String, String> removePlace(@PathVariable String placeId,
            @AuthenticationPrincipal FirebaseUser user) {
        return savedPlaceService.removePlace(placeId, user);
    }

    @GetMapping("/check/{placeId}")
    public Map<String, Boolean> checkIsSaved(@PathVariable String placeId,
            @AuthenticationPrincipal FirebaseUser user) {
        return savedPlaceService.checkIsSaved(placeId, user);
    }
}
