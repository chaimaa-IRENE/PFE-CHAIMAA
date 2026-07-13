package com.example.usermanagement.service;

import com.example.usermanagement.model.TicketMaintenance;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.TicketMaintenanceRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TicketMaintenanceService {
    
    private static final Logger logger = LoggerFactory.getLogger(TicketMaintenanceService.class);
    
    private final TicketMaintenanceRepository ticketMaintenanceRepository;
    private final VehiculeRepository vehiculeRepository;
    private final EmailNotificationService emailNotificationService;
    
    public TicketMaintenanceService(TicketMaintenanceRepository ticketMaintenanceRepository,
                                    VehiculeRepository vehiculeRepository,
                                    EmailNotificationService emailNotificationService) {
        this.ticketMaintenanceRepository = ticketMaintenanceRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.emailNotificationService = emailNotificationService;
    }
    
    public List<TicketMaintenance> getAllTickets() {
        return ticketMaintenanceRepository.findAll();
    }
    
    public Optional<TicketMaintenance> getTicketById(Long id) {
        return ticketMaintenanceRepository.findById(id);
    }
    
    public Optional<TicketMaintenance> getTicketByNumero(String numeroTicket) {
        return ticketMaintenanceRepository.findByNumeroTicket(numeroTicket);
    }
    
    public List<TicketMaintenance> getTicketsByVehicule(Long vehiculeId) {
        return ticketMaintenanceRepository.findByVehiculeId(vehiculeId);
    }
    
    public List<TicketMaintenance> getTicketsByVehiculeImmatriculation(String immatriculation) {
        return ticketMaintenanceRepository.findByVehiculeImmatriculation(immatriculation);
    }
    
    public List<TicketMaintenance> getTicketsByTournee(String tourneeId) {
        return ticketMaintenanceRepository.findByTourneeId(tourneeId);
    }
    
    public List<TicketMaintenance> getTicketsByStatut(TicketMaintenance.StatutTicket statut) {
        return ticketMaintenanceRepository.findByStatut(statut);
    }
    
    public List<TicketMaintenance> getTicketsByCriticite(TicketMaintenance.CriticiteTicket criticite) {
        return ticketMaintenanceRepository.findByCriticite(criticite);
    }
    
    public List<TicketMaintenance> getTicketsByTechnicien(String technicien) {
        return ticketMaintenanceRepository.findByTechnicien(technicien);
    }
    
    @Transactional
    public TicketMaintenance createTicket(TicketMaintenance ticket) {
        // Générer numéro ticket unique
        if (ticket.getNumeroTicket() == null || ticket.getNumeroTicket().isEmpty()) {
            String numeroTicket = "TKT-" + System.currentTimeMillis();
            ticket.setNumeroTicket(numeroTicket);
        }
        
        // Définir date ouverture si non fournie
        if (ticket.getDateOuverture() == null) {
            ticket.setDateOuverture(LocalDateTime.now());
        }
        
        // Vérifier que le véhicule existe
        if (ticket.getVehiculeId() != null) {
            Optional<Vehicule> vehicule = vehiculeRepository.findById(ticket.getVehiculeId());
            if (vehicule.isPresent()) {
                ticket.setVehiculeImmatriculation(vehicule.get().getImmatriculation());
            }
        }
        
        TicketMaintenance savedTicket = ticketMaintenanceRepository.save(ticket);
        logger.info("Ticket de maintenance créé: {} pour véhicule {}", 
                savedTicket.getNumeroTicket(), savedTicket.getVehiculeImmatriculation());
        
        // Si critique, bloquer le véhicule
        if (savedTicket.getCriticite() == TicketMaintenance.CriticiteTicket.CRITIQUE) {
            bloquerVehiculePourMaintenance(savedTicket.getVehiculeId());
        }
        
        return savedTicket;
    }
    
    @Transactional
    public TicketMaintenance updateTicket(Long id, TicketMaintenance ticketDetails) {
        return ticketMaintenanceRepository.findById(id).map(ticket -> {
            ticket.setElement(ticketDetails.getElement());
            ticket.setCriticite(ticketDetails.getCriticite());
            ticket.setDescription(ticketDetails.getDescription());
            ticket.setActionsRealisees(ticketDetails.getActionsRealisees());
            ticket.setPiecesNecessaires(ticketDetails.getPiecesNecessaires());
            ticket.setCoutEstime(ticketDetails.getCoutEstime());
            ticket.setCoutReel(ticketDetails.getCoutReel());
            ticket.setTechnicien(ticketDetails.getTechnicien());
            ticket.setPriorite(ticketDetails.getPriorite());
            
            TicketMaintenance updatedTicket = ticketMaintenanceRepository.save(ticket);
            logger.info("Ticket de maintenance mis à jour: {}", updatedTicket.getNumeroTicket());
            return updatedTicket;
        }).orElse(null);
    }
    
    @Transactional
    public TicketMaintenance affecterTicket(Long id, String technicien) {
        return ticketMaintenanceRepository.findById(id).map(ticket -> {
            ticket.setStatut(TicketMaintenance.StatutTicket.AFFECTE);
            ticket.setAffectation(technicien);
            ticket.setTechnicien(technicien);
            
            TicketMaintenance updatedTicket = ticketMaintenanceRepository.save(ticket);
            logger.info("Ticket {} affecté à technicien {}", updatedTicket.getNumeroTicket(), technicien);
            return updatedTicket;
        }).orElse(null);
    }
    
    @Transactional
    public TicketMaintenance demarrerReparation(Long id) {
        return ticketMaintenanceRepository.findById(id).map(ticket -> {
            ticket.setStatut(TicketMaintenance.StatutTicket.EN_COURS);
            return ticketMaintenanceRepository.save(ticket);
        }).orElse(null);
    }
    
    @Transactional
    public TicketMaintenance terminerReparation(Long id, String actionsRealisees, String piecesUtilisees, Double coutReel) {
        return ticketMaintenanceRepository.findById(id).map(ticket -> {
            ticket.setStatut(TicketMaintenance.StatutTicket.REPARÉ);
            ticket.setActionsRealisees(actionsRealisees);
            ticket.setPiecesNecessaires(piecesUtilisees);
            ticket.setCoutReel(coutReel);
            
            TicketMaintenance updatedTicket = ticketMaintenanceRepository.save(ticket);
            logger.info("Réparation terminée pour ticket {}", updatedTicket.getNumeroTicket());
            
            // Débloquer le véhicule si c'était un ticket critique
            if (updatedTicket.getCriticite() == TicketMaintenance.CriticiteTicket.CRITIQUE) {
                debloquerVehiculeApresReparation(updatedTicket.getVehiculeId());
            }
            
            return updatedTicket;
        }).orElse(null);
    }
    
    @Transactional
    public TicketMaintenance cloturerTicket(Long id) {
        return ticketMaintenanceRepository.findById(id).map(ticket -> {
            ticket.setStatut(TicketMaintenance.StatutTicket.CLÔTURÉ);
            ticket.setDateCloture(LocalDateTime.now());
            
            TicketMaintenance updatedTicket = ticketMaintenanceRepository.save(ticket);
            logger.info("Ticket {} clôturé", updatedTicket.getNumeroTicket());
            return updatedTicket;
        }).orElse(null);
    }
    
    @Transactional
    public TicketMaintenance annulerTicket(Long id, String motif) {
        return ticketMaintenanceRepository.findById(id).map(ticket -> {
            ticket.setStatut(TicketMaintenance.StatutTicket.ANNULÉ);
            ticket.setDescription(motif);
            
            TicketMaintenance updatedTicket = ticketMaintenanceRepository.save(ticket);
            logger.info("Ticket {} annulé", updatedTicket.getNumeroTicket());
            
            // Débloquer le véhicule si c'était un ticket critique
            if (updatedTicket.getCriticite() == TicketMaintenance.CriticiteTicket.CRITIQUE) {
                debloquerVehiculeApresReparation(updatedTicket.getVehiculeId());
            }
            
            return updatedTicket;
        }).orElse(null);
    }
    
    @Transactional
    public void deleteTicket(Long id) {
        ticketMaintenanceRepository.deleteById(id);
        logger.info("Ticket de maintenance supprimé: {}", id);
    }
    
    public List<TicketMaintenance> getOpenTicketsByCriticite(TicketMaintenance.CriticiteTicket criticite) {
        return ticketMaintenanceRepository.findOpenTicketsByCriticite(criticite);
    }
    
    public List<TicketMaintenance> getTicketsByPeriod(LocalDateTime debut, LocalDateTime fin) {
        return ticketMaintenanceRepository.findTicketsByPeriod(debut, fin);
    }
    
    public long countTicketsByStatut(TicketMaintenance.StatutTicket statut) {
        return ticketMaintenanceRepository.countByStatut(statut);
    }
    
    public List<TicketMaintenance> getOpenTicketsOrderByPriority() {
        return ticketMaintenanceRepository.findOpenTicketsOrderByPriority();
    }
    
    public List<TicketMaintenance> getActiveTicketsByVehicule(Long vehiculeId) {
        return ticketMaintenanceRepository.findActiveTicketsByVehicule(vehiculeId);
    }
    
    public Double calculateAverageResolutionTime() {
        return ticketMaintenanceRepository.calculateAverageResolutionTime();
    }
    
    private void bloquerVehiculePourMaintenance(Long vehiculeId) {
        if (vehiculeId == null) return;
        
        Optional<Vehicule> vehicule = vehiculeRepository.findById(vehiculeId);
        if (vehicule.isPresent()) {
            vehicule.get().setStatut("IMMOBILISE");
            vehicule.get().setConforme(false);
            vehiculeRepository.save(vehicule.get());
            logger.info("Véhicule {} bloqué pour maintenance", vehicule.get().getImmatriculation());
        }
    }
    
    private void debloquerVehiculeApresReparation(Long vehiculeId) {
        if (vehiculeId == null) return;
        
        // Vérifier s'il y a d'autres tickets critiques ouverts pour ce véhicule
        List<TicketMaintenance> ticketsCritiques = getOpenTicketsByCriticite(TicketMaintenance.CriticiteTicket.CRITIQUE);
        boolean hasOtherCriticalTickets = ticketsCritiques.stream()
                .anyMatch(t -> t.getVehiculeId().equals(vehiculeId));
        
        if (!hasOtherCriticalTickets) {
            Optional<Vehicule> vehicule = vehiculeRepository.findById(vehiculeId);
            if (vehicule.isPresent()) {
                vehicule.get().setStatut("DISPONIBLE");
                vehicule.get().setConforme(true);
                vehiculeRepository.save(vehicule.get());
                logger.info("Véhicule {} débloqué après réparation", vehicule.get().getImmatriculation());
            }
        }
    }
}
