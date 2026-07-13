package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.YearMonth;

@Entity
@Table(name = "budget_trimestriel")
public class BudgetTrimestriel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "annee", nullable = false)
    private Integer annee;

    @Column(name = "trimestre", nullable = false)
    private Integer trimestre;

    @Column(name = "budget_total", nullable = false)
    private Double budgetTotal;

    @Column(name = "budget_utilise", nullable = false)
    private Double budgetUtilise = 0.0;

    @Column(name = "date_creation", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private java.util.Date dateCreation;

    @Column(name = "date_debut_periode")
    private LocalDate dateDebutPeriode;

    @Column(name = "date_fin_periode")
    private LocalDate dateFinPeriode;

    @Column(name = "actif", nullable = false)
    private Boolean actif = true;

    // Getters & Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getAnnee() {
        return annee;
    }

    public void setAnnee(Integer annee) {
        this.annee = annee;
    }

    public Integer getTrimestre() {
        return trimestre;
    }

    public void setTrimestre(Integer trimestre) {
        this.trimestre = trimestre;
    }

    public Double getBudgetTotal() {
        return budgetTotal;
    }

    public void setBudgetTotal(Double budgetTotal) {
        this.budgetTotal = budgetTotal;
    }

    public Double getBudgetUtilise() {
        return budgetUtilise;
    }

    public void setBudgetUtilise(Double budgetUtilise) {
        this.budgetUtilise = budgetUtilise;
    }

    public Double getBudgetRestant() {
        return budgetTotal - budgetUtilise;
    }

    public java.util.Date getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(java.util.Date dateCreation) {
        this.dateCreation = dateCreation;
    }

    public LocalDate getDateDebutPeriode() {
        return dateDebutPeriode;
    }

    public void setDateDebutPeriode(LocalDate dateDebutPeriode) {
        this.dateDebutPeriode = dateDebutPeriode;
    }

    public LocalDate getDateFinPeriode() {
        return dateFinPeriode;
    }

    public void setDateFinPeriode(LocalDate dateFinPeriode) {
        this.dateFinPeriode = dateFinPeriode;
    }

    public Boolean getActif() {
        return actif;
    }

    public void setActif(Boolean actif) {
        this.actif = actif;
    }

    public void ajouterUtilisation(Double montant) {
        this.budgetUtilise += montant;
    }
}
