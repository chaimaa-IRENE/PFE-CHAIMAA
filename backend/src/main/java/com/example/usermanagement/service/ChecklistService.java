package com.example.usermanagement.service;

import com.example.usermanagement.dto.ChecklistDTO;
import com.example.usermanagement.model.DriverChecklist;
import com.example.usermanagement.model.VehicleBlocking;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.DriverChecklistRepository;
import com.example.usermanagement.repository.VehicleBlockingRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import com.example.usermanagement.repository.AuditLogRepository;
import com.example.usermanagement.model.AuditLog;
import com.example.usermanagement.service.DocumentVehiculeService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
public class ChecklistService {

    private final DriverChecklistRepository checklistRepository;
    private final VehiculeRepository vehiculeRepository;
    private final VehicleBlockingRepository vehicleBlockingRepository;
    private final ComparisonService comparisonService;
    private final EmailNotificationService emailService;
    private final AlertService alertService;
    private final AuditLogRepository auditLogRepository;
    private final DocumentVehiculeService documentVehiculeService;

    public ChecklistService(DriverChecklistRepository checklistRepository, VehiculeRepository vehiculeRepository,
                            VehicleBlockingRepository vehicleBlockingRepository,
                            @Lazy ComparisonService comparisonService,
                            EmailNotificationService emailService,
                            AlertService alertService,
                            AuditLogRepository auditLogRepository,
                            DocumentVehiculeService documentVehiculeService) {
        this.checklistRepository = checklistRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.vehicleBlockingRepository = vehicleBlockingRepository;
        this.comparisonService = comparisonService;
        this.emailService = emailService;
        this.alertService = alertService;
        this.auditLogRepository = auditLogRepository;
        this.documentVehiculeService = documentVehiculeService;
    }

    public DriverChecklist createChecklist(Long chauffeurId, String chauffeurNom, String chauffeurMatricule,
                                           String vehiculeImmatriculation, String tourneeId) {
        Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(vehiculeImmatriculation);
        if (vOpt.isEmpty()) return null;

        Vehicule v = vOpt.get();

        // Vérification des documents réglementaires avant création de checklist
        boolean documentsValides = documentVehiculeService.verifierDocumentsObligatoires(v.getId());
        if (!documentsValides) {
            // Retourner null avec un message d'erreur indiquant que les documents sont expirés
            return null;
        }

        List<VehicleBlocking> blockings = vehicleBlockingRepository.findByVehiculeImmatriculationOrderByDateBlocageDesc(vehiculeImmatriculation);
        boolean isBlocked = blockings.stream().anyMatch(b -> Boolean.TRUE.equals(b.getBloque()));
        if (isBlocked) return null;

        DriverChecklist cl = new DriverChecklist(chauffeurId, chauffeurNom, chauffeurMatricule, v.getId(), vehiculeImmatriculation);
        cl.setTourneeId(tourneeId);
        cl.setStatut("PENDING");
        DriverChecklist saved = checklistRepository.save(cl);
        audit("CHECKLIST", saved.getId(), "CREATE", chauffeurNom, "CHAUFFEUR", "Check-up cree pour vehicule " + vehiculeImmatriculation + " tournee " + tourneeId);
        return saved;
    }

    public Map<String, Object> canDepartCheck(String immatriculation) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("immatriculation", immatriculation);

        // Vérification des documents réglementaires
        Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(immatriculation);
        if (vOpt.isEmpty()) {
            result.put("canDepart", false);
            result.put("reason", "Vehicule non trouve");
            return result;
        }

        Vehicule v = vOpt.get();
        boolean documentsValides = documentVehiculeService.verifierDocumentsObligatoires(v.getId());
        result.put("documentsValides", documentsValides);

        if (!documentsValides) {
            result.put("canDepart", false);
            result.put("reason", "Le vehicule contient un ou plusieurs documents expirés. Depart interdit jusqu'a regularisation.");
            result.put("isBlocked", true);
            return result;
        }

        List<VehicleBlocking> blockings = vehicleBlockingRepository.findByVehiculeImmatriculationOrderByDateBlocageDesc(immatriculation);
        boolean isBlocked = blockings.stream().anyMatch(b -> Boolean.TRUE.equals(b.getBloque()));
        result.put("isBlocked", isBlocked);
        if (isBlocked) {
            result.put("canDepart", false);
            result.put("reason", "Vehicule bloque - check-up non conforme en cours");
            result.put("lastChecklistId", blockings.get(0).getId());
            return result;
        }

