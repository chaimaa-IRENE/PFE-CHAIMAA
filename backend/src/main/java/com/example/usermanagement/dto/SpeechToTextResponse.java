package com.example.usermanagement.dto;

public class SpeechToTextResponse {
    private String texte;
    private String texteFrancais;
    private String langue;
    private double confiance;

    public SpeechToTextResponse() {}

    public SpeechToTextResponse(String texte, String texteFrancais, String langue, double confiance) {
        this.texte = texte;
        this.texteFrancais = texteFrancais;
        this.langue = langue;
        this.confiance = confiance;
    }

    public String getTexte() { return texte; }
    public void setTexte(String texte) { this.texte = texte; }
    public String getTexteFrancais() { return texteFrancais; }
    public void setTexteFrancais(String texteFrancais) { this.texteFrancais = texteFrancais; }
    public String getLangue() { return langue; }
    public void setLangue(String langue) { this.langue = langue; }
    public double getConfiance() { return confiance; }
    public void setConfiance(double confiance) { this.confiance = confiance; }
}
