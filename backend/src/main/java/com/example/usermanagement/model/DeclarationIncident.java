package com.example.usermanagement.model;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "declaration_incident", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"chauffeur_id", "vehicule_immatriculation", "date_heure"}, 
                          name = "uk_chauffeur_vehicule_date")
       })
public class DeclarationIncident {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_incident")
    @JsonProperty("id")
    private Long idIncident;

    @Column(name = "numero_demande")
    @JsonProperty("numeroDeclaration")
    private String numeroDemande;

    @Column(name = "date_heure")
    @JsonProperty("dateDeclaration")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateHeure;

    @Column(name = "description_arabe")
    @JsonProperty("descriptionArabe")
    private String descriptionArabe;

    @Column(name = "description_francais")
    @JsonProperty("descriptionFrancais")
    private String descriptionFrancais;

    @JsonProperty("criticite")
    private String criticite;

    @JsonProperty("statut")
    private String statut;

    @Column(name = "type_panne")
    @JsonProperty("typePanne")
    private String typePanne;

    @Column(name = "type_panne_arabe")
    @JsonProperty("typePanneArabe")
    private String typePanneArabe;

    @Column(name = "type_panne_francais")
    @JsonProperty("typePanneFrancais")
    private String typePanneFrancais;

    @JsonProperty("location")
    private String location;

    @Column(name = "lieu_incident_arabe")
    @JsonProperty("lieuIncidentArabe")
    private String lieuIncidentArabe;

    @Column(name = "lieu_incident_francais")
    @JsonProperty("lieuIncidentFrancais")
    private String lieuIncidentFrancais;

    @Column(name = "lieu")
    @JsonProperty("lieu")
    private String lieu;

    @Column(name = "photo_url")
    @JsonProperty("photoUrl")
    private String photoUrl;

    @Column(name = "video_url")
    @JsonProperty("videoUrl")
    private String videoUrl;

    @JsonProperty("photo")
    private String photo;

    @JsonProperty("video")
    private String video;

    @Column(name = "chauffeur_nom")
    @JsonProperty("chauffeurNom")
    private String chauffeurNom;

    @Column(name = "chauffeur_matricule")
    @JsonProperty("chauffeurMatricule")
    private String chauffeurMatricule;

    @Column(name = "chauffeur_id")
    @JsonProperty("chauffeurId")
    private Long chauffeurId;

    @Column(name = "vehicule_id")
    @JsonProperty("vehiculeId")
    private Long vehiculeId;

    @Column(name = "vehicule_immatriculation")
    @JsonProperty("vehiculeImmatriculation")
    private String vehiculeImmatriculation;

    @Column(name = "vehicule_marque")
    @JsonProperty("vehiculeMarque")
    private String vehiculeMarque;

    @Column(name = "vehicule_modele")
    @JsonProperty("vehiculeModele")
    private String vehiculeModele;

    @Column(name = "vehicule_type")
    @JsonProperty("vehiculeType")
    private String vehiculeType;

    @Column(name = "kilometrage")
    @JsonProperty("kilometrage")
    private Integer kilometrage;

    @Column(name = "date_debut_intervention")
    @JsonProperty("dateDebutIntervention")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateDebutIntervention;

    @Column(name = "date_reparation")
    @JsonProperty("dateReparation")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateReparation;

    @Column(name = "duree_reparation")
    @JsonProperty("dureeReparation")
    private Integer dureeReparation;

    @Column(name = "etat")
    @JsonProperty("etat")
    private String etat;

    @Column(name = "numero_ordre_camion")
    @JsonProperty("numeroOrdreCamion")
    private String numeroOrdreCamion;

    @Column(name = "mois")
    @JsonProperty("mois")
    private String mois;

    @Column(name = "tournee")
    @JsonProperty("tournee")
    private String tournee;

    @Column(name = "date_reclamation")
    @JsonProperty("dateReclamation")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private LocalDateTime dateReclamation;

    @Column(name = "source")
    @JsonProperty("source")
    private String source;

