package com.example.usermanagement.controller;

import com.example.usermanagement.service.UserValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user-validation")
@CrossOrigin(origins = "*")
public class UserValidationController {

    private final UserValidationService userValidationService;

    public UserValidationController(UserValidationService userValidationService) {
        this.userValidationService = userValidationService;
    }

    /**
     * Génère et envoie un code de validation par email
     */
    @PostMapping("/send-code/{userId}")
    public ResponseEntity<Map<String, Object>> sendValidationCode(@PathVariable Long userId) {
        try {
            String code = userValidationService.generateAndSendValidationCode(userId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Code de validation envoyé par email",
                "code", code // Retourner le code pour les tests (en production, ne pas le retourner)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Valide le code de validation
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateCode(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String code = request.get("code");

        if (username == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Username et code requis"
            ));
        }

        boolean isValid = userValidationService.validateUserCode(username, code);
        return ResponseEntity.ok(Map.of(
            "success", isValid,
            "message", isValid ? "Code validé avec succès" : "Code invalide ou expiré"
        ));
    }

    /**
     * Régénère et renvoie un nouveau code de validation
     */
    @PostMapping("/regenerate/{username}")
    public ResponseEntity<Map<String, Object>> regenerateCode(@PathVariable String username) {
        try {
            String code = userValidationService.regenerateValidationCode(username);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Nouveau code de validation envoyé",
                "code", code // Retourner le code pour les tests
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Vérifie si l'utilisateur a validé son email
     */
    @GetMapping("/check/{username}")
    public ResponseEntity<Map<String, Object>> checkValidation(@PathVariable String username) {
        boolean isValidated = userValidationService.isEmailValidated(username);
        return ResponseEntity.ok(Map.of(
            "emailValidated", isValidated
        ));
    }
}
