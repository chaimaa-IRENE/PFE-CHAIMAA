package com.example.usermanagement.controller;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/powerbi/v2")
@CrossOrigin(origins = "*")
public class SmartFleetPowerBiController {

    private final VehiculeRepository vehiculeRepository;
    private final DeclarationRepository declarationRepository;
    private final DriverChecklistRepository checklistRepository;
    private final LegalDocumentRepository documentRepository;
    private final DocumentReglementaireRepository docReglementaireRepository;
    private final TicketMaintenanceRepository ticketRepository;
    private final AnomalieCheckupRepository anomalieRepository;
    private final FleetAlertRepository alertRepository;
    private final VehicleBlockingRepository blockingRepository;
    private final DepartHistoriqueRepository departRepository;
    private final DriverPresenceRepository presenceRepository;
    private final CheckupRepository checkupRepository;
    private final TrackingHistoryRepository trackingRepository;

    public SmartFleetPowerBiController(VehiculeRepository vehiculeRepository,
                                        DeclarationRepository declarationRepository,
                                        DriverChecklistRepository checklistRepository,
                                        LegalDocumentRepository documentRepository,
                                        DocumentReglementaireRepository docReglementaireRepository,
                                        TicketMaintenanceRepository ticketRepository,
                                        AnomalieCheckupRepository anomalieRepository,
                                        FleetAlertRepository alertRepository,
                                        VehicleBlockingRepository blockingRepository,
                                        DepartHistoriqueRepository departRepository,
                                        DriverPresenceRepository presenceRepository,
                                        CheckupRepository checkupRepository,
                                        TrackingHistoryRepository trackingRepository) {
        this.vehiculeRepository = vehiculeRepository;
        this.declarationRepository = declarationRepository;
        this.checklistRepository = checklistRepository;
        this.documentRepository = documentRepository;
        this.docReglementaireRepository = docReglementaireRepository;
        this.ticketRepository = ticketRepository;
        this.anomalieRepository = anomalieRepository;
        this.alertRepository = alertRepository;
        this.blockingRepository = blockingRepository;
        this.departRepository = departRepository;
        this.presenceRepository = presenceRepository;
        this.checkupRepository = checkupRepository;
        this.trackingRepository = trackingRepository;
    }

    private double computeAvgSpeed(List<TrackingHistory> records) {
        return records.stream().filter(t -> t.getVitesse() != null).mapToDouble(TrackingHistory::getVitesse).average().orElse(0);
    }

    private double computeAvgConsommation(Vehicule v) {
        if (v == null || v.getType() == null) return 12;
        String t = v.getType().toLowerCase();
        if (t.contains("poid") || t.contains("camion") || t.contains("truck")) return 28;
        if (t.contains("utilitaire") || t.contains("van") || t.contains("fourgon")) return 10;
        if (t.contains("berline") || t.contains("citadine") || t.contains("suv")) return 7;
        return 12;
    }

    private Map<String, Object> computeVehicleStats(String immatriculation) {
        List<TrackingHistory> tracks = trackingRepository.findByImmatriculationOrderByTimestampAsc(immatriculation);
        double vitesse = computeAvgSpeed(tracks);
        double conso = 0;
        if (!tracks.isEmpty()) {
            Double firstFuel = tracks.get(0).getNiveauCarburant();
            Double lastFuel = tracks.get(tracks.size() - 1).getNiveauCarburant();
            if (firstFuel != null && lastFuel != null) {
                int firstKm = tracks.get(0).getKilometrage() != null ? tracks.get(0).getKilometrage() : 0;
                int lastKm = tracks.get(tracks.size() - 1).getKilometrage() != null ? tracks.get(tracks.size() - 1).getKilometrage() : 0;
                double distKm = Math.max(1, lastKm - firstKm);
                double fuelUsed = (firstFuel - lastFuel) * 0.6;
                conso = Math.round((fuelUsed / distKm) * 100 * 10.0) / 10.0;
            }
        }
        if (conso <= 0) conso = 12;
        return Map.of("vitesseMoyenne", Math.round(vitesse * 10.0) / 10.0, "consommationMoyenne", conso);
    }

    // ========================================================================
    // SECTION 1 – VUE GLOBALE DU PARC
    // ========================================================================
    @GetMapping("/fleet-overview")
    public ResponseEntity<Map<String, Object>> getFleetOverview(
            @RequestParam(name = "period", defaultValue = "30j") String period,
            @RequestParam(name = "vehicle", defaultValue = "") String vehicle,
            @RequestParam(name = "site", defaultValue = "") String site) {
        List<Vehicule> allVehs = vehiculeRepository.findAll();
        // Apply filters
        List<Vehicule> vehs = allVehs.stream()
            .filter(v -> vehicle.isEmpty() || vehicle.equals(v.getImmatriculation()))
            .filter(v -> site.isEmpty() || (v.getAgence() != null && v.getAgence().equalsIgnoreCase(site)))
            .collect(Collectors.toList());
        if (vehs.isEmpty()) vehs = allVehs;
        List<String> immas = vehs.stream().map(Vehicule::getImmatriculation).collect(Collectors.toList());

        // Period cutoff
        int days = 30;
        try { days = Integer.parseInt(period.replace("j", "").replace("a", "365")); } catch (Exception e) {}
        if (period.endsWith("a")) days = 365;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);

        List<DeclarationIncident> decsAll = declarationRepository.findAll();
        List<DeclarationIncident> decs = decsAll.stream()
            .filter(d -> d.getVehiculeImmatriculation() == null || immas.contains(d.getVehiculeImmatriculation()))
            .filter(d -> d.getDateHeure() == null || d.getDateHeure().isAfter(cutoff))
            .collect(Collectors.toList());
        List<DriverChecklist> cksAll = checklistRepository.findAll();
        List<DriverChecklist> cks = cksAll.stream()
            .filter(c -> c.getVehiculeImmatriculation() == null || immas.contains(c.getVehiculeImmatriculation()))
            .filter(c -> c.getDateChecklist() == null || c.getDateChecklist().isAfter(cutoff))
            .collect(Collectors.toList());
        List<TicketMaintenance> ticketsAll = ticketRepository.findAll();
        List<TicketMaintenance> tickets = ticketsAll.stream()
            .filter(t -> t.getVehiculeImmatriculation() == null || immas.contains(t.getVehiculeImmatriculation()))
            .collect(Collectors.toList());
        List<LegalDocument> docs = documentRepository.findAll();
        List<AnomalieCheckup> anomalies = anomalieRepository.findAll();
        List<VehicleBlocking> blocks = blockingRepository.findAll();

