package com.example.usermanagement.controller;

import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.model.DriverChecklist;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.DeclarationRepository;
import com.example.usermanagement.repository.DriverChecklistRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/powerbi")
@CrossOrigin(origins = "*")
public class PowerBiAnalyticsController {

    private final DeclarationRepository declarationRepository;
    private final DriverChecklistRepository checklistRepository;
    private final VehiculeRepository vehiculeRepository;

    public PowerBiAnalyticsController(DeclarationRepository declarationRepository,
                                       DriverChecklistRepository checklistRepository,
                                       VehiculeRepository vehiculeRepository) {
        this.declarationRepository = declarationRepository;
        this.checklistRepository = checklistRepository;
        this.vehiculeRepository = vehiculeRepository;
    }

    @GetMapping("/declarations-mensuelles")
    public ResponseEntity<?> getDeclarationsMensuelles() {
        List<DeclarationIncident> all = declarationRepository.findAll();
        Map<String, Long> parMois = all.stream()
            .filter(d -> d.getDateHeure() != null)
            .collect(Collectors.groupingBy(
                d -> d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                TreeMap::new,
                Collectors.counting()
            ));
        Map<String, Map<String, Long>> parMoisEtStatut = all.stream()
            .filter(d -> d.getDateHeure() != null && d.getStatut() != null)
            .collect(Collectors.groupingBy(
                d -> d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                TreeMap::new,
                Collectors.groupingBy(DeclarationIncident::getStatut, Collectors.counting())
            ));
        List<Map<String, Object>> result = new ArrayList<>();
        for (String mois : parMois.keySet()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("mois", mois);
            entry.put("total", parMois.get(mois));
            Map<String, Long> parStatut = parMoisEtStatut.getOrDefault(mois, new LinkedHashMap<>());
            entry.put("EN_ATTENTE", parStatut.getOrDefault("EN_ATTENTE", 0L));
            entry.put("EN_COURS", parStatut.getOrDefault("EN_COURS", 0L));
            entry.put("CLOTURE", parStatut.getOrDefault("CLOTURE", 0L));
            entry.put("RESOLU", parStatut.getOrDefault("RESOLU", 0L));
            entry.put("BLOQUE", parStatut.getOrDefault("BLOQUE", 0L));
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/declarations-par-vehicule")
    public ResponseEntity<?> getDeclarationsParVehicule() {
        List<Vehicule> vehicules = vehiculeRepository.findAll();
        List<DeclarationIncident> all = declarationRepository.findAll();
        Map<String, Map<String, Object>> parVeh = new LinkedHashMap<>();
        for (Vehicule v : vehicules) {
            if (v.getImmatriculation() == null) continue;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("immatriculation", v.getImmatriculation());
            entry.put("marque", v.getMarque());
            entry.put("modele", v.getModele());
            entry.put("chauffeurNom", v.getChauffeurNom());
            entry.put("statut", v.getStatut());
            entry.put("totalDeclarations", 0L);
            entry.put("bloquantes", 0L);
            entry.put("resolues", 0L);
            entry.put("coutTotal", 0.0);
            parVeh.put(v.getImmatriculation(), entry);
        }
        for (DeclarationIncident d : all) {
            String im = d.getVehiculeImmatriculation();
            if (im == null) continue;
            Map<String, Object> entry = parVeh.computeIfAbsent(im, k -> {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("immatriculation", im);
                e.put("marque", d.getVehiculeMarque());
                e.put("modele", d.getVehiculeModele());
                e.put("chauffeurNom", d.getChauffeurNom());
                e.put("statut", "ACTIF");
                e.put("totalDeclarations", 0L);
                e.put("bloquantes", 0L);
                e.put("resolues", 0L);
                e.put("coutTotal", 0.0);
                return e;
            });
            entry.put("totalDeclarations", (Long) entry.get("totalDeclarations") + 1);
            if ("BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite()))
                entry.put("bloquantes", (Long) entry.get("bloquantes") + 1);
            if ("CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut()))
                entry.put("resolues", (Long) entry.get("resolues") + 1);
            if (d.getCoutProbleme() != null)
                entry.put("coutTotal", (Double) entry.get("coutTotal") + d.getCoutProbleme());
        }
        return ResponseEntity.ok(parVeh.values());
    }

    @GetMapping("/export-declarations")
    public ResponseEntity<?> exportDeclarations() {
        List<DeclarationIncident> all = declarationRepository.findAll();
        List<Map<String, Object>> flat = all.stream().map(d -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", d.getIdIncident());
            row.put("numeroDemande", d.getNumeroDemande());
            row.put("dateDeclaration", d.getDateHeure() != null ? d.getDateHeure().toString() : null);
            row.put("dateReclamation", d.getDateReclamation() != null ? d.getDateReclamation().toString() : null);
            row.put("mois", d.getMois());
            row.put("typePanne", d.getTypePanne());
            row.put("criticite", d.getCriticite());
            row.put("statut", d.getStatut());
            row.put("etat", d.getEtat());
            row.put("elementVehicule", d.getElementVehicule());
            row.put("detailElement", d.getDetailElement());
            row.put("categorie", d.getCategorie());
            row.put("location", d.getLocation());
            row.put("lieu", d.getLieu());
            row.put("source", d.getSource());
            row.put("chauffeurNom", d.getChauffeurNom());
            row.put("chauffeurMatricule", d.getChauffeurMatricule());
            row.put("vehiculeImmatriculation", d.getVehiculeImmatriculation());
            row.put("vehiculeMarque", d.getVehiculeMarque());
            row.put("vehiculeModele", d.getVehiculeModele());
            row.put("vehiculeType", d.getVehiculeType());
            row.put("kilometrage", d.getKilometrage());
            row.put("coutProbleme", d.getCoutProbleme());
            row.put("budgetMensuel", d.getBudgetMensuel());
            row.put("dureeReparation", d.getDureeReparation());
            row.put("dateDebutIntervention", d.getDateDebutIntervention() != null ? d.getDateDebutIntervention().toString() : null);
            row.put("dateReparation", d.getDateReparation() != null ? d.getDateReparation().toString() : null);
            row.put("descriptionFrancais", d.getDescriptionFrancais());
            row.put("descriptionArabe", d.getDescriptionArabe());
            row.put("sla", d.getSla());
            row.put("contratBonCommande", d.getContratBonCommande());
            row.put("qualification", d.getQualification());
            row.put("tournee", d.getTournee());
            row.put("numeroOrdreCamion", d.getNumeroOrdreCamion());
            row.put("actionsRealisees", d.getActionsRealisees());
            row.put("piecesNecessaires", d.getPiecesNecessaires());
            row.put("motifRefus", d.getMotifRefus());
            return row;
        }).collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", flat.size());
        result.put("rows", flat);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/export-checklists")
    public ResponseEntity<?> exportChecklists() {
        List<DriverChecklist> all = checklistRepository.findAllByOrderByDateChecklistDesc();
        List<Map<String, Object>> flat = all.stream().map(c -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", c.getId());
            row.put("chauffeurNom", c.getChauffeurNom());
            row.put("chauffeurMatricule", c.getChauffeurMatricule());
            row.put("chauffeurId", c.getChauffeurId());
            row.put("vehiculeImmatriculation", c.getVehiculeImmatriculation());
            row.put("vehiculeId", c.getVehiculeId());
            row.put("dateChecklist", c.getDateChecklist() != null ? c.getDateChecklist().toString() : null);
            row.put("statut", c.getStatut());
            row.put("estConforme", c.getEstConforme());
            row.put("pneus", c.getPneus());
            row.put("freins", c.getFreins());
            row.put("feux", c.getFeux());
            row.put("extincteur", c.getExtincteur());
            row.put("documents", c.getDocuments());
            row.put("carrosserie", c.getCarrosserie());
            row.put("huileNiveau", c.getHuileNiveau());
            row.put("batterie", c.getBatterie());
            row.put("essuieGlaces", c.getEssuieGlaces());
            row.put("ceinturesSecurite", c.getCeinturesSecurite());
            row.put("commentaireGeneral", c.getCommentaireGeneral());
            row.put("validePar", c.getValidePar());
            row.put("dateValidation", c.getDateValidation() != null ? c.getDateValidation().toString() : null);
            row.put("motifRefus", c.getMotifRefus());
            row.put("postRepair", c.getPostRepair());
            row.put("feedback", c.getFeedback());
            return row;
        }).collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", flat.size());
        result.put("rows", flat);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/indicateurs")
    public ResponseEntity<?> getIndicateurs() {
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<DriverChecklist> cks = checklistRepository.findAll();
        List<Vehicule> vehs = vehiculeRepository.findAll();

        long totalDeclarations = decs.size();
        long resolues = decs.stream().filter(d -> "CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())).count();
        long bloquantes = decs.stream().filter(d -> "BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite())).count();
        double coutTotal = decs.stream().filter(d -> d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).sum();
        double coutMoyen = totalDeclarations > 0 ? coutTotal / totalDeclarations : 0;

        long totalCheckups = cks.size();
        long conformes = cks.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();
        long nonConformes = cks.stream().filter(c -> Boolean.FALSE.equals(c.getEstConforme())).count();
        long enAttente = cks.stream().filter(c -> "PENDING".equals(c.getStatut())).count();
        double tauxConformite = totalCheckups > 0 ? Math.round((double) conformes / totalCheckups * 10000.0) / 100.0 : 0;
        double tauxResolution = totalDeclarations > 0 ? Math.round((double) resolues / totalDeclarations * 10000.0) / 100.0 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalVehicules", vehs.size());
        result.put("totalDeclarations", totalDeclarations);
        result.put("declarationsResolues", resolues);
        result.put("declarationsBloquantes", bloquantes);
        result.put("tauxResolution", tauxResolution);
        result.put("coutTotalProblemes", coutTotal);
        result.put("coutMoyenProbleme", coutMoyen);
        result.put("totalCheckups", totalCheckups);
        result.put("checkupsConformes", conformes);
        result.put("checkupsNonConformes", nonConformes);
        result.put("checkupsEnAttente", enAttente);
        result.put("tauxConformite", tauxConformite);

        // Types de pannes les plus fréquentes
        Map<String, Long> topPannes = decs.stream()
            .filter(d -> d.getTypePanne() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
        result.put("topPannes", topPannes);

        // Éléments de checkup les plus défaillants
        Map<String, Long> defautsCheckup = new LinkedHashMap<>();
        for (DriverChecklist c : cks) {
            if (Boolean.FALSE.equals(c.getPneus())) defautsCheckup.merge("PNEUS", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getFreins())) defautsCheckup.merge("FREINS", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getFeux())) defautsCheckup.merge("FEUX", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getExtincteur())) defautsCheckup.merge("EXTINCTEUR", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getDocuments())) defautsCheckup.merge("DOCUMENTS", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getCarrosserie())) defautsCheckup.merge("CARROSSERIE", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getHuileNiveau())) defautsCheckup.merge("HUILE_NIVEAU", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getBatterie())) defautsCheckup.merge("BATTERIE", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getEssuieGlaces())) defautsCheckup.merge("ESSUIE_GLACES", 1L, Long::sum);
            if (Boolean.FALSE.equals(c.getCeinturesSecurite())) defautsCheckup.merge("CEINTURES", 1L, Long::sum);
        }
        result.put("defautsCheckupFrequents", defautsCheckup);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/checkups-par-mois")
    public ResponseEntity<?> getCheckupsParMois() {
        List<DriverChecklist> all = checklistRepository.findAllByOrderByDateChecklistDesc();
        Map<String, long[]> parMois = new TreeMap<>();
        for (DriverChecklist c : all) {
            if (c.getDateChecklist() == null) continue;
            String mois = c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            long[] stats = parMois.computeIfAbsent(mois, k -> new long[4]);
            stats[0]++;
            if (Boolean.TRUE.equals(c.getEstConforme())) stats[1]++;
            else if (Boolean.FALSE.equals(c.getEstConforme())) stats[2]++;
            if ("PENDING".equals(c.getStatut())) stats[3]++;
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, long[]> e : parMois.entrySet()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("mois", e.getKey());
            entry.put("total", e.getValue()[0]);
            entry.put("conformes", e.getValue()[1]);
            entry.put("nonConformes", e.getValue()[2]);
            entry.put("enAttente", e.getValue()[3]);
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    // ========== ALERTES AUTOMATIQUES ==========
    @GetMapping("/alertes")
    public ResponseEntity<?> getAlertes() {
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<Vehicule> vehs = vehiculeRepository.findAll();
        List<Map<String, Object>> alertes = new ArrayList<>();

        // Alerte 1: Anomalies critiques non traitées
        long critiquesNonTraitees = decs.stream()
            .filter(d -> ("CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite()))
                && !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut()))
            .count();
        if (critiquesNonTraitees > 0) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("type", "CRITIQUE");
            a.put("message", critiquesNonTraitees + " anomalie(s) critique(s) non traitée(s)");
            a.put("severite", "HAUTE");
            a.put("count", critiquesNonTraitees);
            alertes.add(a);
        }

        // Alerte 2: Véhicules immobilisés (statut non ACTIF)
        long immobilises = vehs.stream().filter(v -> !"ACTIF".equals(v.getStatut())).count();
        if (immobilises > 0) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("type", "IMMOBILISATION");
            a.put("message", immobilises + " véhicule(s) immobilisé(s)");
            a.put("severite", "MOYENNE");
            a.put("count", immobilises);
            alertes.add(a);
        }

        // Alerte 3: SLA dépassé
        long slaDepasse = decs.stream()
            .filter(d -> d.getSla() != null && d.getDateHeure() != null
                && d.getDateHeure().plusHours(d.getSla()).isBefore(LocalDateTime.now())
                && !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut()))
            .count();
        if (slaDepasse > 0) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("type", "SLA");
            a.put("message", slaDepasse + " déclaration(s) hors SLA");
            a.put("severite", "HAUTE");
            a.put("count", slaDepasse);
            alertes.add(a);
        }

        // Alerte 4: Checkups non conformes
        long ncCheckups = decs.size() > 0 ? decs.stream()
            .filter(d -> d.getVehiculeImmatriculation() != null)
            .count() : 0;
        List<DriverChecklist> cks = checklistRepository.findAll();
        long checkupsNC = cks.stream().filter(c -> Boolean.FALSE.equals(c.getEstConforme())).count();
        if (checkupsNC > 0) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("type", "CHECKUP_NC");
            a.put("message", checkupsNC + " check-up(s) non conforme(s)");
            a.put("severite", "MOYENNE");
            a.put("count", checkupsNC);
            alertes.add(a);
        }

        // Alerte 5: Déclarations sans intervention
        long sansIntervention = decs.stream()
            .filter(d -> d.getDateDebutIntervention() == null
                && !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut()))
            .count();
        if (sansIntervention > 0) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("type", "SANS_INTERVENTION");
            a.put("message", sansIntervention + " déclaration(s) sans intervention planifiée");
            a.put("severite", "INFORMATION");
            a.put("count", sansIntervention);
            alertes.add(a);
        }

        return ResponseEntity.ok(alertes);
    }

    // ========== PERFORMANCE CHAUFFEURS ==========
    @GetMapping("/performance-chauffeurs")
    public ResponseEntity<?> getPerformanceChauffeurs() {
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<DriverChecklist> cks = checklistRepository.findAll();

        Map<String, Map<String, Object>> perfMap = new LinkedHashMap<>();

        // Aggregate by chauffeur nom
        for (DeclarationIncident d : decs) {
            String nom = d.getChauffeurNom();
            if (nom == null) continue;
            Map<String, Object> p = perfMap.computeIfAbsent(nom, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("chauffeurNom", k);
                m.put("totalDeclarations", 0L);
                m.put("resolues", 0L);
                m.put("encours", 0L);
                m.put("coutTotal", 0.0);
                m.put("checkupsOK", 0L);
                m.put("checkupsNC", 0L);
                m.put("totalCheckups", 0L);
                m.put("score", 0);
                return m;
            });
            p.put("totalDeclarations", (Long) p.get("totalDeclarations") + 1);
            if ("CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut()))
                p.put("resolues", (Long) p.get("resolues") + 1);
            if ("EN_COURS".equals(d.getStatut()) || "EN_ATTENTE".equals(d.getStatut()))
                p.put("encours", (Long) p.get("encours") + 1);
            if (d.getCoutProbleme() != null)
                p.put("coutTotal", (Double) p.get("coutTotal") + d.getCoutProbleme());
        }

        for (DriverChecklist c : cks) {
            String nom = c.getChauffeurNom();
            if (nom == null || !perfMap.containsKey(nom)) {
                if (nom == null) continue;
                perfMap.computeIfAbsent(nom, k -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("chauffeurNom", k);
                    m.put("totalDeclarations", 0L);
                    m.put("resolues", 0L);
                    m.put("encours", 0L);
                    m.put("coutTotal", 0.0);
                    m.put("checkupsOK", 0L);
                    m.put("checkupsNC", 0L);
                    m.put("totalCheckups", 0L);
                    m.put("score", 0);
                    return m;
                });
            }
            Map<String, Object> p = perfMap.get(nom);
            p.put("totalCheckups", (Long) p.get("totalCheckups") + 1);
            if (Boolean.TRUE.equals(c.getEstConforme()))
                p.put("checkupsOK", (Long) p.get("checkupsOK") + 1);
            else if (Boolean.FALSE.equals(c.getEstConforme()))
                p.put("checkupsNC", (Long) p.get("checkupsNC") + 1);
        }

        // Compute score composite 0-100
        for (Map<String, Object> p : perfMap.values()) {
            long totalDecs = (Long) p.get("totalDeclarations");
            long resolues = (Long) p.get("resolues");
            long totalCks = (Long) p.get("totalCheckups");
            long ckOK = (Long) p.get("checkupsOK");
            double cout = (Double) p.get("coutTotal");

            double tauxReso = totalDecs > 0 ? (double) resolues / totalDecs : 1.0;
            double tauxCK = totalCks > 0 ? (double) ckOK / totalCks : 1.0;
            double coutPenalty = Math.min(30, cout / 100);
            int score = (int) Math.round(Math.max(0, Math.min(100, tauxReso * 40 + tauxCK * 40 + 20 - coutPenalty)));
            p.put("score", score);
        }

        return ResponseEntity.ok(perfMap.values());
    }

    // ========== STATISTIQUES INTERVENTIONS ==========
    @GetMapping("/stats-interventions")
    public ResponseEntity<?> getStatsInterventions() {
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<Map<String, Object>> interventions = decs.stream()
            .filter(d -> d.getDateDebutIntervention() != null)
            .map(d -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", d.getIdIncident());
                row.put("vehiculeImmatriculation", d.getVehiculeImmatriculation());
                row.put("typePanne", d.getTypePanne());
                row.put("criticite", d.getCriticite());
                row.put("dateDebut", d.getDateDebutIntervention().toString());
                row.put("dateReparation", d.getDateReparation() != null ? d.getDateReparation().toString() : null);
                row.put("duree", d.getDureeReparation());
                row.put("cout", d.getCoutProbleme());
                row.put("statut", d.getStatut());
                row.put("chauffeurNom", d.getChauffeurNom());
                // Extract prestataire from actionsRealisees if available
                String actions = d.getActionsRealisees();
                String prestataire = null;
                if (actions != null && actions.startsWith("Intervention par ")) {
                    int dashIdx = actions.indexOf(" - ");
                    if (dashIdx > 0) {
                        prestataire = actions.substring("Intervention par ".length(), dashIdx);
                    }
                }
                row.put("prestataire", prestataire);
                return row;
            })
            .collect(Collectors.toList());

        java.util.IntSummaryStatistics dureeStats = decs.stream()
            .filter(d -> d.getDureeReparation() != null)
            .mapToInt(DeclarationIncident::getDureeReparation)
            .summaryStatistics();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("interventions", interventions);
        result.put("totalInterventions", interventions.size());
        result.put("dureeMoyenneH", dureeStats.getCount() > 0 ? Math.round(dureeStats.getAverage() / 60.0 * 10.0) / 10.0 : 0);
        result.put("dureeMaxH", dureeStats.getCount() > 0 ? Math.round(dureeStats.getMax() / 60.0 * 10.0) / 10.0 : 0);

        return ResponseEntity.ok(result);
    }

    // ========== SCORE CAMION (0-100) ==========
    @GetMapping("/score-camions")
    public ResponseEntity<?> getScoreCamions() {
        List<Vehicule> vehs = vehiculeRepository.findAll();
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<DriverChecklist> cks = checklistRepository.findAll();

        List<Map<String, Object>> scores = new ArrayList<>();
        for (Vehicule v : vehs) {
            if (v.getImmatriculation() == null) continue;
            String im = v.getImmatriculation();
            List<DeclarationIncident> vDecs = decs.stream().filter(d -> im.equals(d.getVehiculeImmatriculation())).collect(Collectors.toList());
            List<DriverChecklist> vCks = cks.stream().filter(c -> im.equals(c.getVehiculeImmatriculation())).collect(Collectors.toList());

            long totalDecs = vDecs.size();
            long bloquantes = vDecs.stream().filter(d -> "BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite())).count();
            long resolues = vDecs.stream().filter(d -> "CLOTURE".equals(d.getStatut())).count();
            double cout = vDecs.stream().filter(d -> d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).sum();
            long ckTotal = vCks.size();
            long ckOK = vCks.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();
            long ckNC = vCks.stream().filter(c -> Boolean.FALSE.equals(c.getEstConforme())).count();

            double disponibilite = vCks.isEmpty() ? 15.0 : Math.round((double) ckOK / ckTotal * 30.0 * 100.0) / 100.0;
            double noteAnomalies = totalDecs == 0 ? 20.0 : Math.max(0, 20 - (bloquantes * 5 + (totalDecs - bloquantes) * 2));
            double noteReparation = cout == 0 ? 15.0 : Math.max(0, 15 - (cout / 300));
            double noteCheckups = ckTotal == 0 ? 10.0 : Math.round((double) ckOK / ckTotal * 20.0 * 100.0) / 100.0;
            double noteDocuments = v.getStatut() != null && "ACTIF".equals(v.getStatut()) ? 5.0 : 0.0;
            double scoreFinal = Math.round(Math.min(100, Math.max(0, disponibilite + noteAnomalies + noteReparation + noteCheckups + noteDocuments)));

            Map<String, Object> s = new LinkedHashMap<>();
            s.put("immatriculation", im);
            s.put("marque", v.getMarque());
            s.put("modele", v.getModele());
            s.put("chauffeurNom", v.getChauffeurNom());
            s.put("statut", v.getStatut());
            s.put("score", scoreFinal);
            s.put("totalDeclarations", totalDecs);
            s.put("bloquantes", bloquantes);
            s.put("resolues", resolues);
            s.put("coutTotal", cout);
            s.put("checkupsTotal", ckTotal);
            s.put("checkupsOK", ckOK);
            s.put("tauxDisponibilite", ckTotal > 0 ? Math.round((double) ckOK / ckTotal * 100) : 100);
            s.put("categorie", scoreFinal >= 90 ? "EXCELLENT" : scoreFinal >= 75 ? "BON" : scoreFinal >= 60 ? "MOYEN" : "CRITIQUE");
            scores.add(s);
        }
        scores.sort((a, b) -> Double.compare((Double) b.get("score"), (Double) a.get("score")));
        return ResponseEntity.ok(scores);
    }

    // ========== COMPARAISON MENSUELLE ==========
    @GetMapping("/comparaison-mensuelle/{immatriculation}")
    public ResponseEntity<?> getComparaisonMensuelle(@PathVariable String immatriculation) {
        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation()) && d.getDateHeure() != null)
            .collect(Collectors.toList());
        List<DriverChecklist> cks = checklistRepository.findAll().stream()
            .filter(c -> immatriculation.equals(c.getVehiculeImmatriculation()) && c.getDateChecklist() != null)
            .collect(Collectors.toList());

        Map<String, Map<String, Object>> parMois = new TreeMap<>();
        for (DeclarationIncident d : decs) {
            String mois = d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            Map<String, Object> m = parMois.computeIfAbsent(mois, k -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("mois", k); map.put("anomalies", 0L); map.put("critiques", 0L);
                map.put("cout", 0.0); map.put("dureeReparation", 0L); map.put("nbReparations", 0L);
                return map;
            });
            m.put("anomalies", (Long) m.get("anomalies") + 1);
            if ("BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite()))
                m.put("critiques", (Long) m.get("critiques") + 1);
            if (d.getCoutProbleme() != null) m.put("cout", (Double) m.get("cout") + d.getCoutProbleme());
            if (d.getDureeReparation() != null) { m.put("dureeReparation", (Long) m.get("dureeReparation") + d.getDureeReparation()); m.put("nbReparations", (Long) m.get("nbReparations") + 1); }
        }
        for (DriverChecklist c : cks) {
            String mois = c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            Map<String, Object> m = parMois.computeIfAbsent(mois, k -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("mois", k); map.put("anomalies", 0L); map.put("critiques", 0L);
                map.put("cout", 0.0); map.put("dureeReparation", 0L); map.put("nbReparations", 0L);
                map.put("checkups", 0L); map.put("checkupsOK", 0L);
                return map;
            });
            m.put("checkups", (Long) m.getOrDefault("checkups", 0L) + 1);
            if (Boolean.TRUE.equals(c.getEstConforme())) m.put("checkupsOK", (Long) m.getOrDefault("checkupsOK", 0L) + 1);
        }
        // Compute trends
        List<Map<String, Object>> result = new ArrayList<>(parMois.values());
        for (int i = 1; i < result.size(); i++) {
            Map<String, Object> prev = result.get(i - 1);
            Map<String, Object> cur = result.get(i);
            long aPrev = (Long) prev.getOrDefault("anomalies", 0L);
            long aCur = (Long) cur.getOrDefault("anomalies", 0L);
            cur.put("evolutionAnomalies", aPrev > 0 ? Math.round((double) (aCur - aPrev) / aPrev * 100) : 0);
            double cPrev = (Double) prev.getOrDefault("cout", 0.0);
            double cCur = (Double) cur.getOrDefault("cout", 0.0);
            cur.put("evolutionCout", cPrev > 0 ? Math.round((cCur - cPrev) / cPrev * 100) : 0);
        }
        return ResponseEntity.ok(result);
    }

    // ========== FICHE VÉHICULE DÉTAILLÉE ==========
    @GetMapping("/vehicule-detail/{immatriculation}")
    public ResponseEntity<?> getVehiculeDetail(@PathVariable String immatriculation) {
        Vehicule v = vehiculeRepository.findByImmatriculation(immatriculation).orElse(null);
        if (v == null) return ResponseEntity.ok(Map.of("error", "Véhicule introuvable"));

        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation())).collect(Collectors.toList());
        List<DriverChecklist> cks = checklistRepository.findAll().stream()
            .filter(c -> immatriculation.equals(c.getVehiculeImmatriculation())).collect(Collectors.toList());

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("immatriculation", v.getImmatriculation());
        info.put("marque", v.getMarque());
        info.put("modele", v.getModele());
        info.put("type", v.getType());
        info.put("annee", v.getAnnee());
        info.put("kilometrage", v.getKilometrage());
        info.put("carburant", v.getCarburant());
        info.put("statut", v.getStatut());
        info.put("chauffeurNom", v.getChauffeurNom());
        info.put("totalDeclarations", decs.size());
        info.put("totalCheckups", cks.size());

        // Dernier checkup
        if (!cks.isEmpty()) {
            DriverChecklist last = cks.get(0);
            info.put("dernierCheckup", last.getDateChecklist().toString());
            info.put("dernierCheckupConforme", last.getEstConforme());
        }

        // Timeline
        List<Map<String, Object>> timeline = new ArrayList<>();
        for (DeclarationIncident d : decs) {
            Map<String, Object> ev = new LinkedHashMap<>();
            ev.put("date", d.getDateHeure() != null ? d.getDateHeure().toString() : "");
            ev.put("type", "ANOMALIE");
            ev.put("description", d.getTypePanne() + " - " + d.getCriticite());
            ev.put("statut", d.getStatut());
            ev.put("cout", d.getCoutProbleme());
            timeline.add(ev);
        }
        for (DriverChecklist c : cks) {
            Map<String, Object> ev = new LinkedHashMap<>();
            ev.put("date", c.getDateChecklist().toString());
            ev.put("type", "CHECKUP");
            ev.put("description", c.getEstConforme() != null && c.getEstConforme() ? "Conforme" : "Non conforme");
            ev.put("statut", c.getStatut());
            ev.put("cout", null);
            timeline.add(ev);
        }
        timeline.sort((a, b) -> ((String) b.get("date")).compareTo((String) a.get("date")));
        info.put("timeline", timeline);

        // Anomalies par élément
        Map<String, Long> parElement = decs.stream()
            .filter(d -> d.getElementVehicule() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getElementVehicule, Collectors.counting()));
        info.put("anomaliesParElement", parElement);

        return ResponseEntity.ok(info);
    }

    // ========== ANALYSE BUDGÉTAIRE ==========
    @GetMapping("/budget-analysis")
    public ResponseEntity<?> getBudgetAnalysis() {
        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> d.getDateHeure() != null && d.getCoutProbleme() != null)
            .collect(Collectors.toList());

        Map<String, Double> coutParMois = new TreeMap<>();
        Map<String, Double> budgetParMois = new TreeMap<>();
        for (DeclarationIncident d : decs) {
            String mois = d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            coutParMois.merge(mois, d.getCoutProbleme(), Double::sum);
            if (d.getBudgetMensuel() != null) budgetParMois.put(mois, d.getBudgetMensuel());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (String mois : coutParMois.keySet()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("mois", mois);
            entry.put("cout", Math.round(coutParMois.get(mois) * 100.0) / 100.0);
            double budget = budgetParMois.getOrDefault(mois, 0.0);
            entry.put("budget", budget);
            entry.put("ecart", Math.round((coutParMois.get(mois) - budget) * 100.0) / 100.0);
            entry.put("tauxUtilisation", budget > 0 ? Math.round(coutParMois.get(mois) / budget * 100) : 0);
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    // ========== ANALYSE CAUSES RACINES ==========
    @GetMapping("/root-cause-analysis")
    public ResponseEntity<?> getRootCauseAnalysis() {
        List<DeclarationIncident> decs = declarationRepository.findAll();
        Map<String, Long> parElement = decs.stream()
            .filter(d -> d.getElementVehicule() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getElementVehicule, Collectors.counting()));
        Map<String, Long> parCategorie = decs.stream()
            .filter(d -> d.getCategorie() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getCategorie, Collectors.counting()));

        // Anomalies répétitives (même véhicule + même élément > 1)
        Map<String, Long> repetitives = decs.stream()
            .filter(d -> d.getVehiculeImmatriculation() != null && d.getElementVehicule() != null)
            .collect(Collectors.groupingBy(
                d -> d.getVehiculeImmatriculation() + "|" + d.getElementVehicule(),
                Collectors.counting()
            ));
        long nbRepetitives = repetitives.values().stream().filter(c -> c > 1).count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("parElementVehicule", parElement);
        result.put("parCategorie", parCategorie);
        result.put("anomaliesRepetitives", nbRepetitives);
        return ResponseEntity.ok(result);
    }

    // ========== MAINTENANCE PRÉDICTIVE ==========
    @GetMapping("/predictive-maintenance")
    public ResponseEntity<?> getPredictiveMaintenance() {
        List<Vehicule> vehs = vehiculeRepository.findAll();
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<Map<String, Object>> risques = new ArrayList<>();

        for (Vehicule v : vehs) {
            if (v.getImmatriculation() == null) continue;
            List<DeclarationIncident> vDecs = decs.stream()
                .filter(d -> v.getImmatriculation().equals(d.getVehiculeImmatriculation()))
                .collect(Collectors.toList());

            long recentAnomalies = vDecs.stream()
                .filter(d -> d.getDateHeure() != null && d.getDateHeure().isAfter(LocalDateTime.now().minusDays(30)))
                .count();
            long totalAnomalies = vDecs.size();
            boolean bloquantRecent = vDecs.stream()
                .filter(d -> d.getDateHeure() != null && d.getDateHeure().isAfter(LocalDateTime.now().minusDays(60)))
                .anyMatch(d -> "BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite()));

            int risque = 0;
            if (recentAnomalies >= 3) risque += 40;
            else if (recentAnomalies >= 1) risque += 20;
            if (totalAnomalies >= 5) risque += 25;
            if (bloquantRecent) risque += 25;
            if (v.getKilometrage() != null && v.getKilometrage() > 100000) risque += 10;

            String niveau = risque >= 70 ? "CRITIQUE" : risque >= 40 ? "ELEVE" : risque >= 20 ? "MOYEN" : "FAIBLE";

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("immatriculation", v.getImmatriculation());
            r.put("marque", v.getMarque());
            r.put("modele", v.getModele());
            r.put("risque", Math.min(100, risque));
            r.put("niveau", niveau);
            r.put("totalAnomalies", totalAnomalies);
            r.put("anomalies30Jours", recentAnomalies);
            r.put("recommendation", niveau.equals("CRITIQUE") ? "Maintenance urgente requise dans les 7 jours" :
                niveau.equals("ELEVE") ? "Planifier maintenance dans les 30 jours" :
                niveau.equals("MOYEN") ? "Surveillance renforcée recommandée" : "Aucune action urgente");
            risques.add(r);
        }
        risques.sort((a, b) -> Integer.compare((Integer) b.get("risque"), (Integer) a.get("risque")));
        return ResponseEntity.ok(risques);
    }

    // ========== CYCLE DE VIE COMPOSANTS ==========
    @GetMapping("/component-lifecycle")
    public ResponseEntity<?> getComponentLifecycle() {
        List<DeclarationIncident> decs = declarationRepository.findAll();
        Map<String, Map<String, Long>> parVehicule = new LinkedHashMap<>();
        for (DeclarationIncident d : decs) {
            if (d.getVehiculeImmatriculation() == null || d.getElementVehicule() == null) continue;
            Map<String, Long> compos = parVehicule.computeIfAbsent(d.getVehiculeImmatriculation(), k -> new LinkedHashMap<>());
            compos.merge(d.getElementVehicule(), 1L, Long::sum);
        }
        return ResponseEntity.ok(parVehicule);
    }

    // ========== MOIS DISPONIBLES ==========
    @GetMapping("/mois-disponibles/{immatriculation}")
    public ResponseEntity<?> getMoisDisponibles(@PathVariable String immatriculation) {
        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation()) && d.getDateHeure() != null)
            .collect(Collectors.toList());
        List<DriverChecklist> cks = checklistRepository.findAll().stream()
            .filter(c -> immatriculation.equals(c.getVehiculeImmatriculation()) && c.getDateChecklist() != null)
            .collect(Collectors.toList());
        Set<String> moisSet = new TreeSet<>();
        for (DeclarationIncident d : decs) moisSet.add(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")));
        for (DriverChecklist c : cks) moisSet.add(c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM")));
        List<Map<String, String>> moisList = new ArrayList<>();
        for (String m : moisSet) {
            LocalDate firstDay = LocalDate.parse(m + "-01");
            Map<String, String> entry = new LinkedHashMap<>();
            entry.put("valeur", m);
            entry.put("label", firstDay.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH)));
            moisList.add(entry);
        }
        return ResponseEntity.ok(moisList);
    }

    // ========== ÉVOLUTION VÉHICULE (Page complète) ==========
    @GetMapping("/evolution-vehicule/{immatriculation}")
    public ResponseEntity<?> getEvolutionVehicule(@PathVariable String immatriculation,
            @RequestParam(required = false) String mois1,
            @RequestParam(required = false) String mois2) {
        Vehicule v = vehiculeRepository.findByImmatriculation(immatriculation).orElse(null);
        if (v == null) return ResponseEntity.ok(Map.of("error", "Véhicule introuvable"));

        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation()) && d.getDateHeure() != null)
            .collect(Collectors.toList());
        List<DriverChecklist> cks = checklistRepository.findAll().stream()
            .filter(c -> immatriculation.equals(c.getVehiculeImmatriculation()) && c.getDateChecklist() != null)
            .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        String currentMois = mois1 != null && !mois1.isEmpty() ? mois1 : now.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String prevMois = mois2 != null && !mois2.isEmpty() ? mois2 : now.minusMonths(1).format(DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDate d1 = LocalDate.parse(currentMois + "-01");
        LocalDate d2 = LocalDate.parse(prevMois + "-01");
        String currentMoisLabel = d1.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH));
        String prevMoisLabel = d2.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH));

        // 1. Résumé général (sans score)
        Map<String, Object> resume = new LinkedHashMap<>();
        resume.put("immatriculation", v.getImmatriculation());
        resume.put("marque", v.getMarque());
        resume.put("modele", v.getModele());
        resume.put("chauffeurNom", v.getChauffeurNom());
        resume.put("statut", v.getStatut());
        resume.put("kilometrage", v.getKilometrage());
        resume.put("annee", v.getAnnee());
        resume.put("moisActuel", currentMoisLabel);
        resume.put("moisPrecedent", prevMoisLabel);

        // 2. Tableau comparatif des composants — mois par mois
        String[] composants = {"FREINS","PNEUS","BATTERIE","MOTEUR","ECLAIRAGE","CARROSSERIE","TRANSMISSION","DIRECTION","CLIMATISATION","DOCUMENTS"};
        List<Map<String, Object>> composantsTable = new ArrayList<>();
        for (String comp : composants) {
            long avant = decs.stream().filter(d -> d.getDateHeure() != null
                && prevMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")))
                && comp.equalsIgnoreCase(d.getElementVehicule() != null ? d.getElementVehicule() : "")
            ).count();
            long maintenant = decs.stream().filter(d -> d.getDateHeure() != null
                && currentMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")))
                && comp.equalsIgnoreCase(d.getElementVehicule() != null ? d.getElementVehicule() : "")
            ).count();
            double evo = avant > 0 ? Math.round((double) (maintenant - avant) / avant * 100) : (maintenant > 0 ? 100.0 : 0.0);
            String etat = maintenant == 0 && avant > 0 ? "Résolu" : maintenant < avant ? "Amélioration" : maintenant > avant ? "Dégradation" : "Stable";
            String decision = etat.equals("Résolu") ? "✔ Aucune action" :
                etat.equals("Amélioration") ? "✅ Continuer le suivi" :
                etat.equals("Dégradation") && maintenant >= 3 ? "🚨 Intervention urgente" :
                etat.equals("Dégradation") ? "🔧 Planifier une réparation" :
                "🔍 Surveillance";
            String commentaire = etat.equals("Amélioration") ? "Les anomalies ont diminué, le suivi est efficace." :
                etat.equals("Dégradation") ? "Ce composant nécessite une attention urgente." :
                etat.equals("Résolu") ? "Aucune anomalie détectée ce mois-ci." :
                etat.equals("Stable") && maintenant == 0 && avant == 0 ? "Aucune anomalie ce mois-ci." :
                "Stable, surveillance recommandée.";
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("composant", comp); c.put("avant", avant); c.put("maintenant", maintenant);
            c.put("evolution", evo); c.put("etat", etat); c.put("decision", decision); c.put("commentaireIA", commentaire);
            composantsTable.add(c);
        }

        // 3. Graphique Évolution (12 mois)
        Map<String, Map<String, Long>> parMoisComposant = new TreeMap<>();
        for (DeclarationIncident d : decs) {
            String mois = d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            String comp = d.getElementVehicule() != null ? d.getElementVehicule().toUpperCase() : "AUTRE";
            parMoisComposant.computeIfAbsent(mois, k -> new LinkedHashMap<>()).merge(comp, 1L, Long::sum);
        }
        List<Map<String, Object>> evolutionGraph = new ArrayList<>();
        // Fill last 12 months
        for (int i = 11; i >= 0; i--) {
            String moisKey = now.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM"));
            String moisLabel = now.minusMonths(i).format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.FRENCH));
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("mois", moisLabel);
            long total = 0;
            for (String comp : composants) {
                long val = parMoisComposant.getOrDefault(moisKey, new LinkedHashMap<>()).getOrDefault(comp, 0L);
                if (val > 0) { entry.put(comp, val); total += val; }
            }
            entry.put("total", total);
            evolutionGraph.add(entry);
        }

        // 4. Radar Chart — mois précédent vs mois actuel
        List<Map<String, Object>> radarData = new ArrayList<>();
        String[] axes = {"Freins","Pneus","Moteur","Eclairage","Batterie","Carrosserie","Documents"};
        for (String axe : axes) {
            long prevCount = decs.stream().filter(d -> d.getDateHeure() != null
                && prevMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")))
                && (axe.equalsIgnoreCase(d.getElementVehicule()) || axe.equalsIgnoreCase(d.getTypePanne()))
            ).count();
            long curCount = decs.stream().filter(d -> d.getDateHeure() != null
                && currentMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")))
                && (axe.equalsIgnoreCase(d.getElementVehicule()) || axe.equalsIgnoreCase(d.getTypePanne()))
            ).count();
            double prevVal = prevCount * 20.0;
            double curVal = curCount * 20.0;
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("axe", axe); r.put("precedent", Math.max(0, 100 - prevVal)); r.put("actuel", Math.max(0, 100 - curVal));
            radarData.add(r);
        }

        // 5. Waterfall Chart
        List<Map<String, Object>> waterfall = new ArrayList<>();
        double totalContribution = 0;
        for (Map<String, Object> comp : composantsTable) {
            long avant = ((Number) comp.get("avant")).longValue();
            long maintenant = ((Number) comp.get("maintenant")).longValue();
            int contribution = (int) ((avant - maintenant) * 5);
            if (contribution != 0) {
                Map<String, Object> w = new LinkedHashMap<>();
                w.put("categorie", comp.get("composant"));
                w.put("contribution", contribution);
                w.put("type", contribution > 0 ? "AMELIORATION" : "DEGRADATION");
                waterfall.add(w);
                totalContribution += contribution;
            }
        }
        Map<String, Object> totalW = new LinkedHashMap<>();
        long totalAvant = composantsTable.stream().mapToLong(c -> ((Number) c.get("avant")).longValue()).sum();
        long totalMaintenant = composantsTable.stream().mapToLong(c -> ((Number) c.get("maintenant")).longValue()).sum();
        int totalDiff = (int)(totalAvant - totalMaintenant);
        totalW.put("categorie", "Total");
        totalW.put("contribution", totalDiff);
        totalW.put("type", totalDiff >= 0 ? "AMELIORATION" : "DEGRADATION");
        waterfall.add(totalW);

        // 6. Timeline
        List<Map<String, Object>> timeline = new ArrayList<>();
        for (DeclarationIncident d : decs) {
            Map<String, Object> ev = new LinkedHashMap<>();
            ev.put("date", d.getDateHeure().toString()); ev.put("type", "ANOMALIE");
            ev.put("description", d.getTypePanne() + " - " + (d.getElementVehicule() != null ? d.getElementVehicule() : ""));
            ev.put("cout", d.getCoutProbleme()); ev.put("statut", d.getStatut());
            timeline.add(ev);
        }
        for (DriverChecklist c : cks) {
            Map<String, Object> ev = new LinkedHashMap<>();
            ev.put("date", c.getDateChecklist().toString()); ev.put("type", "CHECKUP");
            ev.put("description", c.getEstConforme() != null && c.getEstConforme() ? "Conforme" : "Non conforme");
            ev.put("cout", null); ev.put("statut", c.getStatut());
            timeline.add(ev);
        }
        timeline.sort((a, b) -> ((String) b.get("date")).compareTo((String) a.get("date")));

        // 7. Heatmap (months x components)
        List<Map<String, Object>> heatmap = new ArrayList<>();
        for (String comp : composants) {
            Map<String, Object> hRow = new LinkedHashMap<>();
            hRow.put("composant", comp);
            for (int i = 11; i >= 0; i--) {
                String moisKey = now.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM"));
                String moisLabel = now.minusMonths(i).format(DateTimeFormatter.ofPattern("MMM", Locale.FRENCH));
                long val = parMoisComposant.getOrDefault(moisKey, new LinkedHashMap<>()).getOrDefault(comp, 0L);
                hRow.put(moisLabel, val);
            }
            boolean hasData = false;
            for (int i = 11; i >= 0; i--) {
                String mois = now.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM"));
                if (parMoisComposant.getOrDefault(mois, new LinkedHashMap<>()).containsKey(comp)) hasData = true;
            }
            if (hasData) heatmap.add(hRow);
        }

        // 8. IA Insights — comparaison pure (pas de score)
        List<String> insights = new ArrayList<>();
        long totalDecsCurrent = decs.stream().filter(d -> d.getDateHeure() != null && currentMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")))).count();
        long totalDecsPrev = decs.stream().filter(d -> d.getDateHeure() != null && prevMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM")))).count();
        long critCurrent = decs.stream().filter(d -> d.getDateHeure() != null && currentMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && ("BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite()))).count();
        long critPrev = decs.stream().filter(d -> d.getDateHeure() != null && prevMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && ("BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite()))).count();
        for (Map<String, Object> comp : composantsTable) {
            String etat = (String) comp.get("etat");
            String nom = (String) comp.get("composant");
            long evo = Math.abs(((Number) comp.get("evolution")).longValue());
            if (etat.equals("Amélioration") && evo > 0) insights.add("Les anomalies de " + nom.toLowerCase() + " ont diminué de " + evo + "%, le suivi est efficace.");
            if (etat.equals("Dégradation")) insights.add("Les " + nom.toLowerCase() + " présentent une augmentation des anomalies, intervention recommandée.");
            if (etat.equals("Résolu")) insights.add("Les " + nom.toLowerCase() + " sont résolus, aucune anomalie ce mois-ci.");
        }
        if (totalDecsCurrent > totalDecsPrev) insights.add("Le nombre total d'anomalies a augmenté (" + totalDecsPrev + " → " + totalDecsCurrent + ").");
        if (totalDecsCurrent < totalDecsPrev) insights.add("Le nombre total d'anomalies a diminué (" + totalDecsPrev + " → " + totalDecsCurrent + "), tendance positive.");
        if (critCurrent > critPrev) insights.add("⚠️ " + (critCurrent - critPrev) + " nouvelle(s) anomalie(s) critique(s) apparue(s).");
        long ckCurrent = cks.stream().filter(c -> c.getDateChecklist() != null && currentMois.equals(c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM")))).count();
        long ckOKCurrent = cks.stream().filter(c -> c.getDateChecklist() != null && currentMois.equals(c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && Boolean.TRUE.equals(c.getEstConforme())).count();
        if (ckCurrent > 0) insights.add(ckCurrent + " check-up(s) ce mois-ci. Conformité : " + (ckCurrent > 0 ? Math.round((double) ckOKCurrent / ckCurrent * 100) : 0) + "%.");
        if (insights.isEmpty()) insights.add("Aucune anomalie ce mois-ci. Le véhicule est stable.");

        // 9. KPI Evolution — mois par mois
        long anomaliesCurrent = totalDecsCurrent;
        long anomaliesPrev = totalDecsPrev;
        long critiquesCurrent = critCurrent;
        long critiquesPrev = critPrev;
        long reparationsCurrent = decs.stream().filter(d -> d.getDateHeure() != null && currentMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && "CLOTURE".equals(d.getStatut())).count();
        long reparationsPrev = decs.stream().filter(d -> d.getDateHeure() != null && prevMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && "CLOTURE".equals(d.getStatut())).count();
        double coutCurrent = decs.stream().filter(d -> d.getDateHeure() != null && currentMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).sum();
        double coutPrev = decs.stream().filter(d -> d.getDateHeure() != null && prevMois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).sum();
        long checkupsCurrent = ckCurrent;
        long checkupsPrev = cks.stream().filter(c -> c.getDateChecklist() != null && prevMois.equals(c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM")))).count();
        long ckOKPrev = cks.stream().filter(c -> c.getDateChecklist() != null && prevMois.equals(c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM"))) && Boolean.TRUE.equals(c.getEstConforme())).count();

        Map<String, Object> kpiEvolution = new LinkedHashMap<>();
        String[][] kpis = {
            {"anomalies", "Nombre d'anomalies"},
            {"anomalies_critiques", "Anomalies critiques"},
            {"reparations", "Réparations"},
            {"cout", "Coût réparation"},
            {"checkups", "Check-ups"},
            {"disponibilite", "Disponibilité"}
        };
        for (String[] kpi : kpis) {
            String key = kpi[0]; String label = kpi[1];
            double valActuel = 0, valPrecedent = 0;
            if (key.equals("anomalies")) { valActuel = anomaliesCurrent; valPrecedent = anomaliesPrev; }
            else if (key.equals("anomalies_critiques")) { valActuel = critiquesCurrent; valPrecedent = critiquesPrev; }
            else if (key.equals("reparations")) { valActuel = reparationsCurrent; valPrecedent = reparationsPrev; }
            else if (key.equals("cout")) { valActuel = coutCurrent; valPrecedent = coutPrev; }
            else if (key.equals("checkups")) { valActuel = checkupsCurrent; valPrecedent = checkupsPrev; }
            else if (key.equals("disponibilite")) { valActuel = checkupsCurrent > 0 ? Math.round((double) ckOKCurrent / checkupsCurrent * 100) : (double) 0; valPrecedent = checkupsPrev > 0 ? Math.round((double) ckOKPrev / checkupsPrev * 100) : (double) 0; }
            double evoKpi = valPrecedent > 0 ? Math.round((valActuel - valPrecedent) / valPrecedent * 100) : (valActuel > 0 ? 100 : 0);
            Map<String, Object> k = new LinkedHashMap<>();
            k.put("label", label); k.put("actuel", valActuel); k.put("precedent", valPrecedent);
            k.put("evolution", evoKpi);
            k.put("fleche", evoKpi > 5 ? "HAUSSE" : evoKpi < -5 ? "BAISSE" : "STABLE");
            kpiEvolution.put(key, k);
        }

        // 10. Alertes intelligentes
        List<String> smartAlertes = new ArrayList<>();
        for (Map<String, Object> comp : composantsTable) {
            String etat = (String) comp.get("etat");
            String nom = (String) comp.get("composant");
            long mant = ((Number) comp.get("maintenant")).longValue();
            if (etat.equals("Amélioration")) smartAlertes.add("🟢 " + nom + " en amélioration — continuer le suivi.");
            if (etat.equals("Dégradation") && mant >= 3) smartAlertes.add("🚨 " + nom + " : " + mant + " anomalies — intervention urgente.");
            if (etat.equals("Dégradation") && mant < 3) smartAlertes.add("⚠️ " + nom + " en dégradation — planifier une réparation.");
            if (etat.equals("Résolu")) smartAlertes.add("✅ " + nom + " résolu ce mois-ci.");
        }
        if (critiquesCurrent > 0) smartAlertes.add("🚨 " + critiquesCurrent + " anomalie(s) critique(s) ce mois-ci.");
        if (anomaliesCurrent > anomaliesPrev && anomaliesPrev > 0) smartAlertes.add("📈 Augmentation des anomalies (" + anomaliesPrev + " → " + anomaliesCurrent + ").");
        if (ckCurrent > 0 && ckOKCurrent == 0) smartAlertes.add("🔒 Check-up non conforme, véhicule bloqué.");
        if (totalDecsCurrent >= 3) smartAlertes.add("🔄 " + totalDecsCurrent + " anomalies ce mois-ci, même problème répété ?");
        if (smartAlertes.isEmpty()) smartAlertes.add("✅ Aucune alerte — véhicule en bon état.");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("resume", resume);
        result.put("composants", composantsTable);
        result.put("evolutionGraph", evolutionGraph);
        result.put("radarData", radarData);
        result.put("waterfall", waterfall);
        result.put("timeline", timeline);
        result.put("heatmap", heatmap);
        result.put("insights", insights);
        result.put("kpiEvolution", kpiEvolution);
        result.put("smartAlertes", smartAlertes);

        return ResponseEntity.ok(result);
    }

    // Helper to compute score for a specific month
    private double[] computeScore(List<DeclarationIncident> allDecs, List<DriverChecklist> allCks, String mois) {
        List<DeclarationIncident> decsMois = allDecs.stream()
            .filter(d -> d.getDateHeure() != null && mois.equals(d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"))))
            .collect(Collectors.toList());
        List<DriverChecklist> cksMois = allCks.stream()
            .filter(c -> c.getDateChecklist() != null && mois.equals(c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM"))))
            .collect(Collectors.toList());

        long totalDecs = decsMois.size();
        long bloquantes = decsMois.stream().filter(d -> "BLOQUANT".equals(d.getCriticite()) || "CRITIQUE".equals(d.getCriticite())).count();
        long resolues = decsMois.stream().filter(d -> "CLOTURE".equals(d.getStatut())).count();
        double cout = decsMois.stream().filter(d -> d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).sum();
        long ckTotal = cksMois.size();
        long ckOK = cksMois.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();

        double disponibilite = cksMois.isEmpty() ? 15.0 : Math.round((double) ckOK / ckTotal * 30.0 * 100.0) / 100.0;
        double noteAnomalies = totalDecs == 0 ? 20.0 : Math.max(0, 20 - (bloquantes * 5 + (totalDecs - bloquantes) * 2));
        double noteReparation = cout == 0 ? 15.0 : Math.max(0, 15 - (cout / 300));
        double noteCheckups = ckTotal == 0 ? 10.0 : Math.round((double) ckOK / ckTotal * 20.0 * 100.0) / 100.0;
        double noteDocuments = 5.0;
        double scoreFinal = Math.round(Math.min(100, Math.max(0, disponibilite + noteAnomalies + noteReparation + noteCheckups + noteDocuments)));
        return new double[]{scoreFinal, disponibilite, noteAnomalies, noteReparation, noteCheckups, noteDocuments};
    }
}
