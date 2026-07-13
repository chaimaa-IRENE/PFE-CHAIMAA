package com.example.usermanagement.dto;

import java.time.LocalDateTime;

public class ChecklistDTO {
    private Long id;
    private Long chauffeurId;
    private String chauffeurNom;
    private String chauffeurMatricule;
    private String tourneeId;
    private Long vehiculeId;
    private String vehiculeImmatriculation;
    private LocalDateTime dateChecklist;
    private Boolean pneus, freins, feux, extincteur, documents;
    private Boolean carrosserie, huileNiveau, batterie, essuieGlaces, ceinturesSecurite;
    private String commentaireGeneral;
    private String signature;
    private String statut;
    private String feedback;
    private Boolean estConforme;
    private String messageAlerteArabe;
    private String defautsJson;
    private Boolean postRepair;
    private String reparationsJson;
    private String validePar;
    private LocalDateTime dateValidation;
    private String motifRefus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }
    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }
    public String getChauffeurMatricule() { return chauffeurMatricule; }
    public void setChauffeurMatricule(String chauffeurMatricule) { this.chauffeurMatricule = chauffeurMatricule; }
    public String getTourneeId() { return tourneeId; }
    public void setTourneeId(String tourneeId) { this.tourneeId = tourneeId; }
    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public LocalDateTime getDateChecklist() { return dateChecklist; }
    public void setDateChecklist(LocalDateTime dateChecklist) { this.dateChecklist = dateChecklist; }
    public Boolean getPneus() { return pneus; }
    public void setPneus(Boolean pneus) { this.pneus = pneus; }
    public Boolean getFreins() { return freins; }
    public void setFreins(Boolean freins) { this.freins = freins; }
    public Boolean getFeux() { return feux; }
    public void setFeux(Boolean feux) { this.feux = feux; }
    public Boolean getExtincteur() { return extincteur; }
    public void setExtincteur(Boolean extincteur) { this.extincteur = extincteur; }
    public Boolean getDocuments() { return documents; }
    public void setDocuments(Boolean documents) { this.documents = documents; }
    public Boolean getCarrosserie() { return carrosserie; }
    public void setCarrosserie(Boolean carrosserie) { this.carrosserie = carrosserie; }
    public Boolean getHuileNiveau() { return huileNiveau; }
    public void setHuileNiveau(Boolean huileNiveau) { this.huileNiveau = huileNiveau; }
    public Boolean getBatterie() { return batterie; }
    public void setBatterie(Boolean batterie) { this.batterie = batterie; }
    public Boolean getEssuieGlaces() { return essuieGlaces; }
    public void setEssuieGlaces(Boolean essuieGlaces) { this.essuieGlaces = essuieGlaces; }
    public Boolean getCeinturesSecurite() { return ceinturesSecurite; }
    public void setCeinturesSecurite(Boolean ceinturesSecurite) { this.ceinturesSecurite = ceinturesSecurite; }
    public String getCommentaireGeneral() { return commentaireGeneral; }
    public void setCommentaireGeneral(String commentaireGeneral) { this.commentaireGeneral = commentaireGeneral; }
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public Boolean getEstConforme() { return estConforme; }
    public void setEstConforme(Boolean estConforme) { this.estConforme = estConforme; }
    public String getMessageAlerteArabe() { return messageAlerteArabe; }
    public void setMessageAlerteArabe(String messageAlerteArabe) { this.messageAlerteArabe = messageAlerteArabe; }
    public String getDefautsJson() { return defautsJson; }
    public void setDefautsJson(String defautsJson) { this.defautsJson = defautsJson; }
    public Boolean getPostRepair() { return postRepair; }
    public void setPostRepair(Boolean postRepair) { this.postRepair = postRepair; }
    public String getReparationsJson() { return reparationsJson; }
    public void setReparationsJson(String reparationsJson) { this.reparationsJson = reparationsJson; }
    public String getValidePar() { return validePar; }
    public void setValidePar(String validePar) { this.validePar = validePar; }
    public LocalDateTime getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDateTime dateValidation) { this.dateValidation = dateValidation; }
    public String getMotifRefus() { return motifRefus; }
    public void setMotifRefus(String motifRefus) { this.motifRefus = motifRefus; }
}
