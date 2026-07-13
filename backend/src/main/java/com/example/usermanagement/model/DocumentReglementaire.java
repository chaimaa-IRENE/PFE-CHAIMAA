package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents_reglementaires")
public class DocumentReglementaire {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicule_id", nullable = false)
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation", nullable = false)
    private String vehiculeImmatriculation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeDocument typeDocument;

    @Column(name = "numero_document")
    private String numeroDocument;

    @Column(name = "date_emission")
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "UTC")
    private LocalDate dateEmission;

    @Column(name = "date_expiration", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "UTC")
    private LocalDate dateExpiration;

    @Lob
    @Column(name = "fichier_pdf")
    private byte[] fichierPdf;

    @Column(name = "fichier_url")
    private String fichierUrl;

    @Enumerated(EnumType.STRING)
    private StatutDocument statutDocument;

    @Column(name = "date_creation")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateModification;

    @Column(name = "alerte_envoyee")
    private Boolean alerteEnvoyee = false;

    @Column(name = "jours_restants")
    private Integer joursRestants;

    public enum TypeDocument {
        ASSURANCE,
        CARTE_GRISE,
        VISITE_TECHNIQUE,
        ONSSA,
        AUTORISATION_REGLEMENTAIRE,
        CARBLEUE,
        PERMIS_CONDUITE
    }

    public enum StatutDocument {
        DISPONIBLE,
        BIENTOT_EXPIRE,
        EXPIRE
    }

    public DocumentReglementaire() {
        this.dateCreation = LocalDateTime.now();
        this.statutDocument = StatutDocument.DISPONIBLE;
    }

    @PrePersist
    @PreUpdate
    public void calculerStatut() {
        if (dateExpiration == null) {
            this.statutDocument = StatutDocument.EXPIRE;
            return;
        }

        LocalDate maintenant = LocalDate.now();
        long jours = java.time.temporal.ChronoUnit.DAYS.between(maintenant, dateExpiration);
        this.joursRestants = (int) jours;

        if (jours < 0) {
            this.statutDocument = StatutDocument.EXPIRE;
        } else if (jours <= 30) {
            this.statutDocument = StatutDocument.BIENTOT_EXPIRE;
        } else {
            this.statutDocument = StatutDocument.DISPONIBLE;
        }
    }

    public boolean estValide() {
        return statutDocument == StatutDocument.DISPONIBLE;
    }

    public boolean estExpiré() {
        return statutDocument == StatutDocument.EXPIRE;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }

    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }

    public TypeDocument getTypeDocument() { return typeDocument; }
    public void setTypeDocument(TypeDocument typeDocument) { this.typeDocument = typeDocument; }

    public String getNumeroDocument() { return numeroDocument; }
    public void setNumeroDocument(String numeroDocument) { this.numeroDocument = numeroDocument; }

    public LocalDate getDateEmission() { return dateEmission; }
    public void setDateEmission(LocalDate dateEmission) { this.dateEmission = dateEmission; }

    public LocalDate getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }

    public byte[] getFichierPdf() { return fichierPdf; }
    public void setFichierPdf(byte[] fichierPdf) { this.fichierPdf = fichierPdf; }

    public String getFichierUrl() { return fichierUrl; }
    public void setFichierUrl(String fichierUrl) { this.fichierUrl = fichierUrl; }

    public StatutDocument getStatutDocument() { return statutDocument; }
    public void setStatutDocument(StatutDocument statutDocument) { this.statutDocument = statutDocument; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public LocalDateTime getDateModification() { return dateModification; }
    public void setDateModification(LocalDateTime dateModification) { this.dateModification = dateModification; }

    public Boolean getAlerteEnvoyee() { return alerteEnvoyee; }
    public void setAlerteEnvoyee(Boolean alerteEnvoyee) { this.alerteEnvoyee = alerteEnvoyee; }

    public Integer getJoursRestants() { return joursRestants; }
    public void setJoursRestants(Integer joursRestants) { this.joursRestants = joursRestants; }

    public void updateDateModification() {
        this.dateModification = LocalDateTime.now();
    }
}
