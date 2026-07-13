package com.example.usermanagement.service;

import com.example.usermanagement.model.DepartHistorique;
import com.example.usermanagement.model.DriverChecklist;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.DepartHistoriqueRepository;
import com.example.usermanagement.repository.DriverChecklistRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class DepartHistoriqueService {

    private static final Logger logger = LoggerFactory.getLogger(DepartHistoriqueService.class);

    private final DepartHistoriqueRepository departHistoriqueRepository;
    private final VehiculeRepository vehiculeRepository;
    private final DriverChecklistRepository driverChecklistRepository;
private final DocumentVehiculeService documentVehiculeService;

    public DepartHistoriqueService(DepartHistoriqueRepository departHistoriqueRepository,
                                    VehiculeRepository vehiculeRepository,
                                    DriverChecklistRepository driverChecklistRepository,
                                    DocumentVehiculeService documentVehiculeService) {
        this.departHistoriqueRepository = departHistoriqueRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.driverChecklistRepository = driverChecklistRepository;
        this.documentVehiculeService = documentVehiculeService;
    }

    @Transactional
    public DepartHistorique enregistrerDepart(DriverChecklist checklist, String site, String branchCode,
                                               Double gpsLatitude, Double gpsLongitude, String gpsCity) {
        // Vérifier que le véhicule est conforme avant d'autoriser le départ
        if (!checklist.getEstConforme()) {
            throw new IllegalStateException("Le véhicule n'est pas conforme. Départ interdit.");
        }

        // Vérifier que les documents sont valides
        if (!documentVehiculeService.verifierDocumentsObligatoires(checklist.getVehiculeId())) {
            throw new IllegalStateException("Le véhicule contient des documents expirés. Départ interdit.");
        }

        // Générer un numéro de départ unique
        String numeroDepart = genererNumeroDepart(checklist.getVehiculeImmatriculation());

        // Créer l'historique de départ
        DepartHistorique depart = new DepartHistorique(
            numeroDepart,
            checklist.getTourneeId(),
            checklist.getChauffeurId(),
            checklist.getChauffeurNom(),
            checklist.getVehiculeId(),
            checklist.getVehiculeImmatriculation(),
            checklist.getEstConforme() ? "CONFORME" : "NON_CONFORME"
        );

        depart.setChecklistId(checklist.getId());
        depart.setChauffeurMatricule(checklist.getChauffeurMatricule());
        depart.setStatutVehicule("DISPONIBLE");
        depart.setSite(site);
        depart.setBranchCode(branchCode);
        depart.setGpsLatitude(gpsLatitude);
        depart.setGpsLongitude(gpsLongitude);
        depart.setGpsCity(gpsCity);

        // Récupérer les informations du véhicule
        Optional<Vehicule> vehicule = vehiculeRepository.findById(checklist.getVehiculeId());
        if (vehicule.isPresent()) {
            depart.setBranchCode(vehicule.get().getBranchCode());
        }

        DepartHistorique savedDepart = departHistoriqueRepository.save(depart);
        logger.info("Départ enregistré: {} pour véhicule {} par chauffeur {} à {}",
                numeroDepart, checklist.getVehiculeImmatriculation(), checklist.getChauffeurNom(), LocalDateTime.now());

        return savedDepart;
    }

    public List<DepartHistorique> getHistoriqueByVehicule(String immatriculation) {
        return departHistoriqueRepository.findHistoriqueByVehicle(immatriculation);
    }

    public List<DepartHistorique> getHistoriqueByChauffeur(Long chauffeurId) {
        return departHistoriqueRepository.findHistoriqueByChauffeur(chauffeurId);
    }

    public List<DepartHistorique> getHistoriqueByDate(LocalDate date) {
        return departHistoriqueRepository.findByDateDepartAndDeletedFalseOrderByTimestampDepartDesc(date);
    }

    public List<DepartHistorique> getHistoriqueBySite(String site) {
        return departHistoriqueRepository.findBySite(site);
    }

    public Optional<DepartHistorique> getDernierDepartByVehicule(String immatriculation) {
        return departHistoriqueRepository.findFirstByVehiculeImmatriculationAndDeletedFalseOrderByTimestampDepartDesc(immatriculation);
    }

    public Long countDepartsByVehicleAndDate(String immatriculation, LocalDate date) {
        return departHistoriqueRepository.countDepartsByVehicleAndDate(immatriculation, date);
    }

    public boolean peutEffectuerNouveauDepart(String immatriculation) {
        // Vérifier que le véhicule n'est pas bloqué
        Optional<Vehicule> vehicule = vehiculeRepository.findByImmatriculation(immatriculation);
        if (vehicule.isEmpty() || "BLOQUE".equals(vehicule.get().getStatut())) {
            return false;
        }

        // Vérifier que les documents sont valides
        if (!documentVehiculeService.verifierDocumentsObligatoires(vehicule.get().getId())) {
            return false;
        }

        return true;
    }

    @Transactional
    public void supprimerDepart(Long id, String supprimePar) {
        Optional<DepartHistorique> depart = departHistoriqueRepository.findById(id);
        if (depart.isPresent()) {
            depart.get().softDelete(supprimePar);
            departHistoriqueRepository.save(depart.get());
            logger.info("Depart {} supprimé par {}", id, supprimePar);
        }
    }

    private String genererNumeroDepart(String immatriculation) {
        LocalDate aujourdHui = LocalDate.now();
        Long count = countDepartsByVehicleAndDate(immatriculation, aujourdHui);
        Long numero = count + 1;
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String dateStr = aujourdHui.format(formatter);
        
        return "DEP-" + immatriculation.replace("-", "") + "-" + dateStr + "-" + String.format("%03d", numero);
    }

    public List<DepartHistorique> getAllDeparts() {
        return departHistoriqueRepository.findAll().stream()
                .filter(d -> !d.getDeleted())
                .toList();
    }

    public Optional<DepartHistorique> getDepartById(Long id) {
        return departHistoriqueRepository.findById(id);
    }
}
