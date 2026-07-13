package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "anomalies_checkup")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class AnomalieCheckup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anomalie_code", unique = true)
    private String anomalieCode;

    @Column(name = "checkup_id")
    private Long checkupId;

    @Column(name = "checkup_code")
    private String checkupCode;

    @Column(name = "element")
    private String element;

    @Column(name = "categorie")
    private String categorie;

    @Column(name = "criticite")
    private String criticite;

    @Column(name = "description")
    private String description;

    @Column(name = "observation")
    private String observation;

    @Column(name = "vehicule_id")
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation")
    private String vehiculeImmatriculation;

    @Column(name = "chauffeur_id")
    private Long chauffeurId;

    @Column(name = "chauffeur_nom")
    private String chauffeurNom;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "source")
    private String source;

    @Column(name = "statut")
    @Enumerated(EnumType.STRING)
    private AnomalieStatut statut;

    @Column(name = "task_id")
    private Long taskId;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "resolution_notes")
    private String resolutionNotes;

    @Column(name = "date_detection")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateDetection;

    @Column(name = "date_prise_en_charge")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime datePriseEnCharge;

    @Column(name = "date_reparation")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateReparation;

    @Column(name = "date_validation")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateValidation;

    @Column(name = "repare_par")
    private String reparePar;

    @Column(name = "valide_par")
    private String validePar;

    @Column(name = "created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    public enum AnomalieStatut {
        DETECTEE, EN_REPARATION, REPAREE, NON_REPAREE, VALIDEE, ANNULEE
    }

    public AnomalieCheckup() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAnomalieCode() { return anomalieCode; }
    public void setAnomalieCode(String anomalieCode) { this.anomalieCode = anomalieCode; }
    public Long getCheckupId() { return checkupId; }
    public void setCheckupId(Long checkupId) { this.checkupId = checkupId; }
    public String getCheckupCode() { return checkupCode; }
    public void setCheckupCode(String checkupCode) { this.checkupCode = checkupCode; }
    public String getElement() { return element; }
    public void setElement(String element) { this.element = element; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public String getCriticite() { return criticite; }
    public void setCriticite(String criticite) { this.criticite = criticite; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }
    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public AnomalieStatut getStatut() { return statut; }
    public void setStatut(AnomalieStatut statut) { this.statut = statut; }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
    public LocalDateTime getDateDetection() { return dateDetection; }
    public void setDateDetection(LocalDateTime dateDetection) { this.dateDetection = dateDetection; }
    public LocalDateTime getDatePriseEnCharge() { return datePriseEnCharge; }
    public void setDatePriseEnCharge(LocalDateTime datePriseEnCharge) { this.datePriseEnCharge = datePriseEnCharge; }
    public LocalDateTime getDateReparation() { return dateReparation; }
    public void setDateReparation(LocalDateTime dateReparation) { this.dateReparation = dateReparation; }
    public LocalDateTime getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDateTime dateValidation) { this.dateValidation = dateValidation; }
    public String getReparePar() { return reparePar; }
    public void setReparePar(String reparePar) { this.reparePar = reparePar; }
    public String getValidePar() { return validePar; }
    public void setValidePar(String validePar) { this.validePar = validePar; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}