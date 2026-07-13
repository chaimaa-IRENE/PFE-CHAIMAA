package com.example.usermanagement.dto;

import java.util.List;
import java.util.Map;

public class ExcelDashboardDTO {
    private long totalComplaints;
    private double averageDuree;
    private Map<String, Long> complaintsByCategorie;
    private Map<String, Long> complaintsByChauffeur;
    private Map<String, Long> complaintsByImmatriculation;
    private Map<String, Long> complaintsByEtat;
    private List<String> distinctMois;
    private List<String> distinctChauffeurs;
    private List<String> distinctSources;
    private List<String> distinctElements;
    private List<String> distinctCategories;

    public ExcelDashboardDTO() {}

    public ExcelDashboardDTO(long totalComplaints, double averageDuree, 
                             Map<String, Long> complaintsByCategorie,
                             Map<String, Long> complaintsByChauffeur,
                             Map<String, Long> complaintsByImmatriculation,
                             Map<String, Long> complaintsByEtat,
                             List<String> distinctMois,
                             List<String> distinctChauffeurs,
                             List<String> distinctSources,
                             List<String> distinctElements,
                             List<String> distinctCategories) {
        this.totalComplaints = totalComplaints;
        this.averageDuree = averageDuree;
        this.complaintsByCategorie = complaintsByCategorie;
        this.complaintsByChauffeur = complaintsByChauffeur;
        this.complaintsByImmatriculation = complaintsByImmatriculation;
        this.complaintsByEtat = complaintsByEtat;
        this.distinctMois = distinctMois;
        this.distinctChauffeurs = distinctChauffeurs;
        this.distinctSources = distinctSources;
        this.distinctElements = distinctElements;
        this.distinctCategories = distinctCategories;
    }

    // Getters and Setters
    public long getTotalComplaints() { return totalComplaints; }
    public void setTotalComplaints(long totalComplaints) { this.totalComplaints = totalComplaints; }

    public double getAverageDuree() { return averageDuree; }
    public void setAverageDuree(double averageDuree) { this.averageDuree = averageDuree; }

    public Map<String, Long> getComplaintsByCategorie() { return complaintsByCategorie; }
    public void setComplaintsByCategorie(Map<String, Long> complaintsByCategorie) { this.complaintsByCategorie = complaintsByCategorie; }

    public Map<String, Long> getComplaintsByChauffeur() { return complaintsByChauffeur; }
    public void setComplaintsByChauffeur(Map<String, Long> complaintsByChauffeur) { this.complaintsByChauffeur = complaintsByChauffeur; }

    public Map<String, Long> getComplaintsByImmatriculation() { return complaintsByImmatriculation; }
    public void setComplaintsByImmatriculation(Map<String, Long> complaintsByImmatriculation) { this.complaintsByImmatriculation = complaintsByImmatriculation; }

    public Map<String, Long> getComplaintsByEtat() { return complaintsByEtat; }
    public void setComplaintsByEtat(Map<String, Long> complaintsByEtat) { this.complaintsByEtat = complaintsByEtat; }

    public List<String> getDistinctMois() { return distinctMois; }
    public void setDistinctMois(List<String> distinctMois) { this.distinctMois = distinctMois; }

    public List<String> getDistinctChauffeurs() { return distinctChauffeurs; }
    public void setDistinctChauffeurs(List<String> distinctChauffeurs) { this.distinctChauffeurs = distinctChauffeurs; }

    public List<String> getDistinctSources() { return distinctSources; }
    public void setDistinctSources(List<String> distinctSources) { this.distinctSources = distinctSources; }

    public List<String> getDistinctElements() { return distinctElements; }
    public void setDistinctElements(List<String> distinctElements) { this.distinctElements = distinctElements; }

    public List<String> getDistinctCategories() { return distinctCategories; }
    public void setDistinctCategories(List<String> distinctCategories) { this.distinctCategories = distinctCategories; }
}
