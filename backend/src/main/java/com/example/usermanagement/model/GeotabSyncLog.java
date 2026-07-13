package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "geotab_sync_logs")
public class GeotabSyncLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(nullable = false)
    private String statut;

    @Column(name = "nb_vehicules")
    private Integer nbVehicules;

    @Column(name = "nb_positions")
    private Integer nbPositions;

    @Column(name = "nb_anomalies")
    private Integer nbAnomalies;

    @Column(name = "message_erreur", columnDefinition = "TEXT")
    private String messageErreur;

    public GeotabSyncLog() {
        this.dateDebut = LocalDateTime.now();
        this.statut = "RUNNING";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDateTime dateDebut) { this.dateDebut = dateDebut; }
    public LocalDateTime getDateFin() { return dateFin; }
    public void setDateFin(LocalDateTime dateFin) { this.dateFin = dateFin; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public Integer getNbVehicules() { return nbVehicules; }
    public void setNbVehicules(Integer nbVehicules) { this.nbVehicules = nbVehicules; }
    public Integer getNbPositions() { return nbPositions; }
    public void setNbPositions(Integer nbPositions) { this.nbPositions = nbPositions; }
    public Integer getNbAnomalies() { return nbAnomalies; }
    public void setNbAnomalies(Integer nbAnomalies) { this.nbAnomalies = nbAnomalies; }
    public String getMessageErreur() { return messageErreur; }
    public void setMessageErreur(String messageErreur) { this.messageErreur = messageErreur; }
}
