package com.journey360.controller;

import com.journey360.auth.FirebaseUser;
import com.journey360.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public Map<String, Object> getMyProfile(@AuthenticationPrincipal FirebaseUser user) {
        return userService.getProfile(user);
    }

    @PutMapping("/me")
    public Map<String, Object> updateMyProfile(@RequestBody Map<String, Object> updateData,
            @AuthenticationPrincipal FirebaseUser user) {
        return userService.updateProfile(updateData, user);
    }

    @DeleteMapping("/me")
    public Map<String, String> deleteMyAccount(@AuthenticationPrincipal FirebaseUser user) {
        return userService.deleteAccount(user);
    }

    @PostMapping("/test-notify")
    public Map<String, String> testNotification(@AuthenticationPrincipal FirebaseUser user) {
        return userService.testNotification(user);
    }

    @PostMapping("/2fa/setup")
    public Map<String, String> setup2fa(@AuthenticationPrincipal FirebaseUser user) {
        return userService.setup2fa(user);
    }

    @PostMapping("/2fa/verify")
    public Map<String, Object> verify2fa(@RequestBody Map<String, String> data,
            @AuthenticationPrincipal FirebaseUser user) {
        return userService.verify2fa(data.get("code"), user);
    }

    @PostMapping("/2fa/disable")
    public Map<String, Object> disable2fa(@AuthenticationPrincipal FirebaseUser user) {
        return userService.disable2fa(user);
    }
}
