package com.example.usermanagement.service;

import com.example.usermanagement.model.DeclarationFormData;
import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.repository.DeclarationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class DeclarationTransmissionService {

    @Autowired
    private DeclarationRepository declarationRepository;

    /**
     * Transmet automatiquement une déclaration vocale vers le module de déclaration standard
     */
    @Transactional
    public DeclarationIncident transmettreVersModuleDeclaration(DeclarationFormData formData) {
        DeclarationIncident declarationIncident = new DeclarationIncident();
        
        // Générer un numéro de demande
        declarationIncident.setNumeroDemande(genererNumeroDemande());
        
        // Date et heure actuelle
        LocalDateTime now = LocalDateTime.now();
        declarationIncident.setDateHeure(now);
        
        // Transférer les données bilingues
        declarationIncident.setDescriptionArabe(formData.getDescriptionArabe());
        declarationIncident.setDescriptionFrancais(formData.getDescriptionFrancais());
        
        // Extraire et mapper les informations
        declarationIncident.setLocation(formData.getLieuIncidentFrancais());
        declarationIncident.setTypePanne(formData.getTypePanneFrancais());
        
        // Véhicule (à partir des données vocales)
        if (formData.getTypeVehiculeFrancais() != null) {
            declarationIncident.setVehiculeType(formData.getTypeVehiculeFrancais());
        }
        
        // Statut initial
        declarationIncident.setStatut("EN_ATTENTE");
        
        // Criticité par défaut (peut être amélioré avec analyse du texte)
        declarationIncident.setCriticite("MOYEN");
        
        // ID du chauffeur
        declarationIncident.setChauffeurId(formData.getChauffeurId());
        
        // Matricule du chauffeur
        declarationIncident.setChauffeurMatricule(formData.getChauffeurMatricule());
        
        // Matricule du véhicule
        declarationIncident.setVehiculeImmatriculation(formData.getVehiculeMatricule());
        
        // Kilométrage
        declarationIncident.setKilometrage(formData.getKilometrage());
        
        // Définir l'ID du véhicule si disponible
        if (formData.getChauffeurId() != null) {
            // Pour l'instant, on peut assigner un véhicule par défaut ou laisser null
            // Dans une vraie implémentation, on pourrait récupérer le véhicule du chauffeur
        }
        
        // Sauvegarder dans le module de déclaration
        DeclarationIncident saved = declarationRepository.save(declarationIncident);
        
        // Log pour vérification
        System.out.println("Déclaration transmise - ID: " + saved.getIdIncident() + 
                          ", Date: " + saved.getDateHeure() + 
                          ", Numéro: " + saved.getNumeroDemande());
        
        return saved;
    }

    /**
     * Génère un numéro de demande unique au format INC-2026-000123
     */
    private String genererNumeroDemande() {
        int year = java.time.Year.now().getValue();
        long count = System.currentTimeMillis() % 10000;
        return String.format("INC-%d-%04d", year, count);
    }

    /**
     * Transmet avec notification (pour webhook ou autre système externe)
     */
    public void transmettreVersSystemeExterne(DeclarationFormData formData) {
        if (formData == null) return;

        String payload = buildWebhookPayload(formData);
        System.out.println("[TRANSMISSION] Envoi vers système externe — Declaration ID: " + formData.getId());

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                sendWebhook(payload, attempt);
                System.out.println("[TRANSMISSION] ✅ Transmis avec succès — Attempt: " + attempt);
                return;
            } catch (Exception e) {
                System.err.println("[TRANSMISSION] ❌ Échec tentative " + attempt + "/" + maxRetries + " — " + e.getMessage());
                if (attempt < maxRetries) {
                    try { Thread.sleep(1000 * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        }
        System.err.println("[TRANSMISSION] ❌ Toutes les tentatives épuisées — declaration " + formData.getId());
    }

    private String buildWebhookPayload(DeclarationFormData formData) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"event\":\"declaration_created\"");
        sb.append(",\"declarationId\":").append(formData.getId());
        if (formData.getChauffeurId() != null) sb.append(",\"chauffeurId\":").append(formData.getChauffeurId());
        if (formData.getVehiculeMatricule() != null) sb.append(",\"vehicule\":\"").append(escapeJson(formData.getVehiculeMatricule())).append("\"");
        if (formData.getTypePanneFrancais() != null) sb.append(",\"typePanne\":\"").append(escapeJson(formData.getTypePanneFrancais())).append("\"");
        if (formData.getDescriptionFrancais() != null) sb.append(",\"description\":\"").append(escapeJson(formData.getDescriptionFrancais())).append("\"");
        if (formData.getLieuIncidentFrancais() != null) sb.append(",\"lieu\":\"").append(escapeJson(formData.getLieuIncidentFrancais())).append("\"");
        sb.append(",\"timestamp\":\"").append(java.time.LocalDateTime.now().toString()).append("\"");
        sb.append("}");
        return sb.toString();
    }

    private void sendWebhook(String payload, int attempt) throws Exception {
        String webhookUrl = System.getenv().getOrDefault("DRIVERHUB_WEBHOOK_URL", "");
        if (webhookUrl.isBlank()) {
            System.out.println("[TRANSMISSION] 📋 Mode simulation — aucun webhook configuré (DRIVERHUB_WEBHOOK_URL)");
            return;
        }
        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) new java.net.URL(webhookUrl).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("X-DriverHub-Source", "transmission-service");
        conn.setDoOutput(true);
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(10000);

        try (java.io.OutputStream os = conn.getOutputStream()) {
            os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }

        int responseCode = conn.getResponseCode();
        if (responseCode >= 200 && responseCode < 300) {
            System.out.println("[TRANSMISSION] Webhook response: " + responseCode);
        } else {
            throw new Exception("Webhook returned HTTP " + responseCode);
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