        List<DriverChecklist> checklists = checklistRepository.findByVehiculeImmatriculationOrderByDateChecklistDesc(immatriculation);
        if (checklists.isEmpty()) {
            result.put("canDepart", false);
            result.put("reason", "Aucun check-up effectue - controle obligatoire avant depart");
            result.put("lastChecklistId", null);
            result.put("lastChecklistDate", null);
            result.put("lastChecklistStatus", null);
            return result;
        }

        DriverChecklist latest = checklists.get(0);
        result.put("lastChecklistId", latest.getId());
        result.put("lastChecklistDate", latest.getDateChecklist() != null ? latest.getDateChecklist().toString() : null);
        result.put("lastChecklistStatut", latest.getStatut());
        result.put("lastChecklistConforme", latest.getEstConforme());

        if ("COMPLETE".equals(latest.getStatut()) && Boolean.TRUE.equals(latest.getEstConforme())) {
            result.put("canDepart", true);
            result.put("reason", "Check-up conforme - depart autorise");
        } else if ("VALIDATED".equals(latest.getStatut())) {
            result.put("canDepart", true);
            result.put("reason", "Reparation validee par RS - depart autorise");
        } else if ("COMPLETE".equals(latest.getStatut()) && Boolean.FALSE.equals(latest.getEstConforme())) {
            result.put("canDepart", false);
            result.put("reason", "Check-up non conforme - vehicule en attente de reparation/validation RS");
        } else if ("REPAIRE".equals(latest.getStatut())) {
            result.put("canDepart", false);
            result.put("reason", "Reparation en cours - en attente de validation RS");
        } else if ("REJECTED".equals(latest.getStatut())) {
            result.put("canDepart", false);
            result.put("reason", "Reparation refusee par RS - vehicule reste bloque");
        } else {
            result.put("canDepart", false);
            result.put("reason", "Check-up en cours - statut: " + latest.getStatut());
        }

