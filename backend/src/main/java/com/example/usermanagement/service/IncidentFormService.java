package com.example.usermanagement.service;

import com.example.usermanagement.dto.IncidentFormRequest;
import com.example.usermanagement.dto.IncidentFormResponse;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IncidentFormService {

    private static final List<StepDefinition> STEPS = List.of(
        new StepDefinition(1, "typePanne", "Chno naw3 dial panne?", "Chno naw3 dial panne? (moteur / frein / batterie…)"),
        new StepDefinition(2, "elementVehicule", "Fin kayn mochkil?", "Fin kayn mochkil? (9dam / lor / moteur…)"),
        new StepDefinition(3, "detail", "Wach kayn bruit, vibration, ou ay haja okhra?", "Wach kayn bruit, vibration, ou ay haja okhra?"),
        new StepDefinition(4, "criticite", "Ch7al hadi bdat had problem?", "Ch7al hadi bdat had problem?"),
        new StepDefinition(5, "description", "3ti description kamla dyal l'panne.", "3ti description kamla dyal l'panne.")
    );

    private final Map<String, Map<String, String>> sessions = new ConcurrentHashMap<>();
    private final RasaService rasaService;

    public IncidentFormService(RasaService rasaService) {
        this.rasaService = rasaService;
    }

    public IncidentFormResponse startSession() {
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, new HashMap<>());
        return buildResponse(sessionId, 1, false, null);
    }

    public IncidentFormResponse processStep(IncidentFormRequest request) {
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.isEmpty()) {
            sessionId = UUID.randomUUID().toString();
        }

        sessions.putIfAbsent(sessionId, new HashMap<>());
        Map<String, String> formData = sessions.get(sessionId);

        int step = request.getStep();
        if (step < 1 || step > STEPS.size()) {
            return errorResponse(sessionId, "Step invalide: " + step);
        }

        String response = request.getResponse();
        if (response != null && !response.trim().isEmpty()) {
            StepDefinition currentStepDef = STEPS.get(step - 1);
            String valeurNette;
            if ("description".equals(currentStepDef.field)) {
                valeurNette = response.trim();
            } else {
                Map<String, String> analyse = rasaService.analyser(response);
                valeurNette = analyse.getOrDefault("intent", response.trim());
            }
            formData.put(currentStepDef.field, valeurNette);
        }

        if (step >= STEPS.size()) {
            Map<String, String> finalData = new HashMap<>(formData);
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

    private static class StepDefinition {
        final int number;
        final String field;
        final String questionDarija;
        final String questionFrancais;

        StepDefinition(int number, String field, String questionDarija, String questionFrancais) {
            this.number = number;
            this.field = field;
            this.questionDarija = questionDarija;
            this.questionFrancais = questionFrancais;
        }
    }
}
