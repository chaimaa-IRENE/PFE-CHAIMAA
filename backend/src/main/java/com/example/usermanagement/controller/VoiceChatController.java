package com.example.usermanagement.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/voice-chat")
@CrossOrigin(origins = "*")
public class VoiceChatController {

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body,
                                         @RequestHeader(value = "X-User-Name", required = false) String userName,
                                         @RequestHeader(value = "X-User-Location", required = false) String location,
                                         @RequestHeader(value = "X-Current-Field", required = false) String currentField) {
        String message = (String) body.get("message");
        String sessionId = (String) body.get("sessionId");
        String field = currentField != null ? currentField : (String) body.get("currentField");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", sessionId != null ? sessionId : UUID.randomUUID().toString());
        response.put("success", true);
        response.put("erreur", "");

        if (message == null || message.isBlank()) {
            response.put("questionDarija", "شنو نوع العطب؟");
            response.put("questionFrancais", "Quel est le type de panne ?");
            response.put("field", "typePanne");
            response.put("done", false);
            response.put("rapportJson", "");
            return ResponseEntity.ok(response);
        }

        boolean done = field != null && List.of("description", "criticite", "confirmation").contains(field);
        response.put("done", done);
        response.put("rapportJson", done ? "{\"source\":\"Voix chauffeur\"}" : "");
        response.put("questionDarija", done ? "شكرا، تم التسجيل" : "شنو وصف المشكلة؟");
        response.put("questionFrancais", done ? "Merci, c'est enregistré" : "Quelle est la description du problème ?");
        response.put("field", done ? "done" : "description");
        return ResponseEntity.ok(response);
    }
}