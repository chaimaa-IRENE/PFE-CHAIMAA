package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "legal_documents")
public class LegalDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicule_id", nullable = false)
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation", nullable = false)
    private String vehiculeImmatriculation;

    @Column(nullable = false)
    private String type;

    @Column(name = "numero_document")
    private String numeroDocument;

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    private String proprietaire;

    @Column(name = "fichier_url")
    private String fichierUrl;

    @Column(columnDefinition = "TEXT")
    private String ocrData;

    @Column(name = "date_import")
    private LocalDateTime dateImport;

    private String statut;

    @Column(name = "importe_par")
    private String importePar;

    public LegalDocument() {}

    public LegalDocument(Long vehiculeId, String vehiculeImmatriculation, String type) {
        this.vehiculeId = vehiculeId;
        this.vehiculeImmatriculation = vehiculeImmatriculation;
        this.type = type;
        this.dateImport = LocalDateTime.now();
        this.statut = "EN_ATTENTE";
    }

    @PrePersist
    @PreUpdate
    public void updateStatut() {
        if (dateExpiration == null) {
            this.statut = "EN_ATTENTE";
            return;
        }
        LocalDate now = LocalDate.now();
        if (dateExpiration.isBefore(now)) {
            this.statut = "EXPIRE";
        } else if (dateExpiration.isBefore(now.plusMonths(3))) {
            this.statut = "BIENTOT_EXPIRE";
        } else {
            this.statut = "VALIDE";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getNumeroDocument() { return numeroDocument; }
    public void setNumeroDocument(String numeroDocument) { this.numeroDocument = numeroDocument; }
    public LocalDate getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }
    public String getProprietaire() { return proprietaire; }
    public void setProprietaire(String proprietaire) { this.proprietaire = proprietaire; }
    public String getFichierUrl() { return fichierUrl; }
    public void setFichierUrl(String fichierUrl) { this.fichierUrl = fichierUrl; }
    public String getOcrData() { return ocrData; }
    public void setOcrData(String ocrData) { this.ocrData = ocrData; }
    public LocalDateTime getDateImport() { return dateImport; }
    public void setDateImport(LocalDateTime dateImport) { this.dateImport = dateImport; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getImportePar() { return importePar; }
    public void setImportePar(String importePar) { this.importePar = importePar; }
}