        long total = vehs.size();
        long enService = vehs.stream().filter(v -> "ACTIF".equals(v.getStatut())).count();
        long aArret = vehs.stream().filter(v -> "BLOQUE".equals(v.getStatut()) || "IMMOBILISE".equals(v.getStatut())).count();
        long enMaintenance = vehs.stream().filter(v -> "MAINTENANCE".equals(v.getStatut())).count();
        long anomaliesOuvertes = anomalies.stream().filter(a -> !"REPAREE".equals(a.getStatut()) && !"VALIDEE".equals(a.getStatut()) && !"ANNULEE".equals(a.getStatut())).count();
        long ticketsOuverts = tickets.stream().filter(t -> !"CLOTURE".equals(t.getStatut()) && !"ANNULE".equals(t.getStatut())).count();
        long decsOuvertes = decs.stream().filter(d -> !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut())).count();

        // Digitalisation check-up quotidien
        LocalDateTime cutoff30j = LocalDateTime.now().minusDays(30);
        long totalCheckups30j = cks.stream().filter(c -> c.getDateChecklist() != null && c.getDateChecklist().isAfter(cutoff30j)).count();
        long checkupsConformes30j = cks.stream().filter(c -> c.getDateChecklist() != null && c.getDateChecklist().isAfter(cutoff30j) && Boolean.TRUE.equals(c.getEstConforme())).count();
        double txCheckupVert = totalCheckups30j > 0 ? Math.round((double) checkupsConformes30j / totalCheckups30j * 100) : 0;

        // Anomalies par source (regroupement)
        Map<String, Long> parSource = new LinkedHashMap<>();
        parSource.put("CHECKUP_QUOTIDIEN", anomalies.stream().filter(a -> "CHECKUP".equals(a.getSource())).count());
        parSource.put("FICHE_ALERTE", alerts().stream().filter(a -> "FICHE_ALERTE".equals(a.get("type"))).count());
        parSource.put("MAINTENANCE_CURATIVE", decs.stream().filter(d -> "CURATIVE".equals(d.getQualification()) || "Panne".equals(d.getTypePanne())).count());
        parSource.put("MAINTENANCE_PREVENTIVE", decs.stream().filter(d -> "PREVENTIVE".equals(d.getQualification())).count());
        parSource.put("PANNE_MARCHE", decs.stream().filter(d -> "Panne marché".equals(d.getSource()) || "Panne".equals(d.getSource())).count());
        parSource.put("INCIDENT_MARCHE", decs.stream().filter(d -> "Incident".equals(d.getSource()) || "Accident".equals(d.getSource())).count());

        // Par marque
        Map<String, Long> parMarque = vehs.stream().filter(v -> v.getMarque() != null).collect(Collectors.groupingBy(Vehicule::getMarque, Collectors.counting()));

        // Par categorie
        Map<String, Long> parCategorie = decs.stream().filter(d -> d.getCategorie() != null).collect(Collectors.groupingBy(DeclarationIncident::getCategorie, Collectors.counting()));

        // Par element vehicule
        Map<String, Long> parElement = decs.stream().filter(d -> d.getElementVehicule() != null).collect(Collectors.groupingBy(DeclarationIncident::getElementVehicule, Collectors.counting()));

        // Par chauffeur
        Map<String, Long> parChauffeur = decs.stream().filter(d -> d.getChauffeurNom() != null).collect(Collectors.groupingBy(DeclarationIncident::getChauffeurNom, Collectors.counting()));

        // Types d'incident (par typePanne)
        Map<String, Long> repartitionParTypePanne = decs.stream()
            .filter(d -> d.getTypePanne() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.counting()));

        // Types de déclarations par statut
        Map<String, Long> repartitionParStatut = decs.stream()
            .filter(d -> d.getStatut() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getStatut, Collectors.counting()));

        // Types de déclarations par qualification
        Map<String, Long> repartitionParQualification = decs.stream()
            .filter(d -> d.getQualification() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getQualification, Collectors.counting()));

        // Anomalies par marque (déclarations groupées par marque du véhicule)
        Map<String, Long> anomaliesParMarque = decs.stream()
            .filter(d -> d.getVehiculeImmatriculation() != null)
            .collect(Collectors.groupingBy(d -> {
                Vehicule vv = allVehs.stream().filter(v -> v.getImmatriculation().equals(d.getVehiculeImmatriculation())).findFirst().orElse(null);
                return vv != null && vv.getMarque() != null ? vv.getMarque() : "AUTRE";
            }, Collectors.counting()));

        // Repartition vehicules par marque (%)
        Map<String, Double> marquePct = new LinkedHashMap<>();
        for (Map.Entry<String, Long> e : parMarque.entrySet()) {
            marquePct.put(e.getKey(), total > 0 ? Math.round((double) e.getValue() / total * 10000) / 100.0 : 0);
        }

        // Blocages actifs
        long bloques = blocks.stream().filter(b -> Boolean.TRUE.equals(b.getBloque())).count();

        // Vitesse et consommation moyennes (filtrées)
        List<TrackingHistory> allTracks = immas.isEmpty() ? trackingRepository.findAll()
            : immas.stream().flatMap(im -> trackingRepository.findByImmatriculationOrderByTimestampAsc(im).stream()).collect(Collectors.toList());
        double vitMoyenne = computeAvgSpeed(allTracks);
        double consoMoyenne = vehs.stream().filter(v -> v.getType() != null).mapToDouble(this::computeAvgConsommation).average().orElse(12);
        consoMoyenne = Math.round(consoMoyenne * 10.0) / 10.0;

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("totalVehicules", total);
        r.put("enService", enService);
        r.put("aArret", aArret);
        r.put("enMaintenance", enMaintenance);
        r.put("bloques", bloques);
        r.put("anomaliesOuvertes", anomaliesOuvertes + decsOuvertes);
        r.put("ticketsOuverts", ticketsOuverts);
        r.put("tauxCheckupVert30j", txCheckupVert);
        r.put("vitesseMoyenne", Math.round(vitMoyenne * 10.0) / 10.0);
        r.put("consommationMoyenne", consoMoyenne);
        r.put("anomaliesParSource", parSource);
        r.put("repartitionParMarque", parMarque);
        r.put("repartitionParMarquePct", marquePct);
        r.put("repartitionParCategorie", parCategorie);
        r.put("repartitionParElement", parElement);
        r.put("repartitionParChauffeur", parChauffeur);
        r.put("anomaliesParMarque", anomaliesParMarque);
        r.put("repartitionParTypePanne", repartitionParTypePanne);
        r.put("repartitionParStatut", repartitionParStatut);
        r.put("repartitionParQualification", repartitionParQualification);
        return ResponseEntity.ok(r);
    }

    // ========================================================================
    // SECTION 1b – TENDANCE ANOMALIES & CHECK-UPS
    // ========================================================================
    @GetMapping("/trend")
    public ResponseEntity<Map<String, Object>> getTrend(
            @RequestParam(name = "vehicle", defaultValue = "") String vehicle,
            @RequestParam(name = "months", defaultValue = "6") int months) {
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(months);
        List<DeclarationIncident> decsAll = declarationRepository.findAll().stream()
            .filter(d -> d.getDateHeure() != null && d.getDateHeure().isAfter(cutoff))
            .filter(d -> vehicle.isEmpty() || vehicle.equals(d.getVehiculeImmatriculation()))
            .collect(Collectors.toList());
        List<DriverChecklist> cksAll = checklistRepository.findAll().stream()
            .filter(c -> c.getDateChecklist() != null && c.getDateChecklist().isAfter(cutoff))
            .filter(c -> vehicle.isEmpty() || vehicle.equals(c.getVehiculeImmatriculation()))
            .collect(Collectors.toList());
        List<Checkup> ck2All = checkupRepository.findAll().stream()
            .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(cutoff))
            .filter(c -> vehicle.isEmpty() || vehicle.equals(c.getVehiculeImmatriculation()))
            .collect(Collectors.toList());

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Long> decsByMonth = decsAll.stream()
            .collect(Collectors.groupingBy(d -> d.getDateHeure().format(fmt), Collectors.counting()));
        Map<String, Long> cksByMonth = cksAll.stream()
            .collect(Collectors.groupingBy(c -> c.getDateChecklist().format(fmt), Collectors.counting()));
        for (Checkup c : ck2All) {
            String key = c.getCreatedAt().format(fmt);
            cksByMonth.merge(key, 1L, Long::sum);
        }

        List<String> monthsList = new ArrayList<>();
        List<Map<String, Object>> chartData = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            String key = LocalDateTime.now().minusMonths(i).format(fmt);
            monthsList.add(key);
            long decCount = decsByMonth.getOrDefault(key, 0L);
            long ckCount = cksByMonth.getOrDefault(key, 0L);
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("mois", key);
            pt.put("anomalies", decCount);
            pt.put("checkups", ckCount);
            chartData.add(pt);
        }

        // Simple linear regression on anomalies to determine trend
        int n = monthsList.size();
        double slope = 0;
        if (n > 1) {
            double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            for (int i = 0; i < n; i++) {
                long y = decsByMonth.getOrDefault(monthsList.get(i), 0L);
                sumX += i;
                sumY += y;
                sumXY += i * y;
                sumX2 += i * i;
            }
            double denom = n * sumX2 - sumX * sumX;
            if (denom != 0) {
                slope = (n * sumXY - sumX * sumY) / denom;
            }
        }

        String trend = slope > 0.3 ? "DEGRADATION" : slope < -0.3 ? "AMELIORATION" : "STABLE";
        String trendIcon = slope > 0.3 ? "\u2B06" : slope < -0.3 ? "\u2B07" : "\u27A1";

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("months", monthsList);
        r.put("chartData", chartData);
        r.put("slope", Math.round(slope * 100.0) / 100.0);
        r.put("trend", trend);
        r.put("trendIcon", trendIcon);

        // IA interpretation text
        String iaMessage;
        if ("AMELIORATION".equals(trend)) {
            iaMessage = "Les anomalies diminuent, la flotte s'améliore. Bonne gestion des maintenances.";
        } else if ("DEGRADATION".equals(trend)) {
            iaMessage = "Les anomalies augmentent, attention! Vérifier les véhicules les plus critiques.";
        } else {
            iaMessage = "Tendance stable, la situation est sous contrôle.";
        }
        r.put("iaMessage", iaMessage);
        return ResponseEntity.ok(r);
    }

    // ========================================================================
    // SECTION 2 – FICHE CAMION DIGITALE
    // ========================================================================
    @GetMapping("/vehicle-id-card/{immatriculation}")
    public ResponseEntity<?> getVehicleIdCard(@PathVariable String immatriculation) {
        Vehicule v = vehiculeRepository.findByImmatriculation(immatriculation).orElse(null);
        if (v == null) return ResponseEntity.ok(Map.of("error", "Véhicule introuvable"));

        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation())).collect(Collectors.toList());
        List<DriverChecklist> cks = checklistRepository.findAll().stream()
            .filter(c -> immatriculation.equals(c.getVehiculeImmatriculation())).collect(Collectors.toList());
        List<TicketMaintenance> tickets = ticketRepository.findAll().stream()
            .filter(t -> immatriculation.equals(t.getVehiculeImmatriculation())).collect(Collectors.toList());
        List<LegalDocument> docs = documentRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation())).collect(Collectors.toList());
        List<DepartHistorique> departs = departRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation())).collect(Collectors.toList());

        // Carte d'identité
        Map<String, Object> idCard = new LinkedHashMap<>();
        idCard.put("numeroOrdre", v.getTruckNumber());
        idCard.put("immatriculation", v.getImmatriculation());
        idCard.put("vin", v.getVehicleId());
        idCard.put("marque", v.getMarque());
        idCard.put("modele", v.getModele());
        idCard.put("type", v.getType());
        idCard.put("annee", v.getAnnee());
        idCard.put("kilometrage", v.getKilometrage());
        idCard.put("carburant", v.getCarburant());
        idCard.put("statut", v.getStatut());
        idCard.put("chauffeurNom", v.getChauffeurNom());
        idCard.put("agence", v.getAgence());
        idCard.put("dateAffectation", v.getDateAffectation() != null ? v.getDateAffectation().toString() : null);

        // Performance camion
        long ckTotal = cks.size();
        long ckOK = cks.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();
        long ckNC = cks.stream().filter(c -> Boolean.FALSE.equals(c.getEstConforme())).count();
        long decsTotal = decs.size();
        long decsResolues = decs.stream().filter(d -> "CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())).count();
        long docsValides = docs.stream().filter(d -> d.getStatut() != null && "VALIDE".equals(d.getStatut())).count();
        long docsTotal = docs.size();

        double conformiteSecurite = ckTotal > 0 ? Math.round((double) ckOK / ckTotal * 100) : 0;
        double conformiteQualite = decsTotal > 0 ? Math.round((double) decsResolues / decsTotal * 100) : 0;
        double conformiteReglementaire = docsTotal > 0 ? Math.round((double) docsValides / docsTotal * 100) : 0;
        double scoreIvms = Math.round((conformiteSecurite + conformiteQualite + conformiteReglementaire) / 3);
        Map<String, Object> perf = new LinkedHashMap<>();
        perf.put("conformiteSecurite", conformiteSecurite);
        perf.put("conformiteQualite", conformiteQualite);
        perf.put("conformiteReglementaire", conformiteReglementaire);
        perf.put("scoreIVMS", scoreIvms);
        perf.put("tauxConformiteCheckup", conformiteSecurite);
        perf.put("tauxResolutionAnomalies", conformiteQualite);

        // Dernières anomalies et réparations par criticité
        List<Map<String, Object>> lastAnomalies = decs.stream()
            .sorted((a, b) -> {
                if (a.getDateHeure() == null) return 1; if (b.getDateHeure() == null) return -1;
                return b.getDateHeure().compareTo(a.getDateHeure());
            })
            .limit(10)
            .map(d -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("date", d.getDateHeure() != null ? d.getDateHeure().toString() : null);
                m.put("type", d.getTypePanne()); m.put("criticite", d.getCriticite());
                m.put("statut", d.getStatut()); m.put("element", d.getElementVehicule());
                m.put("description", d.getDescriptionFrancais());
                return m;
            }).collect(Collectors.toList());

        // Derniers entretiens & réparations préventives
        List<Map<String, Object>> lastPreventives = tickets.stream()
            .filter(t -> "CLOTURE".equals(t.getStatut()) || "REPARE".equals(t.getStatut()))
            .sorted((a, b) -> {
                if (a.getDateCloture() == null) return 1; if (b.getDateCloture() == null) return -1;
                return b.getDateCloture().compareTo(a.getDateCloture());
            })
            .limit(10)
            .map(t -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("date", t.getDateCloture() != null ? t.getDateCloture().toString() : null);
                m.put("element", t.getElement()); m.put("criticite", t.getCriticite());
                m.put("actions", t.getActionsRealisees()); m.put("technicien", t.getTechnicien());
                m.put("coutReel", t.getCoutReel());
                return m;
            }).collect(Collectors.toList());

        // Derniers checkups (driver_checklists)
        List<Map<String, Object>> lastCheckups = cks.stream()
            .sorted((a, b) -> {
                if (a.getDateChecklist() == null) return 1; if (b.getDateChecklist() == null) return -1;
                return b.getDateChecklist().compareTo(a.getDateChecklist());
            })
            .limit(10)
            .map(c -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("date", c.getDateChecklist() != null ? c.getDateChecklist().toString() : null);
                m.put("conforme", c.getEstConforme()); m.put("chauffeur", c.getChauffeurNom());
                m.put("statut", c.getStatut()); m.put("feedback", c.getFeedback());
                return m;
            }).collect(Collectors.toList());

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("idCard", idCard);
        r.put("performance", perf);
        r.put("dernieresAnomalies", lastAnomalies);
        r.put("derniersEntretiens", lastPreventives);
        r.put("derniersCheckups", lastCheckups);
        return ResponseEntity.ok(r);
    }

    // ========================================================================
    // SECTION 3 – ANALYSE DÉTAILLÉE – FILTRE CAMION
    // ========================================================================
    @GetMapping("/vehicle-deep-analysis/{immatriculation}")
    public ResponseEntity<?> getVehicleDeepAnalysis(@PathVariable String immatriculation) {
        Vehicule v = vehiculeRepository.findByImmatriculation(immatriculation).orElse(null);
        if (v == null) return ResponseEntity.ok(Map.of("error", "Véhicule introuvable"));

        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> immatriculation.equals(d.getVehiculeImmatriculation()) && d.getDateHeure() != null).collect(Collectors.toList());
        List<DriverChecklist> cks = checklistRepository.findAll().stream()
            .filter(c -> immatriculation.equals(c.getVehiculeImmatriculation()) && c.getDateChecklist() != null).collect(Collectors.toList());
        List<TicketMaintenance> tickets = ticketRepository.findAll().stream()
            .filter(t -> immatriculation.equals(t.getVehiculeImmatriculation())).collect(Collectors.toList());

        // Re-identification
        Map<String, Object> identity = new LinkedHashMap<>();
        identity.put("immatriculation", v.getImmatriculation());
        identity.put("numeroOrdre", v.getTruckNumber());
        identity.put("marque", v.getMarque());
        identity.put("modele", v.getModele());
        identity.put("type", v.getType());
        identity.put("annee", v.getAnnee());
        identity.put("kilometrage", v.getKilometrage());
        identity.put("chauffeurNom", v.getChauffeurNom());
        identity.put("statut", v.getStatut());

        // Performance
        long ckOK = cks.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();
        double txConformite = cks.size() > 0 ? Math.round((double) ckOK / cks.size() * 100) : 100;
        long decsResolues = decs.stream().filter(d -> "CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())).count();
        double txResolution = decs.size() > 0 ? Math.round((double) decsResolues / decs.size() * 100) : 100;
        double coutTotal = decs.stream().filter(d -> d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).sum();
        Map<String, Object> vehStats = computeVehicleStats(immatriculation);
        // Durée moyenne réparation
        double dureeMoyenneReparation = tickets.stream()
            .filter(t -> t.getDateOuverture() != null && t.getDateCloture() != null)
            .mapToLong(t -> java.time.temporal.ChronoUnit.DAYS.between(t.getDateOuverture(), t.getDateCloture()))
            .average().orElse(0);
        dureeMoyenneReparation = Math.round(dureeMoyenneReparation * 10.0) / 10.0;
        // Taux 1ère intervention
        long totalTickets = tickets.size();
        long ticketsFermes = tickets.stream().filter(t -> "CLOTURE".equals(t.getStatut())).count();
        double tauxPremiereIntervention = totalTickets > 0 ? Math.round((double) ticketsFermes / totalTickets * 100) : 0;
        Map<String, Object> perf = new LinkedHashMap<>();
        perf.put("totalAnomalies", decs.size());
        perf.put("totalCheckups", cks.size());
        perf.put("tauxConformite", txConformite);
        perf.put("tauxResolution", txResolution);
        perf.put("coutTotal", coutTotal);
        perf.put("vitesseMoyenne", vehStats.get("vitesseMoyenne"));
        perf.put("consommationMoyenne", vehStats.get("consommationMoyenne"));
        perf.put("dureeMoyenneReparation", dureeMoyenneReparation);
        perf.put("tauxPremiereIntervention", tauxPremiereIntervention);

        // Anomalies vs réparations par mois
        Map<String, long[]> parMois = new TreeMap<>();
        for (DeclarationIncident d : decs) {
            String m = d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            parMois.computeIfAbsent(m, k -> new long[4])[0]++;
            if ("CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())) parMois.get(m)[1]++;
            if ("CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite())) parMois.get(m)[2]++;
        }
        for (DriverChecklist c : cks) {
            String m = c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            parMois.computeIfAbsent(m, k -> new long[4])[3]++;
        }
        List<Map<String, Object>> anomaliesVsReparations = new ArrayList<>();
        for (Map.Entry<String, long[]> e : parMois.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("mois", e.getKey()); row.put("anomalies", e.getValue()[0]);
            row.put("reparations", e.getValue()[1]); row.put("critiques", e.getValue()[2]);
            row.put("checkups", e.getValue()[3]);
            anomaliesVsReparations.add(row);
        }

        // Détails réparations par catégorie / gravité / source
        Map<String, Long> parCategorie = decs.stream().filter(d -> d.getCategorie() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getCategorie, Collectors.counting()));
        Map<String, Long> parGravite = decs.stream().filter(d -> d.getCriticite() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getCriticite, Collectors.counting()));
        Map<String, Long> parSource = decs.stream().filter(d -> d.getSource() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getSource, Collectors.counting()));

        // Historique des anomalies et réparations
        List<Map<String, Object>> historique = new ArrayList<>();
        for (DeclarationIncident d : decs) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", d.getDateHeure().toString()); row.put("type", "ANOMALIE");
            row.put("element", d.getElementVehicule()); row.put("criticite", d.getCriticite());
            row.put("statut", d.getStatut()); row.put("source", d.getSource());
            row.put("description", d.getDescriptionFrancais());
            row.put("cout", d.getCoutProbleme()); row.put("chauffeur", d.getChauffeurNom());
            historique.add(row);
        }
        for (TicketMaintenance t : tickets) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", t.getDateOuverture() != null ? t.getDateOuverture().toString() : null);
            row.put("type", "MAINTENANCE"); row.put("element", t.getElement());
            row.put("criticite", t.getCriticite()); row.put("statut", t.getStatut());
            row.put("source", "TICKET"); row.put("description", t.getDescription());
            row.put("cout", t.getCoutReel() != null ? t.getCoutReel() : t.getCoutEstime());
            row.put("chauffeur", null);
            historique.add(row);
        }
        historique.sort((a, b) -> {
            String da = (String) a.get("date"); String db = (String) b.get("date");
            if (da == null) return 1; if (db == null) return -1;
            return db.compareTo(da);
        });

        // Suivi réparations (statuts)
        Map<String, Long> suiviReparations = tickets.stream()
            .filter(t -> t.getStatut() != null)
            .collect(Collectors.groupingBy(t -> t.getStatut().name(), Collectors.counting()));

        // Anomalies par élément
        Map<String, Long> anomaliesParElement = decs.stream()
            .filter(d -> d.getElementVehicule() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getElementVehicule, Collectors.counting()));

        // PDR consommé par camion
        Map<String, Double> pdrConsomme = decs.stream()
            .filter(d -> d.getTypePanne() != null && d.getCoutProbleme() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.summingDouble(DeclarationIncident::getCoutProbleme)));
        // Also add ticket costs per element
        Map<String, Double> pdrTickets = tickets.stream()
            .filter(t -> t.getElement() != null && t.getCoutReel() != null)
            .collect(Collectors.groupingBy(TicketMaintenance::getElement, Collectors.summingDouble(TicketMaintenance::getCoutReel)));

        // Types d'incident (par typePanne) pour ce véhicule
        Map<String, Long> repartitionParTypePanne = decs.stream()
            .filter(d -> d.getTypePanne() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.counting()));

        // Types de déclarations par statut pour ce véhicule
        Map<String, Long> repartitionParStatut = decs.stream()
            .filter(d -> d.getStatut() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getStatut, Collectors.counting()));

        // Types de déclarations par qualification pour ce véhicule
        Map<String, Long> repartitionParQualification = decs.stream()
            .filter(d -> d.getQualification() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getQualification, Collectors.counting()));

        // Anomalies ouvertes
        List<Map<String, Object>> anomaliesOuvertes = decs.stream()
            .filter(d -> !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut()) && !"ANNULE".equals(d.getStatut()))
            .map(d -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("date", d.getDateHeure().toString()); row.put("element", d.getElementVehicule());
                row.put("criticite", d.getCriticite()); row.put("statut", d.getStatut());
                row.put("description", d.getDescriptionFrancais()); row.put("sla", d.getSla());
                return row;
            }).collect(Collectors.toList());

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("identity", identity); r.put("performance", perf);
        r.put("anomaliesVsReparationsMois", anomaliesVsReparations);
        r.put("reparationsParCategorie", parCategorie);
        r.put("reparationsParGravite", parGravite);
        r.put("reparationsParSource", parSource);
        r.put("historique", historique);
        r.put("suiviReparations", suiviReparations);
        r.put("anomaliesParElement", anomaliesParElement);
        r.put("anomaliesOuvertes", anomaliesOuvertes);
        r.put("pdrConsomme", pdrConsomme);
        r.put("pdrTickets", pdrTickets);
        r.put("repartitionParTypePanne", repartitionParTypePanne);
        r.put("repartitionParStatut", repartitionParStatut);
        r.put("repartitionParQualification", repartitionParQualification);
        return ResponseEntity.ok(r);
    }

    // ========================================================================
    // SECTION 4 – ANALYSE DÉTAILLÉE – FILTRE CHAUFFEUR
    // ========================================================================
    @GetMapping("/driver-deep-analysis/{chauffeurNom}")
    public ResponseEntity<?> getDriverDeepAnalysis(@PathVariable String chauffeurNom) {
        List<DeclarationIncident> decs = declarationRepository.findAll().stream()
            .filter(d -> chauffeurNom.equalsIgnoreCase(d.getChauffeurNom())).collect(Collectors.toList());
        List<DriverChecklist> cks = checklistRepository.findAll().stream()
            .filter(c -> chauffeurNom.equalsIgnoreCase(c.getChauffeurNom())).collect(Collectors.toList());
        List<DepartHistorique> departs = departRepository.findAll().stream()
            .filter(d -> chauffeurNom.equalsIgnoreCase(d.getChauffeurNom())).collect(Collectors.toList());
        List<DriverPresence> presences = presenceRepository.findAll();

        // Consolidation anomalies par chauffeur
        long totalAnomalies = decs.size();
        long resolues = decs.stream().filter(d -> "CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())).count();
        long critiques = decs.stream().filter(d -> "CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite())).count();
        double coutTotal = decs.stream().filter(d -> d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).sum();
        long totalCheckups = cks.size();
        long checkupsOK = cks.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();
        long checkupsNC = cks.stream().filter(c -> Boolean.FALSE.equals(c.getEstConforme())).count();
        double tauxConformite = totalCheckups > 0 ? Math.round((double) checkupsOK / totalCheckups * 100) : 100;
        double tauxResolution = totalAnomalies > 0 ? Math.round((double) resolues / totalAnomalies * 100) : 100;

        // Score conducteur
        int score = (int) Math.round(tauxConformite * 0.4 + tauxResolution * 0.4 + (critiques == 0 ? 20 : Math.max(0, 20 - critiques * 5)));

        // Anomalies par mois
        Map<String, long[]> parMois = new TreeMap<>();
        for (DeclarationIncident d : decs) {
            if (d.getDateHeure() == null) continue;
            String m = d.getDateHeure().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            parMois.computeIfAbsent(m, k -> new long[5])[0]++;
            if ("CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())) parMois.get(m)[1]++;
            if ("CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite())) parMois.get(m)[2]++;
        }
        for (DriverChecklist c : cks) {
            if (c.getDateChecklist() == null) continue;
            String m = c.getDateChecklist().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            parMois.computeIfAbsent(m, k -> new long[5])[3]++;
            if (Boolean.TRUE.equals(c.getEstConforme())) parMois.get(m)[4]++;
        }
        List<Map<String, Object>> tendances = new ArrayList<>();
        for (Map.Entry<String, long[]> e : parMois.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("mois", e.getKey()); row.put("anomalies", e.getValue()[0]);
            row.put("resolues", e.getValue()[1]); row.put("critiques", e.getValue()[2]);
            row.put("checkups", e.getValue()[3]); row.put("checkupsOK", e.getValue()[4]);
            tendances.add(row);
        }

        // Anomalies par gravité
        Map<String, Long> parGravite = decs.stream()
            .filter(d -> d.getCriticite() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getCriticite, Collectors.counting()));
        // PDR consommé par chauffeur (via coutProbleme par type de panne)
        Map<String, Double> pdrConsomme = decs.stream()
            .filter(d -> d.getTypePanne() != null && d.getCoutProbleme() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.summingDouble(DeclarationIncident::getCoutProbleme)));

        // Dernières anomalies par véhicule
        Map<String, Long> parVehicule = decs.stream()
            .filter(d -> d.getVehiculeImmatriculation() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getVehiculeImmatriculation, Collectors.counting()));

        // Derniers checkups
        List<Map<String, Object>> derniersCheckups = cks.stream()
            .sorted((a, b) -> {
                if (a.getDateChecklist() == null) return 1; if (b.getDateChecklist() == null) return -1;
                return b.getDateChecklist().compareTo(a.getDateChecklist());
            })
            .limit(10)
            .map(c -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("date", c.getDateChecklist() != null ? c.getDateChecklist().toString() : null);
                row.put("vehicule", c.getVehiculeImmatriculation());
                row.put("conforme", c.getEstConforme()); row.put("statut", c.getStatut());
                row.put("pneus", c.getPneus()); row.put("freins", c.getFreins()); row.put("feux", c.getFeux());
                return row;
            }).collect(Collectors.toList());

        // Vitesse et consommation du chauffeur (moyenne des vehicules utilises)
        Map<String, Object> driverStats = Map.of("vitesseMoyenne", 0.0, "consommationMoyenne", 0.0);
        if (!parVehicule.isEmpty()) {
            double totalVit = 0, totalConso = 0;
            for (String imma : parVehicule.keySet()) {
                Map<String, Object> vs = computeVehicleStats(imma);
                totalVit += (Double) vs.getOrDefault("vitesseMoyenne", 0.0);
                totalConso += (Double) vs.getOrDefault("consommationMoyenne", 12.0);
            }
            int n = parVehicule.size();
            driverStats = Map.of("vitesseMoyenne", Math.round(totalVit / n * 10.0) / 10.0, "consommationMoyenne", Math.round(totalConso / n * 10.0) / 10.0);
        }

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("chauffeurNom", chauffeurNom);
        r.put("totalAnomalies", totalAnomalies);
        r.put("anomaliesResolues", resolues);
        r.put("anomaliesCritiques", critiques);
        r.put("coutTotal", coutTotal);
        r.put("totalCheckups", totalCheckups);
        r.put("checkupsOK", checkupsOK);
        r.put("checkupsNC", checkupsNC);
        r.put("tauxConformite", tauxConformite);
        r.put("tauxResolution", tauxResolution);
        r.put("score", score);
        r.put("vitesseMoyenne", driverStats.get("vitesseMoyenne"));
        r.put("consommationMoyenne", driverStats.get("consommationMoyenne"));
        r.put("anomaliesParGravite", parGravite);
        r.put("pdrConsomme", pdrConsomme);
        r.put("tendancesMensuelles", tendances);
        r.put("anomaliesParVehicule", parVehicule);
        r.put("derniersCheckups", derniersCheckups);

        // Types d'incident et déclarations pour ce chauffeur
        Map<String, Long> repartitionParTypePanne = decs.stream()
            .filter(d -> d.getTypePanne() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.counting()));
        Map<String, Long> repartitionParStatut = decs.stream()
            .filter(d -> d.getStatut() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getStatut, Collectors.counting()));
        Map<String, Long> repartitionParQualification = decs.stream()
            .filter(d -> d.getQualification() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getQualification, Collectors.counting()));
        r.put("repartitionParTypePanne", repartitionParTypePanne);
        r.put("repartitionParStatut", repartitionParStatut);
        r.put("repartitionParQualification", repartitionParQualification);

        return ResponseEntity.ok(r);
    }

    // ========================================================================
    // SECTION 5 – ALERTES AUTOMATIQUES + EXPORT GLOBAL FLAT
    // ========================================================================
    protected List<Map<String, Object>> alerts() {
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<Vehicule> vehs = vehiculeRepository.findAll();
        List<LegalDocument> docs = documentRepository.findAll();
        List<DriverChecklist> cks = checklistRepository.findAll();
        List<TicketMaintenance> tickets = ticketRepository.findAll();
        List<VehicleBlocking> blocks = blockingRepository.findAll();
        List<Map<String, Object>> alertes = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Expiration documents légaux
        for (LegalDocument d : docs) {
            if (d.getDateExpiration() == null) continue;
            long joursRestants = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), d.getDateExpiration());
            if (joursRestants < 0) {
                alertes.add(Map.of("type", "DOCUMENT_EXPIRE", "severite", "HAUTE",
                    "vehicule", d.getVehiculeImmatriculation(), "document", d.getType(),
                    "numero", d.getNumeroDocument(), "expireLe", d.getDateExpiration().toString(),
                    "message", "Document expiré depuis " + Math.abs(joursRestants) + " jours"));
            } else if (joursRestants <= 30) {
                alertes.add(Map.of("type", "DOCUMENT_EXPIRE_BIENTOT", "severite", "MOYENNE",
                    "vehicule", d.getVehiculeImmatriculation(), "document", d.getType(),
                    "numero", d.getNumeroDocument(), "expireLe", d.getDateExpiration().toString(),
                    "message", "Expire dans " + joursRestants + " jours"));
            }
        }

        // Retard maintenance
        for (TicketMaintenance t : tickets) {
            if (!"OUVERT".equals(t.getStatut()) && !"EN_COURS".equals(t.getStatut())) continue;
            if (t.getDateOuverture() == null) continue;
            long jours = java.time.temporal.ChronoUnit.DAYS.between(t.getDateOuverture(), LocalDateTime.now());
            if (jours > 7) {
                alertes.add(Map.of("type", "RETARD_MAINTENANCE", "severite", "MOYENNE",
                    "vehicule", t.getVehiculeImmatriculation(), "ticket", t.getNumeroTicket(),
                    "element", t.getElement(), "joursOuvert", jours,
                    "message", "Ticket " + t.getNumeroTicket() + " ouvert depuis " + jours + " jours"));
            }
        }

        // Véhicule immobilisé prolongé
        for (VehicleBlocking b : blocks) {
            if (!Boolean.TRUE.equals(b.getBloque()) || b.getDateBlocage() == null) continue;
            long jours = java.time.temporal.ChronoUnit.DAYS.between(b.getDateBlocage(), LocalDate.now());
            if (jours > 3) {
                alertes.add(Map.of("type", "IMMOBILISE_PROLONGE", "severite", "HAUTE",
                    "vehicule", b.getVehiculeImmatriculation(), "joursBloque", jours,
                    "message", "Véhicule immobilisé depuis " + jours + " jours"));
            }
        }

        // Anomalies critiques non traitées
        long critiquesNonTraitees = decs.stream()
            .filter(d -> ("CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite()))
                && !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut()))
            .count();
        if (critiquesNonTraitees > 0) {
            alertes.add(Map.of("type", "ANOMALIES_CRITIQUES", "severite", "HAUTE",
                "count", critiquesNonTraitees,
                "message", critiquesNonTraitees + " anomalie(s) critique(s) non traitées"));
        }

        // Non-conformité check-up chauffeur
        long checkupsNC = cks.stream()
            .filter(c -> Boolean.FALSE.equals(c.getEstConforme()) && c.getDateChecklist() != null
                && c.getDateChecklist().isAfter(LocalDateTime.now().minusDays(7)))
            .count();
        if (checkupsNC > 0) {
            alertes.add(Map.of("type", "CHECKUP_NON_CONFORME", "severite", "MOYENNE",
                "count", checkupsNC,
                "message", checkupsNC + " check-up(s) non conforme(s) cette semaine"));
        }

        // Déclaration incident critique récente
        long incidentsCritiquesRecents = decs.stream()
            .filter(d -> "CRITIQUE".equals(d.getCriticite()) && d.getDateHeure() != null
                && d.getDateHeure().isAfter(LocalDateTime.now().minusDays(7))
                && !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut()))
            .count();
        if (incidentsCritiquesRecents > 0) {
            alertes.add(Map.of("type", "INCIDENT_CRITIQUE", "severite", "HAUTE",
                "count", incidentsCritiquesRecents,
                "message", incidentsCritiquesRecents + " déclaration(s) incident critique cette semaine"));
        }

        return alertes;
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Map<String, Object>>> getAlerts(
            @RequestParam(name = "period", defaultValue = "30j") String period,
            @RequestParam(name = "vehicle", defaultValue = "") String vehicle) {
        return ResponseEntity.ok(alerts());
    }

    // ========================================================================
    // EXPORT GLOBAL POWER BI (FLAT + STRUCTURED)
    // ========================================================================
    @GetMapping("/full-export")
    public ResponseEntity<Map<String, Object>> getFullExport(
            @RequestParam(name = "period", defaultValue = "30j") String period,
            @RequestParam(name = "vehicle", defaultValue = "") String vehicle,
            @RequestParam(name = "site", defaultValue = "") String site) {
        List<Vehicule> vehs = vehiculeRepository.findAll();
        List<DeclarationIncident> decs = declarationRepository.findAll();
        List<DriverChecklist> cks = checklistRepository.findAll();
        List<TicketMaintenance> tickets = ticketRepository.findAll();
        List<LegalDocument> docs = documentRepository.findAll();
        List<DepartHistorique> departs = departRepository.findAll();

        // 1. Véhicules (plat)
        List<Map<String, Object>> flatVehicles = vehs.stream().map(v -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", v.getId()); row.put("numeroOrdre", v.getTruckNumber());
            row.put("vin", v.getVehicleId()); row.put("immatriculation", v.getImmatriculation());
            row.put("marque", v.getMarque()); row.put("modele", v.getModele());
            row.put("type", v.getType()); row.put("annee", v.getAnnee());
            row.put("kilometrage", v.getKilometrage()); row.put("carburant", v.getCarburant());
            row.put("statut", v.getStatut()); row.put("agence", v.getAgence());
            row.put("chauffeurNom", v.getChauffeurNom());
            return row;
        }).collect(Collectors.toList());

        // 2. Déclarations (plat)
        List<Map<String, Object>> flatDeclarations = decs.stream().map(d -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", d.getIdIncident()); row.put("numeroDemande", d.getNumeroDemande());
            row.put("dateDeclaration", d.getDateHeure() != null ? d.getDateHeure().toString() : null);
            row.put("dateReclamation", d.getDateReclamation() != null ? d.getDateReclamation().toString() : null);
            row.put("mois", d.getMois()); row.put("typePanne", d.getTypePanne());
            row.put("criticite", d.getCriticite()); row.put("statut", d.getStatut());
            row.put("elementVehicule", d.getElementVehicule()); row.put("categorie", d.getCategorie());
            row.put("source", d.getSource()); row.put("chauffeurNom", d.getChauffeurNom());
            row.put("chauffeurMatricule", d.getChauffeurMatricule());
            row.put("vehiculeImmatriculation", d.getVehiculeImmatriculation());
            row.put("vehiculeMarque", d.getVehiculeMarque());
            row.put("cout", d.getCoutProbleme()); row.put("sla", d.getSla());
            row.put("dureeReparation", d.getDureeReparation());
            row.put("dateDebutIntervention", d.getDateDebutIntervention() != null ? d.getDateDebutIntervention().toString() : null);
            row.put("dateReparation", d.getDateReparation() != null ? d.getDateReparation().toString() : null);
            row.put("description", d.getDescriptionFrancais());
            row.put("actions", d.getActionsRealisees());
            row.put("pieces", d.getPiecesNecessaires());
            row.put("qualification", d.getQualification());
            return row;
        }).collect(Collectors.toList());

        // 3. Check-lists quotidiennes (plat)
        List<Map<String, Object>> flatChecklists = cks.stream().map(c -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", c.getId()); row.put("chauffeurNom", c.getChauffeurNom());
            row.put("chauffeurMatricule", c.getChauffeurMatricule());
            row.put("vehiculeImmatriculation", c.getVehiculeImmatriculation());
            row.put("dateChecklist", c.getDateChecklist() != null ? c.getDateChecklist().toString() : null);
            row.put("statut", c.getStatut()); row.put("estConforme", c.getEstConforme());
            row.put("pneus", c.getPneus()); row.put("freins", c.getFreins());
            row.put("feux", c.getFeux()); row.put("extincteur", c.getExtincteur());
            row.put("documents", c.getDocuments()); row.put("carrosserie", c.getCarrosserie());
            row.put("huile", c.getHuileNiveau()); row.put("batterie", c.getBatterie());
            row.put("essuieGlaces", c.getEssuieGlaces()); row.put("ceintures", c.getCeinturesSecurite());
            row.put("validePar", c.getValidePar());
            row.put("dateValidation", c.getDateValidation() != null ? c.getDateValidation().toString() : null);
            row.put("feedback", c.getFeedback());
            row.put("tourneeId", c.getTourneeId());
            return row;
        }).collect(Collectors.toList());

        // 4. Documents légaux (plat)
        List<Map<String, Object>> flatDocuments = docs.stream().map(d -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", d.getId()); row.put("vehiculeImmatriculation", d.getVehiculeImmatriculation());
            row.put("type", d.getType()); row.put("numero", d.getNumeroDocument());
            row.put("dateExpiration", d.getDateExpiration() != null ? d.getDateExpiration().toString() : null);
            row.put("statut", d.getStatut());
            row.put("joursRestants", d.getDateExpiration() != null ?
                java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), d.getDateExpiration()) : null);
            return row;
        }).collect(Collectors.toList());

        // 5. Tickets maintenance (plat)
        List<Map<String, Object>> flatTickets = tickets.stream().map(t -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", t.getId()); row.put("numeroTicket", t.getNumeroTicket());
            row.put("vehiculeImmatriculation", t.getVehiculeImmatriculation());
            row.put("dateOuverture", t.getDateOuverture() != null ? t.getDateOuverture().toString() : null);
            row.put("dateCloture", t.getDateCloture() != null ? t.getDateCloture().toString() : null);
            row.put("element", t.getElement()); row.put("criticite", t.getCriticite());
            row.put("statut", t.getStatut()); row.put("description", t.getDescription());
            row.put("actions", t.getActionsRealisees());
            row.put("pieces", t.getPiecesNecessaires());
            row.put("coutEstime", t.getCoutEstime()); row.put("coutReel", t.getCoutReel());
            row.put("technicien", t.getTechnicien());
            return row;
        }).collect(Collectors.toList());

        // 6. Départs historiques (plat)
        List<Map<String, Object>> flatDeparts = departs.stream().map(d -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", d.getId()); row.put("numeroDepart", d.getNumeroDepart());
            row.put("chauffeurNom", d.getChauffeurNom());
            row.put("vehiculeImmatriculation", d.getVehiculeImmatriculation());
            row.put("dateDepart", d.getDateDepart() != null ? d.getDateDepart().toString() : null);
            row.put("resultat", d.getResultatControle());
            row.put("site", d.getSite()); row.put("branchCode", d.getBranchCode());
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("exportedAt", LocalDateTime.now().toString());
        r.put("vehicules", flatVehicles);
        r.put("declarations", flatDeclarations);
        r.put("checklists", flatChecklists);
        r.put("documentsLegaux", flatDocuments);
        r.put("ticketsMaintenance", flatTickets);
        r.put("departs", flatDeparts);
        r.put("totalVehicules", flatVehicles.size());
        r.put("totalDeclarations", flatDeclarations.size());
        r.put("totalChecklists", flatChecklists.size());
        r.put("totalDocuments", flatDocuments.size());
        r.put("totalTickets", flatTickets.size());
        r.put("totalDeparts", flatDeparts.size());
        return ResponseEntity.ok(r);
    }

    // ========================================================================
    // SECTION 6 – AI INSIGHTS : Déclarations & Check-ups
    // ========================================================================
    @GetMapping("/ai-insights")
    public ResponseEntity<Map<String, Object>> getAiInsights(
            @RequestParam(name = "vehicle", defaultValue = "") String vehicle,
            @RequestParam(name = "driver", defaultValue = "") String driver,
            @RequestParam(name = "months", defaultValue = "6") int months) {
        List<DeclarationIncident> allDecs = declarationRepository.findAll();
        List<DriverChecklist> allCks = checklistRepository.findAll();
        List<TicketMaintenance> allTickets = ticketRepository.findAll();

        // Apply filters
        Stream<DeclarationIncident> decsStream = allDecs.stream()
            .filter(d -> d.getDateHeure() != null)
            .filter(d -> vehicle.isEmpty() || vehicle.equals(d.getVehiculeImmatriculation()))
            .filter(d -> driver.isEmpty() || driver.equalsIgnoreCase(d.getChauffeurNom()));
        Stream<DriverChecklist> cksStream = allCks.stream()
            .filter(c -> c.getDateChecklist() != null)
            .filter(c -> vehicle.isEmpty() || vehicle.equals(c.getVehiculeImmatriculation()))
            .filter(c -> driver.isEmpty() || driver.equalsIgnoreCase(c.getChauffeurNom()));

        List<DeclarationIncident> decs = decsStream.collect(Collectors.toList());
        List<DriverChecklist> cks = cksStream.collect(Collectors.toList());

        // ---- DÉCLARATIONS ANALYSIS ----
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(months);
        LocalDateTime midCutoff = LocalDateTime.now().minusMonths(months / 2);

        List<DeclarationIncident> decsPeriod = decs.stream()
            .filter(d -> d.getDateHeure().isAfter(cutoff)).collect(Collectors.toList());
        List<DeclarationIncident> decsRecent = decsPeriod.stream()
            .filter(d -> d.getDateHeure().isAfter(midCutoff)).collect(Collectors.toList());
        List<DeclarationIncident> decsOld = decsPeriod.stream()
            .filter(d -> !d.getDateHeure().isAfter(midCutoff)).collect(Collectors.toList());

        long totalDecsPeriod = decsPeriod.size();
        long totalDecsRecent = decsRecent.size();
        long totalDecsOld = decsOld.size();

        // Resolution rate
        long resoluesRecent = decsRecent.stream().filter(d -> "CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())).count();
        long resoluesOld = decsOld.stream().filter(d -> "CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())).count();
        double tauxResoRecent = totalDecsRecent > 0 ? Math.round((double) resoluesRecent / totalDecsRecent * 100) : 0;
        double tauxResoOld = totalDecsOld > 0 ? Math.round((double) resoluesOld / totalDecsOld * 100) : 0;

        // Critical rate
        long critiquesRecent = decsRecent.stream().filter(d -> "CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite())).count();
        long critiquesOld = decsOld.stream().filter(d -> "CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite())).count();
        double tauxCritRecent = totalDecsRecent > 0 ? Math.round((double) critiquesRecent / totalDecsRecent * 100) : 0;
        double tauxCritOld = totalDecsOld > 0 ? Math.round((double) critiquesOld / totalDecsOld * 100) : 0;

        // Monthly trend for declarations
        Map<String, Long> decsParMois = decsPeriod.stream()
            .collect(Collectors.groupingBy(d -> d.getDateHeure().format(fmt), Collectors.counting()));
        List<Map.Entry<String, Long>> sortedDecsMois = new ArrayList<>(decsParMois.entrySet());
        sortedDecsMois.sort(Map.Entry.comparingByKey());
        double decsSlope = computeSlope(sortedDecsMois);
        String decsTrend = decsSlope > 0.3 ? "EN_HAUSSE" : decsSlope < -0.3 ? "EN_BAISSE" : "STABLE";

        // Average cost trend
        double coutMoyenRecent = decsRecent.stream().filter(d -> d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).average().orElse(0);
        double coutMoyenOld = decsOld.stream().filter(d -> d.getCoutProbleme() != null).mapToDouble(DeclarationIncident::getCoutProbleme).average().orElse(0);

        // ---- CHECK-UPS ANALYSIS ----
        List<DriverChecklist> cksPeriod = cks.stream()
            .filter(c -> c.getDateChecklist().isAfter(cutoff)).collect(Collectors.toList());
        List<DriverChecklist> cksRecent = cksPeriod.stream()
            .filter(c -> c.getDateChecklist().isAfter(midCutoff)).collect(Collectors.toList());
        List<DriverChecklist> cksOld = cksPeriod.stream()
            .filter(c -> !c.getDateChecklist().isAfter(midCutoff)).collect(Collectors.toList());

        long totalCksPeriod = cksPeriod.size();
        long totalCksRecent = cksRecent.size();
        long totalCksOld = cksOld.size();

        long conformesRecent = cksRecent.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();
        long conformesOld = cksOld.stream().filter(c -> Boolean.TRUE.equals(c.getEstConforme())).count();
        long ncRecent = cksRecent.stream().filter(c -> Boolean.FALSE.equals(c.getEstConforme())).count();
        long ncOld = cksOld.stream().filter(c -> Boolean.FALSE.equals(c.getEstConforme())).count();

        double txConformiteRecent = totalCksRecent > 0 ? Math.round((double) conformesRecent / totalCksRecent * 100) : 0;
        double txConformiteOld = totalCksOld > 0 ? Math.round((double) conformesOld / totalCksOld * 100) : 0;

        // Monthly trend for checkups
        Map<String, Long> cksParMois = cksPeriod.stream()
            .collect(Collectors.groupingBy(c -> c.getDateChecklist().format(fmt), Collectors.counting()));
        List<Map.Entry<String, Long>> sortedCksMois = new ArrayList<>(cksParMois.entrySet());
        sortedCksMois.sort(Map.Entry.comparingByKey());
        double cksSlope = computeSlope(sortedCksMois);
        String cksTrend = cksSlope > 0.3 ? "EN_HAUSSE" : cksSlope < -0.3 ? "EN_BAISSE" : "STABLE";

        // ---- GENERATE INSIGHTS ----
        String declaInsight = generateDeclaInsight(totalDecsPeriod, totalDecsRecent, totalDecsOld,
            tauxResoRecent, tauxResoOld, tauxCritRecent, tauxCritOld, decsTrend, coutMoyenRecent, coutMoyenOld);
        String checkupInsight = generateCheckupInsight(totalCksPeriod, totalCksRecent, totalCksOld,
            txConformiteRecent, txConformiteOld, ncRecent, ncOld, cksTrend);

        Map<String, Object> r = new LinkedHashMap<>();
        Map<String, Object> declaMap = new LinkedHashMap<>();
        declaMap.put("total", totalDecsPeriod);
        declaMap.put("periodeMois", months);
        declaMap.put("tendance", decsTrend);
        declaMap.put("pente", Math.round(decsSlope * 100.0) / 100.0);
        declaMap.put("tauxResolutionRecent", tauxResoRecent);
        declaMap.put("tauxResolutionAvant", tauxResoOld);
        declaMap.put("tauxCritiqueRecent", tauxCritRecent);
        declaMap.put("tauxCritiqueAvant", tauxCritOld);
        declaMap.put("coutMoyenRecent", Math.round(coutMoyenRecent * 100.0) / 100.0);
        declaMap.put("coutMoyenAvant", Math.round(coutMoyenOld * 100.0) / 100.0);
        declaMap.put("insight", declaInsight);
        r.put("declarations", declaMap);

        Map<String, Object> checkupMap = new LinkedHashMap<>();
        checkupMap.put("total", totalCksPeriod);
        checkupMap.put("periodeMois", months);
        checkupMap.put("tendance", cksTrend);
        checkupMap.put("pente", Math.round(cksSlope * 100.0) / 100.0);
        checkupMap.put("tauxConformiteRecent", txConformiteRecent);
        checkupMap.put("tauxConformiteAvant", txConformiteOld);
        checkupMap.put("nonConformesRecents", ncRecent);
        checkupMap.put("nonConformesAvant", ncOld);
        checkupMap.put("insight", checkupInsight);
        r.put("checkups", checkupMap);
        return ResponseEntity.ok(r);
    }

    private double computeSlope(List<Map.Entry<String, Long>> data) {
        int n = data.size();
        if (n < 2) return 0;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            long y = data.get(i).getValue();
            sumX += i;
            sumY += y;
            sumXY += i * y;
            sumX2 += i * i;
        }
        double denom = n * sumX2 - sumX * sumX;
        return denom != 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    }

    private String generateDeclaInsight(long total, long recent, long old,
            double txResoRecent, double txResoOld,
            double txCritRecent, double txCritOld,
            String trend, double coutRecent, double coutOld) {
        StringBuilder sb = new StringBuilder();
        if (total == 0) return "Aucune déclaration sur la période analysée.";
        sb.append("Sur ").append(total).append(" déclarations");
        if (old > 0 && recent > 0) {
            long variation = recent - old;
            String dir = variation > 0 ? "hausse" : "baisse";
            sb.append(", le nombre est en ").append(dir).append(" de ").append(Math.abs(variation));
            sb.append(" (").append(old > 0 ? Math.round((double) variation / old * 100) : 0).append("%)");
        }
        sb.append(". ");
        if (txResoRecent > 0 || txResoOld > 0) {
            sb.append("Taux de résolution : ").append((int)txResoRecent).append("%");
            if (txResoRecent > txResoOld) sb.append(" (en amélioration de ").append((int)(txResoRecent - txResoOld)).append("pts)");
            else if (txResoRecent < txResoOld) sb.append(" (en dégradation de ").append((int)(txResoOld - txResoRecent)).append("pts)");
            else sb.append(" (stable)");
            sb.append(". ");
        }
        if (txCritRecent > 0) {
            sb.append((int)txCritRecent).append("% des déclarations sont critiques");
            if (txCritRecent > txCritOld) sb.append(" (en hausse)");
            else if (txCritRecent < txCritOld) sb.append(" (en baisse)");
            sb.append(". ");
        }
        if (coutRecent > 0) {
            sb.append("Coût moyen par déclaration : ").append(Math.round(coutRecent)).append(" DH");
            if (coutRecent > coutOld) sb.append(" (en hausse par rapport à la période précédente)");
            else if (coutRecent < coutOld) sb.append(" (en baisse)");
            sb.append(".");
        }
        if (trend.equals("EN_HAUSSE")) sb.append(" Attention : tendance haussière détectée.");
        else if (trend.equals("EN_BAISSE")) sb.append(" Bon point : tendance baissière détectée.");
        return sb.toString();
    }

    private String generateCheckupInsight(long total, long recent, long old,
            double txConfRecent, double txConfOld,
            long ncRecent, long ncOld, String trend) {
        StringBuilder sb = new StringBuilder();
        if (total == 0) return "Aucun check-up sur la période analysée.";
        sb.append("Sur ").append(total).append(" check-ups");
        if (old > 0 && recent > 0) {
            long variation = recent - old;
            String dir = variation > 0 ? "hausse" : "baisse";
            sb.append(", le nombre est en ").append(dir).append(" de ").append(Math.abs(variation));
            sb.append(" (").append(old > 0 ? Math.round((double) variation / old * 100) : 0).append("%)");
        }
        sb.append(". ");
        if (txConfRecent > 0 || txConfOld > 0) {
            sb.append("Taux de conformité : ").append((int)txConfRecent).append("%");
            if (txConfRecent > txConfOld) sb.append(" (en amélioration de ").append((int)(txConfRecent - txConfOld)).append("pts)");
            else if (txConfRecent < txConfOld) sb.append(" (en dégradation de ").append((int)(txConfOld - txConfRecent)).append("pts)");
            else sb.append(" (stable)");
            sb.append(". ");
        }
        if (ncRecent > 0) {
            sb.append(ncRecent).append(" check-up(s) non conforme(s) récents");
            if (ncRecent > ncOld) sb.append(" (en hausse, vigilance)");
            else if (ncRecent < ncOld) sb.append(" (en baisse, bon point)");
            sb.append(". ");
        }
        if (trend.equals("EN_BAISSE")) sb.append(" Attention : le nombre de check-ups diminue.");
        else if (trend.equals("EN_HAUSSE")) sb.append(" Bon point : les check-ups sont plus fréquents.");
        return sb.toString();
    }
}