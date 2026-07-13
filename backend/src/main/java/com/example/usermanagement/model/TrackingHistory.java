package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tracking_history")
public class TrackingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "immatriculation")
    private String immatriculation;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "vitesse")
    private Double vitesse;

    @Column(name = "niveau_carburant")
    private Double niveauCarburant;

    @Column(name = "kilometrage")
    private Integer kilometrage;

    @Column(name = "moteur_allume")
    private Boolean moteurAllume;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    public TrackingHistory() {}

    public TrackingHistory(String immatriculation, Double latitude, Double longitude, Double vitesse,
                           Double niveauCarburant, Integer kilometrage, Boolean moteurAllume) {
        this.immatriculation = immatriculation;
        this.latitude = latitude;
        this.longitude = longitude;
        this.vitesse = vitesse;
        this.niveauCarburant = niveauCarburant;
        this.kilometrage = kilometrage;
        this.moteurAllume = moteurAllume;
        this.timestamp = LocalDateTime.now();
    }

    public TrackingHistory(String immatriculation, Double latitude, Double longitude, Double vitesse,
                           Double niveauCarburant, Integer kilometrage, Boolean moteurAllume,
                           LocalDateTime timestamp) {
        this.immatriculation = immatriculation;
        this.latitude = latitude;
        this.longitude = longitude;
        this.vitesse = vitesse;
        this.niveauCarburant = niveauCarburant;
        this.kilometrage = kilometrage;
        this.moteurAllume = moteurAllume;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Double getVitesse() { return vitesse; }
    public void setVitesse(Double vitesse) { this.vitesse = vitesse; }
    public Double getNiveauCarburant() { return niveauCarburant; }
    public void setNiveauCarburant(Double niveauCarburant) { this.niveauCarburant = niveauCarburant; }
    public Integer getKilometrage() { return kilometrage; }
    public void setKilometrage(Integer kilometrage) { this.kilometrage = kilometrage; }
    public Boolean getMoteurAllume() { return moteurAllume; }
    public void setMoteurAllume(Boolean moteurAllume) { this.moteurAllume = moteurAllume; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
