package com.example.usermanagement.service;

import com.example.usermanagement.model.Checkup;
import com.example.usermanagement.model.CheckupDetail;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.CheckupRepository;
import com.example.usermanagement.repository.CheckupDetailRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CheckupService {

    private final CheckupRepository checkupRepository;
    private final CheckupDetailRepository checkupDetailRepository;
    private final VehiculeRepository vehiculeRepository;
    private final AnomalieCheckupService anomalieCheckupService;

    public CheckupService(CheckupRepository checkupRepository, CheckupDetailRepository checkupDetailRepository, VehiculeRepository vehiculeRepository, AnomalieCheckupService anomalieCheckupService) {
        this.checkupRepository = checkupRepository;
        this.checkupDetailRepository = checkupDetailRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.anomalieCheckupService = anomalieCheckupService;
    }

    public List<Checkup> getAllCheckups() { return checkupRepository.findAll(); }
    public Optional<Checkup> getCheckupById(Long id) { return checkupRepository.findById(id); }
    public Optional<Checkup> getCheckupByCode(String code) { return checkupRepository.findByCheckupCode(code); }
    public List<Checkup> getCheckupsByVehicle(Long id) { return checkupRepository.findByVehiculeId(id); }
    public List<Checkup> getCheckupsByChauffeur(Long id) { return checkupRepository.findByChauffeurId(id); }
    public List<Checkup> getCheckupsConforme(boolean conforme) { return checkupRepository.findByConforme(conforme); }
    public long countConforme() { return checkupRepository.countByConforme(true); }
    public long countNonConforme() { return checkupRepository.countByConforme(false); }

    @Transactional
    public Checkup createCheckup(Checkup checkup, List<CheckupDetail> details) {
        checkup.setCheckupCode("CHK-" + System.nanoTime());
        checkup.setCreatedAt(LocalDateTime.now());
        checkup.setUpdatedAt(LocalDateTime.now());
        if (checkup.getCheckupDate() == null) checkup.setCheckupDate(LocalDateTime.now());
        boolean hasNonConforme = false;
        if (details != null && !details.isEmpty()) {
            for (CheckupDetail d : details) { if ("NON_CONFORME".equals(d.getStatut()) || "CRITIQUE".equals(d.getCriticite())) hasNonConforme = true; }
            checkup.setDetails(details);
        }
        if (checkup.getConforme() == null) checkup.setConforme(!hasNonConforme);
        if (checkup.getStatut() == null) checkup.setStatut(checkup.getConforme() ? "AUTORISE" : "BLOQUE");
        Checkup saved = checkupRepository.save(checkup);
        updateVehicle(saved);
        if (!saved.getConforme() && details != null) { for (CheckupDetail d : details) { if ("NON_CONFORME".equals(d.getStatut()) || "CRITIQUE".equals(d.getCriticite())) anomalieCheckupService.createAnomalieFromCheckupDetail(saved, d); } }
        return saved;
    }

    @Transactional
    public Checkup authorizeDeparture(Long id) {
        return checkupRepository.findById(id).map(c -> { c.setConforme(true); c.setStatut("AUTORISE"); c.setUpdatedAt(LocalDateTime.now()); Checkup s = checkupRepository.save(c); updateVehicle(s); return s; }).orElseThrow(() -> new RuntimeException("Checkup non trouve"));
    }

    @Transactional
    public Checkup signalAnomalie(Long id, String notes) {
        return checkupRepository.findById(id).map(c -> { c.setConforme(false); c.setStatut("BLOQUE"); c.setNotes(notes); c.setUpdatedAt(LocalDateTime.now()); Checkup s = checkupRepository.save(c); updateVehicle(s); return s; }).orElseThrow(() -> new RuntimeException("Checkup non trouve"));
    }

    private void updateVehicle(Checkup checkup) {
        if (checkup.getVehiculeId() != null) {
            vehiculeRepository.findById(checkup.getVehiculeId()).ifPresent(v -> {
                v.setConforme(checkup.getConforme());
                v.setDocumentsDisponibles(checkup.getDocumentsDisponibles());
                v.setStatut(checkup.getConforme() ? "DISPONIBLE" : "BLOQUE");
                vehiculeRepository.save(v);
            });
        }
    }
}