package com.example.usermanagement.controller;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import com.example.usermanagement.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/fleet")
@CrossOrigin(origins = "*")
public class FleetDashboardController {

    private final VehiculeRepository vehiculeRepository;
    private final DeclarationRepository declarationRepository;
    private final DriverChecklistRepository checklistRepository;
    private final LegalDocumentRepository documentRepository;
    private final FleetAlertRepository alertRepository;
    private final VehicleBlockingRepository blockingRepository;
    private final AlertService alertService;

    public FleetDashboardController(VehiculeRepository vehiculeRepository,
                                    DeclarationRepository declarationRepository,
                                    DriverChecklistRepository checklistRepository,
                                    LegalDocumentRepository documentRepository,
                                    FleetAlertRepository alertRepository,
                                    VehicleBlockingRepository blockingRepository,
                                    AlertService alertService) {
        this.vehiculeRepository = vehiculeRepository;
        this.declarationRepository = declarationRepository;
        this.checklistRepository = checklistRepository;
        this.documentRepository = documentRepository;
        this.alertRepository = alertRepository;
        this.blockingRepository = blockingRepository;
        this.alertService = alertService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        List<Vehicule> vehicles = vehiculeRepository.findAll();
        List<DeclarationIncident> declarations = declarationRepository.findAll();
        List<DriverChecklist> checklists = checklistRepository.findAllByOrderByDateChecklistDesc();
        List<LegalDocument> docs = documentRepository.findAll();
        List<FleetAlert> alerts = alertRepository.findByResoluFalseOrderByDateCreationDesc();

        Map<String, Object> data = new HashMap<>();
        data.put("vehicles", vehicles.stream().map(this::toVehicleMap).collect(Collectors.toList()));
        data.put("claims", declarations.stream().map(this::toClaimMap).collect(Collectors.toList()));
        data.put("legalDocs", generateLegalDocs(vehicles, docs));
        data.put("ivms", generateIvmsStats());
        data.put("stats", aggregateStats(vehicles, declarations, checklists, docs, alerts));
        data.put("filters", getFilterOptions(declarations));
        data.put("alerts", alerts.stream().map(this::toAlertMap).collect(Collectors.toList()));
        data.put("checklists", checklists.stream().map(this::toChecklistMap).collect(Collectors.toList()));
        data.put("alertCounts", Map.of(
            "active", alertService.getActiveAlertsCount(),
            "critical", alertService.getCriticalAlertsCount(),
            "blocking", alertService.getBlockingAlertsCount()
        ));

        return ResponseEntity.ok(data);
    }

