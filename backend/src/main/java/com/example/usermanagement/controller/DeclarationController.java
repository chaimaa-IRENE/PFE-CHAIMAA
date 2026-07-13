package com.example.usermanagement.controller;

import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.service.DeclarationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/declarations")
@CrossOrigin(origins = "*")
public class DeclarationController {
    private final DeclarationService declarationService;

    public DeclarationController(DeclarationService declarationService) {
        this.declarationService = declarationService;
    }

    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> createDeclarationJson(@RequestBody Map<String, Object> body) {
        try {
            String numeroDemande = declarationService.generateRequestNumber();
            String dateHeure = (String) body.getOrDefault("dateHeure", LocalDateTime.now().toString());
            String typePanne = (String) body.get("typePanne");
            String description = (String) body.get("description");
            String criticite = (String) body.get("criticite");
            String location = (String) body.get("location");
            String lieu = (String) body.get("lieu");
            Long chauffeurId = body.get("chauffeurId") != null ? Long.valueOf(body.get("chauffeurId").toString()) : null;
            String chauffeurNom = (String) body.get("chauffeurNom");
            String kilometrage = (String) body.get("kilometrage");
            String vehiculeType = (String) body.get("vehiculeType");
            Double latitude = body.get("latitude") != null ? Double.valueOf(body.get("latitude").toString()) : null;
            Double longitude = body.get("longitude") != null ? Double.valueOf(body.get("longitude").toString()) : null;
            Long vehiculeId = body.get("vehiculeId") != null ? Long.valueOf(body.get("vehiculeId").toString()) : null;
            String vehiculeImmatriculation = (String) body.get("vehiculeImmatriculation");
            String vehiculeMarque = (String) body.get("vehiculeMarque");
            String vehiculeModele = (String) body.get("vehiculeModele");
            String vehiculeKilometrage = (String) body.get("vehiculeKilometrage");
            String vehiculeAgence = (String) body.get("vehiculeAgence");
            String source = (String) body.get("source");
            String elementVehicule = (String) body.get("elementVehicule");
            String detailElement = (String) body.get("detailElement");
            String categorie = (String) body.get("categorie");

            DeclarationIncident result = declarationService.createDeclaration(numeroDemande, dateHeure, typePanne,
                description, criticite, location, lieu, chauffeurId, chauffeurNom, kilometrage, vehiculeType,
                null, null, latitude, longitude, vehiculeId, vehiculeImmatriculation, vehiculeMarque,
                vehiculeModele, vehiculeKilometrage, vehiculeAgence, source, elementVehicule, detailElement, categorie);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createDeclaration(
            @RequestParam("numeroDemande") String numeroDemande,
            @RequestParam("dateHeure") String dateHeure,
            @RequestParam("typePanne") String typePanne,
            @RequestParam("description") String description,
            @RequestParam("criticite") String criticite,
            @RequestParam("location") String location,
            @RequestParam(value = "lieu", required = false) String lieu,
            @RequestParam("chauffeurId") Long chauffeurId,
            @RequestParam(value = "chauffeurNom", required = false) String chauffeurNom,
            @RequestParam(value = "kilometrage", required = false) String kilometrage,
            @RequestParam(value = "vehiculeType", required = false) String vehiculeType,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam(value = "video", required = false) MultipartFile video,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "vehiculeId", required = false) Long vehiculeId,
            @RequestParam(value = "vehiculeImmatriculation", required = false) String vehiculeImmatriculation,
            @RequestParam(value = "vehiculeMarque", required = false) String vehiculeMarque,
            @RequestParam(value = "vehiculeModele", required = false) String vehiculeModele,
            @RequestParam(value = "vehiculeKilometrage", required = false) String vehiculeKilometrage,
            @RequestParam(value = "vehiculeAgence", required = false) String vehiculeAgence,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "elementVehicule", required = false) String elementVehicule,
            @RequestParam(value = "detailElement", required = false) String detailElement,
            @RequestParam(value = "categorie", required = false) String categorie) {
        try {
            return ResponseEntity.ok(declarationService.createDeclaration(numeroDemande, dateHeure, typePanne,
                description, criticite, location, lieu, chauffeurId, chauffeurNom, kilometrage, vehiculeType,
                photo, video, latitude, longitude, vehiculeId, vehiculeImmatriculation, vehiculeMarque,
                vehiculeModele, vehiculeKilometrage, vehiculeAgence, source, elementVehicule, detailElement, categorie));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/audio")
    public ResponseEntity<?> createDeclarationAudio(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("criticite") String criticite,
            @RequestParam("typePanne") String typePanne,
            @RequestParam("location") String location,
            @RequestParam("lieu") String lieu,
            @RequestParam("chauffeurId") Long chauffeurId,
            @RequestParam("vehiculeId") Long vehiculeId,
            @RequestParam(value = "vehiculeImmatriculation", required = false) String vehiculeImmatriculation,
            @RequestParam(value = "vehiculeMarque", required = false) String vehiculeMarque,
            @RequestParam(value = "vehiculeModele", required = false) String vehiculeModele,
            @RequestParam(value = "vehiculeType", required = false) String vehiculeType,
            @RequestParam(value = "vehiculeKilometrage", required = false) String vehiculeKilometrage,
            @RequestParam(value = "vehiculeAgence", required = false) String vehiculeAgence) {
        try {
            return ResponseEntity.ok(declarationService.createDeclarationAudio(audio, criticite, typePanne,
                location, lieu, chauffeurId, vehiculeId, vehiculeImmatriculation, vehiculeMarque,
                vehiculeModele, vehiculeType, vehiculeKilometrage, vehiculeAgence));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<DeclarationIncident>> getAllDeclarations() {
        return ResponseEntity.ok(declarationService.getAllDeclarations());
    }

    @GetMapping("/chauffeur/{chauffeurId}")
    public ResponseEntity<List<DeclarationIncident>> getDeclarationsByChauffeur(@PathVariable Long chauffeurId) {
        return ResponseEntity.ok(declarationService.getDeclarationsByChauffeur(chauffeurId));
    }

    @PutMapping("/{id}/takeCharge")
    public ResponseEntity<?> takeCharge(@PathVariable Long id) {
        try {
            declarationService.takeCharge(id);
            return ResponseEntity.ok(Map.of("message", "Prise en charge effectuée"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/update")
    public ResponseEntity<?> updateDeclaration(@PathVariable Long id,
            @RequestParam("dateDebutIntervention") String dateDebutIntervention,
            @RequestParam(value = "dureeReparation", required = false) String dureeReparation,
            @RequestParam("actionsRealisees") String actionsRealisees,
            @RequestParam(value = "piecesNecessaires", required = false) String piecesNecessaires,
            @RequestParam("qualification") String qualification,
            @RequestParam("cout") String cout,
            @RequestParam(value = "documentPdf", required = false) MultipartFile documentPdf,
            @RequestParam(value = "dateReparation", required = false) String dateReparation,
            @RequestParam(value = "etatReparation", required = false) String etatReparation,
            @RequestParam(value = "contratBonCommande", required = false) String contratBonCommande) {
        try {
            declarationService.updateDeclaration(id, dateDebutIntervention, dureeReparation, actionsRealisees,
                piecesNecessaires, qualification, cout, documentPdf, dateReparation, etatReparation, contratBonCommande);
            return ResponseEntity.ok(Map.of("message", "Déclaration mise à jour"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeDeclaration(@PathVariable Long id) {
        try {
            declarationService.closeDeclaration(id);
            return ResponseEntity.ok(Map.of("message", "Déclaration fermée"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<?> returnToProvider(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            declarationService.returnToProvider(id, body.get("motif"));
            return ResponseEntity.ok(Map.of("message", "Retournée au prestataire"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/refuse")
    public ResponseEntity<?> refuseDeclaration(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            declarationService.refuseDeclaration(id, body.get("motif"));
            return ResponseEntity.ok(Map.of("message", "Déclaration refusée"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validateDeclaration(@PathVariable Long id) {
        try {
            declarationService.validateDeclaration(id);
            return ResponseEntity.ok(Map.of("message", "Déclaration validée"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/filter")
    public ResponseEntity<List<DeclarationIncident>> filterDeclarations(@RequestBody Map<String, String> filters) {
        return ResponseEntity.ok(declarationService.filterDeclarations(filters));
    }

    @PutMapping("/{id}/patch-rapport")
    public ResponseEntity<?> patchRapport(@PathVariable Long id,
            @RequestParam(value = "contratBonCommande", required = false) String contratBonCommande,
            @RequestParam(value = "piecesNecessaires", required = false) String piecesNecessaires) {
        try {
            declarationService.patchRapport(id, contratBonCommande, piecesNecessaires);
            return ResponseEntity.ok(Map.of("message", "Rapport mis à jour"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(declarationService.getStats());
    }
}
