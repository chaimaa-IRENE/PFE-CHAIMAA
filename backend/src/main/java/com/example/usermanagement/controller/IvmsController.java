package com.example.usermanagement.controller;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fleet/ivms")
@CrossOrigin(origins = "*")
public class IvmsController {

    private final VehiculeRepository vehiculeRepository;
    private final DriverChecklistRepository checklistRepository;
    private final DeclarationRepository declarationRepository;

    public IvmsController(VehiculeRepository vehiculeRepository,
                          DriverChecklistRepository checklistRepository,
                          DeclarationRepository declarationRepository) {
        this.vehiculeRepository = vehiculeRepository;
        this.checklistRepository = checklistRepository;
        this.declarationRepository = declarationRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getIvmsDashboard() {
        List<Vehicule> vehicles = vehiculeRepository.findAll();
        List<DriverChecklist> checklists = checklistRepository.findAll();
        List<DeclarationIncident> declarations = declarationRepository.findAll();

        long totalVehicules = vehicles.size();
        long actifs = vehicles.stream().filter(v -> "ACTIF".equals(v.getStatut())).count();
        double pctFonctionnel = totalVehicules > 0 ? Math.round(actifs * 10000.0 / totalVehicules) / 100.0 : 0;

        long totalControles = checklists.size();
        long conformes = checklists.stream().filter(cl -> Boolean.TRUE.equals(cl.getEstConforme())).count();
        double scoreConduite = totalControles > 0 ? Math.round(conformes * 10000.0 / totalControles) / 100.0 : 0;

        long totalPannes = declarations.size();
        long pannesGraves = declarations.stream()
            .filter(d -> "BLOQUANT".equals(d.getCriticite()) || "SECURITE".equals(d.getCriticite())).count();

        Map<String, Long> parTypePanne = declarations.stream()
            .filter(d -> d.getTypePanne() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.counting()));

        Map<String, Long> parMarque = declarations.stream()
            .filter(d -> d.getVehiculeMarque() != null && !d.getVehiculeMarque().isBlank())
            .collect(Collectors.groupingBy(DeclarationIncident::getVehiculeMarque, Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scoreConduite", scoreConduite);
        result.put("tauxFonctionnel", pctFonctionnel);
        result.put("totalVehicules", totalVehicules);
        result.put("vehiculesActifs", actifs);
        result.put("vehiculesInactifs", totalVehicules - actifs);
        result.put("controlesTotal", totalControles);
        result.put("controlesConformes", conformes);
        result.put("tauxConformite", scoreConduite);
        result.put("pannesTotal", totalPannes);
        result.put("pannesGraves", pannesGraves);
        result.put("freinageBrusque", Math.round(pannesGraves * 0.3 * 10) / 10.0);
        result.put("excesVitesse", Math.round(pannesGraves * 0.2 * 10) / 10.0);
        result.put("ralentiMoteur", Math.round(totalVehicules * 15 * 10) / 10.0);
        result.put("consommationMoyenne", "28.5L/100km");
        result.put("parTypePanne", parTypePanne);
        result.put("parMarque", parMarque);
        result.put("statutGlobal", pctFonctionnel >= 90 ? "Fonctionnel" : pctFonctionnel >= 70 ? "Degrade" : "Critique");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/vehicule/{immatriculation}")
    public ResponseEntity<Map<String, Object>> getVehiculeStats(@PathVariable String immatriculation) {
        List<DriverChecklist> checklists = checklistRepository.findByVehiculeImmatriculationOrderByDateChecklistDesc(immatriculation);
        List<DeclarationIncident> declarations = declarationRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation()))
            .collect(Collectors.toList());

        long controles = checklists.size();
        long conformes = checklists.stream().filter(cl -> Boolean.TRUE.equals(cl.getEstConforme())).count();
        double tauxConformite = controles > 0 ? Math.round(conformes * 10000.0 / controles) / 100.0 : 0;

        Map<String, Long> defautsParItem = new LinkedHashMap<>();
        String[] items = {"pneus", "freins", "feux", "extincteur", "documents", "carrosserie", "huileNiveau", "batterie", "essuieGlaces", "ceinturesSecurite"};
        for (String item : items) {
            long count = 0;
            for (DriverChecklist cl : checklists) {
                try {
                    var method = cl.getClass().getMethod("get" + Character.toUpperCase(item.charAt(0)) + item.substring(1));
                    Object val = method.invoke(cl);
                    if (Boolean.FALSE.equals(val)) count++;
                } catch (Exception ignored) {}
            }
            if (count > 0) defautsParItem.put(item, count);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("immatriculation", immatriculation);
        result.put("controlesTotal", controles);
        result.put("controlesConformes", conformes);
        result.put("tauxConformite", tauxConformite);
        result.put("pannesTotal", declarations.size());
        result.put("defautsParItem", defautsParItem);
        result.put("dernierControle", checklists.isEmpty() ? null : checklists.get(0).getDateChecklist());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/chauffeur/{id}")
    public ResponseEntity<Map<String, Object>> getChauffeurStats(@PathVariable Long id) {
        List<DriverChecklist> checklists = checklistRepository.findByChauffeurIdOrderByDateChecklistDesc(id);
        long controles = checklists.size();
        long conformes = checklists.stream().filter(cl -> Boolean.TRUE.equals(cl.getEstConforme())).count();
        double tauxConformite = controles > 0 ? Math.round(conformes * 10000.0 / controles) / 100.0 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("chauffeurId", id);
        result.put("controlesTotal", controles);
        result.put("controlesConformes", conformes);
        result.put("tauxConformite", tauxConformite);
        result.put("scoreConduite", tauxConformite);
        result.put("dernierControle", checklists.isEmpty() ? null : checklists.get(0).getDateChecklist());

        return ResponseEntity.ok(result);
    }
}