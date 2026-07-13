package com.example.usermanagement.dto;

import java.util.List;

public class ComparisonResultDTO {
    private String vehiculeImmatriculation;
    private String marque;
    private String modele;
    private ChecklistDTO lastChecklist;
    private List<LegalDocumentDTO> documents;
    private List<ComparisonItemDTO> items;
    private String statutGlobal;
    private String description;

    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }
    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }
    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }
    public ChecklistDTO getLastChecklist() { return lastChecklist; }
    public void setLastChecklist(ChecklistDTO lastChecklist) { this.lastChecklist = lastChecklist; }
    public List<LegalDocumentDTO> getDocuments() { return documents; }
    public void setDocuments(List<LegalDocumentDTO> documents) { this.documents = documents; }
    public List<ComparisonItemDTO> getItems() { return items; }
    public void setItems(List<ComparisonItemDTO> items) { this.items = items; }
    public String getStatutGlobal() { return statutGlobal; }
    public void setStatutGlobal(String statutGlobal) { this.statutGlobal = statutGlobal; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
