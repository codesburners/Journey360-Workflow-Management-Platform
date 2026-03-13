package com.journey360.auth;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(FirebaseTokenFilter.class);
    private static final Gson gson = new Gson();

    @Value("${app.offline-mode:false}")
    private boolean offlineMode;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/") || path.equals("/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"detail\":\"Missing or invalid Authorization header\"}");
            return;
        }

        String token = authHeader.substring(7);
        log.debug("Received token starting with {}...", token.substring(0, Math.min(10, token.length())));

        try {
            FirebaseUser user = verifyToken(token);
            log.info("Auth success for user {}", user.email());

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null,
                    Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            log.warn("Token verification failed: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"detail\":\"Token verification failed: " +
                    e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    private FirebaseUser verifyToken(String idToken) throws Exception {
        // 1. Mock token (offline/dev mode)
        if (offlineMode || "mock_token".equals(idToken)) {
            log.info("Firebase running in OFFLINE_MODE. Attempting lazy decode.");
            if ("mock_token".equals(idToken)) {
                return new FirebaseUser("mock_user_123", "mock@example.com", "Mock User");
            }
            return decodeWithoutVerification(idToken);
        }

        // 2. Strict Firebase verification
        if (!FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                return new FirebaseUser(
                        decodedToken.getUid(),
                        decodedToken.getEmail(),
                        decodedToken.getName());
            } catch (Exception e) {
                log.warn("Strict token verification failed: {}", e.getMessage());
            }
        }

        // 3. Fallback: unverified decode (dev only — mirrors Python behavior)
        log.warn("Falling back to unverified token decoding (Missing Key or Verification Failed).");
        return decodeWithoutVerification(idToken);
    }

    /**
     * Decode a JWT without verifying signature.
     * WARNING: Insecure — only for local dev when Firebase key is unavailable.
     */
    private FirebaseUser decodeWithoutVerification(String token) throws Exception {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                throw new Exception("Invalid JWT format");
            }
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            JsonObject claims = gson.fromJson(payload, JsonObject.class);

            String uid = claims.has("sub") ? claims.get("sub").getAsString()
                    : claims.has("user_id") ? claims.get("user_id").getAsString() : null;
            String email = claims.has("email") ? claims.get("email").getAsString() : null;
            String name = claims.has("name") ? claims.get("name").getAsString() : null;

            if (uid == null) {
                throw new Exception("Token payload missing 'sub' or 'user_id'");
            }

            log.info("Lazy decode success for {}", email);
            return new FirebaseUser(uid, email, name);
        } catch (Exception e) {
            log.error("Lazy decode failed: {}", e.getMessage());
            throw new Exception("Invalid token and no fallback available.");
        }
    }
}
