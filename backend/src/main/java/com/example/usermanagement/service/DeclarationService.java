package com.example.usermanagement.service;

import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.repository.DeclarationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class DeclarationService {

    @Autowired
    private DeclarationRepository repository;

    @Autowired
    private SpeechService speechService;

    @Autowired
    private BudgetTrimestrielService budgetTrimestrielService;

    // Générer un numéro unique
    public String generateRequestNumber() {
        return "INC-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0,6);
    }

    // Créer une déclaration classique
    public DeclarationIncident createDeclaration(String numeroDemande, String dateHeure, String typePanne, String description,
                                                 String criticite, String location, String lieu, Long chauffeurId, String chauffeurNom,
                                                 String kilometrage, String vehiculeType,
                                                 MultipartFile photo, MultipartFile video,
                                                 Double latitude, Double longitude,
                                                 Long vehiculeId, String vehiculeImmatriculation,
                                                 String vehiculeMarque, String vehiculeModele,
                                                 String vehiculeKilometrage, String vehiculeAgence,
                                                 String source, String elementVehicule, String detailElement, String categorie) {
        DeclarationIncident incident = new DeclarationIncident();
        incident.setNumeroDemande(numeroDemande);

        // Use provided date or default to now
        LocalDateTime now = LocalDateTime.now();
        if (dateHeure != null && !dateHeure.isEmpty()) {
            try {
                incident.setDateHeure(LocalDateTime.parse(dateHeure));
            } catch (Exception e) {
                incident.setDateHeure(now);
            }
        } else {
            incident.setDateHeure(now);
        }

        incident.setDescriptionFrancais(description);
        incident.setCriticite(criticite);
        incident.setTypePanne(typePanne);
        incident.setLocation(location);
        incident.setLieu(lieu != null ? lieu : location);
        incident.setChauffeurId(chauffeurId);
        incident.setChauffeurNom(chauffeurNom);
        incident.setSource(source);
        incident.setElementVehicule(elementVehicule);
        incident.setDetailElement(detailElement);
        incident.setCategorie(categorie);

        // Parse kilometrage if provided
        if (kilometrage != null && !kilometrage.isEmpty()) {
            try {
                incident.setKilometrage(Integer.parseInt(kilometrage));
            } catch (Exception e) {
                // Keep null if parsing fails
            }
        }

        // Use vehiculeType from parameter if provided, otherwise use vehiculeType from other fields
        if (vehiculeType != null && !vehiculeType.isEmpty()) {
            incident.setVehiculeType(vehiculeType);
        }

        incident.setVehiculeId(vehiculeId);
        incident.setVehiculeImmatriculation(vehiculeImmatriculation);
        incident.setVehiculeMarque(vehiculeMarque);
        incident.setVehiculeModele(vehiculeModele);
        
        // Handle manual vehicle entry fields
        if (vehiculeKilometrage != null && !vehiculeKilometrage.isEmpty()) {
            try {
                incident.setKilometrage(Integer.parseInt(vehiculeKilometrage));
            } catch (Exception e) {
                // Keep null if parsing fails
            }
        }
        if (vehiculeAgence != null && !vehiculeAgence.isEmpty()) {
            // Store agence in a custom field or use existing fields
            incident.setMois(vehiculeAgence); // Temporary storage, can be improved
        }
        
        incident.setStatut("EN_ATTENTE");

        // Calculate SLA automatically
        incident.setSla(calculateSLA(incident.getDateHeure()));

        // Set month from date
        incident.setMois(String.valueOf(incident.getDateHeure().getMonthValue()));

        // Handle photo
        if (photo != null && photo.getSize() > 0) {
            try {
                incident.setPhoto(java.util.Base64.getEncoder().encodeToString(photo.getBytes()));
            } catch (Exception e) {
                // Keep null if encoding fails
            }
        }

        // Handle video
        if (video != null && video.getSize() > 0) {
            try {
                incident.setVideo(java.util.Base64.getEncoder().encodeToString(video.getBytes()));
            } catch (Exception e) {
                // Keep null if encoding fails
            }
        }

        return repository.save(incident);
    }

    public DeclarationIncident createDeclarationFromVoice(DeclarationIncident incident) {
        if (incident.getDateHeure() == null) incident.setDateHeure(LocalDateTime.now());
        if (incident.getStatut() == null) incident.setStatut("EN_ATTENTE");
        if (incident.getEtat() == null) incident.setEtat("NON_TRAITE");
        if (incident.getNumeroDemande() == null || incident.getNumeroDemande().isBlank()) {
            incident.setNumeroDemande(generateRequestNumber());
        }
        incident.setSla(calculateSLA(incident.getDateHeure()));
        return repository.save(incident);
    }

    // Créer une déclaration vocale
    public DeclarationIncident createDeclarationAudio(MultipartFile audio, String criticite,
                                                      String typePanne, String location, String lieu, Long chauffeurId,
                                                      Long vehiculeId, String vehiculeImmatriculation,
                                                      String vehiculeMarque, String vehiculeModele, String vehiculeType,
                                                      String vehiculeKilometrage, String vehiculeAgence) throws Exception {
        String texteArabe = speechService.transcrireAudio(audio);
        String texteFrancais = speechService.traduireArabeVersFrancais(texteArabe);
        String numeroDemande = generateRequestNumber();

        DeclarationIncident incident = createDeclaration(numeroDemande, null, typePanne, texteFrancais,
                criticite, location, lieu, chauffeurId, null, null, vehiculeType,
                null, null, null, null,
                vehiculeId, vehiculeImmatriculation, vehiculeMarque, vehiculeModele,
                vehiculeKilometrage, vehiculeAgence, null, null, null, null);

        incident.setDescriptionArabe(texteArabe);
        incident.setAudio(audio.getBytes());
        return repository.save(incident);
    }

    // Obtenir toutes les déclarations
    public List<DeclarationIncident> getAllDeclarations() {
        return repository.findAll();
    }

    // Obtenir une déclaration par ID
    public DeclarationIncident getDeclarationById(Long id) {
        return repository.findById(id).orElse(null);
    }

    // Obtenir les déclarations par chauffeur
    public List<DeclarationIncident> getDeclarationsByChauffeur(Long chauffeurId) {
        return repository.findByChauffeurId(chauffeurId);
    }

    public void updateVideoUrl(Long id, String videoUrl) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));
        incident.setVideoUrl(videoUrl);
        repository.save(incident);
    }

    public DeclarationIncident updateFieldsFromAI(Long id, String immatriculation, Integer kilometrage,
                                                   String elementVehicule, String detailElement,
                                                   String categorie, String typePanne, String criticite,
                                                   String description, String source, String lieu) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));
        if (immatriculation != null && !immatriculation.isEmpty()) {
            incident.setVehiculeImmatriculation(immatriculation);
        }
        if (kilometrage != null) {
            incident.setKilometrage(kilometrage);
        }
        if (elementVehicule != null && !elementVehicule.isEmpty()) {
            incident.setElementVehicule(elementVehicule);
        }
        if (detailElement != null && !detailElement.isEmpty()) {
            incident.setDetailElement(detailElement);
        }
        if (categorie != null && !categorie.isEmpty()) {
            incident.setCategorie(categorie);
        }
        if (typePanne != null && !typePanne.isEmpty()) {
            incident.setTypePanne(typePanne);
        }
        if (criticite != null && !criticite.isEmpty()) {
            incident.setCriticite(criticite);
        }
        if (description != null && !description.isEmpty()) {
            incident.setDescriptionFrancais(description);
        }
        if (source != null && !source.isEmpty()) {
            incident.setSource(source);
        }
        if (lieu != null && !lieu.isEmpty()) {
            incident.setLocation(lieu);
        }
        return repository.save(incident);
    }

    // Prendre en charge une déclaration (PRESTATAIRE)
    public void takeCharge(Long id) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));
        // Workflow: EN_ATTENTE → EN_COURS
        if (!"EN_ATTENTE".equals(incident.getStatut())) {
            throw new RuntimeException("Seules les déclarations en attente peuvent être prises en charge");
        }
        LocalDateTime now = LocalDateTime.now();
        incident.setDateDebutIntervention(now);
        incident.setStatut("EN_COURS");
        repository.save(incident);
    }

    // Mettre à jour une déclaration avec rapport d'intervention (PRESTATAIRE)
    public void updateDeclaration(Long id, String dateDebutIntervention, String dureeReparation,
                                  String actionsRealisees, String piecesNecessaires, String qualification,
                                  String cout, MultipartFile documentPdf,
                                  String dateReparation, String etatReparation,
                                  String contratBonCommande) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));

        // Workflow: EN_COURS → EN_VALIDATION
        if (!"EN_COURS".equals(incident.getStatut())) {
            throw new RuntimeException("Seules les déclarations en cours peuvent être mises à jour");
        }

        // Validate mandatory fields
        if (dateDebutIntervention == null || dateDebutIntervention.isEmpty()) {
            throw new RuntimeException("La date de début d'intervention est obligatoire");
        }

        if (cout == null || cout.isEmpty()) {
            throw new RuntimeException("Le coût est obligatoire");
        }
        
        try {
            double coutValue = Double.parseDouble(cout);
            if (coutValue <= 0) {
                throw new RuntimeException("Le coût doit être supérieur à zéro");
            }
            incident.setCoutProbleme(coutValue);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Format de coût invalide");
        }

        // Update dateDebutIntervention if provided
        if (dateDebutIntervention != null && !dateDebutIntervention.isEmpty()) {
            try {
                incident.setDateDebutIntervention(LocalDateTime.parse(dateDebutIntervention, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")));
            } catch (Exception e) {
                try {
                    incident.setDateDebutIntervention(LocalDateTime.parse(dateDebutIntervention));
                } catch (Exception e2) {
                    throw new RuntimeException("Format de date de début d'intervention invalide: " + dateDebutIntervention);
                }
            }
        }

        // Auto-calculer la durée de réparation en secondes entre dateDebutIntervention et maintenant
        if (incident.getDateDebutIntervention() != null) {
            LocalDateTime debut = incident.getDateDebutIntervention();
            LocalDateTime fin = LocalDateTime.now();
            if (dateReparation != null && !dateReparation.isEmpty()) {
                try {
                    String dr = dateReparation;
                    if (dr.endsWith("Z")) dr = dr.substring(0, dr.length() - 1);
                    if (dr.contains("+")) dr = dr.substring(0, dr.indexOf('+'));
                    fin = LocalDateTime.parse(dr, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"));
                } catch (Exception e1) {
                    try {
                        String dr = dateReparation;
                        if (dr.endsWith("Z")) dr = dr.substring(0, dr.length() - 1);
                        if (dr.contains("+")) dr = dr.substring(0, dr.indexOf('+'));
                        fin = LocalDateTime.parse(dr);
                    } catch (Exception ignored) {}
                }
            }
            long secondes = Duration.between(debut, fin).toSeconds();
            if (secondes < 1) secondes = 1;
            incident.setDureeReparation((int) secondes);
        } else {
            throw new RuntimeException("Date de début d'intervention non trouvée");
        }

        // Set rapport fields
        incident.setActionsRealisees(actionsRealisees);
        incident.setPiecesNecessaires(piecesNecessaires);
        incident.setQualification(qualification);
        incident.setContratBonCommande(contratBonCommande);

        // Set the new fields
        if (dateReparation != null && !dateReparation.isEmpty()) {
            try {
                String dr = dateReparation;
                if (dr.endsWith("Z")) dr = dr.substring(0, dr.length() - 1);
                if (dr.contains("+")) dr = dr.substring(0, dr.indexOf('+'));
                incident.setDateReparation(LocalDateTime.parse(dr, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")));
            } catch (Exception e) {
                try {
                    String dr = dateReparation;
                    if (dr.endsWith("Z")) dr = dr.substring(0, dr.length() - 1);
                    if (dr.contains("+")) dr = dr.substring(0, dr.indexOf('+'));
                    incident.setDateReparation(LocalDateTime.parse(dr));
                } catch (Exception e2) {
                    throw new RuntimeException("Format de date de réparation invalide: " + dateReparation);
                }
            }
        }

        incident.setEtat(etatReparation);

        incident.setStatut("EN_VALIDATION");
        repository.save(incident);
    }

    // Clôturer une déclaration (RESPONSABLE_SUPPORT)
    public void closeDeclaration(Long id) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));

        // Business rules: Clôture impossible sans dateReparation
        if (incident.getDateReparation() == null) {
            throw new RuntimeException("La date de réparation est obligatoire pour clôturer");
        }

        // Workflow: EN_VALIDATION, TRAITE → CLOTURE
        if (!"EN_VALIDATION".equals(incident.getStatut()) && !"TRAITE".equals(incident.getStatut())) {
            throw new RuntimeException("Seules les déclarations en validation ou traitées peuvent être clôturées");
        }

        if (incident.getCoutProbleme() == null) {
            throw new RuntimeException("Le coût du problème doit être défini avant clôture");
        }

        incident.setStatut("CLOTURE");
        repository.save(incident);
    }

    // Retourner une déclaration au prestataire (RESPONSABLE_SUPPORT)
    public void returnToProvider(Long id, String motif) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));

        // Business rules: Retour → motif obligatoire
        if (motif == null || motif.trim().isEmpty()) {
            throw new RuntimeException("Le motif de retour est obligatoire");
        }

        // Workflow: EN_VALIDATION → RETOURNE
        if (!"EN_VALIDATION".equals(incident.getStatut())) {
            throw new RuntimeException("Seules les déclarations en validation peuvent être retournées");
        }

        incident.setStatut("RETOURNEE");
        incident.setMotifRefus(motif);
        repository.save(incident);
    }

    // Refuser une déclaration (RESPONSABLE_SUPPORT)
    public void refuseDeclaration(Long id, String motif) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));

        // Business rules: Refus → motif obligatoire
        if (motif == null || motif.trim().isEmpty()) {
            throw new RuntimeException("Le motif de refus est obligatoire");
        }

        // Workflow: EN_VALIDATION → REFUSE
        if (!"EN_VALIDATION".equals(incident.getStatut())) {
            throw new RuntimeException("Seules les déclarations en validation peuvent être refusées");
        }

        incident.setStatut("REFUSE");
        incident.setMotifRefus(motif);
        repository.save(incident);
    }

    // Patching rapport fields on existing declarations (fix legacy missing data)
    public void patchRapport(Long id, String contratBonCommande, String piecesNecessaires) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));
        if (contratBonCommande != null) incident.setContratBonCommande(contratBonCommande);
        if (piecesNecessaires != null) incident.setPiecesNecessaires(piecesNecessaires);
        repository.save(incident);
    }

    // Valider une déclaration (RESPONSABLE_SUPPORT) - transition EN_VALIDATION → TRAITE
    public void validateDeclaration(Long id) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));

        // Workflow: EN_VALIDATION → TRAITE
        if (!"EN_VALIDATION".equals(incident.getStatut())) {
            throw new RuntimeException("Seules les déclarations en validation peuvent être validées");
        }

        incident.setStatut("TRAITE");
        repository.save(incident);
    }

    // Filtrer les déclarations avec les nouveaux critères
    public List<DeclarationIncident> filterDeclarations(Map<String, String> filters) {
        String mois = filters.get("mois");
        String categorie = filters.get("categorie");
        String statut = filters.get("statut");
        String elementVehicule = filters.get("elementVehicule");

        return repository.filterDeclarations(mois, categorie, statut, elementVehicule);
    }

    // Statistiques
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", repository.count());
        stats.put("enAttente", repository.countByStatut("EN_ATTENTE"));
        stats.put("enCours", repository.countByStatut("EN_COURS"));
        stats.put("enValidation", repository.countByStatut("EN_VALIDATION"));
        stats.put("cloturees", repository.countByStatut("CLOTURE"));
        stats.put("retournees", repository.countByStatut("RETOURNEE"));
        return stats;
    }

    // Transmission au prestataire
    public void transmitToProvider(String numeroDemande) {
        DeclarationIncident incident = repository.findByNumeroDemande(numeroDemande)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));
        incident.setStatut("EN_COURS");
        repository.save(incident);
    }

    // Sauvegarder une déclaration
    public DeclarationIncident saveDeclaration(DeclarationIncident declaration) {
        return repository.save(declaration);
    }

    // Vérifier si une déclaration existe déjà pour ce chauffeur/vehicule/date
    public boolean existsByChauffeurAndVehiculeAndDate(Long chauffeurId, String vehiculeImmatriculation, LocalDateTime dateHeure) {
        // Vérifier dans une fenêtre de 1 minute autour de la date pour éviter les doublons
        LocalDateTime start = dateHeure.minusMinutes(1);
        LocalDateTime end = dateHeure.plusMinutes(1);
        return repository.existsByChauffeurIdAndVehiculeImmatriculationAndDateHeureBetween(
            chauffeurId, vehiculeImmatriculation, start, end
        );
    }

    // Calculer le SLA (jours depuis la création)
    private Integer calculateSLA(LocalDateTime creationDate) {
        if (creationDate == null) return 0;
        long days = ChronoUnit.DAYS.between(creationDate, LocalDateTime.now());
        return (int) days;
    }

    // Mettre à jour le SLA d'une déclaration
    public void updateSLA(Long id) {
        DeclarationIncident incident = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Déclaration non trouvée"));
        incident.setSla(calculateSLA(incident.getDateHeure()));
        repository.save(incident);
    }
}
