package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "geotab_config")
public class GeotabConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "[database]", nullable = false)
    private String database;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "serveur")
    private String serveur;

    @Column(name = "sync_interval_ms")
    private Long syncIntervalMs = 300000L;

    @Column(name = "actif")
    private Boolean actif = false;

    @Column(name = "dernier_sync")
    private LocalDateTime dernierSync;

    @Column(name = "dernier_statut")
    private String dernierStatut;

    @Column(name = "derniere_erreur", columnDefinition = "TEXT")
    private String derniereErreur;

    public GeotabConfig() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDatabase() { return database; }
    public void setDatabase(String database) { this.database = database; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getServeur() { return serveur; }
    public void setServeur(String serveur) { this.serveur = serveur; }
    public Long getSyncIntervalMs() { return syncIntervalMs; }
    public void setSyncIntervalMs(Long syncIntervalMs) { this.syncIntervalMs = syncIntervalMs; }
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    public LocalDateTime getDernierSync() { return dernierSync; }
    public void setDernierSync(LocalDateTime dernierSync) { this.dernierSync = dernierSync; }
    public String getDernierStatut() { return dernierStatut; }
    public void setDernierStatut(String dernierStatut) { this.dernierStatut = dernierStatut; }
    public String getDerniereErreur() { return derniereErreur; }
    public void setDerniereErreur(String derniereErreur) { this.derniereErreur = derniereErreur; }
}
