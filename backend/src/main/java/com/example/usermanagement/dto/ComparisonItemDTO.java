package com.example.usermanagement.dto;

public class ComparisonItemDTO {
    private String element;
    private boolean presentPhysiquement;
    private boolean valideAdministrativement;
    private String statut;
    private String message;

    public ComparisonItemDTO(String element, boolean presentPhysiquement, boolean valideAdministrativement) {
        this.element = element;
        this.presentPhysiquement = presentPhysiquement;
        this.valideAdministrativement = valideAdministrativement;
        if (presentPhysiquement && valideAdministrativement) {
            this.statut = "CONFORME";
            this.message = "Conforme";
        } else if (!presentPhysiquement && valideAdministrativement) {
            this.statut = "ALERTE";
            this.message = "Chauffeur oublie document";
        } else if (presentPhysiquement && !valideAdministrativement) {
            this.statut = "CRITIQUE";
            this.message = "Document perime";
        } else {
            this.statut = "BLOQUANT";
            this.message = "Vehicule bloque";
        }
    }

    public String getElement() { return element; }
    public void setElement(String element) { this.element = element; }
    public boolean isPresentPhysiquement() { return presentPhysiquement; }
    public void setPresentPhysiquement(boolean presentPhysiquement) { this.presentPhysiquement = presentPhysiquement; }
    public boolean isValideAdministrativement() { return valideAdministrativement; }
    public void setValideAdministrativement(boolean valideAdministrativement) { this.valideAdministrativement = valideAdministrativement; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
