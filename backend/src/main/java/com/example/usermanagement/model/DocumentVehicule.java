package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents_vehicule")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class DocumentVehicule {

    public enum TypeDocument {
        ASSURANCE, ONSSA, VISITE_TECHNIQUE, CARTE_GRISE, METROLOGIQUE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicule_id", nullable = false)
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation")
    private String vehiculeImmatriculation;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", nullable = false)
    private TypeDocument typeDocument;

    @Column(name = "numero_document")
    private String numeroDocument;

    @Column(name = "date_emission")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateEmission;

    @Column(name = "date_expiration")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateExpiration;

    @Column(name = "fichier_url")
    private String fichierUrl;

    @Column(name = "est_disponible")
    private Boolean estDisponible = true;

    @Column(name = "notes")
    private String notes;

    @Column(name = "importe_par")
    private String importePar;

    @Column(name = "created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @Column(name = "archived")
    private Boolean archived = false;

    @Column(name = "archived_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime archivedAt;

    @Column(name = "archived_by")
    private String archivedBy;

    public DocumentVehicule() {}

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
    public LocalDateTime getDateEmission() { return dateEmission; }
    public void setDateEmission(LocalDateTime dateEmission) { this.dateEmission = dateEmission; }
    public LocalDateTime getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDateTime dateExpiration) { this.dateExpiration = dateExpiration; }
    public String getFichierUrl() { return fichierUrl; }
    public void setFichierUrl(String fichierUrl) { this.fichierUrl = fichierUrl; }
    public Boolean getEstDisponible() { return estDisponible; }
    public void setEstDisponible(Boolean estDisponible) { this.estDisponible = estDisponible; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getImportePar() { return importePar; }
    public void setImportePar(String importePar) { this.importePar = importePar; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Boolean getArchived() { return archived; }
    public void setArchived(Boolean archived) { this.archived = archived; }
    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }
    public String getArchivedBy() { return archivedBy; }
    public void setArchivedBy(String archivedBy) { this.archivedBy = archivedBy; }
}