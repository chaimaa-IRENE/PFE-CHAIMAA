package com.example.usermanagement.repository;

import com.example.usermanagement.model.FleetAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FleetAlertRepository extends JpaRepository<FleetAlert, Long> {
    List<FleetAlert> findByVehiculeImmatriculationOrderByDateCreationDesc(String immatriculation);
    List<FleetAlert> findByResoluFalseOrderByDateCreationDesc();
    List<FleetAlert> findByCriticiteOrderByDateCreationDesc(String criticite);
    List<FleetAlert> findByTypeAlerte(String typeAlerte);
    List<FleetAlert> findAllByOrderByDateCreationDesc();
    long countByResoluFalse();
    long countByCriticiteAndResoluFalse(String criticite);
}
