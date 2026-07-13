package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_blocking")
public class VehicleBlocking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicule_id", nullable = false)
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation", nullable = false)
    private String vehiculeImmatriculation;

    @Column(nullable = false)
    private Boolean bloque = false;

    @Column(columnDefinition = "TEXT")
    private String raison;

    @Column(name = "date_blocage")
    private LocalDateTime dateBlocage;

    @Column(name = "date_deblocage")
    private LocalDateTime dateDeblocage;

    @Column(name = "bloque_par")
    private String bloquePar;

    @Column(name = "debloque_par")
    private String debloquePar;

    @Column(name = "alerte_id")
    private Long alerteId;

    public VehicleBlocking() {}

    public VehicleBlocking(Long vehiculeId, String vehiculeImmatriculation, String raison) {
        this.vehiculeId = vehiculeId;
        this.vehiculeImmatriculation = vehiculeImmatriculation;
        this.raison = raison;
        this.bloque = true;
        this.dateBlocage = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public Boolean getBloque() { return bloque; }
    public void setBloque(Boolean bloque) { this.bloque = bloque; }
    public String getRaison() { return raison; }
    public void setRaison(String raison) { this.raison = raison; }
    public LocalDateTime getDateBlocage() { return dateBlocage; }
    public void setDateBlocage(LocalDateTime dateBlocage) { this.dateBlocage = dateBlocage; }
    public LocalDateTime getDateDeblocage() { return dateDeblocage; }
    public void setDateDeblocage(LocalDateTime dateDeblocage) { this.dateDeblocage = dateDeblocage; }
    public String getBloquePar() { return bloquePar; }
    public void setBloquePar(String bloquePar) { this.bloquePar = bloquePar; }
    public String getDebloquePar() { return debloquePar; }
    public void setDebloquePar(String debloquePar) { this.debloquePar = debloquePar; }
    public Long getAlerteId() { return alerteId; }
    public void setAlerteId(Long alerteId) { this.alerteId = alerteId; }
}