    @Column(name = "element_vehicule")
    @JsonProperty("elementVehicule")
    private String elementVehicule;

    @Column(name = "detail_element")
    @JsonProperty("detailElement")
    private String detailElement;

    @Column(name = "categorie")
    @JsonProperty("categorie")
    private String categorie;

    @Column(name = "sla")
    @JsonProperty("sla")
    private Integer sla;

    @Column(name = "motif_refus")
    @JsonProperty("motifRefus")
    private String motifRefus;

    @Column(name = "cout_probleme")
    @JsonProperty("coutProbleme")
    private Double coutProbleme;

    @Column(name = "budget_mensuel")
    @JsonProperty("budgetMensuel")
    private Double budgetMensuel;

    @Column(name = "actions_realisees")
    @JsonProperty("actionsRealisees")
    private String actionsRealisees;

    @Column(name = "pieces_necessaires")
    @JsonProperty("piecesNecessaires")
    private String piecesNecessaires;

    @Column(name = "qualification")
    @JsonProperty("qualification")
    private String qualification;

    @Column(name = "contrat_bon_commande")
    @JsonProperty("contratBonCommande")
    private String contratBonCommande;

    @Lob
    private byte[] audio;

    // Getters & Setters

    public Long getIdIncident() {
        return idIncident;
    }

    public String getNumeroDemande() {
        return numeroDemande;
    }

    public LocalDateTime getDateHeure() {
        return dateHeure;
    }

    public String getDescriptionArabe() {
        return descriptionArabe;
    }

    public String getDescriptionFrancais() {
        return descriptionFrancais;
    }

    public String getCriticite() {
        return criticite;
    }

    public String getStatut() {
        return statut;
    }

    public String getTypePanne() {
        return typePanne;
    }

    public String getTypePanneArabe() {
        return typePanneArabe;
    }

    public String getTypePanneFrancais() {
        return typePanneFrancais;
    }

    public String getLocation() {
        return location;
    }

    public String getLieuIncidentArabe() {
        return lieuIncidentArabe;
    }

