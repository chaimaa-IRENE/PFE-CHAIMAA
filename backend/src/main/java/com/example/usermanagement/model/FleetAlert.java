package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fleet_alerts")
public class FleetAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicule_id")
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation")
    private String vehiculeImmatriculation;

    @Column(name = "chauffeur_nom")
    private String chauffeurNom;

    @Column(name = "checklist_id")
    private Long checklistId;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "type_alerte", nullable = false)
    private String typeAlerte;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String criticite;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_resolution")
    private LocalDateTime dateResolution;

    @Column(nullable = false)
    private Boolean resolu = false;

    @Column(name = "resolu_par")
    private String resoluPar;

    @Column(name = "action_requise")
    private String actionRequise;

    public FleetAlert() {}

    public FleetAlert(String typeAlerte, String description, String criticite) {
        this.typeAlerte = typeAlerte;
        this.description = description;
        this.criticite = criticite;
        this.dateCreation = LocalDateTime.now();
        this.resolu = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }
    public Long getChecklistId() { return checklistId; }
    public void setChecklistId(Long checklistId) { this.checklistId = checklistId; }
    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }
    public String getTypeAlerte() { return typeAlerte; }
    public void setTypeAlerte(String typeAlerte) { this.typeAlerte = typeAlerte; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCriticite() { return criticite; }
    public void setCriticite(String criticite) { this.criticite = criticite; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    public LocalDateTime getDateResolution() { return dateResolution; }
    public void setDateResolution(LocalDateTime dateResolution) { this.dateResolution = dateResolution; }
    public Boolean getResolu() { return resolu; }
    public void setResolu(Boolean resolu) { this.resolu = resolu; }
    public String getResoluPar() { return resoluPar; }
    public void setResoluPar(String resoluPar) { this.resoluPar = resoluPar; }
    public String getActionRequise() { return actionRequise; }
    public void setActionRequise(String actionRequise) { this.actionRequise = actionRequise; }
}
