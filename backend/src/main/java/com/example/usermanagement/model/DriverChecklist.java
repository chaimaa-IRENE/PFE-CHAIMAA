package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "driver_checklists")
public class DriverChecklist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chauffeur_id")
    private Long chauffeurId;

    @Column(name = "chauffeur_nom")
    private String chauffeurNom;

    @Column(name = "chauffeur_matricule")
    private String chauffeurMatricule;

    @Column(name = "tournee_id")
    private String tourneeId;

    @Column(name = "vehicule_id", nullable = false)
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation", nullable = false)
    private String vehiculeImmatriculation;

    @Column(name = "date_checklist", nullable = false)
    private LocalDateTime dateChecklist;

    // 10 checklist items (Boolean = conforme ou non)
    private Boolean pneus;
    private Boolean freins;
    private Boolean feux;
    private Boolean extincteur;
    private Boolean documents;
    private Boolean carrosserie;
    private Boolean huileNiveau;
    private Boolean batterie;
    private Boolean essuieGlaces;
    private Boolean ceinturesSecurite;

    @Column(columnDefinition = "TEXT")
    private String commentaireGeneral;

    @Column(columnDefinition = "TEXT")
    private String signature;

    private String feedback;

    private String statut;

    @Column(name = "est_conforme")
    private Boolean estConforme;

    @Column(name = "message_alerte_arabe")
    private String messageAlerteArabe;

    @Column(name = "defauts_json", columnDefinition = "TEXT")
    private String defautsJson;

    @Column(name = "post_repair")
    private Boolean postRepair = false;

    @Column(name = "reparations_json", columnDefinition = "TEXT")
    private String reparationsJson;

    @Column(name = "valide_par")
    private String validePar;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "motif_refus", columnDefinition = "TEXT")
    private String motifRefus;

    public DriverChecklist() {}

    public DriverChecklist(Long chauffeurId, String chauffeurNom, String chauffeurMatricule,
                           Long vehiculeId, String vehiculeImmatriculation) {
        this.chauffeurId = chauffeurId;
        this.chauffeurNom = chauffeurNom;
        this.chauffeurMatricule = chauffeurMatricule;
        this.vehiculeId = vehiculeId;
        this.vehiculeImmatriculation = vehiculeImmatriculation;
        this.dateChecklist = LocalDateTime.now();
        this.statut = "PENDING";
    }

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
