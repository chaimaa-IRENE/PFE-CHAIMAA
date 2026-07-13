package com.example.usermanagement.repository;

import com.example.usermanagement.model.TicketMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketMaintenanceRepository extends JpaRepository<TicketMaintenance, Long> {
    
    Optional<TicketMaintenance> findByNumeroTicket(String numeroTicket);
    
    List<TicketMaintenance> findByVehiculeId(Long vehiculeId);
    
    List<TicketMaintenance> findByVehiculeImmatriculation(String vehiculeImmatriculation);
    
    List<TicketMaintenance> findByTourneeId(String tourneeId);
    
    List<TicketMaintenance> findByStatut(TicketMaintenance.StatutTicket statut);
    
    List<TicketMaintenance> findByCriticite(TicketMaintenance.CriticiteTicket criticite);
    
    List<TicketMaintenance> findByTechnicien(String technicien);
    
    @Query("SELECT t FROM TicketMaintenance t WHERE t.vehiculeId = :vehiculeId AND t.statut = :statut")
    List<TicketMaintenance> findByVehiculeIdAndStatut(@Param("vehiculeId") Long vehiculeId, @Param("statut") TicketMaintenance.StatutTicket statut);
    
    @Query("SELECT t FROM TicketMaintenance t WHERE t.criticite = :criticite AND t.statut != 'CLÔTURÉ' AND t.statut != 'ANNULÉ'")
    List<TicketMaintenance> findOpenTicketsByCriticite(@Param("criticite") TicketMaintenance.CriticiteTicket criticite);
    
    @Query("SELECT t FROM TicketMaintenance t WHERE t.dateOuverture BETWEEN :debut AND :fin")
    List<TicketMaintenance> findTicketsByPeriod(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);
    
    @Query("SELECT COUNT(t) FROM TicketMaintenance t WHERE t.statut = :statut")
    long countByStatut(@Param("statut") TicketMaintenance.StatutTicket statut);
    
    @Query("SELECT t FROM TicketMaintenance t WHERE t.statut = 'OUVERT' ORDER BY t.priorite DESC, t.dateOuverture ASC")
    List<TicketMaintenance> findOpenTicketsOrderByPriority();
    
    @Query("SELECT t FROM TicketMaintenance t WHERE t.vehiculeId = :vehiculeId AND t.statut != 'CLÔTURÉ' AND t.statut != 'ANNULÉ'")
    List<TicketMaintenance> findActiveTicketsByVehicule(@Param("vehiculeId") Long vehiculeId);
    
    @Query("SELECT AVG(FUNCTION('DATEDIFF', DAY, t.dateOuverture, COALESCE(t.dateCloture, CURRENT_TIMESTAMP))) FROM TicketMaintenance t WHERE t.statut = 'CLÔTURÉ'")
    Double calculateAverageResolutionTime();
}
