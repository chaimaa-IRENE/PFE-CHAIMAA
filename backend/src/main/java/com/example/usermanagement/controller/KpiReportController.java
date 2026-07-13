package com.example.usermanagement.controller;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fleet/kpi")
@CrossOrigin(origins = "*")
public class KpiReportController {

    private final DriverChecklistRepository checklistRepository;
    private final VehicleBlockingRepository blockingRepository;
    private final VehiculeRepository vehiculeRepository;
    private final DeclarationRepository declarationRepository;
    private final LegalDocumentRepository documentRepository;

    public KpiReportController(DriverChecklistRepository checklistRepository,
                               VehicleBlockingRepository blockingRepository,
                               VehiculeRepository vehiculeRepository,
                               DeclarationRepository declarationRepository,
                               LegalDocumentRepository documentRepository) {
        this.checklistRepository = checklistRepository;
        this.blockingRepository = blockingRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.declarationRepository = declarationRepository;
        this.documentRepository = documentRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        final LocalDate start;
        final LocalDate end;
        if ("daily".equals(period)) { start = LocalDate.now(); end = LocalDate.now(); }
        else if ("weekly".equals(period)) { start = LocalDate.now().minusWeeks(1); end = LocalDate.now(); }
        else if ("monthly".equals(period)) { start = LocalDate.now().minusMonths(1); end = LocalDate.now(); }
        else { start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusDays(30); end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now(); }

        List<DriverChecklist> checklists = checklistRepository.findAllByOrderByDateChecklistDesc();
        List<DriverChecklist> filtered = checklists.stream()
            .filter(cl -> {
                if (cl.getDateChecklist() == null) return false;
                LocalDate d = cl.getDateChecklist().toLocalDate();
                return !d.isBefore(start) && !d.isAfter(end);
            })
            .collect(Collectors.toList());

        long totalControls = filtered.size();
        long conformes = filtered.stream().filter(cl -> Boolean.TRUE.equals(cl.getEstConforme())).count();
        long nonConformes = filtered.stream().filter(cl -> Boolean.FALSE.equals(cl.getEstConforme())).count();
        double tauxConformite = totalControls > 0 ? Math.round(conformes * 10000.0 / totalControls) / 100.0 : 0;

        List<VehicleBlocking> blockings = blockingRepository.findAllByOrderByDateBlocageDesc();
        long vehiculesBloques = blockings.stream()
            .filter(b -> b.getDateDeblocage() == null)
            .count();

        long reparations = filtered.stream().filter(cl -> Boolean.TRUE.equals(cl.getPostRepair())).count();
        double tauxReparation = nonConformes > 0 ? Math.round(reparations * 10000.0 / nonConformes) / 100.0 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periode", Map.of("debut", start.toString(), "fin", end.toString()));
        result.put("controlesRealises", totalControls);
        result.put("conformes", conformes);
        result.put("nonConformes", nonConformes);
        result.put("tauxConformite", tauxConformite);
        result.put("tauxReparation", tauxReparation);
        result.put("vehiculesBloques", vehiculesBloques);
        result.put("reparations", reparations);

        Map<String, Long> byItem = new LinkedHashMap<>();
        String[] items = {"pneus", "freins", "feux", "extincteur", "documents", "carrosserie", "huileNiveau", "batterie", "essuieGlaces", "ceinturesSecurite"};
        for (String item : items) {
            long count = filtered.stream().filter(cl -> {
                try {
                    var method = cl.getClass().getMethod("get" + Character.toUpperCase(item.charAt(0)) + item.substring(1));
                    Object val = method.invoke(cl);
                    return Boolean.FALSE.equals(val);
                } catch (Exception e) { return false; }
            }).count();
            if (count > 0) byItem.put(item, count);
        }
        result.put("nonConformitesParItem", byItem);

        Map<String, Long> byChauffeur = filtered.stream()
            .filter(cl -> cl.getChauffeurNom() != null && !cl.getChauffeurNom().isBlank())
            .collect(Collectors.groupingBy(DriverChecklist::getChauffeurNom, Collectors.counting()));
        result.put("controlesParChauffeur", byChauffeur);

        Map<String, Long> byImmatriculation = filtered.stream()
            .filter(cl -> cl.getVehiculeImmatriculation() != null)
            .collect(Collectors.groupingBy(DriverChecklist::getVehiculeImmatriculation, Collectors.counting()));
        result.put("controlesParVehicule", byImmatriculation);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        final LocalDate start;
        final LocalDate end;
        if ("daily".equals(period)) { start = LocalDate.now(); end = LocalDate.now(); }
        else if ("weekly".equals(period)) { start = LocalDate.now().minusWeeks(1); end = LocalDate.now(); }
        else if ("monthly".equals(period)) { start = LocalDate.now().minusMonths(1); end = LocalDate.now(); }
        else { start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusDays(30); end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now(); }

        List<DriverChecklist> checklists = checklistRepository.findAllByOrderByDateChecklistDesc();
        List<DriverChecklist> filtered = checklists.stream()
            .filter(cl -> {
                if (cl.getDateChecklist() == null) return false;
                LocalDate d = cl.getDateChecklist().toLocalDate();
                return !d.isBefore(start) && !d.isAfter(end);
            })
            .collect(Collectors.toList());

        Map<LocalDate, List<DriverChecklist>> grouped = filtered.stream()
            .filter(cl -> cl.getDateChecklist() != null)
            .collect(Collectors.groupingBy(cl -> cl.getDateChecklist().toLocalDate()));

        List<Map<String, Object>> history = new ArrayList<>();
        grouped.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(entry -> {
                LocalDate date = entry.getKey();
                List<DriverChecklist> dayList = entry.getValue();
                long total = dayList.size();
                long conf = dayList.stream().filter(cl -> Boolean.TRUE.equals(cl.getEstConforme())).count();
                double taux = total > 0 ? Math.round(conf * 10000.0 / total) / 100.0 : 0;

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("date", date.toString());
                row.put("controles", total);
                row.put("conformes", conf);
                row.put("nonConformes", total - conf);
                row.put("tauxConformite", taux);
                history.add(row);
            });

        return ResponseEntity.ok(history);
    }

