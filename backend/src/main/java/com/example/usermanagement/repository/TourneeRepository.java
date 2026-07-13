package com.example.usermanagement.repository;

import com.example.usermanagement.model.Tournee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TourneeRepository extends JpaRepository<Tournee, Long> {
    
    Optional<Tournee> findByNumeroTournee(String numeroTournee);
    
    Optional<Tournee> findByIdTournee(String idTournee);
    
    List<Tournee> findByChauffeurId(Long chauffeurId);
    
    List<Tournee> findByVehiculeId(Long vehiculeId);
    
    List<Tournee> findBySite(String site);
    
    List<Tournee> findByStatut(Tournee.StatutTournee statut);
    
    List<Tournee> findByDateTourneeBetween(LocalDateTime debut, LocalDateTime fin);
    
    @Query("SELECT t FROM Tournee t WHERE t.chauffeurId = :chauffeurId AND t.statut = :statut")
    List<Tournee> findByChauffeurIdAndStatut(@Param("chauffeurId") Long chauffeurId, @Param("statut") Tournee.StatutTournee statut);
    
    @Query("SELECT t FROM Tournee t WHERE t.vehiculeId = :vehiculeId AND t.statut = :statut")
    List<Tournee> findByVehiculeIdAndStatut(@Param("vehiculeId") Long vehiculeId, @Param("statut") Tournee.StatutTournee statut);
    
    @Query("SELECT COUNT(t) FROM Tournee t WHERE t.statut = :statut")
    long countByStatut(@Param("statut") Tournee.StatutTournee statut);
    
    @Query("SELECT t FROM Tournee t WHERE t.dateTournee >= :debut AND t.dateTournee <= :fin ORDER BY t.dateTournee DESC")
    List<Tournee> findTourneesByPeriod(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);
}
