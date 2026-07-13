package com.example.usermanagement.service;

import com.example.usermanagement.model.FleetAlert;
import com.example.usermanagement.repository.FleetAlertRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    private final FleetAlertRepository alertRepository;

    public AlertService(FleetAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public FleetAlert createAlert(String typeAlerte, String description, String criticite,
                                  Long vehiculeId, String vehiculeImmatriculation,
                                  Long checklistId, Long documentId) {
        FleetAlert alert = new FleetAlert(typeAlerte, description, criticite);
        alert.setVehiculeId(vehiculeId);
        alert.setVehiculeImmatriculation(vehiculeImmatriculation);
        alert.setChecklistId(checklistId);
        alert.setDocumentId(documentId);
        return alertRepository.save(alert);
    }

    public List<FleetAlert> getActiveAlerts() {
        return alertRepository.findByResoluFalseOrderByDateCreationDesc();
    }

    public List<FleetAlert> getAllAlerts() {
        return alertRepository.findAllByOrderByDateCreationDesc();
    }

    public List<FleetAlert> getAlertsByVehicule(String immatriculation) {
        return alertRepository.findByVehiculeImmatriculationOrderByDateCreationDesc(immatriculation);
    }

    public FleetAlert resolveAlert(Long alertId, String resoluPar) {
        Optional<FleetAlert> opt = alertRepository.findById(alertId);
        if (opt.isEmpty()) return null;

        FleetAlert alert = opt.get();
        alert.setResolu(true);
        alert.setResoluPar(resoluPar);
        alert.setDateResolution(LocalDateTime.now());
        return alertRepository.save(alert);
    }

    public long getActiveAlertsCount() {
        return alertRepository.countByResoluFalse();
    }

    public long getCriticalAlertsCount() {
        return alertRepository.countByCriticiteAndResoluFalse("CRITIQUE");
    }

    public long getBlockingAlertsCount() {
        return alertRepository.countByCriticiteAndResoluFalse("BLOQUANT");
    }
}
