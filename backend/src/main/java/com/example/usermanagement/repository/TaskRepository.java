package com.example.usermanagement.repository;

import com.example.usermanagement.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByTaskCode(String taskCode);
    List<Task> findByAnomalieId(Long anomalieId);
    List<Task> findByVehicleId(Long vehicleId);
    List<Task> findByVehiculeImmatriculation(String vehiculeImmatriculation);
    List<Task> findByChauffeurId(Long chauffeurId);
    List<Task> findByDoneFalse();
    List<Task> findByClosedFalse();
    List<Task> findByDoneTrueAndClosedTrue();
    List<Task> findByAssignedToAndDoneFalse(String assignedTo);
    List<Task> findByPriorityAndDoneFalse(String priority);
}