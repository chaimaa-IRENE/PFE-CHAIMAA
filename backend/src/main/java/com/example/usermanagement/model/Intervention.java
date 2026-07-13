package com.example.usermanagement.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Lob;
import org.springframework.data.annotation.Id;
import java.time.LocalDateTime;

@Entity
public class Intervention {
    @jakarta.persistence.Id
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numeroDemande;
    private String vehicule;
    private String site;
    private String typeIncident;
    private String statut;
    private int sla; // jours ouverts

    private String actionsRealisees;
    private String piecesNecessaires;
    private String piecesUtilisees;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateDebutIntervention;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateReparation;

    private Integer dureeReparation;
    private String etatReparation; // TRAITE / NON_TRAITE / EN_ATTENTE / REPARE
    private String qualification; // CONTRAT / DEVIS
    private String motifRefus;

    @Lob
    private byte[] rapportPDF;

    // getters et setters

    public Long getId() {
        return id;
    }

    public String getNumeroDemande() {
        return numeroDemande;
    }

    public String getVehicule() {
        return vehicule;
    }

    public String getSite() {
        return site;
    }

    public String getTypeIncident() {
        return typeIncident;
    }

    public String getStatut() {
        return statut;
    }

    public int getSla() {
        return sla;
    }

    public String getActionsRealisees() {
        return actionsRealisees;
    }

    public String getPiecesNecessaires() {
        return piecesNecessaires;
    }

    public String getPiecesUtilisees() {
        return piecesUtilisees;
    }

    public LocalDateTime getDateDebutIntervention() {
        return dateDebutIntervention;
    }

    public LocalDateTime getDateReparation() {
        return dateReparation;
    }

    public Integer getDureeReparation() {
        return dureeReparation;
    }

    public String getEtatReparation() {
        return etatReparation;
    }

    public String getQualification() {
        return qualification;
    }

    public String getMotifRefus() {
        return motifRefus;
    }

    public byte[] getRapportPDF() {
        return rapportPDF;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setNumeroDemande(String numeroDemande) {
        this.numeroDemande = numeroDemande;
    }

    public void setVehicule(String vehicule) {
        this.vehicule = vehicule;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public void setTypeIncident(String typeIncident) {
        this.typeIncident = typeIncident;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public void setSla(int sla) {
        this.sla = sla;
    }

    public void setActionsRealisees(String actionsRealisees) {
        this.actionsRealisees = actionsRealisees;
    }

    public void setPiecesNecessaires(String piecesNecessaires) {
        this.piecesNecessaires = piecesNecessaires;
    }

    public void setPiecesUtilisees(String piecesUtilisees) {
        this.piecesUtilisees = piecesUtilisees;
    }

    public void setDateDebutIntervention(LocalDateTime dateDebutIntervention) {
        this.dateDebutIntervention = dateDebutIntervention;
    }

    public void setDateReparation(LocalDateTime dateReparation) {
        this.dateReparation = dateReparation;
    }

    public void setDureeReparation(Integer dureeReparation) {
        this.dureeReparation = dureeReparation;
    }

    public void setEtatReparation(String etatReparation) {
        this.etatReparation = etatReparation;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public void setMotifRefus(String motifRefus) {
        this.motifRefus = motifRefus;
    }

    public void setRapportPDF(byte[] rapportPDF) {
        this.rapportPDF = rapportPDF;
    }
}

