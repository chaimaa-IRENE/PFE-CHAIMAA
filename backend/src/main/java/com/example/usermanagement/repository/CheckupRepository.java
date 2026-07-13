package com.example.usermanagement.repository;

import com.example.usermanagement.model.Checkup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CheckupRepository extends JpaRepository<Checkup, Long> {
    Optional<Checkup> findByCheckupCode(String checkupCode);
    List<Checkup> findByVehiculeId(Long vehiculeId);
    List<Checkup> findByVehiculeImmatriculation(String immatriculation);
    List<Checkup> findByChauffeurId(Long chauffeurId);
    List<Checkup> findByConforme(Boolean conforme);
    List<Checkup> findByStatut(String statut);
    List<Checkup> findByCheckupDateBetween(LocalDateTime start, LocalDateTime end);
    long countByConforme(Boolean conforme);
    long countByStatut(String statut);
    long countByVehiculeId(Long vehiculeId);
    boolean existsByCheckupCode(String checkupCode);
}