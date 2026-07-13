package com.example.usermanagement.controller;

import com.example.usermanagement.service.MoteurDecisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/moteur-decision")
@CrossOrigin(origins = "*")
public class MoteurDecisionController {
    
    private final MoteurDecisionService moteurDecisionService;
    
    public MoteurDecisionController(MoteurDecisionService moteurDecisionService) {
        this.moteurDecisionService = moteurDecisionService;
    }
    
    @PostMapping("/verifier-conformite")
    public ResponseEntity<MoteurDecisionService.ResultatConformite> verifierConformiteVehicule(
            @RequestParam Long vehiculeId,
            @RequestParam(required = false) Long chauffeurId) {
        MoteurDecisionService.ResultatConformite resultat = 
                moteurDecisionService.verifierConformiteVehicule(vehiculeId, chauffeurId);
        return ResponseEntity.ok(resultat);
    }
    
    @PostMapping("/verifier-conformite/vehicule/{vehiculeId}")
    public ResponseEntity<MoteurDecisionService.ResultatConformite> verifierConformiteVehiculePath(
            @PathVariable Long vehiculeId,
            @RequestParam(required = false) Long chauffeurId) {
        MoteurDecisionService.ResultatConformite resultat = 
                moteurDecisionService.verifierConformiteVehicule(vehiculeId, chauffeurId);
        return ResponseEntity.ok(resultat);
    }
    
    @PostMapping("/verifier-conformite/chauffeur/{chauffeurId}/vehicule/{vehiculeId}")
    public ResponseEntity<MoteurDecisionService.ResultatConformite> verifierConformiteComplete(
            @PathVariable Long chauffeurId,
            @PathVariable Long vehiculeId) {
        MoteurDecisionService.ResultatConformite resultat = 
                moteurDecisionService.verifierConformiteVehicule(vehiculeId, chauffeurId);
        return ResponseEntity.ok(resultat);
    }
}
