package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets_maintenance")
public class TicketMaintenance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_ticket", unique = true)
    private String numeroTicket;

    @Column(name = "vehicule_id")
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation")
    private String vehiculeImmatriculation;

    @Column(name = "tournee_id")
    private String tourneeId;

    private String element;

    @Enumerated(EnumType.STRING)
    private CriticiteTicket criticite;

    @Enumerated(EnumType.STRING)
    private StatutTicket statut;

    @Column(name = "date_ouverture")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateOuverture;

    @Column(name = "affectation")
    private String affectation;

    @Column(name = "date_cloture")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateCloture;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "actions_realisees", columnDefinition = "TEXT")
    private String actionsRealisees;

    @Column(name = "pieces_necessaires", columnDefinition = "TEXT")
    private String piecesNecessaires;

    @Column(name = "cout_estime")
    private Double coutEstime;

    @Column(name = "cout_reel")
    private Double coutReel;

    @Column(name = "technicien")
    private String technicien;

    @Column(name = "priorite")
    private Integer priorite;

    @Column(name = "date_creation")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateModification;

    @Column(name = "cree_par")
    private String creePar;

    @Column(name = "modifie_par")
    private String modifiePar;

    public enum CriticiteTicket {
        CRITIQUE,
        MOYENNE,
        MINEURE
    }

    public enum StatutTicket {
        OUVERT,
        AFFECTE,
        EN_COURS,
        REPARÉ,
        CLÔTURÉ,
        ANNULÉ
    }

    public TicketMaintenance() {
        this.dateCreation = LocalDateTime.now();
        this.statut = StatutTicket.OUVERT;
        this.priorite = 2;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroTicket() { return numeroTicket; }
    public void setNumeroTicket(String numeroTicket) { this.numeroTicket = numeroTicket; }

    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }

    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }

    public String getTourneeId() { return tourneeId; }
    public void setTourneeId(String tourneeId) { this.tourneeId = tourneeId; }

    public String getElement() { return element; }
    public void setElement(String element) { this.element = element; }

    public CriticiteTicket getCriticite() { return criticite; }
    public void setCriticite(CriticiteTicket criticite) { this.criticite = criticite; }

    public StatutTicket getStatut() { return statut; }
    public void setStatut(StatutTicket statut) { this.statut = statut; }

    public LocalDateTime getDateOuverture() { return dateOuverture; }
    public void setDateOuverture(LocalDateTime dateOuverture) { this.dateOuverture = dateOuverture; }

    public String getAffectation() { return affectation; }
    public void setAffectation(String affectation) { this.affectation = affectation; }

    public LocalDateTime getDateCloture() { return dateCloture; }
    public void setDateCloture(LocalDateTime dateCloture) { this.dateCloture = dateCloture; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getActionsRealisees() { return actionsRealisees; }
    public void setActionsRealisees(String actionsRealisees) { this.actionsRealisees = actionsRealisees; }

    public String getPiecesNecessaires() { return piecesNecessaires; }
    public void setPiecesNecessaires(String piecesNecessaires) { this.piecesNecessaires = piecesNecessaires; }

    public Double getCoutEstime() { return coutEstime; }
    public void setCoutEstime(Double coutEstime) { this.coutEstime = coutEstime; }

    public Double getCoutReel() { return coutReel; }
    public void setCoutReel(Double coutReel) { this.coutReel = coutReel; }

    public String getTechnicien() { return technicien; }
    public void setTechnicien(String technicien) { this.technicien = technicien; }

    public Integer getPriorite() { return priorite; }
    public void setPriorite(Integer priorite) { this.priorite = priorite; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public LocalDateTime getDateModification() { return dateModification; }
    public void setDateModification(LocalDateTime dateModification) { this.dateModification = dateModification; }

    public String getCreePar() { return creePar; }
    public void setCreePar(String creePar) { this.creePar = creePar; }

    public String getModifiePar() { return modifiePar; }
    public void setModifiePar(String modifiePar) { this.modifiePar = modifiePar; }

    @PreUpdate
    public void updateDateModification() {
        this.dateModification = LocalDateTime.now();
    }
}
