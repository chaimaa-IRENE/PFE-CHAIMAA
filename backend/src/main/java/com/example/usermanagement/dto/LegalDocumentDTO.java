package com.example.usermanagement.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LegalDocumentDTO {
    private Long id;
    private Long vehiculeId;
    private String vehiculeImmatriculation;
    private String type;
    private String numeroDocument;
    private LocalDate dateExpiration;
    private String proprietaire;
    private String fichierUrl;
    private String statut;
    private LocalDateTime dateImport;

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
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public LocalDateTime getDateImport() { return dateImport; }
    public void setDateImport(LocalDateTime dateImport) { this.dateImport = dateImport; }
}
