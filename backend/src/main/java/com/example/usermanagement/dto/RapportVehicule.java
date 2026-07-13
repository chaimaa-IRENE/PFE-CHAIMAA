package com.example.usermanagement.dto;

import com.example.usermanagement.model.DeclarationIncident;
import java.util.List;

public class RapportVehicule {
    private Long vehiculeId;
    private String immatriculation;
    private String marque;
    private String modele;
    private String type;
    private String agence;
    private Integer kilometrage;
    private Integer annee;
    private String carburant;
    private String statut;
    private List<DeclarationIncident> declarations;

    // Constructeurs
    public RapportVehicule() {}

    public RapportVehicule(Long vehiculeId, String immatriculation, String marque, String modele, String type, String agence, Integer kilometrage, Integer annee, String carburant, String statut, List<DeclarationIncident> declarations) {
        this.vehiculeId = vehiculeId;
        this.immatriculation = immatriculation;
        this.marque = marque;
        this.modele = modele;
        this.type = type;
        this.agence = agence;
        this.kilometrage = kilometrage;
        this.annee = annee;
        this.carburant = carburant;
        this.statut = statut;
        this.declarations = declarations;
    }

    // Getters & Setters
    public Long getVehiculeId() {
        return vehiculeId;
    }

    public void setVehiculeId(Long vehiculeId) {
        this.vehiculeId = vehiculeId;
    }

    public String getImmatriculation() {
        return immatriculation;
    }

    public void setImmatriculation(String immatriculation) {
        this.immatriculation = immatriculation;
    }

    public String getMarque() {
        return marque;
    }

    public void setMarque(String marque) {
        this.marque = marque;
    }

    public String getModele() {
        return modele;
    }

    public void setModele(String modele) {
        this.modele = modele;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAgence() {
        return agence;
    }

    public void setAgence(String agence) {
        this.agence = agence;
    }

    public Integer getKilometrage() {
        return kilometrage;
    }

    public void setKilometrage(Integer kilometrage) {
        this.kilometrage = kilometrage;
    }

    public Integer getAnnee() {
        return annee;
    }

    public void setAnnee(Integer annee) {
        this.annee = annee;
    }

    public String getCarburant() {
        return carburant;
    }

    public void setCarburant(String carburant) {
        this.carburant = carburant;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public List<DeclarationIncident> getDeclarations() {
        return declarations;
    }

    public void setDeclarations(List<DeclarationIncident> declarations) {
        this.declarations = declarations;
    }
}
