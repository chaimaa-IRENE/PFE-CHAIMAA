package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournees")
public class Tournee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_tournee", unique = true)
    private String idTournee;

    @Column(name = "numero_tournee", unique = true)
    private String numeroTournee;

    private String site;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    @Column(name = "date_tournee")
    private LocalDateTime dateTournee;

    @Column(name = "chauffeur_id")
    private Long chauffeurId;

    @Column(name = "chauffeur_nom")
    private String chauffeurNom;

    @Column(name = "vehicule_id")
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation")
    private String vehiculeImmatriculation;

    @Enumerated(EnumType.STRING)
    private StatutTournee statut;

    @Column(name = "heure_debut")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime heureDebut;

    @Column(name = "heure_fin")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime heureFin;

    @Column(name = "nombre_arrets")
    private Integer nombreArrets;

    @Column(name = "distance_totale")
    private Integer distanceTotale;

    @Column(name = "itineraire")
    private String itineraire;

    @Column(name = "notes")
    private String notes;

    @Column(name = "date_creation")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateModification;

    public enum StatutTournee {
        PLANIFIEE,
        EN_COURS,
        TERMINEE,
        ANNULEE,
        RETARD
    }

    public Tournee() {
        this.dateCreation = LocalDateTime.now();
        this.statut = StatutTournee.PLANIFIEE;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIdTournee() { return idTournee; }
    public void setIdTournee(String idTournee) { this.idTournee = idTournee; }

    public String getNumeroTournee() { return numeroTournee; }
    public void setNumeroTournee(String numeroTournee) { this.numeroTournee = numeroTournee; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public LocalDateTime getDateTournee() { return dateTournee; }
    public void setDateTournee(LocalDateTime dateTournee) { this.dateTournee = dateTournee; }

    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }

    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }

    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }

    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }

    public StatutTournee getStatut() { return statut; }
    public void setStatut(StatutTournee statut) { this.statut = statut; }

    public LocalDateTime getHeureDebut() { return heureDebut; }
    public void setHeureDebut(LocalDateTime heureDebut) { this.heureDebut = heureDebut; }

    public LocalDateTime getHeureFin() { return heureFin; }
    public void setHeureFin(LocalDateTime heureFin) { this.heureFin = heureFin; }

    public Integer getNombreArrets() { return nombreArrets; }
    public void setNombreArrets(Integer nombreArrets) { this.nombreArrets = nombreArrets; }

    public Integer getDistanceTotale() { return distanceTotale; }
    public void setDistanceTotale(Integer distanceTotale) { this.distanceTotale = distanceTotale; }

    public String getItineraire() { return itineraire; }
    public void setItineraire(String itineraire) { this.itineraire = itineraire; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public LocalDateTime getDateModification() { return dateModification; }
    public void setDateModification(LocalDateTime dateModification) { this.dateModification = dateModification; }

    @PreUpdate
    public void updateDateModification() {
        this.dateModification = LocalDateTime.now();
    }
}
