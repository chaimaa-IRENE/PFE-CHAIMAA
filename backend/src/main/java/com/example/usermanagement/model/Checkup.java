package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "checkups")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Checkup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "checkup_code", unique = true)
    private String checkupCode;

    @Column(name = "vehicule_id")
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation")
    private String vehiculeImmatriculation;

    @Column(name = "vehicule_truck_number")
    private String vehiculeTruckNumber;

    @Column(name = "chauffeur_id")
    private Long chauffeurId;

    @Column(name = "chauffeur_nom")
    private String chauffeurNom;

    @Column(name = "kilometrage")
    private Integer kilometrage;

    @Column(name = "conforme")
    private Boolean conforme;

    @Column(name = "documents_disponibles")
    private String documentsDisponibles;

    @Column(name = "checkup_date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkupDate;

    @Column(name = "statut")
    private String statut;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "checkup_id")
    private List<CheckupDetail> details;

    public Checkup() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCheckupCode() { return checkupCode; }
    public void setCheckupCode(String checkupCode) { this.checkupCode = checkupCode; }
    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public String getVehiculeTruckNumber() { return vehiculeTruckNumber; }
    public void setVehiculeTruckNumber(String vehiculeTruckNumber) { this.vehiculeTruckNumber = vehiculeTruckNumber; }
    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }
    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }
    public Integer getKilometrage() { return kilometrage; }
    public void setKilometrage(Integer kilometrage) { this.kilometrage = kilometrage; }
    public Boolean getConforme() { return conforme; }
    public void setConforme(Boolean conforme) { this.conforme = conforme; }
    public String getDocumentsDisponibles() { return documentsDisponibles; }
    public void setDocumentsDisponibles(String documentsDisponibles) { this.documentsDisponibles = documentsDisponibles; }
    public LocalDateTime getCheckupDate() { return checkupDate; }
    public void setCheckupDate(LocalDateTime checkupDate) { this.checkupDate = checkupDate; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<CheckupDetail> getDetails() { return details; }
    public void setDetails(List<CheckupDetail> details) { this.details = details; }
}