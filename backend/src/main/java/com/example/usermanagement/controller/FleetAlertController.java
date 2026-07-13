package com.example.usermanagement.controller;

import com.example.usermanagement.model.FleetAlert;
import com.example.usermanagement.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/fleet/alerts")
@CrossOrigin(origins = "*")
public class FleetAlertController {

    private final AlertService alertService;

    public FleetAlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<FleetAlert>> getActiveAlerts() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    @GetMapping("/all")
    public ResponseEntity<List<FleetAlert>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    @GetMapping("/vehicule/{immatriculation}")
    public ResponseEntity<List<FleetAlert>> getByVehicule(@PathVariable String immatriculation) {
        return ResponseEntity.ok(alertService.getAlertsByVehicule(immatriculation));
    }

    @PutMapping("/resolve/{id}")
    public ResponseEntity<?> resolveAlert(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String resoluPar = body.get("resoluPar");
        FleetAlert alert = alertService.resolveAlert(id, resoluPar);
        if (alert == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Alerte non trouvee"));

        return ResponseEntity.ok(alert);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("active", alertService.getActiveAlertsCount());
        counts.put("critical", alertService.getCriticalAlertsCount());
        counts.put("blocking", alertService.getBlockingAlertsCount());
        return ResponseEntity.ok(counts);
    }
}
