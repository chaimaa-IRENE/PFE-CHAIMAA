package com.example.usermanagement.repository;

import com.example.usermanagement.model.DepartHistorique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepartHistoriqueRepository extends JpaRepository<DepartHistorique, Long> {

    List<DepartHistorique> findByVehiculeImmatriculationAndDeletedFalseOrderByTimestampDepartDesc(String immatriculation);

    List<DepartHistorique> findByChauffeurIdAndDeletedFalseOrderByTimestampDepartDesc(Long chauffeurId);

    List<DepartHistorique> findByTourneeIdAndDeletedFalseOrderByTimestampDepartDesc(String tourneeId);

    List<DepartHistorique> findByDateDepartAndDeletedFalseOrderByTimestampDepartDesc(LocalDate dateDepart);

    Optional<DepartHistorique> findFirstByVehiculeImmatriculationAndDeletedFalseOrderByTimestampDepartDesc(String immatriculation);

    @Query("SELECT COUNT(d) FROM DepartHistorique d WHERE d.vehiculeImmatriculation = :immatriculation AND d.dateDepart = :date AND d.deleted = false")
    Long countDepartsByVehicleAndDate(@Param("immatriculation") String immatriculation, @Param("date") LocalDate date);

    @Query("SELECT d FROM DepartHistorique d WHERE d.vehiculeImmatriculation = :immatriculation AND d.deleted = false ORDER BY d.timestampDepart DESC")
    List<DepartHistorique> findHistoriqueByVehicle(@Param("immatriculation") String immatriculation);

    @Query("SELECT d FROM DepartHistorique d WHERE d.chauffeurId = :chauffeurId AND d.deleted = false ORDER BY d.timestampDepart DESC")
    List<DepartHistorique> findHistoriqueByChauffeur(@Param("chauffeurId") Long chauffeurId);

    @Query("SELECT d FROM DepartHistorique d WHERE d.resultatControle = :resultat AND d.deleted = false ORDER BY d.timestampDepart DESC")
    List<DepartHistorique> findByResultatControle(@Param("resultat") String resultat);

    @Query("SELECT d FROM DepartHistorique d WHERE d.site = :site AND d.deleted = false ORDER BY d.timestampDepart DESC")
    List<DepartHistorique> findBySite(@Param("site") String site);
}
