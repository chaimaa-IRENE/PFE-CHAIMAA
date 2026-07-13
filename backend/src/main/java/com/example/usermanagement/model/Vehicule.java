package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicules")
@JsonIdentityInfo(
    generator = ObjectIdGenerators.PropertyGenerator.class,
    property = "id"
)
public class Vehicule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", unique = true)
    private String vehicleId;

    @Column(name = "truck_number", unique = true)
    private String truckNumber;

    private String immatriculation;
    private String marque;
    private String modele;
    private String type;
    private String branchCode;
    private Integer kilometrage;
    private Integer annee;
    private String carburant;
    private String statut;
    private String agence;

    @Column(name = "tournee")
    private String tournee;

    @Column(name = "chauffeur_id")
    private Long chauffeurId;

    @Column(name = "chauffeur_nom")
    private String chauffeurNom;

    @Column(name = "date_affectation")
    private LocalDateTime dateAffectation;

    @Column(name = "conforme")
    private Boolean conforme;

    @Column(name = "documents_disponibles")
    private String documentsDisponibles;

    @Column(name = "notes")
    private String notes;

    @Column(name = "archived")
    private Boolean archived = false;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "archived_by")
    private String archivedBy;

    @Column(name = "date_blocage")
    private LocalDateTime dateBlocage;

    @Column(name = "date_deblocage")
    private LocalDateTime dateDeblocage;

    @Column(name = "bloque_par")
    private String bloquePar;

    @Column(name = "debloque_par")
    private String debloquePar;

    @Column(name = "raison_blocage")
    private String raisonBlocage;

    // === MyGeotab fields ===
    @Column(name = "geotab_id")
    private String geotabId;

    @Column(name = "derniere_latitude")
    private Double derniereLatitude;

    @Column(name = "derniere_longitude")
    private Double derniereLongitude;

    @Column(name = "derniere_vitesse")
    private Double derniereVitesse;

    @Column(name = "niveau_carburant")
    private Double niveauCarburant;

    @Column(name = "derniere_position_date")
    private LocalDateTime dernierePositionDate;

    @Column(name = "moteur_allume")
    private Boolean moteurAllume;

    public Vehicule() {}

    public Vehicule(String immatriculation, String marque, String modele, String type, String branchCode) {
        this.immatriculation = immatriculation;
        this.marque = marque;
        this.modele = modele;
        this.type = type;
        this.branchCode = branchCode;
    }

    public Vehicule(String immatriculation, String marque, String modele, String type, String branchCode, Integer kilometrage, Integer annee, String carburant, String statut, String agence) {
        this.immatriculation = immatriculation;
        this.marque = marque;
        this.modele = modele;
        this.type = type;
        this.branchCode = branchCode;
        this.kilometrage = kilometrage;
        this.annee = annee;
        this.carburant = carburant;
        this.statut = statut;
        this.agence = agence;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }

    public String getTruckNumber() { return truckNumber; }
    public void setTruckNumber(String truckNumber) { this.truckNumber = truckNumber; }

    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }

    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public Integer getKilometrage() { return kilometrage; }
    public void setKilometrage(Integer kilometrage) { this.kilometrage = kilometrage; }

    public Integer getAnnee() { return annee; }
    public void setAnnee(Integer annee) { this.annee = annee; }

    public String getCarburant() { return carburant; }
    public void setCarburant(String carburant) { this.carburant = carburant; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getAgence() { return agence; }
    public void setAgence(String agence) { this.agence = agence; }

    public String getTournee() { return tournee; }
    public void setTournee(String tournee) { this.tournee = tournee; }

    public Long getChauffeurId() { return chauffeurId; }
    public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }

    public String getChauffeurNom() { return chauffeurNom; }
    public void setChauffeurNom(String chauffeurNom) { this.chauffeurNom = chauffeurNom; }

    public LocalDateTime getDateAffectation() { return dateAffectation; }
    public void setDateAffectation(LocalDateTime dateAffectation) { this.dateAffectation = dateAffectation; }

    public Boolean getConforme() { return conforme; }
    public void setConforme(Boolean conforme) { this.conforme = conforme; }

    public String getDocumentsDisponibles() { return documentsDisponibles; }
    public void setDocumentsDisponibles(String documentsDisponibles) { this.documentsDisponibles = documentsDisponibles; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Boolean getArchived() { return archived; }
    public void setArchived(Boolean archived) { this.archived = archived; }
    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }
    public String getArchivedBy() { return archivedBy; }
    public void setArchivedBy(String archivedBy) { this.archivedBy = archivedBy; }
    public LocalDateTime getDateBlocage() { return dateBlocage; }
    public void setDateBlocage(LocalDateTime dateBlocage) { this.dateBlocage = dateBlocage; }
    public LocalDateTime getDateDeblocage() { return dateDeblocage; }
    public void setDateDeblocage(LocalDateTime dateDeblocage) { this.dateDeblocage = dateDeblocage; }
    public String getBloquePar() { return bloquePar; }
    public void setBloquePar(String bloquePar) { this.bloquePar = bloquePar; }
    public String getDebloquePar() { return debloquePar; }
    public void setDebloquePar(String debloquePar) { this.debloquePar = debloquePar; }
    public String getRaisonBlocage() { return raisonBlocage; }
    public void setRaisonBlocage(String raisonBlocage) { this.raisonBlocage = raisonBlocage; }

    public String getGeotabId() { return geotabId; }
    public void setGeotabId(String geotabId) { this.geotabId = geotabId; }
    public Double getDerniereLatitude() { return derniereLatitude; }
    public void setDerniereLatitude(Double derniereLatitude) { this.derniereLatitude = derniereLatitude; }
    public Double getDerniereLongitude() { return derniereLongitude; }
    public void setDerniereLongitude(Double derniereLongitude) { this.derniereLongitude = derniereLongitude; }
    public Double getDerniereVitesse() { return derniereVitesse; }
    public void setDerniereVitesse(Double derniereVitesse) { this.derniereVitesse = derniereVitesse; }
    public Double getNiveauCarburant() { return niveauCarburant; }
    public void setNiveauCarburant(Double niveauCarburant) { this.niveauCarburant = niveauCarburant; }
    public LocalDateTime getDernierePositionDate() { return dernierePositionDate; }
    public void setDernierePositionDate(LocalDateTime dernierePositionDate) { this.dernierePositionDate = dernierePositionDate; }
    public Boolean getMoteurAllume() { return moteurAllume; }
    public void setMoteurAllume(Boolean moteurAllume) { this.moteurAllume = moteurAllume; }
}
