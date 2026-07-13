package com.example.usermanagement.repository;

import com.example.usermanagement.model.DriverChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DriverChecklistRepository extends JpaRepository<DriverChecklist, Long> {
    List<DriverChecklist> findByVehiculeImmatriculationOrderByDateChecklistDesc(String immatriculation);
    List<DriverChecklist> findByChauffeurIdOrderByDateChecklistDesc(Long chauffeurId);
    List<DriverChecklist> findByDateChecklistBetween(LocalDateTime start, LocalDateTime end);
    List<DriverChecklist> findByStatut(String statut);
    List<DriverChecklist> findAllByOrderByDateChecklistDesc();
    List<DriverChecklist> findByVehiculeIdOrderByDateChecklistDesc(Long vehiculeId);
    List<DriverChecklist> findByEstConformeFalseOrderByDateChecklistDesc();
    List<DriverChecklist> findByVehiculeImmatriculationAndStatutInOrderByDateChecklistDesc(String immatriculation, List<String> statuts);
}
