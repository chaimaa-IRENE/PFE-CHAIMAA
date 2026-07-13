package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_code", unique = true)
    private String taskCode;

    @Column(name = "description")
    private String description;

    @Column(name = "task_date")
    private LocalDateTime taskDate;

    @Column(name = "done")
    private Boolean done = false;

    @Column(name = "closed")
    private Boolean closed = false;

    @Column(name = "anomalie_id")
    private Long anomalieId;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "vehicule_immatriculation")
    private String vehiculeImmatriculation;

    @Column(name = "chauffeur_id")
    private Long chauffeurId;

    @Column(name = "chauffeur_nom")
    private String chauffeurNom;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "priority")
    private String priority;

    @Column(name = "category")
    private String category;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolution_notes")
    private String resolutionNotes;

    @Column(name = "created_by")
    private String createdBy;

    public Task() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getTaskDate() { return taskDate; }
    public void setTaskDate(LocalDateTime taskDate) { this.taskDate = taskDate; }

    public Boolean getDone() { return done; }
    public void setDone(Boolean done) { this.done = done; }

    public Boolean getClosed() { return closed; }
    public void setClosed(Boolean closed) { this.closed = closed; }

    public Long getAnomalieId() { return anomalieId; }
    public void setAnomalieId(Long anomalieId) { this.anomalieId = anomalieId; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }

    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }

    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}