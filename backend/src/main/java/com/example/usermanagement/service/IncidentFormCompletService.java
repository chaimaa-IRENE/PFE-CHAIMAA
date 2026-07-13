package com.example.usermanagement.service;

import com.example.usermanagement.dto.IncidentFormRequest;
import com.example.usermanagement.dto.IncidentFormResponse;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IncidentFormCompletService {

    private static final List<StepDefinition> STEPS = List.of(
        new StepDefinition(1, "ville", "Fin kenti? (Casablanca / Rabat / Marrakech / Tanger / Fes / ville okhra)", "Où êtes-vous? (Casablanca / Rabat / Marrakech / Tanger / Fès / autre)"),
        new StepDefinition(2, "immatriculation", "Chno l'immatriculation dyal camion?", "Quelle est l'immatriculation du véhicule?"),
        new StepDefinition(3, "typePanne", "Chno naw3 dial panne? (Mécanique / Électrique / Caisse / Cabine / Sécurité / Autres)", "Type de panne? (Mécanique / Électrique / Caisse / Cabine / Sécurité / Autres)"),
        new StepDefinition(4, "criticite", "Wach l'mochkil bloquant wla la? (bloquant / non bloquant / sécurité)", "Criticité? (Bloquant / Non bloquant / Sécurité)"),
        new StepDefinition(5, "source", "Chno l'source dyal had l'panne? (Check-up / Alerte / Maintenance / Panne marché / Incident marché)", "Source? (Check-up / Fiche alerte / Maintenance / Panne marché / Incident marché)"),
        new StepDefinition(6, "elementVehicule", "Fino l'element dyal véhicule? (Cabine / Caisse / Éclairage / Froid / Mécanique / Papier)", "Élément? (Cabine / Caisse / Éclairage / Froid / Mécanique / Papier accessoire)"),
        new StepDefinition(7, "detailElement", "Wach kayn chi détail? (Klaxon / Plancher / Panneaux / Plafond / Face Avant / Ponts / Hayon / Lanière / March-pied / Poignée / Barres / Bandes / 3 points)", "Détail? (Klaxon / Plancher / Panneaux / Plafond / Face Avant / Ponts / Étanchéité / Lanière / March-pied / Hayon / Poignée / Barres / Bandes / 3 points)"),
        new StepDefinition(8, "categorie", "Chno l'catégorie? (Mécanique / Sécurité / Qualité / Visibilité / Doc légale / Extérieur)", "Catégorie? (Mécanique / Sécurité / Qualité / Visibilité / Documentation légale / Extérieur)"),
        new StepDefinition(9, "kilometrage", "Ch7al f kilométrage dyal camion?", "Kilométrage actuel du véhicule?"),
        new StepDefinition(10, "chauffeurNom", "Chno smiytek?", "Votre nom?"),
        new StepDefinition(11, "description", "3ti description kamla dyal l'panne.", "Description complète de l'incident.")
    );

    private static final Map<String, List<String>> CHOIX = new HashMap<>();
    static {
        CHOIX.put("ville", List.of("Casablanca", "Rabat", "Marrakech", "Tanger", "Fes"));
        CHOIX.put("typePanne", List.of("Mécanique", "Électrique", "Caisse", "Cabine", "Sécurité", "Autres"));
        CHOIX.put("criticite", List.of("bloquant", "non bloquant", "sécurité"));
        CHOIX.put("source", List.of("Check-up", "Alerte", "Maintenance", "Panne marché", "Incident marché"));
        CHOIX.put("elementVehicule", List.of("Cabine", "Caisse", "Éclairage", "Froid", "Mécanique", "Papier"));
        CHOIX.put("detailElement", List.of("Klaxon", "Plancher", "Panneaux", "Plafond", "Face Avant", "Ponts", "Étanchéité", "Lanière", "March-pied", "Hayon", "Poignée", "Barres", "Bandes", "3 points"));
        CHOIX.put("categorie", List.of("Mécanique", "Sécurité", "Qualité", "Visibilité", "Doc légale", "Extérieur"));
    }

    private final Map<String, Map<String, String>> sessions = new ConcurrentHashMap<>();
    private final RasaService rasaService;

    public IncidentFormCompletService(RasaService rasaService) {
        this.rasaService = rasaService;
    }

    public IncidentFormResponse startSession() {
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, new LinkedHashMap<>());
        return buildResponse(sessionId, 1, false, null);
    }

    public IncidentFormResponse processStep(IncidentFormRequest request) {
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.isEmpty()) {
            sessionId = UUID.randomUUID().toString();
        }

        sessions.putIfAbsent(sessionId, new LinkedHashMap<>());
        Map<String, String> formData = sessions.get(sessionId);

        int step = request.getStep();
        if (step < 1 || step > STEPS.size()) {
            return errorResponse(sessionId, "Step invalide: " + step);
        }

        String response = request.getResponse();
        if (response != null && !response.trim().isEmpty()) {
            StepDefinition currentStepDef = STEPS.get(step - 1);
            String field = currentStepDef.field;
            String valeurNette;

            if ("description".equals(field) || "chauffeurNom".equals(field)) {
                valeurNette = response.trim();
            } else if ("kilometrage".equals(field)) {
                String chiffres = response.replaceAll("[^0-9]", "");
                valeurNette = chiffres.isEmpty() ? response.trim() : chiffres;
            } else {
                Map<String, String> analyse = rasaService.analyser(response);
                valeurNette = analyse.getOrDefault("intent", response.trim());
            }
            formData.put(field, valeurNette);
        }

        if (step >= STEPS.size()) {
            Map<String, String> finalData = new LinkedHashMap<>(formData);
            sessions.remove(sessionId);
            return buildResponse(sessionId, step, true, finalData);
        }

        return buildResponse(sessionId, step + 1, false, null);
    }

    private IncidentFormResponse buildResponse(String sessionId, int step, boolean done, Map<String, String> data) {
        IncidentFormResponse res = new IncidentFormResponse();
        res.setSessionId(sessionId);
        res.setCurrentStep(step);
        res.setDone(done);
        res.setData(data);
        if (!done && step >= 1 && step <= STEPS.size()) {
            StepDefinition s = STEPS.get(step - 1);
            res.setField(s.field);
            res.setQuestion(s.questionFrancais);
            res.setQuestionDarija(s.questionDarija);
        }
        return res;
    }

    private IncidentFormResponse errorResponse(String sessionId, String error) {
        IncidentFormResponse res = new IncidentFormResponse();
        res.setSessionId(sessionId);
        res.setError(error);
        return res;
    }

    public static List<StepDefinition> getSteps() {
        return STEPS;
    }

    public static Map<String, List<String>> getChoix() {
        return CHOIX;
    }

    public static class StepDefinition {
        public final int number;
        public final String field;
        public final String questionDarija;
        public final String questionFrancais;

        StepDefinition(int number, String field, String questionDarija, String questionFrancais) {
            this.number = number;
            this.field = field;
            this.questionDarija = questionDarija;
            this.questionFrancais = questionFrancais;
        }
    }
}
