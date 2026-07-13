package com.example.usermanagement.controller;

import com.example.usermanagement.model.DepartHistorique;
import com.example.usermanagement.model.DriverChecklist;
import com.example.usermanagement.service.DepartHistoriqueService;
import com.example.usermanagement.service.ChecklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fleet/departs")
@CrossOrigin(origins = "*")
public class DepartHistoriqueController {

    private static final Logger logger = LoggerFactory.getLogger(DepartHistoriqueController.class);

    private final DepartHistoriqueService departHistoriqueService;
    private final ChecklistService checklistService;

    public DepartHistoriqueController(DepartHistoriqueService departHistoriqueService,
                                       ChecklistService checklistService) {
        this.departHistoriqueService = departHistoriqueService;
        this.checklistService = checklistService;
    }

    @PostMapping("/enregistrer")
    public ResponseEntity<?> enregistrerDepart(@RequestBody Map<String, Object> request) {
        try {
            Long checklistId = Long.valueOf(request.get("checklistId").toString());
            String site = request.get("site") != null ? request.get("site").toString() : null;
            String branchCode = request.get("branchCode") != null ? request.get("branchCode").toString() : null;
            Double gpsLatitude = request.get("gpsLatitude") != null ? Double.valueOf(request.get("gpsLatitude").toString()) : null;
            Double gpsLongitude = request.get("gpsLongitude") != null ? Double.valueOf(request.get("gpsLongitude").toString()) : null;
            String gpsCity = request.get("gpsCity") != null ? request.get("gpsCity").toString() : null;

            DriverChecklist checklist = checklistService.getChecklistById(checklistId);
            if (checklist == null) {
                throw new RuntimeException("Checklist non trouvée");
            }

            DepartHistorique depart = departHistoriqueService.enregistrerDepart(
                    checklist, site, branchCode, gpsLatitude, gpsLongitude, gpsCity);

            return ResponseEntity.ok(depart);
        } catch (IllegalStateException e) {
            logger.error("Erreur lors de l'enregistrement du départ: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "message", "Départ interdit"
            ));
        } catch (Exception e) {
            logger.error("Erreur lors de l'enregistrement du départ", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur serveur"));
        }
    }

    @GetMapping("/vehicule/{immatriculation}")
    public ResponseEntity<List<DepartHistorique>> getHistoriqueByVehicule(@PathVariable String immatriculation) {
        List<DepartHistorique> historique = departHistoriqueService.getHistoriqueByVehicule(immatriculation);
        return ResponseEntity.ok(historique);
    }

    @GetMapping("/chauffeur/{chauffeurId}")
    public ResponseEntity<List<DepartHistorique>> getHistoriqueByChauffeur(@PathVariable Long chauffeurId) {
        List<DepartHistorique> historique = departHistoriqueService.getHistoriqueByChauffeur(chauffeurId);
        return ResponseEntity.ok(historique);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<DepartHistorique>> getHistoriqueByDate(
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        List<DepartHistorique> historique = departHistoriqueService.getHistoriqueByDate(date);
        return ResponseEntity.ok(historique);
    }

    @GetMapping("/site/{site}")
    public ResponseEntity<List<DepartHistorique>> getHistoriqueBySite(@PathVariable String site) {
        List<DepartHistorique> historique = departHistoriqueService.getHistoriqueBySite(site);
        return ResponseEntity.ok(historique);
    }

    @GetMapping("/dernier/{immatriculation}")
    public ResponseEntity<DepartHistorique> getDernierDepart(@PathVariable String immatriculation) {
        return departHistoriqueService.getDernierDepartByVehicule(immatriculation)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/peut-partir/{immatriculation}")
    public ResponseEntity<Map<String, Object>> peutEffectuerNouveauDepart(@PathVariable String immatriculation) {
        boolean peutPartir = departHistoriqueService.peutEffectuerNouveauDepart(immatriculation);
        return ResponseEntity.ok(Map.of(
                "peutPartir", peutPartir,
                "immatriculation", immatriculation
        ));
    }

    @GetMapping("/count/{immatriculation}/{date}")
    public ResponseEntity<Long> countDepartsByVehicleAndDate(
            @PathVariable String immatriculation,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        Long count = departHistoriqueService.countDepartsByVehicleAndDate(immatriculation, date);
        return ResponseEntity.ok(count);
    }

    @GetMapping
    public ResponseEntity<List<DepartHistorique>> getAllDeparts() {
        List<DepartHistorique> departs = departHistoriqueService.getAllDeparts();
        return ResponseEntity.ok(departs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartHistorique> getDepartById(@PathVariable Long id) {
        return departHistoriqueService.getDepartById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerDepart(@PathVariable Long id, @RequestParam String supprimePar) {
        departHistoriqueService.supprimerDepart(id, supprimePar);
        return ResponseEntity.noContent().build();
    }
}
