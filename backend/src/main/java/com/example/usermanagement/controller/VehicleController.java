package com.example.usermanagement.controller;

import com.example.usermanagement.model.*;
import com.example.usermanagement.model.DocumentVehicule.TypeDocument;
import com.example.usermanagement.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehiculeRepository vehiculeRepository;
    private final CheckupRepository checkupRepository;
    private final AnomalieCheckupRepository anomalieCheckupRepository;
    private final AnomalieCheckupHistoryRepository anomalieCheckupHistoryRepository;
    private final DocumentVehiculeRepository documentVehiculeRepository;
    private final VehicleBlockingRepository vehicleBlockingRepository;
    private final DepartHistoriqueRepository departHistoriqueRepository;
    private final TourneeRepository tourneeRepository;
    private final DeclarationRepository declarationRepository;
    private final DriverChecklistRepository driverChecklistRepository;

    public VehicleController(VehiculeRepository vehiculeRepository, CheckupRepository checkupRepository,
                             AnomalieCheckupRepository anomalieCheckupRepository,
                             AnomalieCheckupHistoryRepository anomalieCheckupHistoryRepository,
                             DocumentVehiculeRepository documentVehiculeRepository,
                             VehicleBlockingRepository vehicleBlockingRepository,
                             DepartHistoriqueRepository departHistoriqueRepository,
                             TourneeRepository tourneeRepository,
                             DeclarationRepository declarationRepository,
                             DriverChecklistRepository driverChecklistRepository) {
        this.vehiculeRepository = vehiculeRepository;
        this.checkupRepository = checkupRepository;
        this.anomalieCheckupRepository = anomalieCheckupRepository;
        this.anomalieCheckupHistoryRepository = anomalieCheckupHistoryRepository;
        this.documentVehiculeRepository = documentVehiculeRepository;
        this.vehicleBlockingRepository = vehicleBlockingRepository;
        this.departHistoriqueRepository = departHistoriqueRepository;
        this.tourneeRepository = tourneeRepository;
        this.declarationRepository = declarationRepository;
        this.driverChecklistRepository = driverChecklistRepository;
    }

    @GetMapping public ResponseEntity<?> getAll() { List<Vehicule> v = vehiculeRepository.findAll(); return ResponseEntity.ok(Map.of("success", true, "vehicles", v, "total", v.size())); }
    @GetMapping("/{id}") public ResponseEntity<?> getById(@PathVariable Long id) { return vehiculeRepository.findById(id).map(v -> ResponseEntity.ok(Map.of("success", true, "vehicle", v))).orElse(ResponseEntity.notFound().build()); }
    @GetMapping("/available") public ResponseEntity<?> getAvailable() { return ResponseEntity.ok(Map.of("success", true, "vehicles", vehiculeRepository.findAvailableVehicles())); }
    @GetMapping("/stats") public ResponseEntity<?> getStats() {
        long total = vehiculeRepository.count(); long conforme = vehiculeRepository.countConforme(); long nonConforme = vehiculeRepository.countNonConforme(); long bloque = vehiculeRepository.countBloque();
        Map<String, Object> stats = new LinkedHashMap<>(); stats.put("total", total); stats.put("conforme", conforme); stats.put("nonConforme", nonConforme); stats.put("bloque", bloque); stats.put("disponible", total - bloque); stats.put("tauxConformite", total > 0 ? String.format("%.1f%%", conforme * 100.0 / total) : "0%");
        return ResponseEntity.ok(Map.of("success", true, "stats", stats));
    }

    @PostMapping public ResponseEntity<?> create(@RequestBody Vehicule vehicle) {
        if (vehicle.getImmatriculation() != null && vehiculeRepository.existsByImmatriculation(vehicle.getImmatriculation())) return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Immatriculation existe deja"));
        if (vehicle.getChauffeurId() != null) { vehicle.setDateAffectation(LocalDateTime.now()); }
        if (vehicle.getVehicleId() == null || vehicle.getVehicleId().isEmpty()) vehicle.setVehicleId("V-" + System.currentTimeMillis());
        return ResponseEntity.ok(Map.of("success", true, "vehicle", vehiculeRepository.save(vehicle)));
    }

    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Vehicule updated) {
        return vehiculeRepository.findById(id).map(v -> {
            if (updated.getImmatriculation() != null) v.setImmatriculation(updated.getImmatriculation());
            if (updated.getTruckNumber() != null) v.setTruckNumber(updated.getTruckNumber());
            if (updated.getVehicleId() != null) v.setVehicleId(updated.getVehicleId());
            if (updated.getMarque() != null) v.setMarque(updated.getMarque());
            if (updated.getModele() != null) v.setModele(updated.getModele());
            if (updated.getType() != null) v.setType(updated.getType());
            if (updated.getKilometrage() != null) v.setKilometrage(updated.getKilometrage());
            if (updated.getAnnee() != null) v.setAnnee(updated.getAnnee());
            if (updated.getStatut() != null) v.setStatut(updated.getStatut());
            if (updated.getCarburant() != null) v.setCarburant(updated.getCarburant());
            if (updated.getAgence() != null) v.setAgence(updated.getAgence());
            if (updated.getChauffeurId() != null) { v.setChauffeurId(updated.getChauffeurId()); v.setChauffeurNom(updated.getChauffeurNom()); v.setDateAffectation(LocalDateTime.now()); }
            if (updated.getConforme() != null) v.setConforme(updated.getConforme());
            if (updated.getNotes() != null) v.setNotes(updated.getNotes());
            if (updated.getDateAffectation() != null) v.setDateAffectation(updated.getDateAffectation());
            return ResponseEntity.ok(Map.of("success", true, "vehicle", vehiculeRepository.save(v)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/statut") public ResponseEntity<?> updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        String user = body.getOrDefault("user", "SYSTEM");
        String raison = body.getOrDefault("raison", "");
        return vehiculeRepository.findById(id).map(v -> {
            String ancienStatut = v.getStatut();
            v.setStatut(statut);
            if ("BLOQUE".equals(statut)) {
                v.setConforme(false);
                v.setDateBlocage(LocalDateTime.now());
                v.setBloquePar(user);
                v.setRaisonBlocage(raison);
            }
            if ("DISPONIBLE".equals(statut)) {
                v.setConforme(true);
                v.setDateDeblocage(LocalDateTime.now());
                v.setDebloquePar(user);
            }
            return ResponseEntity.ok(Map.of("success", true, "vehicle", vehiculeRepository.save(v)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/conformite") public ResponseEntity<?> updateConformite(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Boolean conforme = body.get("conforme") != null ? Boolean.valueOf(body.get("conforme").toString()) : null;
        return vehiculeRepository.findById(id).map(v -> {
            if (conforme != null) v.setConforme(conforme);
            v.setStatut(Boolean.TRUE.equals(conforme) ? "DISPONIBLE" : "BLOQUE");
            return ResponseEntity.ok(Map.of("success", true, "vehicle", vehiculeRepository.save(v)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}") public ResponseEntity<?> softDelete(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String archivedBy = body != null ? body.getOrDefault("archivedBy", "SYSTEM") : "SYSTEM";
        return vehiculeRepository.findById(id).map(v -> {
            v.setArchived(true);
            v.setArchivedAt(LocalDateTime.now());
            v.setArchivedBy(archivedBy);
            vehiculeRepository.save(v);
            return ResponseEntity.ok(Map.of("success", true, "message", "Vehicle archive (soft delete)"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/restore") public ResponseEntity<?> restore(@PathVariable Long id) {
        return vehiculeRepository.findById(id).map(v -> {
            v.setArchived(false);
            v.setArchivedAt(null);
            v.setArchivedBy(null);
            return ResponseEntity.ok(Map.of("success", true, "vehicle", vehiculeRepository.save(v)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/archived") public ResponseEntity<?> getArchived() {
        return ResponseEntity.ok(Map.of("success", true, "vehicles", vehiculeRepository.findAllArchived()));
    }

    @GetMapping("/active") public ResponseEntity<?> getActive() {
        return ResponseEntity.ok(Map.of("success", true, "vehicles", vehiculeRepository.findAllActive()));
    }

    @GetMapping("/{id}/history") public ResponseEntity<?> getVehicleHistory(@PathVariable Long id) {
        Map<String, Object> history = new LinkedHashMap<>();
        vehiculeRepository.findById(id).ifPresent(v -> {
            history.put("vehicle", v);

            List<Checkup> checkups = checkupRepository.findByVehiculeId(id);
            history.put("checkups", checkups);
            history.put("checkupsCount", checkups.size());
            history.put("checkupsConforme", checkups.stream().filter(c -> Boolean.TRUE.equals(c.getConforme())).count());
            history.put("checkupsNonConforme", checkups.stream().filter(c -> Boolean.FALSE.equals(c.getConforme())).count());

            List<AnomalieCheckup> anomalies = anomalieCheckupRepository.findByVehiculeId(id);
            history.put("anomalies", anomalies);
            history.put("anomaliesCount", anomalies.size());
            history.put("anomaliesOuvertes", anomalies.stream().filter(a -> a.getStatut() == AnomalieCheckup.AnomalieStatut.DETECTEE || a.getStatut() == AnomalieCheckup.AnomalieStatut.EN_REPARATION).count());
            history.put("anomaliesValidees", anomalies.stream().filter(a -> a.getStatut() == AnomalieCheckup.AnomalieStatut.VALIDEE).count());

            List<DocumentVehicule> documents = documentVehiculeRepository.findByVehiculeIdAndArchivedFalse(id);
            history.put("documents", documents);
            history.put("documentsCount", documents.size());

            List<VehicleBlocking> blocages = vehicleBlockingRepository.findByVehiculeIdOrderByDateBlocageDesc(id);
            history.put("blocages", blocages);

            try {
                List<DepartHistorique> departs = departHistoriqueRepository.findByVehiculeImmatriculationAndDeletedFalseOrderByTimestampDepartDesc(v.getImmatriculation());
                history.put("departs", departs);
                history.put("departsCount", departs.size());
            } catch (Exception e) { history.put("departs", List.of()); history.put("departsCount", 0); }

            List<Tournee> tournees = tourneeRepository.findByVehiculeId(id);
            history.put("tournees", tournees);
            history.put("tourneesCount", tournees.size());

            List<DeclarationIncident> declarations = declarationRepository.findByVehiculeId(id);
            history.put("declarations", declarations);
            history.put("declarationsCount", declarations.size());

            List<DriverChecklist> checklists = driverChecklistRepository.findByVehiculeImmatriculationOrderByDateChecklistDesc(v.getImmatriculation());
            history.put("checklists", checklists);
            history.put("checklistsCount", checklists.size());

            Map<String, Object> docStatus = new LinkedHashMap<>();
            LocalDateTime now = LocalDateTime.now();
            for (TypeDocument type : TypeDocument.values()) {
                List<DocumentVehicule> typeDocs = documents.stream().filter(d -> d.getTypeDocument() == type).toList();
                if (!typeDocs.isEmpty()) {
                    DocumentVehicule doc = typeDocs.get(0);
                    String etat;
                    if (!Boolean.TRUE.equals(doc.getEstDisponible())) etat = "MANQUANT";
                    else if (doc.getDateExpiration() != null && doc.getDateExpiration().isBefore(now)) etat = "EXPIRE";
                    else if (doc.getDateExpiration() != null && doc.getDateExpiration().isBefore(now.plusDays(30))) etat = "EXPIRE_BIENTOT";
                    else etat = "VALIDE";
                    Map<String, Object> ds = new LinkedHashMap<>();
                    ds.put("type", type.name()); ds.put("label", getDocLabel(type)); ds.put("etat", etat);
                    ds.put("numero", doc.getNumeroDocument()); ds.put("dateExpiration", doc.getDateExpiration());
                    ds.put("estDisponible", doc.getEstDisponible()); ds.put("id", doc.getId());
                    docStatus.put(type.name(), ds);
                } else {
                    Map<String, Object> ds = new LinkedHashMap<>();
                    ds.put("type", type.name()); ds.put("label", getDocLabel(type)); ds.put("etat", "MANQUANT"); ds.put("estDisponible", false);
                    docStatus.put(type.name(), ds);
                }
            }
            history.put("documentStatus", docStatus);

            Map<String, Object> blocageInfo = new LinkedHashMap<>();
            blocageInfo.put("dateBlocage", v.getDateBlocage());
            blocageInfo.put("dateDeblocage", v.getDateDeblocage());
            blocageInfo.put("bloquePar", v.getBloquePar());
            blocageInfo.put("debloquePar", v.getDebloquePar());
            blocageInfo.put("raisonBlocage", v.getRaisonBlocage());
            blocageInfo.put("statutActuel", v.getStatut());
            history.put("blocageInfo", blocageInfo);
        });
        if (history.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("success", true, "history", history));
    }

    private String getDocLabel(TypeDocument type) {
        switch (type) {
            case ASSURANCE: return "Assurance";
            case ONSSA: return "ONSSA";
            case VISITE_TECHNIQUE: return "Visite Technique";
            case CARTE_GRISE: return "Carte Grise";
            case METROLOGIQUE: return "Metrologique";
            default: return type.name();
        }
    }
}