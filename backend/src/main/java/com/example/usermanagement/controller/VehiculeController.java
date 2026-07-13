package com.example.usermanagement.controller;

import com.example.usermanagement.dto.AnalyseVehicule;
import com.example.usermanagement.dto.RapportVehicule;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.service.VehiculeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicules")
@CrossOrigin(origins = "*")
public class VehiculeController {
    private final VehiculeService vehiculeService;

    public VehiculeController(VehiculeService vehiculeService) {
        this.vehiculeService = vehiculeService;
    }

    @GetMapping
    public ResponseEntity<List<Vehicule>> getAllVehicules() {
        return ResponseEntity.ok(vehiculeService.getAllVehicules());
    }

    @GetMapping("/branch/{branchCode}")
    public ResponseEntity<List<Vehicule>> getVehiculesByBranchCode(@PathVariable String branchCode) {
        return ResponseEntity.ok(vehiculeService.getVehiculesByBranchCode(branchCode));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicule> getVehiculeById(@PathVariable Long id) {
        return vehiculeService.getVehiculeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/immatriculation/{immatriculation}")
    public ResponseEntity<Vehicule> getVehiculeByImmatriculation(@PathVariable String immatriculation) {
        return vehiculeService.getVehiculeByImmatriculation(immatriculation)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Vehicule>> getVehiculesByType(@PathVariable String type) {
        return ResponseEntity.ok(vehiculeService.getVehiculesByType(type));
    }

    @GetMapping("/rapport/{vehiculeId}")
    public ResponseEntity<RapportVehicule> getRapportVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(vehiculeService.getRapportVehicule(vehiculeId));
    }

    @GetMapping("/analyse/{immatriculation}")
    public ResponseEntity<AnalyseVehicule> analyserVehicule(@PathVariable String immatriculation) {
        return ResponseEntity.ok(vehiculeService.analyserVehicule(immatriculation));
    }

    @PostMapping
    public ResponseEntity<Vehicule> createVehicule(@RequestBody Vehicule vehicule) {
        try {
            return ResponseEntity.ok(vehiculeService.createVehicule(vehicule));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicule> updateVehicule(@PathVariable Long id, @RequestBody Vehicule vehiculeDetails) {
        try {
            Vehicule updated = vehiculeService.updateVehicule(id, vehiculeDetails);
            if (updated != null) {
                return ResponseEntity.ok(updated);
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicule(@PathVariable Long id) {
        if (vehiculeService.deleteVehicule(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/cleanup-null")
    public ResponseEntity<String> cleanupNullVehicules() {
        int deleted = vehiculeService.cleanupNullImmatriculationVehicules();
        return ResponseEntity.ok("{\"deleted\":" + deleted + "}");
    }

    @PostMapping("/{vehiculeId}/assign-chauffeur")
    public ResponseEntity<Vehicule> assignChauffeur(@PathVariable Long vehiculeId, @RequestBody AssignChauffeurRequest request) {
        try {
            Vehicule updated = vehiculeService.assignChauffeurToVehicle(vehiculeId, request.getChauffeurId(), request.getChauffeurNom());
            if (updated != null) {
                return ResponseEntity.ok(updated);
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{vehiculeId}/unassign-chauffeur")
    public ResponseEntity<Vehicule> unassignChauffeur(@PathVariable Long vehiculeId) {
        Vehicule updated = vehiculeService.unassignChauffeurFromVehicle(vehiculeId);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/chauffeur/{chauffeurId}")
    public ResponseEntity<List<Vehicule>> getVehiclesByChauffeurId(@PathVariable Long chauffeurId) {
        return ResponseEntity.ok(vehiculeService.getVehiclesByChauffeurId(chauffeurId));
    }

    static class AssignChauffeurRequest {
        private Long chauffeurId;
        private String chauffeurNom;

        public Long getChauffeurId() { return chauffeurId; }
        public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }
        public String getChauffeurNom() { return chauffeurNom; }
        public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }
    }
}
