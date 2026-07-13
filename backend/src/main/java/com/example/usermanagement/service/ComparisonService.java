package com.example.usermanagement.service;

import com.example.usermanagement.dto.ChecklistDTO;
import com.example.usermanagement.dto.ComparisonItemDTO;
import com.example.usermanagement.dto.ComparisonResultDTO;
import com.example.usermanagement.dto.LegalDocumentDTO;
import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ComparisonService {

    private final ChecklistService checklistService;
    private final LegalDocumentService legalDocumentService;
    private final AlertService alertService;
    private final VehicleBlockingRepository blockingRepository;
    private final VehiculeRepository vehiculeRepository;

    public ComparisonService(ChecklistService checklistService, LegalDocumentService legalDocumentService,
                             AlertService alertService, VehicleBlockingRepository blockingRepository,
                             VehiculeRepository vehiculeRepository) {
        this.checklistService = checklistService;
        this.legalDocumentService = legalDocumentService;
        this.alertService = alertService;
        this.blockingRepository = blockingRepository;
        this.vehiculeRepository = vehiculeRepository;
    }

    public ComparisonResultDTO compare(String immatriculation) {
        ComparisonResultDTO result = new ComparisonResultDTO();

        Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(immatriculation);
        if (vOpt.isEmpty()) return null;

        Vehicule v = vOpt.get();
        result.setVehiculeImmatriculation(immatriculation);
        result.setMarque(v.getMarque());
        result.setModele(v.getModele());

        ChecklistDTO lastChecklist = checklistService.toDTO(
            checklistService.getLatestChecklistForVehicule(immatriculation));
        result.setLastChecklist(lastChecklist);

        List<LegalDocumentDTO> docs = legalDocumentService.toDTOList(
            legalDocumentService.getDocumentsByVehicule(immatriculation));
        result.setDocuments(docs);

        List<ComparisonItemDTO> items = new ArrayList<>();

        boolean hasPhysiqueDocs = lastChecklist != null && Boolean.TRUE.equals(lastChecklist.getDocuments());
        boolean hasAdminDocs = docs.stream().anyMatch(d -> "VALIDE".equals(d.getStatut()));
        items.add(new ComparisonItemDTO("Documents", hasPhysiqueDocs, hasAdminDocs));

        boolean hasPhysiqueExtincteur = lastChecklist != null && Boolean.TRUE.equals(lastChecklist.getExtincteur());
        items.add(new ComparisonItemDTO("Extincteur", hasPhysiqueExtincteur, true));

        boolean hasPhysiquePneus = lastChecklist != null && Boolean.TRUE.equals(lastChecklist.getPneus());
        items.add(new ComparisonItemDTO("Pneus", hasPhysiquePneus, true));

        boolean hasPhysiqueFreins = lastChecklist != null && Boolean.TRUE.equals(lastChecklist.getFreins());
        items.add(new ComparisonItemDTO("Freins", hasPhysiqueFreins, true));

        boolean hasPhysiqueFeux = lastChecklist != null && Boolean.TRUE.equals(lastChecklist.getFeux());
        items.add(new ComparisonItemDTO("Feux", hasPhysiqueFeux, true));

        result.setItems(items);

        boolean hasBloquant = items.stream().anyMatch(i -> "BLOQUANT".equals(i.getStatut()));
        boolean hasCritique = items.stream().anyMatch(i -> "CRITIQUE".equals(i.getStatut()));
        boolean hasAlerte = items.stream().anyMatch(i -> "ALERTE".equals(i.getStatut()));

        if (hasBloquant) {
            result.setStatutGlobal("BLOQUANT");
            result.setDescription("Vehicule bloque : documents manquants et perimes");
        } else if (hasCritique) {
            result.setStatutGlobal("CRITIQUE");
            result.setDescription("Anomalie critique detectee");
        } else if (hasAlerte) {
            result.setStatutGlobal("ALERTE");
            result.setDescription("Alerte : certains documents sont oublies");
        } else {
            result.setStatutGlobal("CONFORME");
            result.setDescription("Tout est conforme");
        }

        generateAlertsFromComparison(immatriculation, result);

        return result;
    }

    private void generateAlertsFromComparison(String immatriculation, ComparisonResultDTO result) {
        for (ComparisonItemDTO item : result.getItems()) {
            switch (item.getStatut()) {
                case "BLOQUANT":
                    alertService.createAlert(
                        "DOCUMENT_MANQUANT_EXPIRE",
                        item.getElement() + " : " + item.getMessage(),
                        "BLOQUANT",
                        null, immatriculation, null, null
                    );
                    blockVehicule(immatriculation, item.getElement() + " manquant et expire");
                    break;
                case "CRITIQUE":
                    alertService.createAlert(
                        "DOCUMENT_EXPIRE",
                        item.getElement() + " : " + item.getMessage(),
                        "CRITIQUE",
                        null, immatriculation, null, null
                    );
                    break;
                case "ALERTE":
                    alertService.createAlert(
                        "CHAUFFEUR_OUBLIE",
                        item.getElement() + " : " + item.getMessage(),
                        "WARNING",
                        null, immatriculation, null, null
                    );
                    break;
            }
        }
    }

    public void blockVehicule(String immatriculation, String raison) {
        Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(immatriculation);
        if (vOpt.isEmpty()) return;

        Optional<VehicleBlocking> existing = blockingRepository.findByVehiculeImmatriculation(immatriculation);
        if (existing.isPresent() && existing.get().getBloque()) return;

        VehicleBlocking blocking = new VehicleBlocking(vOpt.get().getId(), immatriculation, raison);
        blockingRepository.save(blocking);

        vOpt.get().setStatut("BLOQUE");
        vehiculeRepository.save(vOpt.get());
    }

    public void unblockVehicule(String immatriculation, String debloquePar) {
        Optional<VehicleBlocking> opt = blockingRepository.findByVehiculeImmatriculation(immatriculation);
        if (opt.isEmpty()) return;

        VehicleBlocking blocking = opt.get();
        blocking.setBloque(false);
        blocking.setDateDeblocage(java.time.LocalDateTime.now());
        blocking.setDebloquePar(debloquePar);
        blockingRepository.save(blocking);

        vehiculeRepository.findByImmatriculation(immatriculation).ifPresent(v -> {
            v.setStatut("ACTIF");
            vehiculeRepository.save(v);
        });
    }
}
