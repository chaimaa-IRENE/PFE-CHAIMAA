package com.example.usermanagement.repository;

import com.example.usermanagement.model.VehicleBlocking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleBlockingRepository extends JpaRepository<VehicleBlocking, Long> {
    Optional<VehicleBlocking> findByVehiculeImmatriculation(String immatriculation);
    Optional<VehicleBlocking> findByVehiculeId(Long vehiculeId);
    List<VehicleBlocking> findByVehiculeIdOrderByDateBlocageDesc(Long vehiculeId);
    List<VehicleBlocking> findByBloqueTrue();
    List<VehicleBlocking> findByBloqueFalse();
    List<VehicleBlocking> findByVehiculeImmatriculationOrderByDateBlocageDesc(String immatriculation);
    List<VehicleBlocking> findAllByOrderByDateBlocageDesc();
}
