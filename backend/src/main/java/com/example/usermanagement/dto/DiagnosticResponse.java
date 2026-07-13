package com.example.usermanagement.dto;

import java.util.Map;

public class DiagnosticResponse {
    private String diagnostic;
    private String suggestion;
    private String criticite;
    private int niveauUrgence;
    private Map<String, String> formulaireJson;

    public DiagnosticResponse() {}

    public String getDiagnostic() { return diagnostic; }
    public void setDiagnostic(String diagnostic) { this.diagnostic = diagnostic; }
    public String getSuggestion() { return suggestion; }
    public void setSuggestion(String suggestion) { this.suggestion = suggestion; }
    public String getCriticite() { return criticite; }
    public void setCriticite(String criticite) { this.criticite = criticite; }
    public int getNiveauUrgence() { return niveauUrgence; }
    public void setNiveauUrgence(int niveauUrgence) { this.niveauUrgence = niveauUrgence; }
    public Map<String, String> getFormulaireJson() { return formulaireJson; }
    public void setFormulaireJson(Map<String, String> formulaireJson) { this.formulaireJson = formulaireJson; }
}
