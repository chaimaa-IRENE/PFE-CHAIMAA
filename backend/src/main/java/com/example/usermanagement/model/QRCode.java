package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "qr_codes")
public class QRCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicule_id", nullable = false)
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation", nullable = false)
    private String vehiculeImmatriculation;

    @Column(unique = true, nullable = false, length = 64)
    private String code;

    @Column(name = "date_generation")
    private LocalDateTime dateGeneration;

    @Column(nullable = false)
    private Boolean actif = true;

    public QRCode() {}

    public QRCode(Long vehiculeId, String vehiculeImmatriculation, String code) {
        this.vehiculeId = vehiculeId;
        this.vehiculeImmatriculation = vehiculeImmatriculation;
        this.code = code;
        this.dateGeneration = LocalDateTime.now();
        this.actif = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public LocalDateTime getDateGeneration() { return dateGeneration; }
    public void setDateGeneration(LocalDateTime dateGeneration) { this.dateGeneration = dateGeneration; }
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
}
