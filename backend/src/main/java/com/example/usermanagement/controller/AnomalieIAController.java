package com.example.usermanagement.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/anomalie-ia")
@CrossOrigin(origins = "*")
public class AnomalieIAController {

    @PostMapping("/analyser")
    public ResponseEntity<?> analyser(@RequestBody Map<String, Object> body,
                                     @RequestHeader(value = "X-User-Name", required = false) String userName,
                                     @RequestHeader(value = "X-GPS-Location", required = false) String gpsLocation,
                                     @RequestHeader(value = "X-Date-Time", required = false) String dateTime) {
        String texte = (String) body.get("texte");
        String localisation = (String) body.get("localisation");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("vehicule", "UNKNOWN");
        response.put("chauffeur", userName != null ? userName : "UNKNOWN");
        response.put("localisation", localisation != null ? localisation : (gpsLocation != null ? gpsLocation : "UNKNOWN"));
        response.put("element", "MECANIQUE");
        response.put("anomalie", texte != null ? texte : "");
        response.put("description", texte != null ? texte : "");
        response.put("categorie", "Mecanique");
        response.put("criticite", "Moyenne");
        response.put("date", dateTime != null ? dateTime.substring(0, 10) : java.time.LocalDate.now().toString());
        response.put("source", "Voix chauffeur");
        response.put("typePanne", "MECANIQUE");
        return ResponseEntity.ok(response);
    }
}