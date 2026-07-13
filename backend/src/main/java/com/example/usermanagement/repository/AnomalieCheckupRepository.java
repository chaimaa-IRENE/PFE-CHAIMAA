package com.example.usermanagement.repository;

import com.example.usermanagement.model.AnomalieCheckup;
import com.example.usermanagement.model.AnomalieCheckup.AnomalieStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnomalieCheckupRepository extends JpaRepository<AnomalieCheckup, Long> {
    Optional<AnomalieCheckup> findByAnomalieCode(String anomalieCode);
    List<AnomalieCheckup> findByVehiculeId(Long vehiculeId);
    List<AnomalieCheckup> findByVehiculeImmatriculation(String immatriculation);
    List<AnomalieCheckup> findByChauffeurId(Long chauffeurId);
    List<AnomalieCheckup> findByChauffeurNomContaining(String chauffeurNom);
    List<AnomalieCheckup> findByStatut(AnomalieStatut statut);
    List<AnomalieCheckup> findByCategorie(String categorie);
    List<AnomalieCheckup> findByCriticite(String criticite);
    List<AnomalieCheckup> findByCheckupId(Long checkupId);
    List<AnomalieCheckup> findByAssignedTo(String assignedTo);
    List<AnomalieCheckup> findBySource(String source);
    List<AnomalieCheckup> findByDateDetectionBetween(LocalDateTime start, LocalDateTime end);
    long countByStatut(AnomalieStatut statut);
    long countByVehiculeId(Long vehiculeId);
    long countByCriticite(String criticite);
    @org.springframework.data.jpa.repository.Query("SELECT a FROM AnomalieCheckup a WHERE a.dateDetection BETWEEN :start AND :end AND (:chauffeurId IS NULL OR a.chauffeurId = :chauffeurId) AND (:statut IS NULL OR a.statut = :statut) AND (:categorie IS NULL OR a.categorie = :categorie)")
    List<AnomalieCheckup> findByFilters(@org.springframework.data.repository.query.Param("start") LocalDateTime start, @org.springframework.data.repository.query.Param("end") LocalDateTime end, @org.springframework.data.repository.query.Param("chauffeurId") Long chauffeurId, @org.springframework.data.repository.query.Param("statut") AnomalieStatut statut, @org.springframework.data.repository.query.Param("categorie") String categorie);
}