package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "complaints")
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "num")
    private String num;

    @Column(name = "mois")
    private String mois;

    @Column(name = "numero_ordre_camion")
    private String numeroOrdreCamion;

    @Column(name = "chauffeur")
    private String chauffeur;

    @Column(name = "date_reclamation")
    private LocalDate dateReclamation;

    @Column(name = "source")
    private String source;

    @Column(name = "element")
    private String element;

    @Column(name = "detail")
    private String detail;

    @Column(name = "categorie")
    private String categorie;

    @Column(name = "date_reparation")
    private LocalDate dateReparation;

    @Column(name = "duree")
    private Integer duree;

    @Column(name = "etat")
    private String etat;

    @Column(name = "immatriculation")
    private String immatriculation;

    public Complaint() {}

    public Complaint(String num, String mois, String numeroOrdreCamion, String chauffeur,
                     LocalDate dateReclamation, String source, String element, String detail,
                     String categorie, LocalDate dateReparation, Integer duree, String etat,
                     String immatriculation) {
        this.num = num;
        this.mois = mois;
        this.numeroOrdreCamion = numeroOrdreCamion;
        this.chauffeur = chauffeur;
        this.dateReclamation = dateReclamation;
        this.source = source;
        this.element = element;
        this.detail = detail;
        this.categorie = categorie;
        this.dateReparation = dateReparation;
        this.duree = duree;
        this.etat = etat;
        this.immatriculation = immatriculation;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNum() { return num; }
    public void setNum(String num) { this.num = num; }

    public String getMois() { return mois; }
    public void setMois(String mois) { this.mois = mois; }

    public String getNumeroOrdreCamion() { return numeroOrdreCamion; }
    public void setNumeroOrdreCamion(String numeroOrdreCamion) { this.numeroOrdreCamion = numeroOrdreCamion; }

    public String getChauffeur() { return chauffeur; }
    public void setChauffeur(String chauffeur) { this.chauffeur = chauffeur; }

    public LocalDate getDateReclamation() { return dateReclamation; }
    public void setDateReclamation(LocalDate dateReclamation) { this.dateReclamation = dateReclamation; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getElement() { return element; }
    public void setElement(String element) { this.element = element; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }

    public LocalDate getDateReparation() { return dateReparation; }
    public void setDateReparation(LocalDate dateReparation) { this.dateReparation = dateReparation; }

    public Integer getDuree() { return duree; }
    public void setDuree(Integer duree) { this.duree = duree; }

    public String getEtat() { return etat; }
    public void setEtat(String etat) { this.etat = etat; }

    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }
}
