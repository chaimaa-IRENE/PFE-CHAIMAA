package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "declaration_form_data")
public class DeclarationFormData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lieu_incident_arabe")
    private String lieuIncidentArabe;

    @Column(name = "lieu_incident_francais")
    private String lieuIncidentFrancais;

    @Column(name = "type_vehicule_arabe")
    private String typeVehiculeArabe;

    @Column(name = "type_vehicule_francais")
    private String typeVehiculeFrancais;

    @Column(name = "type_panne_arabe")
    private String typePanneArabe;

    @Column(name = "type_panne_francais")
    private String typePanneFrancais;

    @Column(name = "description_arabe")
    private String descriptionArabe;

    @Column(name = "description_francais")
    private String descriptionFrancais;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "chauffeur_id")
    private Long chauffeurId;

    @Column(name = "chauffeur_matricule")
    private String chauffeurMatricule;

    @Column(name = "vehicule_matricule")
    private String vehiculeMatricule;

    @Column(name = "kilometrage")
    private Integer kilometrage;

    @Column(name = "agence")
    private String agence;

    @Lob
    @Column(name = "audio_data")
    private byte[] audioData;

    public DeclarationFormData() {
        this.dateCreation = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLieuIncidentArabe() {
        return lieuIncidentArabe;
    }

    public void setLieuIncidentArabe(String lieuIncidentArabe) {
        this.lieuIncidentArabe = lieuIncidentArabe;
    }

    public String getLieuIncidentFrancais() {
        return lieuIncidentFrancais;
    }

    public void setLieuIncidentFrancais(String lieuIncidentFrancais) {
        this.lieuIncidentFrancais = lieuIncidentFrancais;
    }

    public String getTypeVehiculeArabe() {
        return typeVehiculeArabe;
    }

    public void setTypeVehiculeArabe(String typeVehiculeArabe) {
        this.typeVehiculeArabe = typeVehiculeArabe;
    }

    public String getTypeVehiculeFrancais() {
        return typeVehiculeFrancais;
    }

    public void setTypeVehiculeFrancais(String typeVehiculeFrancais) {
        this.typeVehiculeFrancais = typeVehiculeFrancais;
    }

    public String getTypePanneArabe() {
        return typePanneArabe;
    }

    public void setTypePanneArabe(String typePanneArabe) {
        this.typePanneArabe = typePanneArabe;
    }

    public String getTypePanneFrancais() {
        return typePanneFrancais;
    }

    public void setTypePanneFrancais(String typePanneFrancais) {
        this.typePanneFrancais = typePanneFrancais;
    }

    public String getDescriptionArabe() {
        return descriptionArabe;
    }

    public void setDescriptionArabe(String descriptionArabe) {
        this.descriptionArabe = descriptionArabe;
    }

    public String getDescriptionFrancais() {
        return descriptionFrancais;
    }

    public void setDescriptionFrancais(String descriptionFrancais) {
        this.descriptionFrancais = descriptionFrancais;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public Long getChauffeurId() {
        return chauffeurId;
    }

    public void setChauffeurId(Long chauffeurId) {
        this.chauffeurId = chauffeurId;
    }

    public String getChauffeurMatricule() {
        return chauffeurMatricule;
    }

    public void setChauffeurMatricule(String chauffeurMatricule) {
        this.chauffeurMatricule = chauffeurMatricule;
    }

    public String getVehiculeMatricule() {
        return vehiculeMatricule;
    }

    public void setVehiculeMatricule(String vehiculeMatricule) {
        this.vehiculeMatricule = vehiculeMatricule;
    }

    public Integer getKilometrage() {
        return kilometrage;
    }

    public void setKilometrage(Integer kilometrage) {
        this.kilometrage = kilometrage;
    }

    public String getAgence() {
        return agence;
    }

    public void setAgence(String agence) {
        this.agence = agence;
    }

    public byte[] getAudioData() {
        return audioData;
    }

    public void setAudioData(byte[] audioData) {
        this.audioData = audioData;
    }
}
