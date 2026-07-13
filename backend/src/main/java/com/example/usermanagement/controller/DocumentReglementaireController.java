package com.example.usermanagement.controller;

import com.example.usermanagement.model.DocumentReglementaire;
import com.example.usermanagement.service.DocumentReglementaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/documents-reglementaires")
@CrossOrigin(origins = "*")
public class DocumentReglementaireController {
    
    private final DocumentReglementaireService documentReglementaireService;
    
    public DocumentReglementaireController(DocumentReglementaireService documentReglementaireService) {
        this.documentReglementaireService = documentReglementaireService;
    }
    
    @GetMapping
    public ResponseEntity<List<DocumentReglementaire>> getAllDocuments() {
        return ResponseEntity.ok(documentReglementaireService.getAllDocuments());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DocumentReglementaire> getDocumentById(@PathVariable Long id) {
        return documentReglementaireService.getDocumentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/vehicule/{vehiculeId}")
    public ResponseEntity<List<DocumentReglementaire>> getDocumentsByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(documentReglementaireService.getDocumentsByVehicule(vehiculeId));
    }
    
    @GetMapping("/vehicule/immatriculation/{immatriculation}")
    public ResponseEntity<List<DocumentReglementaire>> getDocumentsByVehiculeImmatriculation(@PathVariable String immatriculation) {
        return ResponseEntity.ok(documentReglementaireService.getDocumentsByVehiculeImmatriculation(immatriculation));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<DocumentReglementaire>> getDocumentsByType(@PathVariable DocumentReglementaire.TypeDocument type) {
        return ResponseEntity.ok(documentReglementaireService.getDocumentsByType(type));
    }
    
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<DocumentReglementaire>> getDocumentsByStatut(@PathVariable DocumentReglementaire.StatutDocument statut) {
        return ResponseEntity.ok(documentReglementaireService.getDocumentsByStatut(statut));
    }
    
    @GetMapping("/vehicule/{vehiculeId}/type/{type}")
    public ResponseEntity<DocumentReglementaire> getDocumentByVehiculeAndType(
            @PathVariable Long vehiculeId,
            @PathVariable DocumentReglementaire.TypeDocument type) {
        return documentReglementaireService.getDocumentByVehiculeAndType(vehiculeId, type)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/expirant-avant/{date}")
    public ResponseEntity<List<DocumentReglementaire>> getDocumentsExpiringBefore(@PathVariable LocalDate date) {
        return ResponseEntity.ok(documentReglementaireService.getDocumentsExpiringBefore(date));
    }
    
    @GetMapping("/expirant-entre")
    public ResponseEntity<List<DocumentReglementaire>> getDocumentsExpiringBetween(
            @RequestParam LocalDate debut,
            @RequestParam LocalDate fin) {
        return ResponseEntity.ok(documentReglementaireService.getDocumentsExpiringBetween(debut, fin));
    }
    
    @GetMapping("/vehicule/{vehiculeId}/expires/count")
    public ResponseEntity<Long> countExpiredDocumentsByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(documentReglementaireService.countExpiredDocumentsByVehicule(vehiculeId));
    }
    
    @GetMapping("/alertes")
    public ResponseEntity<List<DocumentReglementaire>> getDocumentsNeedingAlert() {
        return ResponseEntity.ok(documentReglementaireService.getDocumentsNeedingAlert());
    }
    
    @GetMapping("/vehicule/{vehiculeId}/valides")
    public ResponseEntity<List<DocumentReglementaire>> getValidDocumentsByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(documentReglementaireService.getValidDocumentsByVehicule(vehiculeId));
    }
    
    @GetMapping("/vehicule/{vehiculeId}/conforme")
    public ResponseEntity<Boolean> verifierConformiteVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(documentReglementaireService.verifierConformiteVehicule(vehiculeId));
    }
    
    @GetMapping("/vehicule/{vehiculeId}/obligatoires")
    public ResponseEntity<Boolean> verifierDocumentsObligatoires(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(documentReglementaireService.verifierDocumentsObligatoires(vehiculeId));
    }
    
    @PostMapping
    public ResponseEntity<DocumentReglementaire> createDocument(@RequestBody DocumentReglementaire document) {
        DocumentReglementaire createdDocument = documentReglementaireService.createDocument(document);
        return ResponseEntity.ok(createdDocument);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<DocumentReglementaire> updateDocument(
            @PathVariable Long id,
            @RequestBody DocumentReglementaire document) {
        DocumentReglementaire updatedDocument = documentReglementaireService.updateDocument(id, document);
        if (updatedDocument != null) {
            return ResponseEntity.ok(updatedDocument);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentReglementaireService.deleteDocument(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/envoyer-alertes")
    public ResponseEntity<Void> envoyerAlertesExpiration() {
        documentReglementaireService.envoyerAlertesExpiration();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<List<DocumentReglementaire>> getDashboardDocuments(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String immatriculation,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String dateExpiration) {
        List<DocumentReglementaire> documents = documentReglementaireService.getAllDocuments();

        // Filtrage par site (via véhicule)
        if (site != null && !site.isEmpty()) {
            documents = documents.stream()
                    .filter(d -> {
                        // Filtre à implémenter si les véhicules ont un champ site
                        return true;
                    })
                    .toList();
        }

        // Filtrage par immatriculation
        if (immatriculation != null && !immatriculation.isEmpty()) {
            documents = documents.stream()
                    .filter(d -> immatriculation.equalsIgnoreCase(d.getVehiculeImmatriculation()))
                    .toList();
        }

        // Filtrage par statut
        if (statut != null && !statut.isEmpty()) {
            try {
                DocumentReglementaire.StatutDocument statutEnum = DocumentReglementaire.StatutDocument.valueOf(statut.toUpperCase());
                documents = documents.stream()
                        .filter(d -> d.getStatutDocument() == statutEnum)
                        .toList();
            } catch (IllegalArgumentException e) {
                // Statut invalide, ignorer le filtre
            }
        }

        // Filtrage par date d'expiration
        if (dateExpiration != null && !dateExpiration.isEmpty()) {
            try {
                LocalDate date = LocalDate.parse(dateExpiration);
                documents = documents.stream()
                        .filter(d -> d.getDateExpiration() != null && d.getDateExpiration().isEqual(date))
                        .toList();
            } catch (Exception e) {
                // Date invalide, ignorer le filtre
            }
        }

        return ResponseEntity.ok(documents);
    }
}
