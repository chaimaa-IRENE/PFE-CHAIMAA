package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rapports_intervention")
public class RapportIntervention {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actions_realisees")
    private String actionsRealisees;

    @Column(name = "date_intervention")
    private LocalDateTime dateIntervention;

    @Column(name = "document_pdf")
    private byte[] documentPdf;

    @Column(name = "nom_intervenant")
    private String nomIntervenant;

    @Column(name = "pieces_necessaires")
    private String piecesNecessaires;

    private String qualification;

    @Column(name = "duree_reparation")
    private String dureeReparation;

    @Column(name = "cout")
    private String cout;

    // ✅ Relation correcte avec DeclarationIncident
    @ManyToOne
    @JoinColumn(name = "declaration_id", referencedColumnName = "id_incident")
    private DeclarationIncident declaration;

    // Getters & Setters

    public Long getId() {
        return id;
    }

    public String getActionsRealisees() {
        return actionsRealisees;
    }

    public LocalDateTime getDateIntervention() {
        return dateIntervention;
    }

    public byte[] getDocumentPdf() {
        return documentPdf;
    }

    public String getNomIntervenant() {
        return nomIntervenant;
    }

    public String getPiecesNecessaires() {
        return piecesNecessaires;
    }

    public String getQualification() {
        return qualification;
    }

    public DeclarationIncident getDeclaration() {
        return declaration;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setActionsRealisees(String actionsRealisees) {
        this.actionsRealisees = actionsRealisees;
    }

    public void setDateIntervention(LocalDateTime dateIntervention) {
        this.dateIntervention = dateIntervention;
    }

    public void setDocumentPdf(byte[] documentPdf) {
        this.documentPdf = documentPdf;
    }

    public void setNomIntervenant(String nomIntervenant) {
        this.nomIntervenant = nomIntervenant;
    }

    public void setPiecesNecessaires(String piecesNecessaires) {
        this.piecesNecessaires = piecesNecessaires;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public void setDeclaration(DeclarationIncident declaration) {
        this.declaration = declaration;
    }

    public String getDureeReparation() {
        return dureeReparation;
    }

    public void setDureeReparation(String dureeReparation) {
        this.dureeReparation = dureeReparation;
    }

    public String getCout() {
        return cout;
    }

    public void setCout(String cout) {
        this.cout = cout;
    }
}