    @GetMapping("/temps-traitement")
    public ResponseEntity<Map<String, Object>> getTempsTraitement() {
        List<VehicleBlocking> blockings = blockingRepository.findAllByOrderByDateBlocageDesc();

        List<Long> durations = blockings.stream()
            .filter(b -> b.getDateDeblocage() != null && b.getDateBlocage() != null)
            .map(b -> ChronoUnit.HOURS.between(b.getDateBlocage(), b.getDateDeblocage()))
            .filter(d -> d >= 0)
            .sorted()
            .collect(Collectors.toList());

        double moyenne = durations.stream().mapToLong(Long::longValue).average().orElse(0);
        double mediane = durations.isEmpty() ? 0 : durations.get(durations.size() / 2);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tempsMoyenHeures", Math.round(moyenne * 10.0) / 10.0);
        result.put("tempsMedianHeures", Math.round(mediane * 10.0) / 10.0);
        result.put("blocagesTraites", durations.size());
        result.put("blocagesEnCours", blockings.stream().filter(b -> b.getDateDeblocage() == null).count());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/documents-stats")
    public ResponseEntity<Map<String, Object>> getDocumentsStats() {
        List<LegalDocument> docs = documentRepository.findAll();
        long total = docs.size();
        long valides = docs.stream().filter(d -> "VALIDE".equals(d.getStatut())).count();
        long expires = docs.stream().filter(d -> "EXPIRE".equals(d.getStatut())).count();
        long bientotExpires = docs.stream().filter(d -> "BIENTOT_EXPIRE".equals(d.getStatut())).count();
        long enAttente = docs.stream().filter(d -> "EN_ATTENTE".equals(d.getStatut()) || d.getStatut() == null).count();

        Map<String, Long> byType = docs.stream()
            .filter(d -> d.getType() != null)
            .collect(Collectors.groupingBy(LegalDocument::getType, Collectors.counting()));

        Map<String, Long> byTypeValide = docs.stream()
            .filter(d -> d.getType() != null && "VALIDE".equals(d.getStatut()))
            .collect(Collectors.groupingBy(LegalDocument::getType, Collectors.counting()));

        Map<String, Long> byTypeExpire = docs.stream()
            .filter(d -> d.getType() != null && "EXPIRE".equals(d.getStatut()))
            .collect(Collectors.groupingBy(LegalDocument::getType, Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("valides", valides);
        result.put("expires", expires);
        result.put("bientotExpires", bientotExpires);
        result.put("enAttente", enAttente);
        result.put("tauxConformite", total > 0 ? Math.round(valides * 10000.0 / total) / 100.0 : 0);
        result.put("parType", byType);
        result.put("parTypeValide", byTypeValide);
        result.put("parTypeExpire", byTypeExpire);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/tendances")
    public ResponseEntity<Map<String, Object>> getTendances(@RequestParam(defaultValue = "30") int jours) {
        LocalDate debut = LocalDate.now().minusDays(jours);
        List<DriverChecklist> checklists = checklistRepository.findAllByOrderByDateChecklistDesc();

        List<DriverChecklist> filtered = checklists.stream()
            .filter(cl -> cl.getDateChecklist() != null && !cl.getDateChecklist().toLocalDate().isBefore(debut))
            .collect(Collectors.toList());

        Map<String, Long> parMarque = new LinkedHashMap<>();
        Map<String, Long> parCategorie = new LinkedHashMap<>();
        Map<String, Object> evolutionParJour = new LinkedHashMap<>();

        Map<LocalDate, Map<String, Long>> dailyByResult = new TreeMap<>();
        for (DriverChecklist cl : filtered) {
            if (cl.getVehiculeImmatriculation() != null) {
                String imm = cl.getVehiculeImmatriculation();
                parMarque.merge(imm, 1L, Long::sum);
            }
            if (cl.getDefautsJson() != null && !cl.getDefautsJson().isBlank()) {
                try {
                    String cat = "non-conforme";
                    parCategorie.merge(cat, 1L, Long::sum);
                } catch (Exception ignored) {}
            }
            if (cl.getDateChecklist() != null) {
                LocalDate day = cl.getDateChecklist().toLocalDate();
                dailyByResult.computeIfAbsent(day, k -> new LinkedHashMap<>())
                    .merge(Boolean.TRUE.equals(cl.getEstConforme()) ? "conforme" : "nonConforme", 1L, Long::sum);
            }
        }

        List<Map<String, Object>> evolution = new ArrayList<>();
        dailyByResult.forEach((date, counts) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", date.toString());
            row.putAll(counts);
            evolution.add(row);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodeJours", jours);
        result.put("totalChecklists", filtered.size());
        result.put("parMarque", parMarque.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new)));
        result.put("parCategorie", parCategorie);
        result.put("evolutionQuotidienne", evolution);

        return ResponseEntity.ok(result);
    }
}