    private Map<String, Object> toVehicleMap(Vehicule v) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", v.getId());
        m.put("immatriculation", v.getImmatriculation() != null ? v.getImmatriculation() : "");
        m.put("marque", v.getMarque() != null ? v.getMarque() : "");
        m.put("modele", v.getModele() != null ? v.getModele() : "");
        m.put("type", v.getType() != null ? v.getType() : "");
        m.put("branchCode", v.getBranchCode() != null ? v.getBranchCode() : "");
        m.put("annee", v.getAnnee() != null ? v.getAnnee() : 0);
        m.put("kilometrage", v.getKilometrage() != null ? v.getKilometrage() : 0);
        m.put("carburant", v.getCarburant() != null ? v.getCarburant() : "");
        m.put("statut", v.getStatut() != null ? v.getStatut() : "ACTIF");
        return m;
    }

    private Map<String, Object> toClaimMap(DeclarationIncident d) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", d.getIdIncident());
        m.put("numeroDeclaration", d.getNumeroDemande() != null ? d.getNumeroDemande() : "");
        m.put("dateReclamation", d.getDateReclamation() != null ? d.getDateReclamation().toString() : null);
        m.put("dateDeclaration", d.getDateHeure() != null ? d.getDateHeure().toString() : null);
        m.put("source", d.getSource() != null ? d.getSource() : "");
        m.put("numeroOrdreCamion", d.getNumeroOrdreCamion() != null ? d.getNumeroOrdreCamion() : "");
        m.put("chauffeurNom", d.getChauffeurNom() != null ? d.getChauffeurNom() : "");
        m.put("chauffeurMatricule", d.getChauffeurMatricule() != null ? d.getChauffeurMatricule() : "");
        m.put("vehiculeImmatriculation", d.getVehiculeImmatriculation() != null ? d.getVehiculeImmatriculation() : "");
        m.put("vehiculeMarque", d.getVehiculeMarque() != null ? d.getVehiculeMarque() : "");
        m.put("typePanne", d.getTypePanne() != null ? d.getTypePanne() : "");
        m.put("typePanneFrancais", d.getTypePanneFrancais() != null ? d.getTypePanneFrancais() : "");
        m.put("elementVehicule", d.getElementVehicule() != null ? d.getElementVehicule() : "");
        m.put("detailElement", d.getDetailElement() != null ? d.getDetailElement() : "");
        m.put("categorie", d.getCategorie() != null ? d.getCategorie() : "");
        m.put("criticite", d.getCriticite() != null ? d.getCriticite() : "");
        m.put("statut", d.getStatut() != null ? d.getStatut() : "");
        m.put("sla", d.getSla() != null ? d.getSla() : 0);
        return m;
    }

    private Map<String, Object> toAlertMap(FleetAlert a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("typeAlerte", a.getTypeAlerte());
        m.put("description", a.getDescription());
        m.put("criticite", a.getCriticite());
        m.put("vehiculeImmatriculation", a.getVehiculeImmatriculation());
        m.put("chauffeurNom", a.getChauffeurNom());
        m.put("dateCreation", a.getDateCreation() != null ? a.getDateCreation().toString() : null);
        m.put("resolu", a.getResolu());
        return m;
    }

    private Map<String, Object> toChecklistMap(DriverChecklist cl) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", cl.getId());
        m.put("chauffeurNom", cl.getChauffeurNom());
        m.put("vehiculeImmatriculation", cl.getVehiculeImmatriculation());
        m.put("dateChecklist", cl.getDateChecklist() != null ? cl.getDateChecklist().toString() : null);
        m.put("pneus", cl.getPneus());
        m.put("freins", cl.getFreins());
        m.put("feux", cl.getFeux());
        m.put("extincteur", cl.getExtincteur());
        m.put("documents", cl.getDocuments());
        m.put("statut", cl.getStatut());
        return m;
    }

    private Map<String, Object> generateLegalDocs(List<Vehicule> vehicles, List<LegalDocument> docs) {
        int total = Math.max(vehicles.size(), 1);
        long totalDocs = docs.size();
        long valides = docs.stream().filter(d -> "VALIDE".equals(d.getStatut())).count();
        long expirees = docs.stream().filter(d -> "EXPIRE".equals(d.getStatut())).count();
        long bientotExpirees = docs.stream().filter(d -> "BIENTOT_EXPIRE".equals(d.getStatut())).count();

        long carteGriseValides = docs.stream().filter(d -> "CARTE_GRISE".equals(d.getType()) && "VALIDE".equals(d.getStatut())).count();
        long onssaValides = docs.stream().filter(d -> "ONSSA".equals(d.getType()) && "VALIDE".equals(d.getStatut())).count();
        long metroValides = docs.stream().filter(d -> "METROLOGIQUE".equals(d.getType()) && "VALIDE".equals(d.getStatut())).count();

        double cessationRate = totalDocs > 0 ? (expirees * 100.0 / totalDocs) : 0;

        Map<String, Object> legal = new HashMap<>();
        legal.put("carteGrise", Map.of(
            "count", total, "valid", carteGriseValides, "expired", total - carteGriseValides,
            "expirationDate", LocalDate.now().plusMonths(8).toString()
        ));
        legal.put("onssa", Map.of(
            "count", total, "valid", onssaValides, "expired", total - onssaValides,
            "expirationDate", LocalDate.now().plusMonths(5).toString()
        ));
        legal.put("metrologique", Map.of(
            "count", total, "valid", metroValides, "expired", total - metroValides,
            "expirationDate", LocalDate.now().plusMonths(3).toString()
        ));
        legal.put("cessationRate", Math.round(cessationRate * 10.0) / 10.0);
        legal.put("total", totalDocs);
        legal.put("valides", valides);
        legal.put("expirees", expirees);
        legal.put("bientotExpirees", bientotExpirees);
        return legal;
    }

    private Map<String, Object> generateIvmsStats() {
        long totalVehicules = vehiculeRepository.count();
        long actifs = vehiculeRepository.findAll().stream().filter(v -> "ACTIF".equals(v.getStatut())).count();
        double pct = totalVehicules > 0 ? (actifs * 100.0 / totalVehicules) : 99.4;
        return Map.of(
            "fonctionnel", Math.round(pct * 10.0) / 10.0,
            "total", totalVehicules,
            "actif", actifs,
            "inactif", totalVehicules - actifs,
            "statut", pct >= 90 ? "Fonctionnel" : pct >= 70 ? "Degrade" : "Critique"
        );
    }

    private Map<String, Object> aggregateStats(List<Vehicule> vehicles, List<DeclarationIncident> declarations,
                                                List<DriverChecklist> checklists, List<LegalDocument> docs,
                                                List<FleetAlert> alerts) {
        Map<String, Long> byType = declarations.stream()
            .filter(d -> d.getTypePanne() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanne, Collectors.counting()));

        Map<String, Long> byMarque = declarations.stream()
            .filter(d -> d.getVehiculeMarque() != null && !d.getVehiculeMarque().isBlank())
            .collect(Collectors.groupingBy(DeclarationIncident::getVehiculeMarque, Collectors.counting()));

        Map<String, Long> byElement = declarations.stream()
            .filter(d -> d.getElementVehicule() != null && !d.getElementVehicule().isBlank())
            .collect(Collectors.groupingBy(DeclarationIncident::getElementVehicule, Collectors.counting()));

        Map<String, Long> byCategorie = declarations.stream()
            .filter(d -> d.getCategorie() != null && !d.getCategorie().isBlank())
            .collect(Collectors.groupingBy(DeclarationIncident::getCategorie, Collectors.counting()));

        Map<String, Long> byChauffeur = declarations.stream()
            .filter(d -> d.getChauffeurNom() != null && !d.getChauffeurNom().isBlank())
            .collect(Collectors.groupingBy(DeclarationIncident::getChauffeurNom, Collectors.counting()));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVehicles", vehicles.size());
        stats.put("totalDeclarations", declarations.size());
        stats.put("totalChecklists", checklists.size());
        stats.put("totalDocuments", docs.size());
        stats.put("activeAlerts", alerts.size());
        stats.put("byType", byType);
        stats.put("byMarque", byMarque);
        stats.put("byElement", byElement);
        stats.put("byCategorie", byCategorie);
        stats.put("byChauffeur", byChauffeur);
        return stats;
    }

    private Map<String, Object> getFilterOptions(List<DeclarationIncident> declarations) {
        Set<String> sources = declarations.stream()
            .map(DeclarationIncident::getSource).filter(s -> s != null && !s.isBlank()).collect(Collectors.toSet());
        Set<String> ordres = declarations.stream()
            .map(DeclarationIncident::getNumeroOrdreCamion).filter(s -> s != null && !s.isBlank()).collect(Collectors.toSet());
        Set<String> chauffeurs = declarations.stream()
            .map(DeclarationIncident::getChauffeurNom).filter(s -> s != null && !s.isBlank()).collect(Collectors.toSet());
        Set<String> elements = declarations.stream()
            .map(DeclarationIncident::getElementVehicule).filter(s -> s != null && !s.isBlank()).collect(Collectors.toSet());
        Set<String> categories = declarations.stream()
            .map(DeclarationIncident::getCategorie).filter(s -> s != null && !s.isBlank()).collect(Collectors.toSet());

        return Map.of(
            "sources", sources,
            "ordreCamions", ordres,
            "chauffeurs", chauffeurs,
            "elements", elements,
            "categories", categories
        );
    }
}
