package com.example.usermanagement.controller;

import com.example.usermanagement.dto.ComparisonResultDTO;
import com.example.usermanagement.service.ComparisonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fleet/comparison")
@CrossOrigin(origins = "*")
public class FleetComparisonController {

    private final ComparisonService comparisonService;

    public FleetComparisonController(ComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    @GetMapping("/{immatriculation}")
    public ResponseEntity<?> compare(@PathVariable String immatriculation) {
        ComparisonResultDTO result = comparisonService.compare(immatriculation);
        if (result == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicule non trouve"));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/unblock/{immatriculation}")
    public ResponseEntity<?> unblock(@PathVariable String immatriculation, @RequestBody Map<String, String> body) {
        String debloquePar = body.get("debloquePar");
        comparisonService.unblockVehicule(immatriculation, debloquePar);
        return ResponseEntity.ok(Map.of("message", "Vehicule debloque avec succes"));
    }
}
