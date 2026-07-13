package com.example.usermanagement.service;

import com.example.usermanagement.model.AnomalieCheckup;
import com.example.usermanagement.model.AnomalieCheckup.AnomalieStatut;
import com.example.usermanagement.model.AnomalieCheckupHistory;
import com.example.usermanagement.model.Checkup;
import com.example.usermanagement.model.CheckupDetail;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.AnomalieCheckupRepository;
import com.example.usermanagement.repository.AnomalieCheckupHistoryRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AnomalieCheckupService {

    private final AnomalieCheckupRepository anomalieRepository;
    private final AnomalieCheckupHistoryRepository historyRepository;
    private final VehiculeRepository vehiculeRepository;
    private final TaskService taskService;

    public AnomalieCheckupService(AnomalieCheckupRepository anomalieRepository,
                                    AnomalieCheckupHistoryRepository historyRepository,
                                    VehiculeRepository vehiculeRepository,
                                    TaskService taskService) {
        this.anomalieRepository = anomalieRepository;
        this.historyRepository = historyRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.taskService = taskService;
    }

    private void logHistory(Long anomalieId, String ancienStatut, String nouveauStatut, String action, String utilisateur, String commentaire) {
        AnomalieCheckupHistory h = new AnomalieCheckupHistory();
        h.setAnomalieId(anomalieId);
        h.setAncienStatut(ancienStatut);
        h.setNouveauStatut(nouveauStatut);
        h.setAction(action);
        h.setUtilisateur(utilisateur);
        h.setCommentaire(commentaire);
        h.setDateAction(LocalDateTime.now());
        historyRepository.save(h);
    }

    private void logHistoryWithDoc(Long anomalieId, String ancienStatut, String nouveauStatut, String action, String utilisateur, String commentaire, String documentUrl) {
        AnomalieCheckupHistory h = new AnomalieCheckupHistory();
        h.setAnomalieId(anomalieId);
        h.setAncienStatut(ancienStatut);
        h.setNouveauStatut(nouveauStatut);
        h.setAction(action);
        h.setUtilisateur(utilisateur);
        h.setCommentaire(commentaire);
        h.setDocumentUrl(documentUrl);
        h.setDateAction(LocalDateTime.now());
        historyRepository.save(h);
    }

    public List<AnomalieCheckupHistory> getHistory(Long anomalieId) {
        return historyRepository.findByAnomalieIdOrderByDateActionAsc(anomalieId);
    }

    public List<AnomalieCheckup> getAll() { return anomalieRepository.findAll(); }
    public Optional<AnomalieCheckup> getById(Long id) { return anomalieRepository.findById(id); }
    public Optional<AnomalieCheckup> getByCode(String code) { return anomalieRepository.findByAnomalieCode(code); }
    public List<AnomalieCheckup> getByVehicule(Long vehiculeId) { return anomalieRepository.findByVehiculeId(vehiculeId); }
    public List<AnomalieCheckup> getByImmatriculation(String immat) { return anomalieRepository.findByVehiculeImmatriculation(immat); }
    public List<AnomalieCheckup> getByChauffeur(Long chauffeurId) { return anomalieRepository.findByChauffeurId(chauffeurId); }
    public List<AnomalieCheckup> getByStatut(AnomalieStatut statut) { return anomalieRepository.findByStatut(statut); }
    public List<AnomalieCheckup> getByCategorie(String categorie) { return anomalieRepository.findByCategorie(categorie); }
    public List<AnomalieCheckup> getByDateRange(LocalDateTime start, LocalDateTime end) { return anomalieRepository.findByDateDetectionBetween(start, end); }
    public List<AnomalieCheckup> getByFilters(LocalDateTime start, LocalDateTime end, Long chauffeurId, AnomalieStatut statut, String categorie) { return anomalieRepository.findByFilters(start, end, chauffeurId, statut, categorie); }

    @Transactional
    public AnomalieCheckup createAnomalieFromCheckupDetail(Checkup checkup, CheckupDetail detail) {
        AnomalieCheckup a = new AnomalieCheckup();
        a.setAnomalieCode("ANO-" + System.nanoTime());
        a.setCheckupId(checkup.getId());
        a.setCheckupCode(checkup.getCheckupCode());
        a.setElement(detail.getElement());
        a.setCategorie(detail.getCategorie());
        a.setCriticite(detail.getCriticite());
        a.setDescription("Anomalie detectee lors du checkup " + checkup.getCheckupCode() + " - " + detail.getElement());
        a.setObservation(detail.getObservation());
        a.setVehiculeId(checkup.getVehiculeId());
        a.setVehiculeImmatriculation(checkup.getVehiculeImmatriculation());
        a.setChauffeurId(checkup.getChauffeurId());
        a.setChauffeurNom(checkup.getChauffeurNom());
        a.setPhotoUrl(detail.getPhotoUrl());
        a.setSource("CHECKUP");
        a.setStatut(AnomalieStatut.DETECTEE);
        a.setAssignedTo("MAINTENANCE");
        a.setDateDetection(LocalDateTime.now());
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        AnomalieCheckup saved = anomalieRepository.save(a);
        logHistory(saved.getId(), null, "DETECTEE", "CREATION", "SYSTEM", a.getDescription());
        taskService.createTask(a.getDescription(), null, checkup.getVehiculeId(), checkup.getVehiculeImmatriculation(), checkup.getChauffeurId(), checkup.getChauffeurNom(), "MAINTENANCE", a.getCriticite() != null ? a.getCriticite() : "HAUTE", a.getCategorie(), "SYSTEM");
        vehiculeRepository.findById(a.getVehiculeId()).ifPresent(v -> { v.setStatut("BLOQUE"); v.setConforme(false); v.setDateBlocage(java.time.LocalDateTime.now()); v.setBloquePar("CHECKUP"); vehiculeRepository.save(v); });
        return saved;
    }

    @Transactional
    public AnomalieCheckup signalerAnomalieManuelle(String immat, Long vehiculeId, Long chauffeurId, String chauffeurNom, String element, String categorie, String criticite, String description, String observation) {
        AnomalieCheckup a = new AnomalieCheckup();
        a.setAnomalieCode("ANO-" + System.nanoTime());
        a.setVehiculeImmatriculation(immat);
        a.setVehiculeId(vehiculeId);
        a.setChauffeurId(chauffeurId);
        a.setChauffeurNom(chauffeurNom);
        a.setElement(element);
        a.setCategorie(categorie);
        a.setCriticite(criticite);
        a.setDescription(description);
        a.setObservation(observation);
        a.setSource("MANUELLE");
        a.setStatut(AnomalieStatut.DETECTEE);
        a.setAssignedTo("MAINTENANCE");
        a.setDateDetection(LocalDateTime.now());
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        AnomalieCheckup saved = anomalieRepository.save(a);
        logHistory(saved.getId(), null, "DETECTEE", "CREATION_MANUELLE", "SYSTEM", a.getDescription());
        vehiculeRepository.findById(vehiculeId).ifPresent(v -> { v.setStatut("BLOQUE"); v.setConforme(false); v.setDateBlocage(java.time.LocalDateTime.now()); v.setBloquePar("MANUELLE"); v.setRaisonBlocage(description); vehiculeRepository.save(v); });
        taskService.createTask(description, null, vehiculeId, immat, chauffeurId, chauffeurNom, "MAINTENANCE", criticite, categorie, "SYSTEM");
        return saved;
    }

    @Transactional
    public AnomalieCheckup prendreEnCharge(Long id, String assignedTo) {
        return anomalieRepository.findById(id).map(a -> {
            if (a.getStatut() != AnomalieStatut.DETECTEE) throw new RuntimeException("Anomalie doit etre DETECTEE. Actuel: " + a.getStatut());
            String ancien = a.getStatut().name();
            a.setStatut(AnomalieStatut.EN_REPARATION);
            a.setAssignedTo(assignedTo);
            a.setDatePriseEnCharge(LocalDateTime.now());
            a.setUpdatedAt(LocalDateTime.now());
            AnomalieCheckup saved = anomalieRepository.save(a);
            logHistory(saved.getId(), ancien, "EN_REPARATION", "PRISE_EN_CHARGE", assignedTo, "Prise en charge par " + assignedTo);
            return saved;
        }).orElseThrow(() -> new RuntimeException("Anomalie non trouvee"));
    }

    @Transactional
    public AnomalieCheckup signalerRepare(Long id, String reparePar, String resolutionNotes) {
        return anomalieRepository.findById(id).map(a -> {
            if (a.getStatut() != AnomalieStatut.EN_REPARATION && a.getStatut() != AnomalieStatut.DETECTEE) throw new RuntimeException("Anomalie doit etre EN_REPARATION ou DETECTEE. Actuel: " + a.getStatut());
            String ancien = a.getStatut().name();
            a.setStatut(AnomalieStatut.REPAREE);
            a.setReparePar(reparePar);
            a.setResolutionNotes(resolutionNotes);
            a.setDateReparation(LocalDateTime.now());
            a.setUpdatedAt(LocalDateTime.now());
            if (a.getTaskId() != null) taskService.markAsDone(a.getTaskId(), resolutionNotes);
            AnomalieCheckup saved = anomalieRepository.save(a);
            logHistory(saved.getId(), ancien, "REPAREE", "REPARATION", reparePar, resolutionNotes);
            return saved;
        }).orElseThrow(() -> new RuntimeException("Anomalie non trouvee"));
    }

    @Transactional
    public AnomalieCheckup signalerNonRepare(Long id, String resolutionNotes) {
        return anomalieRepository.findById(id).map(a -> {
            if (a.getStatut() != AnomalieStatut.EN_REPARATION && a.getStatut() != AnomalieStatut.DETECTEE) throw new RuntimeException("Anomalie doit etre EN_REPARATION ou DETECTEE. Actuel: " + a.getStatut());
            String ancien = a.getStatut().name();
            a.setStatut(AnomalieStatut.NON_REPAREE);
            a.setResolutionNotes(resolutionNotes);
            a.setUpdatedAt(LocalDateTime.now());
            AnomalieCheckup saved = anomalieRepository.save(a);
            logHistory(saved.getId(), ancien, "NON_REPAREE", "NON_REPARABLE", "SYSTEM", resolutionNotes);
            return saved;
        }).orElseThrow(() -> new RuntimeException("Anomalie non trouvee"));
    }

    @Transactional
    public AnomalieCheckup validerReparation(Long id, String validePar) {
        return anomalieRepository.findById(id).map(a -> {
            if (a.getStatut() != AnomalieStatut.REPAREE) throw new RuntimeException("Anomalie doit etre REPAREE pour valider. Actuel: " + a.getStatut());
            String ancien = a.getStatut().name();
            a.setStatut(AnomalieStatut.VALIDEE);
            a.setValidePar(validePar);
            a.setDateValidation(LocalDateTime.now());
            a.setUpdatedAt(LocalDateTime.now());
            if (a.getTaskId() != null) taskService.closeTask(a.getTaskId());
            boolean hasOtherOpen = anomalieRepository.findByVehiculeId(a.getVehiculeId()).stream().anyMatch(o -> !o.getId().equals(a.getId()) && o.getStatut() != AnomalieStatut.VALIDEE && o.getStatut() != AnomalieStatut.ANNULEE && o.getStatut() != AnomalieStatut.NON_REPAREE);
            if (!hasOtherOpen) { vehiculeRepository.findById(a.getVehiculeId()).ifPresent(v -> { v.setStatut("DISPONIBLE"); v.setConforme(true); v.setDateDeblocage(java.time.LocalDateTime.now()); v.setDebloquePar(validePar); v.setRaisonBlocage(null); vehiculeRepository.save(v); }); }
            AnomalieCheckup saved = anomalieRepository.save(a);
            logHistory(saved.getId(), ancien, "VALIDEE", "VALIDATION", validePar, "Reparation validee par " + validePar + " - sans verification budget");
            return saved;
        }).orElseThrow(() -> new RuntimeException("Anomalie non trouvee"));
    }

    @Transactional
    public AnomalieCheckup annuler(Long id, String reason) {
        return anomalieRepository.findById(id).map(a -> {
            String ancien = a.getStatut().name();
            a.setStatut(AnomalieStatut.ANNULEE);
            a.setResolutionNotes(reason);
            a.setUpdatedAt(LocalDateTime.now());
            if (a.getTaskId() != null) taskService.closeTask(a.getTaskId());
            AnomalieCheckup saved = anomalieRepository.save(a);
            logHistory(saved.getId(), ancien, "ANNULEE", "ANNULATION", "SYSTEM", reason);
            return saved;
        }).orElseThrow(() -> new RuntimeException("Anomalie non trouvee"));
    }

    public long countByStatut(AnomalieStatut statut) { return anomalieRepository.countByStatut(statut); }
    public long totalAnomalies() { return anomalieRepository.count(); }

    public AnomalieCheckupHistory saveHistory(AnomalieCheckupHistory h) {
        return historyRepository.save(h);
    }
}