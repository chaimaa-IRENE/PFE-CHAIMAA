package com.example.usermanagement.controller;

import com.example.usermanagement.model.AnomalieCheckup;
import com.example.usermanagement.model.AnomalieCheckup.AnomalieStatut;
import com.example.usermanagement.model.AnomalieCheckupHistory;
import com.example.usermanagement.service.AnomalieCheckupService;
import com.example.usermanagement.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/anomalies-checkup")
@CrossOrigin(origins = "*")
public class AnomalieCheckupController {

    private final AnomalieCheckupService service;
    private final FileStorageService fileStorageService;

    public AnomalieCheckupController(AnomalieCheckupService service, FileStorageService fileStorageService) {
        this.service = service;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping public ResponseEntity<?> getAll() { List<AnomalieCheckup> list = service.getAll(); return ResponseEntity.ok(Map.of("success", true, "anomalies", list, "total", list.size())); }
    @GetMapping("/{id}") public ResponseEntity<?> getById(@PathVariable Long id) { return service.getById(id).map(a -> ResponseEntity.ok(Map.of("success", true, "anomalie", a))).orElse(ResponseEntity.notFound().build()); }
    @GetMapping("/code/{code}") public ResponseEntity<?> getByCode(@PathVariable String code) { return service.getByCode(code).map(a -> ResponseEntity.ok(Map.of("success", true, "anomalie", a))).orElse(ResponseEntity.notFound().build()); }
    @GetMapping("/vehicule/{vehiculeId}") public ResponseEntity<?> getByVehicule(@PathVariable Long vehiculeId) { return ResponseEntity.ok(Map.of("success", true, "anomalies", service.getByVehicule(vehiculeId))); }
    @GetMapping("/immat/{immat}") public ResponseEntity<?> getByImmat(@PathVariable String immat) { return ResponseEntity.ok(Map.of("success", true, "anomalies", service.getByImmatriculation(immat))); }
    @GetMapping("/chauffeur/{chauffeurId}") public ResponseEntity<?> getByChauffeur(@PathVariable Long chauffeurId) { return ResponseEntity.ok(Map.of("success", true, "anomalies", service.getByChauffeur(chauffeurId))); }
    @GetMapping("/statut/{statut}") public ResponseEntity<?> getByStatut(@PathVariable String statut) { return ResponseEntity.ok(Map.of("success", true, "anomalies", service.getByStatut(AnomalieStatut.valueOf(statut.toUpperCase())))); }
    @GetMapping("/categorie/{categorie}") public ResponseEntity<?> getByCategorie(@PathVariable String categorie) { return ResponseEntity.ok(Map.of("success", true, "anomalies", service.getByCategorie(categorie))); }
    @GetMapping("/date-range") public ResponseEntity<?> getByDateRange(@RequestParam String start, @RequestParam String end) { return ResponseEntity.ok(Map.of("success", true, "anomalies", service.getByDateRange(LocalDateTime.parse(start), LocalDateTime.parse(end)))); }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long id) {
        List<AnomalieCheckupHistory> history = service.getHistory(id);
        return ResponseEntity.ok(Map.of("success", true, "history", history));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam(required = false) String start, @RequestParam(required = false) String end, @RequestParam(required = false) Long chauffeurId, @RequestParam(required = false) String statut, @RequestParam(required = false) String categorie) {
        LocalDateTime startDate = start != null ? LocalDateTime.parse(start) : LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime endDate = end != null ? LocalDateTime.parse(end) : LocalDateTime.now();
        AnomalieStatut st = statut != null ? AnomalieStatut.valueOf(statut.toUpperCase()) : null;
        List<AnomalieCheckup> list = service.getByFilters(startDate, endDate, chauffeurId, st, categorie);
        return ResponseEntity.ok(Map.of("success", true, "anomalies", list, "total", list.size()));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long total = service.totalAnomalies();
        long detectees = service.countByStatut(AnomalieStatut.DETECTEE);
        long enReparation = service.countByStatut(AnomalieStatut.EN_REPARATION);
        long reparees = service.countByStatut(AnomalieStatut.REPAREE);
        long validees = service.countByStatut(AnomalieStatut.VALIDEE);
        long nonReparees = service.countByStatut(AnomalieStatut.NON_REPAREE);
        long annulees = service.countByStatut(AnomalieStatut.ANNULEE);
        long ouvertes = detectees + enReparation;
        long cloturees = reparees + validees;
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total); stats.put("detectees", detectees); stats.put("enReparation", enReparation);
        stats.put("reparees", reparees); stats.put("validees", validees); stats.put("nonReparees", nonReparees);
        stats.put("annulees", annulees); stats.put("ouvertes", ouvertes); stats.put("cloturees", cloturees);
        stats.put("tauxReparation", total > 0 ? String.format("%.1f%%", cloturees * 100.0 / (total - annulees)) : "0%");
        return ResponseEntity.ok(Map.of("success", true, "stats", stats));
    }

    @PostMapping("/manuelle")
    public ResponseEntity<?> signalerManuelle(@RequestBody Map<String, Object> body) {
        AnomalieCheckup a = service.signalerAnomalieManuelle(
            (String) body.get("vehiculeImmatriculation"), body.get("vehiculeId") != null ? Long.valueOf(body.get("vehiculeId").toString()) : null,
            body.get("chauffeurId") != null ? Long.valueOf(body.get("chauffeurId").toString()) : null, (String) body.get("chauffeurNom"),
            (String) body.get("element"), (String) body.get("categorie"), (String) body.get("criticite"),
            (String) body.get("description"), (String) body.get("observation"));
        return ResponseEntity.ok(Map.of("success", true, "anomalie", a));
    }

    @PutMapping("/{id}/prendre-en-charge") public ResponseEntity<?> prendreEnCharge(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AnomalieCheckup a = service.prendreEnCharge(id, body.get("assignedTo"));
        return ResponseEntity.ok(Map.of("success", true, "anomalie", a, "message", "Anomalie prise en charge"));
    }

    @PutMapping("/{id}/reparer") public ResponseEntity<?> signalerRepare(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AnomalieCheckup a = service.signalerRepare(id, body.get("reparePar"), body.get("resolutionNotes"));
        return ResponseEntity.ok(Map.of("success", true, "anomalie", a, "message", "Anomalie marquee reparee"));
    }

    @PutMapping("/{id}/non-repare") public ResponseEntity<?> signalerNonRepare(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AnomalieCheckup a = service.signalerNonRepare(id, body.get("resolutionNotes"));
        return ResponseEntity.ok(Map.of("success", true, "anomalie", a, "message", "Anomalie marquee non reparee"));
    }

    @PutMapping("/{id}/valider") public ResponseEntity<?> validerReparation(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AnomalieCheckup a = service.validerReparation(id, body.get("validePar"));
        return ResponseEntity.ok(Map.of("success", true, "anomalie", a, "message", "Reparation validee - sans verification budget"));
    }

    @PutMapping("/{id}/annuler") public ResponseEntity<?> annuler(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AnomalieCheckup a = service.annuler(id, body.get("reason"));
        return ResponseEntity.ok(Map.of("success", true, "anomalie", a, "message", "Anomalie annulee"));
    }

    @PostMapping("/{id}/document")
    public ResponseEntity<?> uploadDocument(@PathVariable Long id, @RequestParam("file") MultipartFile file, @RequestParam(value = "commentaire", required = false) String commentaire) {
        try {
            String fileUrl = fileStorageService.store(file);
            AnomalieCheckup anomalie = service.getById(id).orElseThrow(() -> new RuntimeException("Anomalie non trouvee"));
            String ancienStatut = anomalie.getStatut().name();
            AnomalieCheckupHistory h = new AnomalieCheckupHistory();
            h.setAnomalieId(id);
            h.setAncienStatut(ancienStatut);
            h.setNouveauStatut(ancienStatut);
            h.setAction("DOCUMENT_AJOUTE");
            h.setUtilisateur("RS");
            h.setCommentaire(commentaire != null ? commentaire : "Document ajoute");
            h.setDocumentUrl(fileUrl);
            h.setDateAction(LocalDateTime.now());
            service.saveHistory(h);
            return ResponseEntity.ok(Map.of("success", true, "message", "Document ajoute", "url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}