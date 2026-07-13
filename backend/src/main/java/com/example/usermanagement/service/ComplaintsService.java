package com.example.usermanagement.service;

import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.repository.DeclarationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ComplaintsService {

    private final DeclarationRepository declarationRepository;

    public ComplaintsService(DeclarationRepository declarationRepository) {
        this.declarationRepository = declarationRepository;
    }

    // Map DeclarationIncident to Complaint structure
    public Map<String, Object> mapToComplaint(DeclarationIncident decl) {
        Map<String, Object> complaint = new HashMap<>();
        
        // Generate a sequential number from ID
        complaint.put("id", decl.getIdIncident());
        complaint.put("num", String.valueOf(decl.getIdIncident()));
        
        // Extract month from date
        if (decl.getDateHeure() != null) {
            DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM-yy", Locale.FRENCH);
            complaint.put("mois", decl.getDateHeure().format(monthFormatter));
        } else {
            complaint.put("mois", "Non défini");
        }
        
        // Numero declaration
        complaint.put("numeroDeclaration", decl.getNumeroDemande() != null ? decl.getNumeroDemande() : "N/A");
        
        // Use vehicle immatriculation as numeroOrdreCamion
        complaint.put("numeroOrdreCamion", decl.getVehiculeImmatriculation() != null ? decl.getVehiculeImmatriculation() : "N/A");
        
        // Generate tournees from location or use default
        complaint.put("tournees", decl.getLocation() != null ? decl.getLocation() : "Standard");
        
        // Chauffeur name
        complaint.put("chauffeur", decl.getChauffeurNom() != null ? decl.getChauffeurNom() : "Non assigné");
        
        // Date reclamation
        complaint.put("dateReclamation", decl.getDateHeure() != null ? decl.getDateHeure().toString() : null);
        
        // Source - derive from criticite or use default
        complaint.put("source", decl.getCriticite() != null ? "Fiche d'alerte" : "Interne");
        
        // Element - use type panne
        complaint.put("element", decl.getTypePanneFrancais() != null ? decl.getTypePanneFrancais() : "Non défini");
        
        // Detail element - use description as detail
        complaint.put("detailElement", decl.getDescriptionFrancais() != null ? decl.getDescriptionFrancais() : "");
        
        // Category - derive from type panne
        complaint.put("categorie", categorizeFromTypePanne(decl.getTypePanneFrancais()));
        
        // Criticite
        complaint.put("criticite", decl.getCriticite() != null ? decl.getCriticite() : "Non défini");
        
        // Statut
        complaint.put("statut", decl.getStatut() != null ? decl.getStatut() : "En attente");
        
        // Description
        complaint.put("description", decl.getDescriptionFrancais() != null ? decl.getDescriptionFrancais() : "");
        
        // Date reparation - use from declaration
        complaint.put("dateReparation", decl.getDateReparation() != null ? decl.getDateReparation().toString() : null);
        
        // Duration - use from declaration
        complaint.put("dureeReparation", decl.getDureeReparation());
        
        // State - use statut as etat
        complaint.put("etat", decl.getStatut() != null ? deriveEtat(decl.getStatut()) : "En attente");
        
        // Immatriculation
        complaint.put("immatriculation", decl.getVehiculeImmatriculation() != null ? decl.getVehiculeImmatriculation() : "N/A");
        
        // Kilometrage
        complaint.put("kilometrage", decl.getKilometrage());
        
        // Lieu
        complaint.put("lieu", decl.getLocation() != null ? decl.getLocation() : "Non défini");
        
        return complaint;
    }

    private String deriveEtat(String statut) {
        if (statut == null) return "En attente";
        switch (statut.toLowerCase()) {
            case "terminé": return "Traité";
            case "en cours": return "En cours";
            case "en attente": return "En attente";
            default: return statut;
        }
    }

    private String categorizeFromTypePanne(String typePanne) {
        if (typePanne == null) return "Non classifié";
        
        String lower = typePanne.toLowerCase();
        if (lower.contains("moteur") || lower.contains("transmission") || lower.contains("frein")) {
            return "Mécanique";
        } else if (lower.contains("batterie") || lower.contains("électric") || lower.contains("phare") || lower.contains("lumière")) {
            return "Électrique";
        } else if (lower.contains("pneu") || lower.contains("crevaison")) {
            return "Pneumatique";
        } else if (lower.contains("carrosserie") || lower.contains("porte") || lower.contains("vit")) {
            return "Carrosserie";
        } else if (lower.contains("clim") || lower.contains("chauffage") || lower.contains("siège")) {
            return "Confort";
        } else {
            return "Autre";
        }
    }

    // Get all complaints (mapped from declarations)
    public List<Map<String, Object>> getAllComplaints() {
        return declarationRepository.findAll().stream()
            .map(this::mapToComplaint)
            .collect(Collectors.toList());
    }

    // Get filtered complaints
    public List<Map<String, Object>> getFilteredComplaints(String mois, String chauffeur, 
                                                              String immatriculation, String criticite,
                                                              String statut, String categorie) {
        List<DeclarationIncident> all = declarationRepository.findAll();
        
        return all.stream()
            .map(this::mapToComplaint)
            .filter(c -> mois == null || mois.isEmpty() || c.get("mois").toString().equalsIgnoreCase(mois))
            .filter(c -> chauffeur == null || chauffeur.isEmpty() || c.get("chauffeur").toString().equalsIgnoreCase(chauffeur))
            .filter(c -> immatriculation == null || immatriculation.isEmpty() || c.get("immatriculation").toString().equalsIgnoreCase(immatriculation))
            .filter(c -> criticite == null || criticite.isEmpty() || c.get("criticite").toString().equalsIgnoreCase(criticite))
            .filter(c -> statut == null || statut.isEmpty() || c.get("statut").toString().equalsIgnoreCase(statut))
            .filter(c -> categorie == null || categorie.isEmpty() || c.get("categorie").toString().equalsIgnoreCase(categorie))
            .collect(Collectors.toList());
    }

    // Get dashboard statistics
    public Map<String, Object> getDashboardStats() {
        List<Map<String, Object>> all = getAllComplaints();
        
        Map<String, Long> byCategorie = all.stream()
            .filter(c -> c.get("categorie") != null)
            .collect(Collectors.groupingBy(c -> c.get("categorie").toString(), Collectors.counting()));
        
        Map<String, Long> byCriticite = all.stream()
            .filter(c -> c.get("criticite") != null)
            .collect(Collectors.groupingBy(c -> c.get("criticite").toString(), Collectors.counting()));
        
        Map<String, Long> byStatut = all.stream()
            .filter(c -> c.get("statut") != null)
            .collect(Collectors.groupingBy(c -> c.get("statut").toString(), Collectors.counting()));
        
        Map<String, Long> byMois = all.stream()
            .filter(c -> c.get("mois") != null)
            .collect(Collectors.groupingBy(c -> c.get("mois").toString(), Collectors.counting()));
        
        Map<String, Long> byChauffeur = all.stream()
            .filter(c -> c.get("chauffeur") != null)
            .collect(Collectors.groupingBy(c -> c.get("chauffeur").toString(), Collectors.counting()));
        
        Map<String, Long> byImmatriculation = all.stream()
            .filter(c -> c.get("immatriculation") != null)
            .collect(Collectors.groupingBy(c -> c.get("immatriculation").toString(), Collectors.counting()));
        
        // Calculate average duration
        double averageDuree = all.stream()
            .filter(c -> c.get("dureeReparation") != null)
            .mapToLong(c -> {
                Object duree = c.get("dureeReparation");
                return duree instanceof Number ? ((Number) duree).longValue() : 0L;
            })
            .average()
            .orElse(0.0);
        
        return Map.of(
            "totalDeclarations", all.size(),
            "averageDuree", averageDuree,
            "byCategorie", byCategorie,
            "byCriticite", byCriticite,
            "byStatut", byStatut,
            "byMois", byMois,
            "byChauffeur", byChauffeur,
            "byImmatriculation", byImmatriculation
        );
    }
}
