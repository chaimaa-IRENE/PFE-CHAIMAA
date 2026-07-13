package com.example.usermanagement.dto;

import java.util.List;
import java.util.Map;

public class AnalyseVehicule {
    // Carte nationale
    private String site;
    private String branchCode;
    
    // Fiche synthèse
    private String immatriculation;
    private String marque;
    private String modele;
    private String type;
    private Integer kilometrage;
    private Integer nombreDeclarations;
    private String statut;
    private String derniereIntervention;
    
    // Analyse des déclarations
    private Map<String, Integer> typesIncidents; // Type panne -> nombre
    private Integer frequenceMoyenne; // jours entre incidents
    private String tendance; // "AMELIORE", "STABLE", "DEGRADE"
    
    // Indice qualité (0-100)
    private Integer indiceQualite;
    private String niveauQualite; // "EXCELLENT", "BON", "MOYEN", "FAIBLE", "CRITIQUE"
    
    // Recommandation
    private String recommandation;
    private String typeRecommandation; // "MAINTENANCE_PREVENTIVE", "REVISION", "REPLACEMENT", "AUCUNE"

    // Constructeurs
    public AnalyseVehicule() {}

    public AnalyseVehicule(String site, String branchCode, String immatriculation, String marque, String modele, 
                          String type, Integer kilometrage, Integer nombreDeclarations, String statut, 
                          String derniereIntervention, Map<String, Integer> typesIncidents, Integer frequenceMoyenne, 
                          String tendance, Integer indiceQualite, String niveauQualite, String recommandation, 
                          String typeRecommandation) {
        this.site = site;
        this.branchCode = branchCode;
        this.immatriculation = immatriculation;
        this.marque = marque;
        this.modele = modele;
        this.type = type;
        this.kilometrage = kilometrage;
        this.nombreDeclarations = nombreDeclarations;
        this.statut = statut;
        this.derniereIntervention = derniereIntervention;
        this.typesIncidents = typesIncidents;
        this.frequenceMoyenne = frequenceMoyenne;
        this.tendance = tendance;
        this.indiceQualite = indiceQualite;
        this.niveauQualite = niveauQualite;
        this.recommandation = recommandation;
        this.typeRecommandation = typeRecommandation;
    }

    // Getters & Setters
    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }

    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getKilometrage() { return kilometrage; }
    public void setKilometrage(Integer kilometrage) { this.kilometrage = kilometrage; }

    public Integer getNombreDeclarations() { return nombreDeclarations; }
    public void setNombreDeclarations(Integer nombreDeclarations) { this.nombreDeclarations = nombreDeclarations; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getDerniereIntervention() { return derniereIntervention; }
    public void setDerniereIntervention(String derniereIntervention) { this.derniereIntervention = derniereIntervention; }

    public Map<String, Integer> getTypesIncidents() { return typesIncidents; }
    public void setTypesIncidents(Map<String, Integer> typesIncidents) { this.typesIncidents = typesIncidents; }

    public Integer getFrequenceMoyenne() { return frequenceMoyenne; }
    public void setFrequenceMoyenne(Integer frequenceMoyenne) { this.frequenceMoyenne = frequenceMoyenne; }

    public String getTendance() { return tendance; }
    public void setTendance(String tendance) { this.tendance = tendance; }

    public Integer getIndiceQualite() { return indiceQualite; }
    public void setIndiceQualite(Integer indiceQualite) { this.indiceQualite = indiceQualite; }

    public String getNiveauQualite() { return niveauQualite; }
    public void setNiveauQualite(String niveauQualite) { this.niveauQualite = niveauQualite; }

    public String getRecommandation() { return recommandation; }
    public void setRecommandation(String recommandation) { this.recommandation = recommandation; }

    public String getTypeRecommandation() { return typeRecommandation; }
    public void setTypeRecommandation(String typeRecommandation) { this.typeRecommandation = typeRecommandation; }
}
