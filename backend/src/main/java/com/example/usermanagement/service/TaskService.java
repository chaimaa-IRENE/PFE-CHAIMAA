package com.example.usermanagement.service;

import com.example.usermanagement.model.Task;
import com.example.usermanagement.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public Optional<Task> getTaskByCode(String taskCode) {
        return taskRepository.findByTaskCode(taskCode);
    }

    public List<Task> getOpenTasks() {
        return taskRepository.findByClosedFalse();
    }

    public List<Task> getTasksByVehicle(String immatriculation) {
        return taskRepository.findByVehiculeImmatriculation(immatriculation);
    }

    public List<Task> getTasksByChauffeur(Long chauffeurId) {
        return taskRepository.findByChauffeurId(chauffeurId);
    }

    public List<Task> getTasksByAssignedTo(String assignedTo) {
        return taskRepository.findByAssignedToAndDoneFalse(assignedTo);
    }

    @Transactional
    public Task createTask(String description, Long anomalieId, Long vehicleId, String immatriculation,
                           Long chauffeurId, String chauffeurNom, String assignedTo, String priority, String category, String createdBy) {
        Task task = new Task();
        task.setTaskCode("TSK-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));
        task.setDescription(description);
        task.setAnomalieId(anomalieId);
        task.setVehicleId(vehicleId);
        task.setVehiculeImmatriculation(immatriculation);
        task.setChauffeurId(chauffeurId);
        task.setChauffeurNom(chauffeurNom);
        task.setAssignedTo(assignedTo);
        task.setPriority(priority);
        task.setCategory(category);
        task.setCreatedBy(createdBy);
        task.setCreatedAt(LocalDateTime.now());
        task.setDone(false);
        task.setClosed(false);
        return taskRepository.save(task);
    }

    @Transactional
    public Task markAsDone(Long id, String resolutionNotes) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        task.setDone(true);
        task.setResolutionNotes(resolutionNotes);
        task.setUpdatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    @Transactional
    public Task closeTask(Long id) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        task.setClosed(true);
        task.setUpdatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    @Transactional
    public Task createTaskFromAnomalie(Long anomalieId, Long vehicleId, String immatriculation,
                                       Long chauffeurId, String chauffeurNom, String description, String createdBy) {
        return createTask(description, anomalieId, vehicleId, immatriculation,
                chauffeurId, chauffeurNom, "MAINTENANCE", "URGENT", "REPARATION", createdBy);
    }
}