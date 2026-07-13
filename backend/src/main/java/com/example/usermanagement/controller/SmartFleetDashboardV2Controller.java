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

@RestController
@RequestMapping("/api/powerbi/v4")
@CrossOrigin(origins = "*")
public class SmartFleetDashboardV2Controller {

    private final VehiculeRepository vehiculeRepository;
    private final DeclarationRepository declarationRepository;
    private final DriverChecklistRepository checklistRepository;
    private final LegalDocumentRepository documentRepository;
    private final DocumentReglementaireRepository docReglementaireRepository;
    private final TicketMaintenanceRepository ticketRepository;
    private final AnomalieCheckupRepository anomalieRepository;
    private final VehicleBlockingRepository blockingRepository;
    private final DepartHistoriqueRepository departRepository;
    private final DriverPresenceRepository presenceRepository;
    private final CheckupRepository checkupRepository;
    private final TrackingHistoryRepository trackingRepository;
    private final UserRepository userRepository;

    public SmartFleetDashboardV2Controller(VehiculeRepository vehiculeRepository,
                                            DeclarationRepository declarationRepository,
                                            DriverChecklistRepository checklistRepository,
                                            LegalDocumentRepository documentRepository,
                                            DocumentReglementaireRepository docReglementaireRepository,
                                            TicketMaintenanceRepository ticketRepository,
                                            AnomalieCheckupRepository anomalieRepository,
                                            VehicleBlockingRepository blockingRepository,
                                            DepartHistoriqueRepository departRepository,
                                            DriverPresenceRepository presenceRepository,
                                            CheckupRepository checkupRepository,
                                            TrackingHistoryRepository trackingRepository,
                                            UserRepository userRepository) {
        this.vehiculeRepository = vehiculeRepository;
        this.declarationRepository = declarationRepository;
        this.checklistRepository = checklistRepository;
        this.documentRepository = documentRepository;
        this.docReglementaireRepository = docReglementaireRepository;
        this.ticketRepository = ticketRepository;
        this.anomalieRepository = anomalieRepository;
        this.blockingRepository = blockingRepository;
        this.departRepository = departRepository;
        this.presenceRepository = presenceRepository;
        this.checkupRepository = checkupRepository;
        this.trackingRepository = trackingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/smart-fleet-dashboard")
    public ResponseEntity<Map<String, Object>> getSmartFleetDashboard(
            @RequestParam(name = "period", defaultValue = "30j") String period,
            @RequestParam(name = "vehicle", defaultValue = "") String vehicle,
            @RequestParam(name = "site", defaultValue = "") String site,
            @RequestParam(name = "region", defaultValue = "") String region,
            @RequestParam(name = "driver", defaultValue = "") String driver,
            @RequestParam(name = "status", defaultValue = "") String status) {
        LocalDateTime now = LocalDateTime.now();
        int days = 30;
        try { days = Integer.parseInt(period.replace("j", "").replace("a", "365")); } catch (Exception ignored) {}
        if (period.endsWith("a")) days = 365;
        LocalDateTime cutoff = now.minusDays(days);

        List<Vehicule> allVehs = vehiculeRepository.findAll();
        List<Vehicule> vehs = allVehs.stream()
                .filter(v -> vehicle.isEmpty() || vehicle.equals(v.getImmatriculation()))
                .filter(v -> site.isEmpty() || (v.getAgence() != null && v.getAgence().equalsIgnoreCase(site)))
                .filter(v -> region.isEmpty() || (v.getBranchCode() != null && v.getBranchCode().equalsIgnoreCase(region)))
                .filter(v -> status.isEmpty() || (v.getStatut() != null && v.getStatut().equalsIgnoreCase(status)))
                .collect(Collectors.toList());
        if (vehs.isEmpty()) vehs = allVehs;
        List<String> immas = vehs.stream().map(Vehicule::getImmatriculation).collect(Collectors.toList());

        List<DeclarationIncident> allDecs = declarationRepository.findAll();
        List<DeclarationIncident> decs = allDecs.stream()
                .filter(d -> d.getVehiculeImmatriculation() == null || immas.contains(d.getVehiculeImmatriculation()))
                .filter(d -> d.getDateHeure() == null || d.getDateHeure().isAfter(cutoff))
                .filter(d -> driver.isEmpty() || (d.getChauffeurNom() != null && d.getChauffeurNom().equalsIgnoreCase(driver)))
                .collect(Collectors.toList());
        List<DriverChecklist> allCks = checklistRepository.findAll();
        List<DriverChecklist> cks = allCks.stream()
                .filter(c -> c.getVehiculeImmatriculation() == null || immas.contains(c.getVehiculeImmatriculation()))
                .filter(c -> c.getDateChecklist() == null || c.getDateChecklist().isAfter(cutoff))
                .filter(c -> driver.isEmpty() || (c.getChauffeurNom() != null && c.getChauffeurNom().equalsIgnoreCase(driver)))
                .collect(Collectors.toList());
        List<TicketMaintenance> allTickets = ticketRepository.findAll();
        List<TicketMaintenance> tickets = allTickets.stream()
                .filter(t -> t.getVehiculeImmatriculation() == null || immas.contains(t.getVehiculeImmatriculation()))
                .collect(Collectors.toList());
        List<LegalDocument> docs = documentRepository.findAll();
        List<AnomalieCheckup> anomalies = anomalieRepository.findAll();
        List<VehicleBlocking> blocks = blockingRepository.findAll();
        List<DepartHistorique> allDeparts = departRepository.findAll();
        List<DepartHistorique> departs = allDeparts.stream()
                .filter(dp -> dp.getVehiculeImmatriculation() == null || immas.contains(dp.getVehiculeImmatriculation()))
                .filter(dp -> dp.getDateDepart() == null || dp.getTimestampDepart() == null || dp.getTimestampDepart().isAfter(cutoff))
                .collect(Collectors.toList());
        List<User> drivers = userRepository.findAll().stream()
                .filter(u -> "CHAUFFEUR".equals(u.getRoleCode()) || u.getRole() == Role.CHAUFFEUR || u.getProfileCode() != null)
                .collect(Collectors.toList());

        // ==================== EXECUTIVE KPIs ====================
        long total = vehs.size();
        long enService = vehs.stream().filter(v -> "ACTIF".equals(v.getStatut())).count();
        long aArret = vehs.stream().filter(v -> "BLOQUE".equals(v.getStatut()) || "IMMOBILISE".equals(v.getStatut())).count();
        long enMaintenance = vehs.stream().filter(v -> "MAINTENANCE".equals(v.getStatut())).count();
        long bloques = blocks.stream().filter(b -> Boolean.TRUE.equals(b.getBloque())).count();
        long anomaliesOuvertes = anomalies.stream().filter(a -> !"REPAREE".equals(a.getStatut()) && !"VALIDEE".equals(a.getStatut()) && !"ANNULEE".equals(a.getStatut())).count();
        long ticketsOuverts = tickets.stream().filter(t -> !"CLOTURE".equals(t.getStatut()) && !"ANNULE".equals(t.getStatut())).count();
        long decsOuvertes = decs.stream().filter(d -> !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut())).count();
        long totalAnomalies = anomaliesOuvertes + decsOuvertes;

        Long[] consoArray = {null};
        double consoMoyenne = total > 0 ? vehs.stream()
                .filter(v -> v.getType() != null)
                .mapToDouble(v -> {
                    String t = v.getType().toLowerCase();
                    double c = t.contains("poid") || t.contains("camion") || t.contains("truck") ? 28 :
                            t.contains("utilitaire") || t.contains("van") || t.contains("fourgon") ? 10 :
                            t.contains("berline") || t.contains("citadine") || t.contains("suv") ? 7 : 12;
                    if (consoArray[0] == null) consoArray[0] = (long) (c * 100);
                    return c;
                }).average().orElse(12) : 12;
        consoMoyenne = Math.round(consoMoyenne * 10.0) / 10.0;

        List<TrackingHistory> allTracks = immas.isEmpty() ? trackingRepository.findAll()
                : immas.stream().flatMap(im -> trackingRepository.findByImmatriculationOrderByTimestampAsc(im).stream()).collect(Collectors.toList());
        double vitMoyenne = Math.round(allTracks.stream().filter(t -> t.getVitesse() != null).mapToDouble(TrackingHistory::getVitesse).average().orElse(0) * 10.0) / 10.0;
        long totalKm = vehs.stream().filter(v -> v.getKilometrage() != null).mapToLong(Vehicule::getKilometrage).sum();

        long driverCount = drivers.size();
        long totalCheckups30j = cks.stream().filter(c -> c.getDateChecklist() != null && c.getDateChecklist().isAfter(now.minusDays(30))).count();
        long checkupsConformes30j = cks.stream().filter(c -> c.getDateChecklist() != null && c.getDateChecklist().isAfter(now.minusDays(30)) && Boolean.TRUE.equals(c.getEstConforme())).count();
        double txCheckupVert = totalCheckups30j > 0 ? Math.round((double) checkupsConformes30j / totalCheckups30j * 100) : 0;

        // MTTR (Mean Time To Repair)
        double mttr = tickets.stream()
                .filter(t -> t.getDateOuverture() != null && t.getDateCloture() != null)
                .mapToLong(t -> java.time.temporal.ChronoUnit.HOURS.between(t.getDateOuverture(), t.getDateCloture()))
                .average().orElse(0);
        mttr = Math.round(mttr * 10.0) / 10.0;

        // MTBF (Mean Time Between Failures) - approximate: days / failures
        double mtbf = 0;
        long totalFailures = decs.size();
        if (totalFailures > 1) {
            Optional<LocalDateTime> minDateOpt = decs.stream().map(DeclarationIncident::getDateHeure).filter(Objects::nonNull).min(LocalDateTime::compareTo);
            Optional<LocalDateTime> maxDateOpt = decs.stream().map(DeclarationIncident::getDateHeure).filter(Objects::nonNull).max(LocalDateTime::compareTo);
            if (minDateOpt.isPresent() && maxDateOpt.isPresent() && !minDateOpt.get().equals(maxDateOpt.get())) {
                long spanDays = java.time.temporal.ChronoUnit.DAYS.between(minDateOpt.get(), maxDateOpt.get());
                mtbf = Math.round((double) spanDays / totalFailures * 10.0) / 10.0;
            }
        }

        // SLA compliance
        long slaRespected = decs.stream().filter(d -> d.getSla() != null && d.getDateReparation() != null && d.getDateDebutIntervention() != null)
                .filter(d -> java.time.temporal.ChronoUnit.HOURS.between(d.getDateDebutIntervention(), d.getDateReparation()) <= d.getSla() * 24)
                .count();
        long slaTotal = decs.stream().filter(d -> d.getSla() != null && d.getDateReparation() != null).count();
        double slaCompliance = slaTotal > 0 ? Math.round((double) slaRespected / slaTotal * 100) : 0;

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalVehicules", total);
        kpis.put("enService", enService);
        kpis.put("aArret", aArret);
        kpis.put("enMaintenance", enMaintenance);
        kpis.put("bloques", bloques);
        kpis.put("tauxUtilisation", total > 0 ? Math.round((double) enService / total * 100) : 0);
        kpis.put("anomaliesOuvertes", totalAnomalies);
        kpis.put("ticketsOuverts", ticketsOuverts);
        kpis.put("totalKm", totalKm);
        kpis.put("consoMoyenne", consoMoyenne);
        kpis.put("vitesseMoyenne", vitMoyenne);
        kpis.put("totalChauffeurs", driverCount);
        kpis.put("txCheckupConformite", txCheckupVert);
        kpis.put("totalCheckups30j", totalCheckups30j);
        kpis.put("mttr", mttr);
        kpis.put("mtbf", mtbf);
        kpis.put("slaCompliance", slaCompliance);
        kpis.put("totalDeclarations", decs.size());
        kpis.put("totalMaintenances", tickets.size());

        // ==================== CHARTS ====================
        Map<String, Long> parSource = new LinkedHashMap<>();
        parSource.put("CHECKUP_QUOTIDIEN", anomalies.stream().filter(a -> "CHECKUP".equals(a.getSource())).count());
        parSource.put("MAINTENANCE_CURATIVE", decs.stream().filter(d -> "CURATIVE".equals(d.getQualification()) || "Panne".equals(d.getTypePanne())).count());
        parSource.put("MAINTENANCE_PREVENTIVE", decs.stream().filter(d -> "PREVENTIVE".equals(d.getQualification())).count());
        parSource.put("INCIDENT_MARCHE", decs.stream().filter(d -> "Incident".equals(d.getSource()) || "Accident".equals(d.getSource())).count());

        Map<String, Long> parStatut = decs.stream().filter(d -> d.getStatut() != null)
                .collect(Collectors.groupingBy(DeclarationIncident::getStatut, Collectors.counting()));
        Map<String, Long> parCriticite = decs.stream().filter(d -> d.getCriticite() != null)
                .collect(Collectors.groupingBy(DeclarationIncident::getCriticite, Collectors.counting()));
        Map<String, Long> parTypePanne = decs.stream().filter(d -> d.getTypePanne() != null)
                .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.counting()));
        Map<String, Long> parQualification = decs.stream().filter(d -> d.getQualification() != null)
                .collect(Collectors.groupingBy(DeclarationIncident::getQualification, Collectors.counting()));
        Map<String, Long> parMarque = vehs.stream().filter(v -> v.getMarque() != null)
                .collect(Collectors.groupingBy(Vehicule::getMarque, Collectors.counting()));
        Map<String, Long> parElement = decs.stream().filter(d -> d.getElementVehicule() != null)
                .collect(Collectors.groupingBy(DeclarationIncident::getElementVehicule, Collectors.counting()));
        Map<String, Long> parAgence = vehs.stream().filter(v -> v.getAgence() != null)
                .collect(Collectors.groupingBy(Vehicule::getAgence, Collectors.counting()));
        Map<String, Long> parCategorie = decs.stream().filter(d -> d.getCategorie() != null)
                .collect(Collectors.groupingBy(DeclarationIncident::getCategorie, Collectors.counting()));

        // Evolution monthly trend
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        LocalDateTime trendCutoff = now.minusMonths(12);
        Map<String, long[]> monthlyMap = new TreeMap<>();
        for (DeclarationIncident d : decs) {
            if (d.getDateHeure() == null || d.getDateHeure().isBefore(trendCutoff)) continue;
            String key = d.getDateHeure().format(monthFmt);
            monthlyMap.computeIfAbsent(key, k -> new long[6])[0]++;
            if ("CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut())) monthlyMap.get(key)[1]++;
            if ("CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite())) monthlyMap.get(key)[2]++;
        }
        for (DriverChecklist c : cks) {
            if (c.getDateChecklist() == null || c.getDateChecklist().isBefore(trendCutoff)) continue;
            String key = c.getDateChecklist().format(monthFmt);
            monthlyMap.computeIfAbsent(key, k -> new long[6])[3]++;
            if (Boolean.TRUE.equals(c.getEstConforme())) monthlyMap.get(key)[4]++;
        }
        for (TicketMaintenance t : tickets) {
            if (t.getDateOuverture() == null || t.getDateOuverture().isBefore(trendCutoff)) continue;
            String key = t.getDateOuverture().format(monthFmt);
            monthlyMap.computeIfAbsent(key, k -> new long[6])[5]++;
        }
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (Map.Entry<String, long[]> e : monthlyMap.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("mois", e.getKey()); row.put("anomalies", e.getValue()[0]);
            row.put("resolues", e.getValue()[1]); row.put("critiques", e.getValue()[2]);
            row.put("checkups", e.getValue()[3]); row.put("checkupsOK", e.getValue()[4]);
            row.put("tickets", e.getValue()[5]);
            monthlyTrend.add(row);
        }

        // ==================== VEHICLES TABLE ====================
        List<Map<String, Object>> vehicleTable = vehs.stream().map(v -> {
            String imma = v.getImmatriculation();
            long vDecs = allDecs.stream().filter(d -> imma.equals(d.getVehiculeImmatriculation())).count();
            long vCks = allCks.stream().filter(c -> imma.equals(c.getVehiculeImmatriculation())).count();
            long vTickets = allTickets.stream().filter(t -> imma.equals(t.getVehiculeImmatriculation())).count();
            long vDocs = docs.stream().filter(d -> imma.equals(d.getVehiculeImmatriculation())).count();
            long vDocsValides = docs.stream().filter(d -> imma.equals(d.getVehiculeImmatriculation()) && "VALIDE".equals(d.getStatut())).count();
            double score = (vCks > 0 ? (double) cks.stream().filter(c -> imma.equals(c.getVehiculeImmatriculation()) && Boolean.TRUE.equals(c.getEstConforme())).count() / vCks * 40 : 40)
                    + (vDecs > 0 ? (double) decs.stream().filter(d -> imma.equals(d.getVehiculeImmatriculation()) && ("CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut()))).count() / vDecs * 40 : 40)
                    + (vDocs > 0 ? (double) vDocsValides / vDocs * 20 : 20);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", v.getId()); row.put("immatriculation", imma);
            row.put("numeroOrdre", v.getTruckNumber()); row.put("marque", v.getMarque());
            row.put("modele", v.getModele()); row.put("type", v.getType());
            row.put("annee", v.getAnnee()); row.put("kilometrage", v.getKilometrage());
            row.put("statut", v.getStatut()); row.put("agence", v.getAgence());
            row.put("chauffeurNom", v.getChauffeurNom()); row.put("carburant", v.getCarburant());
            row.put("conforme", v.getConforme());
            row.put("anomalies", vDecs); row.put("checkups", vCks);
            row.put("tickets", vTickets); row.put("documents", vDocs);
            row.put("documentsValides", vDocsValides);
            row.put("scoreIVMS", Math.round(Math.min(score, 100)));
            return row;
        }).collect(Collectors.toList());

        // ==================== ANOMALIES TABLE ====================
        List<Map<String, Object>> anomalyTable = anomalies.stream()
                .sorted((a, b) -> {
                    if (a.getDateDetection() == null) return 1; if (b.getDateDetection() == null) return -1;
                    return b.getDateDetection().compareTo(a.getDateDetection());
                })
                .limit(50)
                .map(a -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", a.getId()); row.put("code", a.getAnomalieCode());
                    row.put("vehicule", a.getVehiculeImmatriculation());
                    row.put("chauffeur", a.getChauffeurNom());
                    row.put("element", a.getElement()); row.put("categorie", a.getCategorie());
                    row.put("criticite", a.getCriticite()); row.put("statut", a.getStatut());
                    row.put("dateDetection", a.getDateDetection() != null ? a.getDateDetection().toString() : null);
                    row.put("dateReparation", a.getDateReparation() != null ? a.getDateReparation().toString() : null);
                    row.put("source", a.getSource());
                    return row;
                }).collect(Collectors.toList());

        List<Map<String, Object>> declaTable = decs.stream()
                .sorted((a, b) -> {
                    if (a.getDateHeure() == null) return 1; if (b.getDateHeure() == null) return -1;
                    return b.getDateHeure().compareTo(a.getDateHeure());
                })
                .limit(50)
                .map(d -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", d.getIdIncident()); row.put("numeroDemande", d.getNumeroDemande());
                    row.put("vehicule", d.getVehiculeImmatriculation());
                    row.put("chauffeur", d.getChauffeurNom());
                    row.put("typePanne", d.getTypePanne()); row.put("criticite", d.getCriticite());
                    row.put("statut", d.getStatut()); row.put("qualification", d.getQualification());
                    row.put("element", d.getElementVehicule()); row.put("categorie", d.getCategorie());
                    row.put("date", d.getDateHeure() != null ? d.getDateHeure().toString() : null);
                    row.put("cout", d.getCoutProbleme()); row.put("sla", d.getSla());
                    row.put("description", d.getDescriptionFrancais());
                    return row;
                }).collect(Collectors.toList());

        // ==================== DRIVER TABLE ====================
        List<Map<String, Object>> driverTable = drivers.stream().map(u -> {
            String nom = u.getName() != null ? u.getName() + " " + (u.getFirstname() != null ? u.getFirstname() : "") : u.getUsername();
            long dDecs = allDecs.stream().filter(d -> nom.trim().equalsIgnoreCase(d.getChauffeurNom())).count();
            long dCks = allCks.stream().filter(c -> nom.trim().equalsIgnoreCase(c.getChauffeurNom())).count();
            long dCksOK = allCks.stream().filter(c -> nom.trim().equalsIgnoreCase(c.getChauffeurNom()) && Boolean.TRUE.equals(c.getEstConforme())).count();
            long dDeparts = allDeparts.stream().filter(dp -> nom.trim().equalsIgnoreCase(dp.getChauffeurNom())).count();
            long dPresences = presenceRepository.findAll().stream().filter(p -> nom.trim().equalsIgnoreCase(p.getChauffeurNom())).count();
            double txConf = dCks > 0 ? Math.round((double) dCksOK / dCks * 100) : 100;
            double txReso = dDecs > 0 ? Math.round((double) decs.stream().filter(d -> nom.trim().equalsIgnoreCase(d.getChauffeurNom()) && ("CLOTURE".equals(d.getStatut()) || "RESOLU".equals(d.getStatut()))).count() / dDecs * 100) : 100;
            int score = (int) Math.round(txConf * 0.4 + txReso * 0.4 + 20);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("nom", nom); row.put("matricule", u.getPersonCode());
            row.put("email", u.getEmail()); row.put("phone", u.getPhone());
            row.put("ville", u.getVille()); row.put("branchCode", u.getBranchCode());
            row.put("anomalies", dDecs); row.put("checkups", dCks);
            row.put("checkupsOK", dCksOK); row.put("tauxConformite", txConf);
            row.put("tauxResolution", txReso);
            row.put("departs", dDeparts); row.put("presences", dPresences);
            row.put("score", score);
            return row;
        }).sorted((a, b) -> Integer.compare((Integer) b.get("score"), (Integer) a.get("score")))
                .collect(Collectors.toList());

        // ==================== ALERTS ====================
        List<Map<String, Object>> alertes = new ArrayList<>();
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (LegalDocument d : docs) {
            if (d.getDateExpiration() == null || d.getVehiculeImmatriculation() == null) continue;
            if (!immas.isEmpty() && !immas.contains(d.getVehiculeImmatriculation())) continue;
            long jrs = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), d.getDateExpiration());
            if (jrs < 0) alertes.add(Map.of("type", "DOCUMENT_EXPIRE", "severite", "HAUTE", "vehicule", d.getVehiculeImmatriculation(), "document", d.getType(), "message", "Expiré depuis " + Math.abs(jrs) + "j"));
            else if (jrs <= 30) alertes.add(Map.of("type", "DOCUMENT_EXPIRE_BIENTOT", "severite", "MOYENNE", "vehicule", d.getVehiculeImmatriculation(), "document", d.getType(), "message", "Expire dans " + jrs + "j"));
        }
        for (TicketMaintenance t : tickets) {
            if (!"OUVERT".equals(t.getStatut()) && !"EN_COURS".equals(t.getStatut())) continue;
            if (t.getDateOuverture() == null) continue;
            long jrs = java.time.temporal.ChronoUnit.DAYS.between(t.getDateOuverture(), now);
            if (jrs > 7) alertes.add(Map.of("type", "RETARD_MAINTENANCE", "severite", "MOYENNE", "vehicule", t.getVehiculeImmatriculation(), "ticket", t.getNumeroTicket(), "message", "Ticket ouvert depuis " + jrs + "j"));
        }
        for (VehicleBlocking b : blocks) {
            if (!Boolean.TRUE.equals(b.getBloque()) || b.getDateBlocage() == null) continue;
            long jrs = java.time.temporal.ChronoUnit.DAYS.between(b.getDateBlocage(), LocalDate.now());
            if (jrs > 3) alertes.add(Map.of("type", "IMMOBILISE_PROLONGE", "severite", "HAUTE", "vehicule", b.getVehiculeImmatriculation(), "message", "Immobilisé " + jrs + "j"));
        }
        long critiquesNonTraitees = decs.stream().filter(d -> ("CRITIQUE".equals(d.getCriticite()) || "BLOQUANT".equals(d.getCriticite())) && !"CLOTURE".equals(d.getStatut()) && !"RESOLU".equals(d.getStatut())).count();
        if (critiquesNonTraitees > 0) alertes.add(Map.of("type", "ANOMALIES_CRITIQUES", "severite", "HAUTE", "count", critiquesNonTraitees, "message", critiquesNonTraitees + " anomalie(s) critique(s)"));
        alertes.sort((a, b) -> {
            String sa = (String) a.getOrDefault("severite", "INFO");
            String sb = (String) b.getOrDefault("severite", "INFO");
            List<String> order = List.of("HAUTE", "MOYENNE", "INFO");
            return Integer.compare(order.indexOf(sa), order.indexOf(sb));
        });

        // ==================== DOCUMENTS ====================
        List<Map<String, Object>> docTable = docs.stream()
                .filter(d -> immas.isEmpty() || immas.contains(d.getVehiculeImmatriculation()))
                .map(d -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", d.getId()); row.put("vehicule", d.getVehiculeImmatriculation());
                    row.put("type", d.getType()); row.put("numero", d.getNumeroDocument());
                    row.put("dateExpiration", d.getDateExpiration() != null ? d.getDateExpiration().toString() : null);
                    row.put("statut", d.getStatut());
                    long jrs = d.getDateExpiration() != null ? java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), d.getDateExpiration()) : 999;
                    row.put("joursRestants", jrs);
                    return row;
                }).collect(Collectors.toList());

        // ==================== FILTER OPTIONS ====================
        List<String> sites = allVehs.stream().map(Vehicule::getAgence).filter(Objects::nonNull).distinct().sorted().collect(Collectors.toList());
        List<String> regions = allVehs.stream().map(Vehicule::getBranchCode).filter(Objects::nonNull).distinct().sorted().collect(Collectors.toList());
        List<Map<String, String>> vehicleOptions = allVehs.stream().map(v -> {
            Map<String, String> opt = new LinkedHashMap<>();
            opt.put("immatriculation", v.getImmatriculation());
            opt.put("marque", v.getMarque());
            return opt;
        }).collect(Collectors.toList());
        List<String> statusOptions = allVehs.stream().map(Vehicule::getStatut).filter(Objects::nonNull).distinct().sorted().collect(Collectors.toList());
        List<String> driverNames = driverTable.stream().map(d -> (String) d.get("nom")).collect(Collectors.toList());

        Map<String, Object> chartsMap = new LinkedHashMap<>();
        chartsMap.put("anomaliesParSource", parSource);
        {
            Map<String, Object> vs = new LinkedHashMap<>();
            vs.put("enService", enService); vs.put("aArret", aArret);
            vs.put("enMaintenance", enMaintenance); vs.put("bloques", bloques);
            chartsMap.put("vehiculesParStatut", vs);
        }
        chartsMap.put("declarationsParStatut", parStatut);
        chartsMap.put("declarationsParCriticite", parCriticite);
        chartsMap.put("declarationsParTypePanne", parTypePanne);
        chartsMap.put("declarationsParQualification", parQualification);
        chartsMap.put("vehiculesParMarque", parMarque);
        chartsMap.put("anomaliesParElement", parElement);
        chartsMap.put("vehiculesParAgence", parAgence);
        chartsMap.put("declarationsParCategorie", parCategorie);
        chartsMap.put("evolutionMensuelle", monthlyTrend);

        Map<String, Object> filterOpts = new LinkedHashMap<>();
        filterOpts.put("sites", sites); filterOpts.put("regions", regions);
        filterOpts.put("vehicles", vehicleOptions); filterOpts.put("status", statusOptions);
        filterOpts.put("drivers", driverNames);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("kpis", kpis);
        response.put("charts", chartsMap);
        response.put("vehicles", vehicleTable);
        response.put("anomalies", anomalyTable);
        response.put("declarations", declaTable);
        response.put("drivers", driverTable);
        response.put("documents", docTable);
        response.put("alerts", alertes);
        response.put("filterOptions", filterOpts);
        return ResponseEntity.ok(response);
    }
}