        return result;
    }

    public DriverChecklist submitChecklist(Long checklistId, Map<String, Object> body) {
        Optional<DriverChecklist> opt = checklistRepository.findById(checklistId);
        if (opt.isEmpty()) return null;

        DriverChecklist cl = opt.get();
        cl.setPneus(getBool(body, "pneus"));
        cl.setFreins(getBool(body, "freins"));
        cl.setFeux(getBool(body, "feux"));
        cl.setExtincteur(getBool(body, "extincteur"));
        cl.setDocuments(getBool(body, "documents"));
        cl.setCarrosserie(getBool(body, "carrosserie"));
        cl.setHuileNiveau(getBool(body, "huileNiveau"));
        cl.setBatterie(getBool(body, "batterie"));
        cl.setEssuieGlaces(getBool(body, "essuieGlaces"));
        cl.setCeinturesSecurite(getBool(body, "ceinturesSecurite"));
        cl.setCommentaireGeneral(getStr(body, "commentaireGeneral"));
        cl.setSignature(getStr(body, "signature"));
        cl.setDefautsJson(getStr(body, "defautsJson"));

        boolean allOk =
            isTrue(cl.getPneus()) && isTrue(cl.getFreins()) && isTrue(cl.getFeux()) &&
            isTrue(cl.getExtincteur()) && isTrue(cl.getDocuments()) && isTrue(cl.getCarrosserie()) &&
            isTrue(cl.getHuileNiveau()) && isTrue(cl.getBatterie()) && isTrue(cl.getEssuieGlaces()) &&
            isTrue(cl.getCeinturesSecurite());

        cl.setEstConforme(allOk);
        cl.setStatut("PENDING");
        String conformiteDetail = allOk ? "CONFORME" : "NON CONFORME - defauts: " + cl.getDefautsJson();

        if (!allOk) {
            cl.setMessageAlerteArabe("يُمنع استعمال الشاحنة لوجود حالة عدم مطابقة. المرجو التواصل مع المسؤول المعني");
            // Block vehicle
            VehicleBlocking vb = new VehicleBlocking(cl.getVehiculeId(), cl.getVehiculeImmatriculation(),
                "Checklist non conforme - " + cl.getDateChecklist());
            vb.setBloquePar(cl.getChauffeurNom());
            vehicleBlockingRepository.save(vb);
            // Trigger comparison
            try { comparisonService.compare(cl.getVehiculeImmatriculation()); } catch (Exception ignored) {}
            // Send alerts to all stakeholders
            try {
                emailService.sendAlertSL(cl, "Anomalie déclarée par " + cl.getChauffeurNom() + " - " + cl.getVehiculeImmatriculation());
                emailService.sendAlertRS(cl, "Anomalie technique - " + cl.getVehiculeImmatriculation());
                emailService.sendAlertRPF(cl, "Véhicule bloqué - Impact plan de livraison - " + cl.getVehiculeImmatriculation());
                emailService.sendAlertLD("Véhicule bloqué - " + cl.getVehiculeImmatriculation(),
                    "Le véhicule " + cl.getVehiculeImmatriculation() + " a été bloqué suite à une non-conformité détectée par " + cl.getChauffeurNom());
                emailService.sendAlertASM(cl, "Non-conformité signalée - " + cl.getVehiculeImmatriculation());
                emailService.notifyChauffeurBlock(cl);
            } catch (Exception ignored) {}
            // Notify maintenance for each defect
            try {
                emailService.notifyMaintenance(cl, "Élément défectueux sur véhicule " + cl.getVehiculeImmatriculation());
            } catch (Exception ignored) {}
            // Create fleet alerts
            try {
                alertService.createAlert("CHECKLIST", "Checklist non conforme: " + cl.getVehiculeImmatriculation(),
                    "BLOQUANT", cl.getVehiculeId(), cl.getVehiculeImmatriculation(), cl.getId(), null);
            } catch (Exception ignored) {}
        } else {
            cl.setMessageAlerteArabe("✅ المركبة " + cl.getVehiculeImmatriculation() + " جاهزة للانطلاق. سليمة وآمنة.");
        }

        audit("CHECKLIST", cl.getId(), "SUBMIT", cl.getChauffeurNom(), "CHAUFFEUR",
            "Check-up soumis - " + conformiteDetail + " - vehicule " + cl.getVehiculeImmatriculation());

        return checklistRepository.save(cl);
    }

    public DriverChecklist submitRepair(Long checklistId, String reparationsJson, String repairBy) {
        Optional<DriverChecklist> opt = checklistRepository.findById(checklistId);
        if (opt.isEmpty()) return null;
        DriverChecklist cl = opt.get();
        cl.setReparationsJson(reparationsJson);
        cl.setPostRepair(true);
        cl.setStatut("REPAIRE");
        // Vehicle remains BLOCKED until RS validates — do NOT unblock here
        audit("CHECKLIST", cl.getId(), "REPAIR_SUBMIT", repairBy, "MAINTENANCE",
            "Reparation signee pour vehicule " + cl.getVehiculeImmatriculation());
        // Notify RS that repair is done and needs technical validation
        try {
            emailService.sendAlertRS(cl, "Réparation signalée — Validation technique requise — " + cl.getVehiculeImmatriculation());
        } catch (Exception e) { logError("sendAlertRS(repair)", e); }
        // Notify SL that repair is in progress
        try {
            emailService.sendAlertSL(cl, "Réparation signalée sur " + cl.getVehiculeImmatriculation() + " — En attente validation RS");
        } catch (Exception e) { logError("sendAlertSL(repair)", e); }
        // Notify ASM of workflow status change
        try {
            emailService.sendAlertASM(cl, "Réparation signalée — " + cl.getVehiculeImmatriculation() + " — Statut: REPAIRE");
        } catch (Exception e) { logError("sendAlertASM(repair)", e); }
        return checklistRepository.save(cl);
    }

    public DriverChecklist validateRepair(Long checklistId, String validatedBy) {
        Optional<DriverChecklist> opt = checklistRepository.findById(checklistId);
        if (opt.isEmpty()) return null;
        DriverChecklist cl = opt.get();
        cl.setStatut("VALIDATED");
        cl.setValidePar(validatedBy);
        cl.setDateValidation(LocalDateTime.now());
        audit("CHECKLIST", cl.getId(), "VALIDATE", validatedBy, "RS",
            "Reparation validee - vehicule " + cl.getVehiculeImmatriculation() + " debloque");
        // Now unblock the vehicle — RS has validated the repair
        List<VehicleBlocking> blockings = vehicleBlockingRepository.findByVehiculeImmatriculationOrderByDateBlocageDesc(
            cl.getVehiculeImmatriculation());
        if (!blockings.isEmpty()) {
            VehicleBlocking vb = blockings.get(0);
            vb.setBloque(false);
            vb.setDateDeblocage(LocalDateTime.now());
            vb.setDebloquePar("RS:" + validatedBy);
            vehicleBlockingRepository.save(vb);
        }
        // Notify all stakeholders that vehicle is now available
        try {
            emailService.sendAlertSL(cl, "✅ Véhicule " + cl.getVehiculeImmatriculation() + " débloqué — Réparation validée par " + validatedBy);
        } catch (Exception e) { logError("sendAlertSL(validate)", e); }
        try {
            emailService.sendAlertRPF(cl, "✅ Véhicule " + cl.getVehiculeImmatriculation() + " disponible — Réparation validée par " + validatedBy);
        } catch (Exception e) { logError("sendAlertRPF(validate)", e); }
        try {
            emailService.sendAlertLD("Véhicule " + cl.getVehiculeImmatriculation() + " débloqué",
                "Le véhicule " + cl.getVehiculeImmatriculation() + " est de nouveau conforme et disponible après validation RS par " + validatedBy + ".");
        } catch (Exception e) { logError("sendAlertLD(validate)", e); }
        try {
            emailService.sendAlertASM(cl, "✅ Véhicule " + cl.getVehiculeImmatriculation() + " — Réparation validée par " + validatedBy + " — Statut: VALIDATED");
        } catch (Exception e) { logError("sendAlertASM(validate)", e); }
        try {
            emailService.notifyMaintenance(cl, "✅ Réparation validée — Véhicule " + cl.getVehiculeImmatriculation() + " remis en service");
        } catch (Exception e) { logError("notifyMaintenance(validate)", e); }
        try {
            emailService.notifyChauffeurUnblock(cl);
        } catch (Exception e) { logError("notifyChauffeur(unblock)", e); }
        return checklistRepository.save(cl);
    }

    public DriverChecklist validatePendingChecklist(Long checklistId, String validatedBy) {
        Optional<DriverChecklist> opt = checklistRepository.findById(checklistId);
        if (opt.isEmpty()) return null;
        DriverChecklist cl = opt.get();
        if (!"PENDING".equals(cl.getStatut())) return null;

        boolean conforme = Boolean.TRUE.equals(cl.getEstConforme());
        if (conforme) {
            cl.setStatut("VALIDATED");
            cl.setValidePar(validatedBy);
            cl.setDateValidation(LocalDateTime.now());
            audit("CHECKLIST", cl.getId(), "VALIDATE", validatedBy, "RS",
                "Check-up valide - vehicule " + cl.getVehiculeImmatriculation() + " debloque");
            List<VehicleBlocking> blockings = vehicleBlockingRepository.findByVehiculeImmatriculationOrderByDateBlocageDesc(
                cl.getVehiculeImmatriculation());
            if (!blockings.isEmpty()) {
                VehicleBlocking vb = blockings.get(0);
                vb.setBloque(false);
                vb.setDateDeblocage(LocalDateTime.now());
                vb.setDebloquePar("RS:" + validatedBy);
                vehicleBlockingRepository.save(vb);
            }
            try {
                emailService.sendAlertSL(cl, "✅ Véhicule " + cl.getVehiculeImmatriculation() + " débloqué — Check-up validé par " + validatedBy);
            } catch (Exception e) { logError("sendAlertSL(validate)", e); }
            try {
                emailService.sendAlertRPF(cl, "✅ Véhicule " + cl.getVehiculeImmatriculation() + " disponible — Check-up validé par " + validatedBy);
            } catch (Exception e) { logError("sendAlertRPF(validate)", e); }
            try {
                emailService.sendAlertLD("Véhicule " + cl.getVehiculeImmatriculation() + " débloqué",
                    "Le véhicule " + cl.getVehiculeImmatriculation() + " est de nouveau conforme et disponible après validation RS par " + validatedBy + ".");
            } catch (Exception e) { logError("sendAlertLD(validate)", e); }
            try {
                emailService.sendAlertASM(cl, "✅ Véhicule " + cl.getVehiculeImmatriculation() + " — Check-up validé par " + validatedBy + " — Statut: VALIDATED");
            } catch (Exception e) { logError("sendAlertASM(validate)", e); }
            try {
                emailService.notifyMaintenance(cl, "✅ Check-up validé — Véhicule " + cl.getVehiculeImmatriculation() + " remis en service");
            } catch (Exception e) { logError("notifyMaintenance(validate)", e); }
            try {
                emailService.notifyChauffeurUnblock(cl);
            } catch (Exception e) { logError("notifyChauffeur(unblock)", e); }
        } else {
            cl.setStatut("COMPLETE");
            cl.setValidePar(validatedBy);
            cl.setDateValidation(LocalDateTime.now());
            audit("CHECKLIST", cl.getId(), "VALIDATE_NON_CONFORME", validatedBy, "RS",
                "Check-up non conforme confirme - vehicule " + cl.getVehiculeImmatriculation() + " bloque");
            try {
                emailService.sendAlertSL(cl, "Anomalie confirmée par " + validatedBy + " — " + cl.getVehiculeImmatriculation() + " reste bloqué");
            } catch (Exception e) { logError("sendAlertSL(non-conforme)", e); }
            try {
                emailService.sendAlertASM(cl, "❌ Non-conformité confirmée par " + validatedBy + " — " + cl.getVehiculeImmatriculation() + " reste bloqué — Statut: COMPLETE");
            } catch (Exception e) { logError("sendAlertASM(non-conforme)", e); }
        }
        return checklistRepository.save(cl);
    }

    public DriverChecklist rejectRepair(Long checklistId, String motif, String rejectedBy) {
        Optional<DriverChecklist> opt = checklistRepository.findById(checklistId);
        if (opt.isEmpty()) return null;
        DriverChecklist cl = opt.get();
        cl.setStatut("REJECTED");
        cl.setValidePar(rejectedBy);
        cl.setDateValidation(LocalDateTime.now());
        cl.setMotifRefus(motif);
        audit("CHECKLIST", cl.getId(), "REJECT", rejectedBy, "RS",
            "Reparation refusee - vehicule " + cl.getVehiculeImmatriculation() + " reste bloque - motif: " + motif);
        // Vehicle stays BLOCKED — repair was rejected
        try {
            emailService.notifyMaintenance(cl, "Réparation refusée par " + rejectedBy + " — " + cl.getVehiculeImmatriculation() + (motif != null ? " — Motif: " + motif : ""));
        } catch (Exception e) { logError("notifyMaintenance(reject)", e); }
        try {
            emailService.sendAlertSL(cl, "Réparation refusée par " + rejectedBy + " — " + cl.getVehiculeImmatriculation() + " reste bloqué");
        } catch (Exception e) { logError("sendAlertSL(reject)", e); }
        try {
            emailService.sendAlertASM(cl, "❌ Réparation refusée par " + rejectedBy + " — " + cl.getVehiculeImmatriculation() + " reste bloqué — Statut: REJECTED");
        } catch (Exception e) { logError("sendAlertASM(reject)", e); }
        return checklistRepository.save(cl);
    }

    private void logError(String method, Exception e) {
        System.err.println("[ChecklistService] Error in " + method + ": " + e.getMessage());
    }

    private void audit(String entityType, Long entityId, String action, String userName, String role, String details) {
        try {
            AuditLog log = new AuditLog(entityType, entityId, action, userName, role, details);
            auditLogRepository.save(log);
        } catch (Exception ignored) {}
    }

    public DriverChecklist updateItem(Long checklistId, String key, Boolean value) {
        Optional<DriverChecklist> opt = checklistRepository.findById(checklistId);
        if (opt.isEmpty()) return null;
        DriverChecklist cl = opt.get();
        switch (key) {
            case "pneus": cl.setPneus(value); break;
            case "freins": cl.setFreins(value); break;
            case "feux": cl.setFeux(value); break;
            case "extincteur": cl.setExtincteur(value); break;
            case "documents": cl.setDocuments(value); break;
            case "carrosserie": cl.setCarrosserie(value); break;
            case "huileNiveau": cl.setHuileNiveau(value); break;
            case "batterie": cl.setBatterie(value); break;
            case "essuieGlaces": cl.setEssuieGlaces(value); break;
            case "ceinturesSecurite": cl.setCeinturesSecurite(value); break;
            default: return null;
        }
        return checklistRepository.save(cl);
    }

    public DriverChecklist updateFeedback(Long checklistId, String feedback) {
        Optional<DriverChecklist> opt = checklistRepository.findById(checklistId);
        if (opt.isEmpty()) return null;
        DriverChecklist cl = opt.get();
        cl.setFeedback(feedback);
        return checklistRepository.save(cl);
    }

    public List<DriverChecklist> getNonConformeChecklists() {
        return checklistRepository.findByEstConformeFalseOrderByDateChecklistDesc();
    }

    public List<DriverChecklist> findAll() {
        return checklistRepository.findAll();
    }

    public List<DriverChecklist> findNonConformes() {
        return getNonConformeChecklists();
    }

    public List<Map<String, Object>> findBlockedVehicules() {
        List<VehicleBlocking> blockings = vehicleBlockingRepository.findByBloqueTrue();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (VehicleBlocking vb : blockings) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", vb.getId());
            map.put("vehiculeImmatriculation", vb.getVehiculeImmatriculation());
            map.put("dateBlocage", vb.getDateBlocage());
            map.put("bloquePar", vb.getBloquePar());
            map.put("motif", vb.getRaison());
            result.add(map);
        }
        return result;
    }

    public List<DriverChecklist> getChecklistsByVehicule(String immatriculation) {
        return checklistRepository.findByVehiculeImmatriculationOrderByDateChecklistDesc(immatriculation);
    }

    public List<DriverChecklist> getChecklistsByChauffeur(Long chauffeurId) {
        return checklistRepository.findByChauffeurIdOrderByDateChecklistDesc(chauffeurId);
    }

    public List<DriverChecklist> getAllChecklists() {
        return checklistRepository.findAllByOrderByDateChecklistDesc();
    }

    public List<DriverChecklist> getChecklistsByStatut(String statut) {
        return checklistRepository.findByStatut(statut);
    }

    public Vehicule findVehiculeByImmatriculation(String immatriculation) {
        return vehiculeRepository.findByImmatriculation(immatriculation).orElse(null);
    }

    public DriverChecklist getLatestChecklistForVehicule(String immatriculation) {
        List<DriverChecklist> list = checklistRepository.findByVehiculeImmatriculationOrderByDateChecklistDesc(immatriculation);
        return list.isEmpty() ? null : list.get(0);
    }

    public DriverChecklist getChecklistById(Long id) {
        return checklistRepository.findById(id).orElse(null);
    }

    public ChecklistDTO toDTO(DriverChecklist cl) {
        if (cl == null) return null;
        ChecklistDTO dto = new ChecklistDTO();
        dto.setId(cl.getId());
        dto.setChauffeurId(cl.getChauffeurId());
        dto.setChauffeurNom(cl.getChauffeurNom());
        dto.setChauffeurMatricule(cl.getChauffeurMatricule());
        dto.setTourneeId(cl.getTourneeId());
        dto.setVehiculeId(cl.getVehiculeId());
        dto.setVehiculeImmatriculation(cl.getVehiculeImmatriculation());
        dto.setDateChecklist(cl.getDateChecklist());
        dto.setPneus(cl.getPneus());
        dto.setFreins(cl.getFreins());
        dto.setFeux(cl.getFeux());
        dto.setExtincteur(cl.getExtincteur());
        dto.setDocuments(cl.getDocuments());
        dto.setCarrosserie(cl.getCarrosserie());
        dto.setHuileNiveau(cl.getHuileNiveau());
        dto.setBatterie(cl.getBatterie());
        dto.setEssuieGlaces(cl.getEssuieGlaces());
        dto.setCeinturesSecurite(cl.getCeinturesSecurite());
        dto.setCommentaireGeneral(cl.getCommentaireGeneral());
        dto.setSignature(cl.getSignature());
        dto.setStatut(cl.getStatut());
        dto.setFeedback(cl.getFeedback());
        dto.setEstConforme(cl.getEstConforme());
        dto.setMessageAlerteArabe(cl.getMessageAlerteArabe());
        dto.setDefautsJson(cl.getDefautsJson());
        dto.setPostRepair(cl.getPostRepair());
        dto.setReparationsJson(cl.getReparationsJson());
        dto.setValidePar(cl.getValidePar());
        dto.setDateValidation(cl.getDateValidation());
        dto.setMotifRefus(cl.getMotifRefus());
        return dto;
    }

    private Boolean getBool(Map<String, Object> m, String k) {
        Object v = m.get(k);
        if (v instanceof Boolean) return (Boolean) v;
        if (v instanceof String) return "true".equalsIgnoreCase((String) v);
        return null;
    }

    private String getStr(Map<String, Object> m, String k) {
        Object v = m.get(k);
        return v instanceof String ? (String) v : null;
    }

    private boolean isTrue(Boolean b) { return Boolean.TRUE.equals(b); }
}
