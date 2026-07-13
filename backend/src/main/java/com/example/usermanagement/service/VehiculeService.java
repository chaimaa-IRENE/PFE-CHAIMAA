package com.example.usermanagement.service;

import com.example.usermanagement.dto.AnalyseVehicule;
import com.example.usermanagement.dto.RapportVehicule;
import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.DeclarationRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VehiculeService {

    private final VehiculeRepository vehiculeRepository;
    private final DeclarationRepository declarationRepository;

    public VehiculeService(VehiculeRepository vehiculeRepository, DeclarationRepository declarationRepository) {
        this.vehiculeRepository = vehiculeRepository;
        this.declarationRepository = declarationRepository;
    }

    // Obtenir tous les véhicules
    public List<Vehicule> getAllVehicules() {
        return vehiculeRepository.findAll();
    }

    // Obtenir les véhicules par branch code
    public List<Vehicule> getVehiculesByBranchCode(String branchCode) {
        return vehiculeRepository.findByBranchCode(branchCode);
    }

    // Obtenir un véhicule par ID
    public Optional<Vehicule> getVehiculeById(Long id) {
        return vehiculeRepository.findById(id);
    }

    // Obtenir un véhicule par immatriculation
    public Optional<Vehicule> getVehiculeByImmatriculation(String immatriculation) {
        return vehiculeRepository.findByImmatriculation(immatriculation);
    }

    // Obtenir les véhicules par type
    public List<Vehicule> getVehiculesByType(String type) {
        return vehiculeRepository.findByType(type);
    }

    // Créer un véhicule
    public Vehicule createVehicule(Vehicule vehicule) {
        return vehiculeRepository.save(vehicule);
    }

    // Mettre à jour un véhicule
    public Vehicule updateVehicule(Long id, Vehicule vehiculeDetails) {
        return vehiculeRepository.findById(id)
                .map(vehicule -> {
                    vehicule.setImmatriculation(vehiculeDetails.getImmatriculation());
                    vehicule.setMarque(vehiculeDetails.getMarque());
                    vehicule.setModele(vehiculeDetails.getModele());
                    vehicule.setType(vehiculeDetails.getType());
                    vehicule.setBranchCode(vehiculeDetails.getBranchCode());
                    vehicule.setTournee(vehiculeDetails.getTournee());
                    vehicule.setChauffeurId(vehiculeDetails.getChauffeurId());
                    vehicule.setChauffeurNom(vehiculeDetails.getChauffeurNom());
                    vehicule.setStatut(vehiculeDetails.getStatut());
                    if (vehiculeDetails.getChauffeurId() != null) {
                        vehicule.setDateAffectation(LocalDateTime.now());
                    }
                    return vehiculeRepository.save(vehicule);
                })
                .orElse(null);
    }

    // Affecter un chauffeur à un véhicule
    public Vehicule assignChauffeurToVehicle(Long vehiculeId, Long chauffeurId, String chauffeurNom) {
        return vehiculeRepository.findById(vehiculeId)
                .map(vehicule -> {
                    vehicule.setChauffeurId(chauffeurId);
                    vehicule.setChauffeurNom(chauffeurNom);
                    vehicule.setDateAffectation(LocalDateTime.now());
                    return vehiculeRepository.save(vehicule);
                })
                .orElse(null);
    }

    // Désaffecter un chauffeur d'un véhicule
    public Vehicule unassignChauffeurFromVehicle(Long vehiculeId) {
        return vehiculeRepository.findById(vehiculeId)
                .map(vehicule -> {
                    vehicule.setChauffeurId(null);
                    vehicule.setChauffeurNom(null);
                    vehicule.setDateAffectation(null);
                    return vehiculeRepository.save(vehicule);
                })
                .orElse(null);
    }

    // Obtenir les véhicules d'un chauffeur
    public List<Vehicule> getVehiclesByChauffeurId(Long chauffeurId) {
        return vehiculeRepository.findByChauffeurId(chauffeurId);
    }

    // Supprimer un véhicule
    public boolean deleteVehicule(Long id) {
        return vehiculeRepository.findById(id)
                .map(vehicule -> {
                    vehiculeRepository.delete(vehicule);
                    return true;
                })
                .orElse(false);
    }

    // Supprimer les véhicules sans immatriculation
    public int cleanupNullImmatriculationVehicules() {
        List<Vehicule> nullVehicules = vehiculeRepository.findByImmatriculationIsNullOrImmatriculationEmpty();
        int count = nullVehicules.size();
        vehiculeRepository.deleteAll(nullVehicules);
        return count;
    }

    // Obtenir le rapport détaillé d'un véhicule avec ses déclarations
    public RapportVehicule getRapportVehicule(Long vehiculeId) {
        Optional<Vehicule> vehiculeOpt = vehiculeRepository.findById(vehiculeId);
        if (vehiculeOpt.isEmpty()) {
            return null;
        }

        Vehicule vehicule = vehiculeOpt.get();
        List<DeclarationIncident> declarations = declarationRepository.findByVehiculeId(vehiculeId);

        return new RapportVehicule(
            vehicule.getId(),
            vehicule.getImmatriculation(),
            vehicule.getMarque(),
            vehicule.getModele(),
            vehicule.getType(),
            vehicule.getBranchCode(),
            vehicule.getKilometrage(),
            vehicule.getAnnee(),
            vehicule.getCarburant(),
            vehicule.getStatut(),
            declarations
        );
    }

    // Analyser un véhicule par immatriculation
    public AnalyseVehicule analyserVehicule(String immatriculation) {
        Optional<Vehicule> vehiculeOpt = vehiculeRepository.findByImmatriculation(immatriculation);
        if (vehiculeOpt.isEmpty()) {
            return null;
        }

        Vehicule vehicule = vehiculeOpt.get();
        List<DeclarationIncident> declarations = declarationRepository.findByVehiculeId(vehicule.getId());

        // Carte nationale
        String site = vehicule.getBranchCode();
        String branchCode = vehicule.getBranchCode();

        // Fiche synthèse
        Integer nombreDeclarations = declarations.size();
        String derniereIntervention = "";
        if (!declarations.isEmpty()) {
            LocalDateTime lastDate = declarations.stream()
                .map(DeclarationIncident::getDateHeure)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
            if (lastDate != null) {
                derniereIntervention = lastDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            }
        }

        // Analyse des déclarations
        Map<String, Integer> typesIncidents = declarations.stream()
            .filter(d -> d.getTypePanneFrancais() != null)
            .collect(Collectors.groupingBy(
                DeclarationIncident::getTypePanneFrancais,
                Collectors.summingInt(d -> 1)
            ));

        // Fréquence moyenne (jours entre incidents)
        Integer frequenceMoyenne = null;
        if (declarations.size() > 1) {
            List<LocalDateTime> dates = declarations.stream()
                .map(DeclarationIncident::getDateHeure)
                .filter(Objects::nonNull)
                .sorted()
                .collect(Collectors.toList());
            
            long totalDays = 0;
            for (int i = 1; i < dates.size(); i++) {
                totalDays += java.time.Duration.between(dates.get(i - 1), dates.get(i)).toDays();
            }
            frequenceMoyenne = (int) (totalDays / (dates.size() - 1));
        }

        // Tendance (basée sur les 3 derniers mois)
        String tendance = "STABLE";
        LocalDateTime troisMois = LocalDateTime.now().minusMonths(3);
        long recentIncidents = declarations.stream()
            .filter(d -> d.getDateHeure() != null && d.getDateHeure().isAfter(troisMois))
            .count();
        long oldIncidents = declarations.size() - recentIncidents;
        
        if (recentIncidents > oldIncidents * 1.5) {
            tendance = "DEGRADE";
        } else if (recentIncidents < oldIncidents * 0.5) {
            tendance = "AMELIORE";
        }

        // Indice qualité (0-100)
        Integer indiceQualite = calculerIndiceQualite(vehicule, declarations);
        String niveauQualite = getNiveauQualite(indiceQualite);

        // Recommandation
        String[] recommandation = calculerRecommandation(vehicule, declarations, indiceQualite);

        return new AnalyseVehicule(
            site, branchCode,
            vehicule.getImmatriculation(), vehicule.getMarque(), vehicule.getModele(), vehicule.getType(),
            vehicule.getKilometrage(), nombreDeclarations, vehicule.getStatut(), derniereIntervention,
            typesIncidents, frequenceMoyenne, tendance,
            indiceQualite, niveauQualite,
            recommandation[0], recommandation[1]
        );
    }

    private Integer calculerIndiceQualite(Vehicule vehicule, List<DeclarationIncident> declarations) {
        int score = 100;
        
        // Pénalité pour kilométrage élevé
        if (vehicule.getKilometrage() != null) {
            if (vehicule.getKilometrage() > 200000) score -= 30;
            else if (vehicule.getKilometrage() > 150000) score -= 20;
            else if (vehicule.getKilometrage() > 100000) score -= 10;
        }

        // Pénalité pour nombre de déclarations
        int nbDeclarations = declarations.size();
        if (nbDeclarations > 10) score -= 40;
        else if (nbDeclarations > 5) score -= 25;
        else if (nbDeclarations > 3) score -= 15;
        else if (nbDeclarations > 1) score -= 5;

        // Pénalité pour incidents critiques
        long critiques = declarations.stream()
            .filter(d -> "BLOQUANT".equals(d.getCriticite()) || "SECURITE".equals(d.getCriticite()))
            .count();
        score -= critiques * 10;

        // Bonus pour véhicule récent
        if (vehicule.getAnnee() != null) {
            int age = 2026 - vehicule.getAnnee();
            if (age < 2) score += 10;
            else if (age < 5) score += 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    private String getNiveauQualite(Integer indice) {
        if (indice >= 80) return "EXCELLENT";
        if (indice >= 60) return "BON";
        if (indice >= 40) return "MOYEN";
        if (indice >= 20) return "FAIBLE";
        return "CRITIQUE";
    }

    private String[] calculerRecommandation(Vehicule vehicule, List<DeclarationIncident> declarations, Integer indiceQualite) {
        if (indiceQualite < 30) {
            return new String[]{"Véhicule en état critique. Remplacement fortement recommandé.", "REPLACEMENT"};
        }
        
        if (vehicule.getKilometrage() != null && vehicule.getKilometrage() > 150000) {
            return new String[]{"Kilométrage élevé. Révision complète recommandée.", "REVISION"};
        }

        if (declarations.size() > 5) {
            return new String[]{"Nombre d'incidents élevé. Maintenance préventive renforcée recommandée.", "MAINTENANCE_PREVENTIVE"};
        }

        if (declarations.size() > 2) {
            return new String[]{"Maintenance préventive régulière recommandée.", "MAINTENANCE_PREVENTIVE"};
        }

        return new String[]{"Véhicule en bon état. Maintenance standard suffisante.", "AUCUNE"};
    }
}
