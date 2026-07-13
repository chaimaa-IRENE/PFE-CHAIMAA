package com.example.usermanagement.controller;

import com.example.usermanagement.dto.ChecklistDTO;
import com.example.usermanagement.model.DriverChecklist;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.model.VehicleBlocking;
import com.example.usermanagement.repository.VehicleBlockingRepository;
import com.example.usermanagement.service.ChecklistService;
import com.example.usermanagement.service.ExcelImportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/fleet/checklist")
@CrossOrigin(origins = "*")
public class ChecklistController {

private final ChecklistService checklistService;
    private final VehicleBlockingRepository vehicleBlockingRepository;
    private final ExcelImportService excelImportService;

    public ChecklistController(ChecklistService checklistService,
                                VehicleBlockingRepository vehicleBlockingRepository,
                                ExcelImportService excelImportService) {
        this.checklistService = checklistService;
        this.vehicleBlockingRepository = vehicleBlockingRepository;
        this.excelImportService = excelImportService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createChecklist(@RequestBody Map<String, String> body) {
        Long chauffeurId = body.get("chauffeurId") != null ? Long.parseLong(body.get("chauffeurId")) : null;
        String chauffeurNom = body.get("chauffeurNom");
        String chauffeurMatricule = body.get("chauffeurMatricule");
        String immatriculation = body.get("vehiculeImmatriculation");
        String tourneeId = body.get("tourneeId");

        DriverChecklist cl = checklistService.createChecklist(chauffeurId, chauffeurNom, chauffeurMatricule, immatriculation, tourneeId);
        if (cl == null) {
            // Vérifier si c'est à cause des documents expirés
            Map<String, Object> canDepartResult = checklistService.canDepartCheck(immatriculation);
            if (canDepartResult.containsKey("documentsValides") && Boolean.FALSE.equals(canDepartResult.get("documentsValides"))) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Le vehicule contient un ou plusieurs documents expirés. Depart interdit jusqu'a regularisation.",
                    "documentsValides", false,
                    "reason", canDepartResult.get("reason")
                ));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Imposible de creer le check-up: vehicule non trouve, vehicule bloque, ou check-up deja actif pour ce vehicule"));
        }
        return ResponseEntity.ok(checklistService.toDTO(cl));
    }

    @GetMapping("/can-depart/{immatriculation}")
    public ResponseEntity<?> canDepart(@PathVariable String immatriculation) {
        Map<String, Object> result = checklistService.canDepartCheck(immatriculation);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/verifier-documents/{immatriculation}")
    public ResponseEntity<?> verifierDocuments(@PathVariable String immatriculation) {
        try {
            Map<String, Object> result = checklistService.canDepartCheck(immatriculation);
            return ResponseEntity.ok(Map.of(
                "documentsValides", result.get("documentsValides"),
                "canDepart", result.get("canDepart"),
                "reason", result.get("reason"),
                "immatriculation", immatriculation
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de la vérification des documents"));
        }
    }

    @PutMapping("/submit/{id}")
    public ResponseEntity<?> submitChecklist(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        DriverChecklist cl = checklistService.submitChecklist(id, body);
        if (cl == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Checklist non trouvee"));
        return ResponseEntity.ok(checklistService.toDTO(cl));
    }

    @PutMapping("/item/{id}")
    public ResponseEntity<?> updateItem(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String key = (String) body.get("key");
        Boolean value = (Boolean) body.get("value");
        if (key == null || value == null)
            return ResponseEntity.badRequest().body(Map.of("error", "key et value requis"));
        DriverChecklist cl = checklistService.updateItem(id, key, value);
        if (cl == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Checklist non trouvee ou cle invalide"));
        return ResponseEntity.ok(checklistService.toDTO(cl));
    }

    @PutMapping("/feedback/{id}")
    public ResponseEntity<?> updateFeedback(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String feedback = body.get("feedback");
        if (feedback == null)
            return ResponseEntity.badRequest().body(Map.of("error", "feedback requis"));
        DriverChecklist cl = checklistService.updateFeedback(id, feedback);
        if (cl == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Checklist non trouvee"));
        return ResponseEntity.ok(checklistService.toDTO(cl));
    }

    @PostMapping("/repair/{id}")
    public ResponseEntity<?> submitRepair(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reparationsJson = body.get("reparationsJson");
        String repairBy = body.get("repairBy");
        DriverChecklist cl = checklistService.submitRepair(id, reparationsJson, repairBy);
        if (cl == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Checklist non trouvee"));
        return ResponseEntity.ok(checklistService.toDTO(cl));
    }

    @PostMapping("/validate-repair/{id}")
    public ResponseEntity<?> validateRepair(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String validatedBy = body != null ? body.get("validatedBy") : "RS";
        DriverChecklist cl = checklistService.validateRepair(id, validatedBy);
        if (cl == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Checklist non trouvee"));
        return ResponseEntity.ok(Map.of("message", "Reparation validee — Vehicule debloque", "checklist", checklistService.toDTO(cl)));
    }

    @PostMapping("/validate-pending/{id}")
    public ResponseEntity<?> validatePending(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String validatedBy = body != null ? body.get("validatedBy") : "RS";
        DriverChecklist cl = checklistService.validatePendingChecklist(id, validatedBy);
        if (cl == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Checklist non trouvee ou pas en statut PENDING"));
        String msg = Boolean.TRUE.equals(cl.getEstConforme()) ? "Check-up valide — Vehicule debloque" : "Non-conformité confirmée — Vehicule reste bloque";
        return ResponseEntity.ok(Map.of("message", msg, "checklist", checklistService.toDTO(cl)));
    }

    @PostMapping("/block-vehicle/{immatriculation}")
    public ResponseEntity<?> blockVehicle(@PathVariable String immatriculation, @RequestBody(required = false) Map<String, String> body) {
        String motif = body != null ? body.get("motif") : "Blocage manuel par RS";
        String bloquePar = body != null ? body.get("bloquePar") : "RS";
        Optional<VehicleBlocking> existing = vehicleBlockingRepository.findByVehiculeImmatriculation(immatriculation);
        if (existing.isPresent() && Boolean.TRUE.equals(existing.get().getBloque())) {
            return ResponseEntity.ok(Map.of("message", "Vehicule deja bloque", "blocking", existing.get()));
        }
        Vehicule vehicule = checklistService.findVehiculeByImmatriculation(immatriculation);
        Long vehiculeId = vehicule != null ? vehicule.getId() : null;
        VehicleBlocking vb = new VehicleBlocking(vehiculeId, immatriculation, motif);
        vb.setBloquePar(bloquePar);
        vehicleBlockingRepository.save(vb);
        return ResponseEntity.ok(Map.of("message", "Vehicule bloque avec succes", "blocking", vb));
    }

    @PostMapping("/unblock-vehicle/{immatriculation}")
    public ResponseEntity<?> unblockVehicle(@PathVariable String immatriculation, @RequestBody(required = false) Map<String, String> body) {
        String debloquePar = body != null ? body.get("debloquePar") : "RS";
        List<VehicleBlocking> blockings = vehicleBlockingRepository.findByVehiculeImmatriculationOrderByDateBlocageDesc(immatriculation);
        if (blockings.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Aucun blocage trouve pour ce vehicule"));
        }
        VehicleBlocking vb = blockings.get(0);
        if (!Boolean.TRUE.equals(vb.getBloque())) {
            return ResponseEntity.ok(Map.of("message", "Vehicule deja debloque", "blocking", vb));
        }
        vb.setBloque(false);
        vb.setDateDeblocage(java.time.LocalDateTime.now());
        vb.setDebloquePar(debloquePar);
        vehicleBlockingRepository.save(vb);
        return ResponseEntity.ok(Map.of("message", "Vehicule debloque avec succes", "blocking", vb));
    }

    @PostMapping("/reject-repair/{id}")
    public ResponseEntity<?> rejectRepair(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String motif = body != null ? body.get("motif") : null;
        String rejectedBy = body != null ? body.get("rejectedBy") : "RS";
        DriverChecklist cl = checklistService.rejectRepair(id, motif, rejectedBy);
        if (cl == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Checklist non trouvee"));
        return ResponseEntity.ok(Map.of("message", "Reparation refusee — Vehicule reste bloque", "checklist", checklistService.toDTO(cl)));
    }

    @GetMapping("/non-conforme")
    public ResponseEntity<List<ChecklistDTO>> getNonConforme() {
        return ResponseEntity.ok(
            checklistService.getNonConformeChecklists().stream().map(checklistService::toDTO).toList()
        );
    }

    @GetMapping("/blocked-vehicules")
    public ResponseEntity<List<VehicleBlocking>> getBlockedVehicules() {
        return ResponseEntity.ok(vehicleBlockingRepository.findByBloqueTrue());
    }

    @GetMapping("/vehicule/{immatriculation}")
    public ResponseEntity<List<ChecklistDTO>> getByVehicule(@PathVariable String immatriculation) {
        return ResponseEntity.ok(
            checklistService.getChecklistsByVehicule(immatriculation).stream().map(checklistService::toDTO).toList()
        );
    }

    @GetMapping("/chauffeur/{chauffeurId}")
    public ResponseEntity<List<ChecklistDTO>> getByChauffeur(@PathVariable Long chauffeurId) {
        return ResponseEntity.ok(
            checklistService.getChecklistsByChauffeur(chauffeurId).stream().map(checklistService::toDTO).toList()
        );
    }

    @GetMapping("/latest/{immatriculation}")
    public ResponseEntity<?> getLatest(@PathVariable String immatriculation) {
        ChecklistDTO dto = checklistService.toDTO(checklistService.getLatestChecklistForVehicule(immatriculation));
        if (dto == null) return ResponseEntity.ok(Collections.emptyMap());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/all")
    public ResponseEntity<List<ChecklistDTO>> getAll() {
        return ResponseEntity.ok(
            checklistService.getAllChecklists().stream().map(checklistService::toDTO).toList()
        );
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<ChecklistDTO>> getByStatut(@PathVariable String statut) {
        return ResponseEntity.ok(
            checklistService.getChecklistsByStatut(statut).stream().map(checklistService::toDTO).toList()
        );
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel() {
        try {
            List<DriverChecklist> checklists = checklistService.getAllChecklists();
            byte[] excel = excelImportService.exportChecklistsToExcel(checklists);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=checkups_export.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
