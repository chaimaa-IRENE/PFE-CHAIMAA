package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "depart_historique")
public class DepartHistorique {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_depart", nullable = false)
    private String numeroDepart;

    @Column(name = "tournee_id", nullable = false)
    private String tourneeId;

    @Column(name = "chauffeur_id", nullable = false)
    private Long chauffeurId;

    @Column(name = "chauffeur_nom", nullable = false)
    private String chauffeurNom;

    @Column(name = "chauffeur_matricule")
    private String chauffeurMatricule;

    @Column(name = "vehicule_id", nullable = false)
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation", nullable = false)
    private String vehiculeImmatriculation;

    @Column(name = "date_depart", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "UTC")
    private LocalDate dateDepart;

    @Column(name = "heure_depart", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss", timezone = "UTC")
    private String heureDepart;

    @Column(name = "timestamp_depart", nullable = false)
    private LocalDateTime timestampDepart;

    @Column(name = "resultat_controle", nullable = false)
    private String resultatControle; // CONFORME ou NON_CONFORME

    @Column(name = "checklist_id")
    private Long checklistId;

    @Column(name = "statut_vehicule", nullable = false)
    private String statutVehicule; // DISPONIBLE, BLOQUE, EN_MAINTENANCE

    @Column(name = "site")
    private String site;

    @Column(name = "branch_code")
    private String branchCode;

    @Column(name = "gps_latitude")
    private Double gpsLatitude;

    @Column(name = "gps_longitude")
    private Double gpsLongitude;

    @Column(name = "gps_city")
    private String gpsCity;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "date_suppression")
    private LocalDateTime dateSuppression;

    @Column(name = "supprime_par")
    private String supprimePar;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public DepartHistorique() {
        this.dateCreation = LocalDateTime.now();
        this.deleted = false;
    }

    public DepartHistorique(String numeroDepart, String tourneeId, Long chauffeurId, String chauffeurNom,
                           Long vehiculeId, String vehiculeImmatriculation, String resultatControle) {
        this();
        this.numeroDepart = numeroDepart;
        this.tourneeId = tourneeId;
        this.chauffeurId = chauffeurId;
        this.chauffeurNom = chauffeurNom;
        this.vehiculeId = vehiculeId;
        this.vehiculeImmatriculation = vehiculeImmatriculation;
        this.resultatControle = resultatControle;
        this.dateDepart = LocalDate.now();
        this.heureDepart = java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"));
        this.timestampDepart = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroDepart() { return numeroDepart; }
    public void setNumeroDepart(String numeroDepart) { this.numeroDepart = numeroDepart; }

    public String getTourneeId() { return tourneeId; }
    public void setTourneeId(String tourneeId) { this.tourneeId = tourneeId; }

    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }

    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }

    public String getChauffeurMatricule() { return chauffeurMatricule; }
    public void setChauffeurMatricule(String chauffeurMatricule) { this.chauffeurMatricule = chauffeurMatricule; }

    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }

    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }

    public LocalDate getDateDepart() { return dateDepart; }
    public void setDateDepart(LocalDate dateDepart) { this.dateDepart = dateDepart; }

    public String getHeureDepart() { return heureDepart; }
    public void setHeureDepart(String heureDepart) { this.heureDepart = heureDepart; }

    public LocalDateTime getTimestampDepart() { return timestampDepart; }
    public void setTimestampDepart(LocalDateTime timestampDepart) { this.timestampDepart = timestampDepart; }

    public String getResultatControle() { return resultatControle; }
    public void setResultatControle(String resultatControle) { this.resultatControle = resultatControle; }

    public Long getChecklistId() { return checklistId; }
    public void setChecklistId(Long checklistId) { this.checklistId = checklistId; }

    public String getStatutVehicule() { return statutVehicule; }
    public void setStatutVehicule(String statutVehicule) { this.statutVehicule = statutVehicule; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public Double getGpsLatitude() { return gpsLatitude; }
    public void setGpsLatitude(Double gpsLatitude) { this.gpsLatitude = gpsLatitude; }

    public Double getGpsLongitude() { return gpsLongitude; }
    public void setGpsLongitude(Double gpsLongitude) { this.gpsLongitude = gpsLongitude; }

    public String getGpsCity() { return gpsCity; }
    public void setGpsCity(String gpsCity) { this.gpsCity = gpsCity; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public LocalDateTime getDateSuppression() { return dateSuppression; }
    public void setDateSuppression(LocalDateTime dateSuppression) { this.dateSuppression = dateSuppression; }

    public String getSupprimePar() { return supprimePar; }
    public void setSupprimePar(String supprimePar) { this.supprimePar = supprimePar; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public void softDelete(String supprimePar) {
        this.deleted = true;
        this.dateSuppression = LocalDateTime.now();
        this.supprimePar = supprimePar;
    }
}
