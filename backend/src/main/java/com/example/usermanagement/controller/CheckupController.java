package com.example.usermanagement.controller;

import com.example.usermanagement.model.Checkup;
import com.example.usermanagement.model.CheckupDetail;
import com.example.usermanagement.service.CheckupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkups")
@CrossOrigin(origins = "*")
public class CheckupController {

    private final CheckupService checkupService;
    public CheckupController(CheckupService checkupService) { this.checkupService = checkupService; }

    @GetMapping public ResponseEntity<?> getAll() { return ResponseEntity.ok(Map.of("success", true, "checkups", checkupService.getAllCheckups())); }
    @GetMapping("/{id}") public ResponseEntity<?> getById(@PathVariable Long id) { return checkupService.getCheckupById(id).map(c -> ResponseEntity.ok(Map.of("success", true, "checkup", c))).orElse(ResponseEntity.notFound().build()); }
    @GetMapping("/chauffeur/{chauffeurId}") public ResponseEntity<?> getByChauffeur(@PathVariable Long chauffeurId) { return ResponseEntity.ok(Map.of("success", true, "checkups", checkupService.getCheckupsByChauffeur(chauffeurId))); }
    @GetMapping("/conforme/{conforme}") public ResponseEntity<?> getConforme(@PathVariable boolean conforme) { return ResponseEntity.ok(Map.of("success", true, "checkups", checkupService.getCheckupsConforme(conforme))); }
    @GetMapping("/vehicle/{vehiculeId}") public ResponseEntity<?> getByVehicle(@PathVariable Long vehiculeId) { return ResponseEntity.ok(Map.of("success", true, "checkups", checkupService.getCheckupsByVehicle(vehiculeId))); }
    @GetMapping("/stats") public ResponseEntity<?> getStats() { return ResponseEntity.ok(Map.of("success", true, "stats", Map.of("total", checkupService.getAllCheckups().size(), "conforme", checkupService.countConforme(), "nonConforme", checkupService.countNonConforme(), "tauxConformite", checkupService.getAllCheckups().size() > 0 ? String.format("%.1f%%", checkupService.countConforme() * 100.0 / checkupService.getAllCheckups().size()) : "0%"))); }

    @PostMapping
    public ResponseEntity<?> createCheckup(@RequestBody Map<String, Object> body) {
        Checkup checkup = new Checkup();
        checkup.setVehiculeId(body.get("vehiculeId") != null ? Long.valueOf(body.get("vehiculeId").toString()) : null);
        checkup.setVehiculeImmatriculation((String) body.get("vehiculeImmatriculation"));
        checkup.setVehiculeTruckNumber((String) body.get("vehiculeTruckNumber"));
        checkup.setChauffeurId(body.get("chauffeurId") != null ? Long.valueOf(body.get("chauffeurId").toString()) : null);
        checkup.setChauffeurNom((String) body.get("chauffeurNom"));
        checkup.setKilometrage(body.get("kilometrage") != null ? Integer.valueOf(body.get("kilometrage").toString()) : null);
        checkup.setDocumentsDisponibles((String) body.get("documentsDisponibles"));
        checkup.setNotes((String) body.get("notes"));
        checkup.setCreatedBy((String) body.get("createdBy"));
        if (body.get("conforme") != null) checkup.setConforme(Boolean.valueOf(body.get("conforme").toString()));
        if (body.get("statut") != null) checkup.setStatut((String) body.get("statut"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> detailMaps = body.get("details") != null ? (List<Map<String, Object>>) body.get("details") : null;
        List<CheckupDetail> details = null;
        if (detailMaps != null) {
            details = detailMaps.stream().map(dm -> { CheckupDetail d = new CheckupDetail(); d.setElement((String) dm.get("element")); d.setCategorie((String) dm.get("categorie")); d.setStatut((String) dm.get("statut")); d.setObservation((String) dm.get("observation")); d.setCriticite((String) dm.get("criticite")); d.setPhotoUrl((String) dm.get("photoUrl")); return d; }).toList();
        }
        Checkup saved = checkupService.createCheckup(checkup, details);
        return ResponseEntity.ok(Map.of("success", true, "checkup", saved));
    }

    @PutMapping("/{id}/authorize") public ResponseEntity<?> authorize(@PathVariable Long id) {
        Checkup c = checkupService.authorizeDeparture(id);
        return ResponseEntity.ok(Map.of("success", true, "checkup", c, "message", "Depart autorise - vehicule DISPONIBLE"));
    }

    @PutMapping("/{id}/signal-anomalie") public ResponseEntity<?> signalAnomalie(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Checkup c = checkupService.signalAnomalie(id, body.get("notes"));
        return ResponseEntity.ok(Map.of("success", true, "checkup", c, "message", "Anomalie signalee - vehicule BLOQUE"));
    }
}