    public String getLieuIncidentFrancais() {
        return lieuIncidentFrancais;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public String getVideo() {
        return video;
    }

    public void setVideo(String video) {
        this.video = video;
    }

    public String getChauffeurNom() {
        return chauffeurNom;
    }

    public String getChauffeurMatricule() {
        return chauffeurMatricule;
    }

    public Long getChauffeurId() {
        return chauffeurId;
    }

    public Long getVehiculeId() {
        return vehiculeId;
    }

    public String getVehiculeImmatriculation() {
        return vehiculeImmatriculation;
    }

    public String getVehiculeMarque() {
        return vehiculeMarque;
    }

    public String getVehiculeModele() {
        return vehiculeModele;
    }

    public String getVehiculeType() {
        return vehiculeType;
    }

    public Integer getKilometrage() {
        return kilometrage;
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

    public String getEtat() {
        return etat;
    }

    public byte[] getAudio() {
        return audio;
    }

    public void setIdIncident(Long idIncident) {
        this.idIncident = idIncident;
    }

    public void setNumeroDemande(String numeroDemande) {
        this.numeroDemande = numeroDemande;
    }

    public void setDateHeure(LocalDateTime dateHeure) {
        this.dateHeure = dateHeure;
    }

    public void setDescriptionArabe(String descriptionArabe) {
        this.descriptionArabe = descriptionArabe;
    }

    public void setDescriptionFrancais(String descriptionFrancais) {
        this.descriptionFrancais = descriptionFrancais;
    }

    public void setCriticite(String criticite) {
        this.criticite = criticite;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public void setTypePanne(String typePanne) {
        this.typePanne = typePanne;
    }

    public void setTypePanneArabe(String typePanneArabe) {
        this.typePanneArabe = typePanneArabe;
    }

    public void setTypePanneFrancais(String typePanneFrancais) {
        this.typePanneFrancais = typePanneFrancais;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setLieuIncidentArabe(String lieuIncidentArabe) {
        this.lieuIncidentArabe = lieuIncidentArabe;
    }

    public void setLieuIncidentFrancais(String lieuIncidentFrancais) {
        this.lieuIncidentFrancais = lieuIncidentFrancais;
    }

    public String getLieu() {
        return lieu;
    }

    public void setLieu(String lieu) {
        this.lieu = lieu;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public void setChauffeurNom(String chauffeurNom) {
        this.chauffeurNom = chauffeurNom;
    }

    public void setChauffeurMatricule(String chauffeurMatricule) {
        this.chauffeurMatricule = chauffeurMatricule;
    }

    public void setChauffeurId(Long chauffeurId) {
        this.chauffeurId = chauffeurId;
    }

    public void setVehiculeId(Long vehiculeId) {
        this.vehiculeId = vehiculeId;
    }

    public void setVehiculeImmatriculation(String vehiculeImmatriculation) {
        this.vehiculeImmatriculation = vehiculeImmatriculation;
    }

    public void setVehiculeMarque(String vehiculeMarque) {
        this.vehiculeMarque = vehiculeMarque;
    }

    public void setVehiculeModele(String vehiculeModele) {
        this.vehiculeModele = vehiculeModele;
    }

    public void setVehiculeType(String vehiculeType) {
        this.vehiculeType = vehiculeType;
    }

    public void setKilometrage(Integer kilometrage) {
        this.kilometrage = kilometrage;
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

    public void setEtat(String etat) {
        this.etat = etat;
    }

    public void setAudio(byte[] audio) {
        this.audio = audio;
    }

    public String getNumeroOrdreCamion() {
        return numeroOrdreCamion;
    }

    public void setNumeroOrdreCamion(String numeroOrdreCamion) {
        this.numeroOrdreCamion = numeroOrdreCamion;
    }

    public String getMois() {
        return mois;
    }

    public void setMois(String mois) {
        this.mois = mois;
    }

    public String getTournee() {
        return tournee;
    }

    public void setTournee(String tournee) {
        this.tournee = tournee;
    }

    public LocalDateTime getDateReclamation() {
        return dateReclamation;
    }

    public void setDateReclamation(LocalDateTime dateReclamation) {
        this.dateReclamation = dateReclamation;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getElementVehicule() {
        return elementVehicule;
    }

    public void setElementVehicule(String elementVehicule) {
        this.elementVehicule = elementVehicule;
    }

    public String getDetailElement() {
        return detailElement;
    }

    public void setDetailElement(String detailElement) {
        this.detailElement = detailElement;
    }

    public String getCategorie() {
        return categorie;
    }

    public void setCategorie(String categorie) {
        this.categorie = categorie;
    }

    public Integer getSla() {
        return sla;
    }

    public void setSla(Integer sla) {
        this.sla = sla;
    }

    public String getMotifRefus() {
        return motifRefus;
    }

    public void setMotifRefus(String motifRefus) {
        this.motifRefus = motifRefus;
    }

    public Double getCoutProbleme() {
        return coutProbleme;
    }

    public void setCoutProbleme(Double coutProbleme) {
        this.coutProbleme = coutProbleme;
    }

    public Double getBudgetMensuel() {
        return budgetMensuel;
    }

    public void setBudgetMensuel(Double budgetMensuel) {
        this.budgetMensuel = budgetMensuel;
    }

    public String getActionsRealisees() {
        return actionsRealisees;
    }

    public void setActionsRealisees(String actionsRealisees) {
        this.actionsRealisees = actionsRealisees;
    }

    public String getPiecesNecessaires() {
        return piecesNecessaires;
    }

    public void setPiecesNecessaires(String piecesNecessaires) {
        this.piecesNecessaires = piecesNecessaires;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public String getContratBonCommande() {
        return contratBonCommande;
    }

    public void setContratBonCommande(String contratBonCommande) {
        this.contratBonCommande = contratBonCommande;
    }
}
