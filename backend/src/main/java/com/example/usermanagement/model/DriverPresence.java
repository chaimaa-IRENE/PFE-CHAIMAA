package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_presence")
public class DriverPresence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long chauffeurId;

    @Column(length = 50)
    private String matricule;

    @Column(length = 255)
    private String chauffeurNom;

    @Column(nullable = false)
    private LocalDateTime checkInTime;

    private LocalDateTime checkOutTime;

    @Column(length = 20)
    private String statut = "PRESENT";

    @Column(length = 100)
    private String source;

    public DriverPresence() {}

    public DriverPresence(Long chauffeurId, String matricule, String chauffeurNom, String source) {
        this.chauffeurId = chauffeurId;
        this.matricule = matricule;
        this.chauffeurNom = chauffeurNom;
        this.source = source;
        this.checkInTime = LocalDateTime.now();
        this.statut = "PRESENT";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
