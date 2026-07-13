package com.example.usermanagement.service;

import com.example.usermanagement.model.Tournee;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.TourneeRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TourneeService {
    
    private static final Logger logger = LoggerFactory.getLogger(TourneeService.class);
    
    private final TourneeRepository tourneeRepository;
    private final VehiculeRepository vehiculeRepository;
    
    public TourneeService(TourneeRepository tourneeRepository, VehiculeRepository vehiculeRepository) {
        this.tourneeRepository = tourneeRepository;
        this.vehiculeRepository = vehiculeRepository;
    }
    
    public List<Tournee> getAllTournees() {
        return tourneeRepository.findAll();
    }
    
    public Optional<Tournee> getTourneeById(Long id) {
        return tourneeRepository.findById(id);
    }
    
    public Optional<Tournee> getTourneeByNumero(String numeroTournee) {
        return tourneeRepository.findByNumeroTournee(numeroTournee);
    }
    
    public List<Tournee> getTourneesByChauffeur(Long chauffeurId) {
        return tourneeRepository.findByChauffeurId(chauffeurId);
    }
    
    public List<Tournee> getTourneesByVehicule(Long vehiculeId) {
        return tourneeRepository.findByVehiculeId(vehiculeId);
    }
    
    public List<Tournee> getTourneesBySite(String site) {
        return tourneeRepository.findBySite(site);
    }
    
    public List<Tournee> getTourneesByStatut(Tournee.StatutTournee statut) {
        return tourneeRepository.findByStatut(statut);
    }
    
    @Transactional
    public Tournee createTournee(Tournee tournee) {
        // Générer ID tournee unique
        String idTournee = "TOU-" + System.currentTimeMillis();
        tournee.setIdTournee(idTournee);
        
        // Générer numéro tournee si non fourni
        if (tournee.getNumeroTournee() == null || tournee.getNumeroTournee().isEmpty()) {
            String numeroTournee = "TRN-" + String.format("%06d", tourneeRepository.count() + 1);
            tournee.setNumeroTournee(numeroTournee);
        }
        
        // Vérifier que le véhicule existe
        if (tournee.getVehiculeId() != null) {
            Optional<Vehicule> vehicule = vehiculeRepository.findById(tournee.getVehiculeId());
            if (vehicule.isPresent()) {
                tournee.setVehiculeImmatriculation(vehicule.get().getImmatriculation());
            }
        }
        
        Tournee savedTournee = tourneeRepository.save(tournee);
        logger.info("Tournée créée: {}", savedTournee.getNumeroTournee());
        return savedTournee;
    }
    
    @Transactional
    public Tournee updateTournee(Long id, Tournee tourneeDetails) {
        return tourneeRepository.findById(id).map(tournee -> {
            tournee.setNumeroTournee(tourneeDetails.getNumeroTournee());
            tournee.setSite(tourneeDetails.getSite());
            tournee.setDateTournee(tourneeDetails.getDateTournee());
            tournee.setChauffeurId(tourneeDetails.getChauffeurId());
            tournee.setChauffeurNom(tourneeDetails.getChauffeurNom());
            tournee.setVehiculeId(tourneeDetails.getVehiculeId());
            tournee.setVehiculeImmatriculation(tourneeDetails.getVehiculeImmatriculation());
            tournee.setStatut(tourneeDetails.getStatut());
            tournee.setHeureDebut(tourneeDetails.getHeureDebut());
            tournee.setHeureFin(tourneeDetails.getHeureFin());
            tournee.setNombreArrets(tourneeDetails.getNombreArrets());
            tournee.setDistanceTotale(tourneeDetails.getDistanceTotale());
            tournee.setItineraire(tourneeDetails.getItineraire());
            tournee.setNotes(tourneeDetails.getNotes());
            
            Tournee updatedTournee = tourneeRepository.save(tournee);
            logger.info("Tournée mise à jour: {}", updatedTournee.getNumeroTournee());
            return updatedTournee;
        }).orElse(null);
    }
    
    @Transactional
    public Tournee demarrerTournee(Long id) {
        return tourneeRepository.findById(id).map(tournee -> {
            tournee.setStatut(Tournee.StatutTournee.EN_COURS);
            tournee.setHeureDebut(LocalDateTime.now());
            return tourneeRepository.save(tournee);
        }).orElse(null);
    }
    
    @Transactional
    public Tournee terminerTournee(Long id) {
        return tourneeRepository.findById(id).map(tournee -> {
            tournee.setStatut(Tournee.StatutTournee.TERMINEE);
            tournee.setHeureFin(LocalDateTime.now());
            
            // Calculer la durée si heure début existe
            if (tournee.getHeureDebut() != null && tournee.getHeureFin() != null) {
                long minutes = java.time.temporal.ChronoUnit.MINUTES.between(
                    tournee.getHeureDebut(), tournee.getHeureFin());
                logger.info("Durée de la tournée: {} minutes", minutes);
            }
            
            return tourneeRepository.save(tournee);
        }).orElse(null);
    }
    
    @Transactional
    public Tournee annulerTournee(Long id, String motif) {
        return tourneeRepository.findById(id).map(tournee -> {
            tournee.setStatut(Tournee.StatutTournee.ANNULEE);
            tournee.setNotes(motif);
            return tourneeRepository.save(tournee);
        }).orElse(null);
    }
    
    @Transactional
    public void deleteTournee(Long id) {
        tourneeRepository.deleteById(id);
        logger.info("Tournée supprimée: {}", id);
    }
    
    public List<Tournee> getTourneesActivesByChauffeur(Long chauffeurId) {
        return tourneeRepository.findByChauffeurIdAndStatut(chauffeurId, Tournee.StatutTournee.EN_COURS);
    }
    
    public List<Tournee> getTourneesActivesByVehicule(Long vehiculeId) {
        return tourneeRepository.findByVehiculeIdAndStatut(vehiculeId, Tournee.StatutTournee.EN_COURS);
    }
    
    public long countTourneesByStatut(Tournee.StatutTournee statut) {
        return tourneeRepository.countByStatut(statut);
    }
    
    public List<Tournee> getTourneesByPeriod(LocalDateTime debut, LocalDateTime fin) {
        return tourneeRepository.findTourneesByPeriod(debut, fin);
    }
}
