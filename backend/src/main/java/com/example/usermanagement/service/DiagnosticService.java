package com.example.usermanagement.service;

import com.example.usermanagement.dto.DiagnosticResponse;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DiagnosticService {

    public DiagnosticResponse diagnostiquer(Map<String, String> formData) {
        String typePanne = formData.getOrDefault("typePanne", "").toLowerCase();
        String elementVehicule = formData.getOrDefault("elementVehicule", "").toLowerCase();
        String detail = formData.getOrDefault("detail", "").toLowerCase();
        String criticite = formData.getOrDefault("criticite", "").toLowerCase();
        String description = formData.getOrDefault("description", "");

        String diagnostic;
        String suggestion;
        int niveauUrgence;
        String criticiteFinale;

        boolean estGrave = criticite.contains("khbar") || criticite.contains("grave")
            || criticite.contains("serious") || criticite.contains("khatar")
            || criticite.contains("bezzaf") || criticite.contains("kbiro");

        boolean estFrein = typePanne.contains("frein") || typePanne.contains("brake")
            || elementVehicule.contains("frein") || elementVehicule.contains("brake");

        boolean estMoteur = typePanne.contains("moteur") || typePanne.contains("engine")
            || elementVehicule.contains("moteur") || elementVehicule.contains("engine");

        boolean estBatterie = typePanne.contains("batterie") || typePanne.contains("battery")
            || typePanne.contains("batri");

        boolean estBruit = detail.contains("bruit") || detail.contains("tla3")
            || detail.contains("sout") || detail.contains("voix");

        if (estFrein) {
            diagnostic = "Mochkil f frein. Hada khatar 3la salamtek.";
            suggestion = "Wakha, khassek t9ef f'hal bla ma tzid tmshi. Frein makhdamch yqder yseb lik accident.";
            niveauUrgence = 5;
            criticiteFinale = "BLOQUANT";
        } else if (estMoteur && estBruit) {
            diagnostic = "Mochkil f moteur + bruit ghrib. Hada mochkil kbir.";
            suggestion = "Khassek t9ef w t3ayn l'mekanicien daba. Moteur fih bruit ya3ni kayn chi haja ra katkesser.";
            niveauUrgence = 4;
            criticiteFinale = "BLOQUANT";
        } else if (estMoteur) {
            diagnostic = "Mochkil f moteur. Mochkil sghir ila b9a hadi ghir l'awal.";
            suggestion = "Ila moteur khdam b zahri, t9ef w tchouf. Ila makhdamch mzyan, 3ayn l'mekanicien.";
            niveauUrgence = 3;
            criticiteFinale = "NON_BLOQUANT";
        } else if (estBatterie) {
            diagnostic = "Mochkil f batterie. Mochkil sghir.";
            suggestion = "Ila batterie mchiya, t9ef w t3ayn chi wahd y3awnk ybeddel-ha. Ila sghir, kammel.";
            niveauUrgence = 2;
            criticiteFinale = "NON_BLOQUANT";
        } else if (estGrave) {
            diagnostic = "Mochkil kbir 7sab ma 9ulti.";
            suggestion = "Khassek t9ef f'hal w t3ayn support technique.";
            niveauUrgence = 4;
            criticiteFinale = "BLOQUANT";
        } else {
            diagnostic = "Mochkil f " + typePanne.replaceFirst("^.*", typePanne.isEmpty() ? "véhicule" : typePanne);
            suggestion = "Ila mochkil sghir, kammel. Ila kbir, 3ayn l'mekanicien.";
            niveauUrgence = 1;
            criticiteFinale = "NON_BLOQUANT";
        }

        if (detail.contains("vibration") || detail.contains("raje") || detail.contains("rt3ach")) {
            diagnostic += " (kayn vibration)";
            if (niveauUrgence < 3) niveauUrgence = 3;
        }

        DiagnosticResponse res = new DiagnosticResponse();
        res.setDiagnostic(diagnostic);
        res.setSuggestion(suggestion);
        res.setCriticite(criticiteFinale);
        res.setNiveauUrgence(niveauUrgence);

        Map<String, String> json = new HashMap<>();
        json.put("typePanne", formData.getOrDefault("typePanne", ""));
        json.put("elementVehicule", formData.getOrDefault("elementVehicule", ""));
        json.put("detail", formData.getOrDefault("detail", ""));
        json.put("criticite", criticiteFinale);
        json.put("description", description);
        res.setFormulaireJson(json);

        return res;
    }
}
