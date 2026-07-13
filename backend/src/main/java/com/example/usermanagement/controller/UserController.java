package com.example.usermanagement.controller;

import com.example.usermanagement.dto.AuthResponse;
import com.example.usermanagement.model.AuditLog;
import com.example.usermanagement.model.ConnectionAudit;
import com.example.usermanagement.model.User;
import com.example.usermanagement.repository.AuditLogRepository;
import com.example.usermanagement.repository.ConnectionAuditRepository;
import com.example.usermanagement.service.FaceService;
import com.example.usermanagement.service.UserService;
import com.example.usermanagement.service.WebAuthnService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService userService;
    private final WebAuthnService webAuthnService;
    private final FaceService faceService;
    private final AuditLogRepository auditLogRepository;
    private final ConnectionAuditRepository connectionAuditRepository;

    public UserController(UserService userService, WebAuthnService webAuthnService,
                          FaceService faceService, AuditLogRepository auditLogRepository,
                          ConnectionAuditRepository connectionAuditRepository) {
        this.userService = userService;
        this.webAuthnService = webAuthnService;
        this.faceService = faceService;
        this.auditLogRepository = auditLogRepository;
        this.connectionAuditRepository = connectionAuditRepository;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.createUser(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-person-code/{personCode}")
    public ResponseEntity<?> getUserByPersonCode(@PathVariable String personCode) {
        return userService.getUserByPersonCode(personCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        try {
            return ResponseEntity.ok(userService.updateUser(id, userDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String holdReason = body != null ? body.get("holdReason") : null;
            if (holdReason == null || holdReason.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "HOLD_REASON is required for deactivation"));
            }
            userService.deleteUser(id, holdReason);
            return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email requis"));
        }
        return ResponseEntity.ok(userService.requestPasswordReset(email));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token et nouveau mot de passe requis"));
        }
        return ResponseEntity.ok(userService.resetPassword(token, newPassword));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        Optional<AuthResponse> auth = userService.authenticateWithToken(username, password);
        return auth.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }

    @PostMapping("/face-login")
    public ResponseEntity<?> faceLogin(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String faceImage = body.get("faceImage");
        if (username == null || faceImage == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "username et faceImage requis"));
        }
        Optional<AuthResponse> auth = userService.authenticateWithFace(username, faceImage);
        if (auth.isPresent()) {
            return ResponseEntity.ok(auth.get());
        }
        double sim = 0.0;
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isPresent() && userOpt.get().getFaceRegistered()) {
            try {
                sim = faceService.compareFaces(userOpt.get().getFaceDescriptor(), faceImage);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.status(401).body(Map.of(
            "error", "Reconnaissance faciale échouée",
            "similarity", sim
        ));
    }

    @PostMapping("/face/register")
    public ResponseEntity<?> registerFace(@RequestBody Map<String, Object> body) {
        try {
            Long userId = ((Number) body.get("userId")).longValue();
            String faceImage = (String) body.get("faceImage");
            if (faceImage == null || faceImage.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "faceImage requis"));
            }
            return ResponseEntity.ok(userService.registerFace(userId, faceImage));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/face/check/{username}")
    public ResponseEntity<?> checkFaceRegistered(@PathVariable String username) {
        boolean registered = userService.hasFaceRegistered(username);
        return ResponseEntity.ok(Map.of("registered", registered));
    }

    @GetMapping("/{id}/face/check")
    public ResponseEntity<?> checkFaceRegisteredById(@PathVariable Long id) {
        boolean registered = userService.hasFaceRegisteredById(id);
        return ResponseEntity.ok(Map.of("registered", registered));
    }

    @DeleteMapping("/{id}/face")
    public ResponseEntity<?> removeFace(@PathVariable Long id) {
        return ResponseEntity.ok(userService.removeFace(id));
    }



    @PostMapping("/webauthn/register/begin")
    public ResponseEntity<?> webAuthnRegisterBegin(@RequestBody Map<String, Long> body) {
        try {
            Long userId = body.get("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
            }
            return ResponseEntity.ok(webAuthnService.startRegistration(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webauthn/register/complete")
    public ResponseEntity<?> webAuthnRegisterComplete(@RequestBody Map<String, Object> body) {
        try {
            Long userId = ((Number) body.get("userId")).longValue();
            Map<String, Object> credential = (Map<String, Object>) body.get("credential");
            return ResponseEntity.ok(webAuthnService.completeRegistration(userId, credential));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webauthn/login/begin")
    public ResponseEntity<?> webAuthnLoginBegin(@RequestBody Map<String, Long> body) {
        try {
            Long userId = body.get("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
            }
            return ResponseEntity.ok(webAuthnService.startLogin(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webauthn/login/complete")
    public ResponseEntity<?> webAuthnLoginComplete(@RequestBody Map<String, Object> body) {
        try {
            Long userId = ((Number) body.get("userId")).longValue();
            Map<String, Object> credential = (Map<String, Object>) body.get("credential");
            Map<String, Object> webauthnResult = webAuthnService.completeLogin(userId, credential);
            if (!Boolean.TRUE.equals(webauthnResult.get("verified"))) {
                return ResponseEntity.status(401).body(Map.of("error", "WebAuthn verification failed"));
            }
            Optional<AuthResponse> auth = userService.completeWebAuthnLogin(userId);
            return auth.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(401).build());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/webauthn/check/{userId}")
    public ResponseEntity<?> webAuthnCheck(@PathVariable Long userId) {
        try {
            boolean hasCreds = webAuthnService.hasCredentials(userId);
            return ResponseEntity.ok(Map.of("hasCredentials", hasCreds));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/webauthn/{userId}")
    public ResponseEntity<?> webAuthnRemove(@PathVariable Long userId) {
        try {
            webAuthnService.removeCredentials(userId);
            return ResponseEntity.ok(Map.of("message", "WebAuthn credentials removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<?> getAuditLogs(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.getAuditLogs(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/audit/all")
    public ResponseEntity<?> getAllAuditLogs() {
        try {
            return ResponseEntity.ok(userService.getAllAuditLogs());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            User user = userService.getUserById(id).orElseThrow(() -> new RuntimeException("User non trouve"));
            String newStatus = body.get("status");
            String oldStatus = user.getStatus();
            user.setStatus(newStatus);
            user.setLastUpdate(LocalDateTime.now());
            if ("INACTIF".equals(newStatus)) { user.setHoldPerson(true); user.setHoldReason(body.getOrDefault("reason", "Desactive par admin")); }
            else if ("ACTIF".equals(newStatus)) { user.setHoldPerson(false); user.setHoldReason(null); }
            User saved = userService.updateUser(id, user);
            return ResponseEntity.ok(Map.of("success", true, "user", saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getUserHistory(@PathVariable Long id) {
        try {
            List<ConnectionAudit> connections = connectionAuditRepository.findByUserIdOrderByConnectionDateDesc(id);
            List<AuditLog> audits = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("USER", id);
            return ResponseEntity.ok(Map.of("success", true, "connections", connections, "audits", audits));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/connections/all")
    public ResponseEntity<?> getAllConnections() {
        return ResponseEntity.ok(Map.of("success", true, "connections", connectionAuditRepository.findAllByOrderByConnectionDateDesc()));
    }
}
