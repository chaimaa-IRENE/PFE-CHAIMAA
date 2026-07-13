package com.example.usermanagement.repository;

import com.example.usermanagement.model.Vehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    
    List<Vehicule> findByBranchCode(String branchCode);
    Optional<Vehicule> findByImmatriculation(String immatriculation);
    boolean existsByImmatriculation(String immatriculation);
    List<Vehicule> findByType(String type);
    Optional<Vehicule> findByTruckNumber(String truckNumber);
    boolean existsByTruckNumber(String truckNumber);
    Optional<Vehicule> findByVehicleId(String vehicleId);
    boolean existsByVehicleId(String vehicleId);
    List<Vehicule> findByChauffeurId(Long chauffeurId);
    List<Vehicule> findByStatut(String statut);
    List<Vehicule> findByConforme(Boolean conforme);

    @Query("SELECT v FROM Vehicule v WHERE v.immatriculation IS NULL OR v.immatriculation = ''")
    List<Vehicule> findByImmatriculationIsNullOrImmatriculationEmpty();

    @Query("SELECT v FROM Vehicule v WHERE v.chauffeurId IS NULL AND v.statut <> 'BLOQUE'")
    List<Vehicule> findAvailableVehicles();

    @Query("SELECT v FROM Vehicule v WHERE v.chauffeurId IS NOT NULL")
    List<Vehicule> findAssignedVehicles();

    @Query("SELECT COUNT(v) FROM Vehicule v WHERE v.conforme = true")
    long countConforme();

    @Query("SELECT COUNT(v) FROM Vehicule v WHERE v.conforme = false")
    long countNonConforme();

    @Query("SELECT COUNT(v) FROM Vehicule v WHERE v.statut = 'BLOQUE'")
    long countBloque();

    @Query("SELECT v FROM Vehicule v WHERE v.archived = false OR v.archived IS NULL")
    List<Vehicule> findAllActive();

    @Query("SELECT v FROM Vehicule v WHERE v.archived = true")
    List<Vehicule> findAllArchived();

    @Query("SELECT COUNT(v) FROM Vehicule v WHERE v.archived = false OR v.archived IS NULL")
    long countActive();

    @Query("SELECT COUNT(v) FROM Vehicule v WHERE v.archived = true")
    long countArchived();
}
