package com.example.usermanagement.controller;

import com.example.usermanagement.model.DocumentVehicule;
import com.example.usermanagement.model.DocumentVehicule.TypeDocument;
import com.example.usermanagement.service.DocumentVehiculeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/documents-vehicule")
@CrossOrigin(origins = "*")
public class DocumentVehiculeController {

    private final DocumentVehiculeService service;

    public DocumentVehiculeController(DocumentVehiculeService service) { this.service = service; }

    @GetMapping public ResponseEntity<?> getAll() { return ResponseEntity.ok(Map.of("success", true, "documents", service.getAllActive())); }

    @GetMapping("/archived") public ResponseEntity<?> getArchived() { return ResponseEntity.ok(Map.of("success", true, "documents", service.getAllArchived())); }

    @GetMapping("/{id}") public ResponseEntity<?> getById(@PathVariable Long id) { return service.getById(id).map(d -> ResponseEntity.ok(Map.of("success", true, "document", d))).orElse(ResponseEntity.notFound().build()); }

    @GetMapping("/vehicule/{vehiculeId}") public ResponseEntity<?> getByVehicule(@PathVariable Long vehiculeId) { return ResponseEntity.ok(Map.of("success", true, "documents", service.getByVehiculeId(vehiculeId))); }

    @GetMapping("/vehicule/{vehiculeId}/all") public ResponseEntity<?> getByVehiculeAll(@PathVariable Long vehiculeId) { return ResponseEntity.ok(Map.of("success", true, "documents", service.getByVehiculeIdAll(vehiculeId))); }

    @GetMapping("/vehicule/{vehiculeId}/status") public ResponseEntity<?> getVehicleDocumentStatus(@PathVariable Long vehiculeId) { return ResponseEntity.ok(Map.of("success", true, "status", service.getVehicleDocumentStatus(vehiculeId))); }

    @GetMapping("/type/{type}") public ResponseEntity<?> getByType(@PathVariable TypeDocument type) { return ResponseEntity.ok(Map.of("success", true, "documents", service.getByType(type))); }

    @GetMapping("/expired") public ResponseEntity<?> getExpired() { return ResponseEntity.ok(Map.of("success", true, "documents", service.getExpired())); }

    @GetMapping("/expiring-soon") public ResponseEntity<?> getExpiringSoon() { return ResponseEntity.ok(Map.of("success", true, "documents", service.getExpiringSoon())); }

    @GetMapping("/missing") public ResponseEntity<?> getMissing() { return ResponseEntity.ok(Map.of("success", true, "documents", service.getMissing())); }

    @GetMapping("/stats") public ResponseEntity<?> getStats() { return ResponseEntity.ok(Map.of("success", true, "stats", service.getDocumentStats())); }

    @PostMapping public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Long vehiculeId = Long.valueOf(body.get("vehiculeId").toString());
            TypeDocument typeDocument = TypeDocument.valueOf(body.get("typeDocument").toString());
            DocumentVehicule doc = new DocumentVehicule();
            doc.setVehiculeId(vehiculeId);
            doc.setTypeDocument(typeDocument);
            if (body.containsKey("numeroDocument") && body.get("numeroDocument") != null) doc.setNumeroDocument(body.get("numeroDocument").toString());
            if (body.containsKey("dateEmission") && body.get("dateEmission") != null && !body.get("dateEmission").toString().isEmpty()) {
                try { doc.setDateEmission(LocalDateTime.parse(body.get("dateEmission").toString())); } catch (Exception e) { doc.setDateEmission(LocalDateTime.now()); }
            }
            if (body.containsKey("dateExpiration") && body.get("dateExpiration") != null && !body.get("dateExpiration").toString().isEmpty()) {
                try { doc.setDateExpiration(LocalDateTime.parse(body.get("dateExpiration").toString())); } catch (Exception e) { }
            }
            if (body.containsKey("estDisponible") && body.get("estDisponible") != null) {
                doc.setEstDisponible(Boolean.parseBoolean(body.get("estDisponible").toString()));
            } else {
                doc.setEstDisponible(true);
            }
            if (body.containsKey("notes") && body.get("notes") != null) doc.setNotes(body.get("notes").toString());
            if (body.containsKey("importePar") && body.get("importePar") != null) doc.setImportePar(body.get("importePar").toString());
            DocumentVehicule saved = service.create(doc, null);
            return ResponseEntity.ok(Map.of("success", true, "document", saved));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); }
    }

    @PostMapping("/upload") public ResponseEntity<?> createWithFile(@RequestParam Long vehiculeId, @RequestParam TypeDocument typeDocument, @RequestParam(required = false) String numeroDocument, @RequestParam(required = false) String dateEmission, @RequestParam(required = false) Boolean estDisponible, @RequestParam(required = false) String notes, @RequestParam(required = false) String importePar, @RequestParam(required = false) MultipartFile fichier) {
        try {
            DocumentVehicule doc = new DocumentVehicule();
            doc.setVehiculeId(vehiculeId);
            doc.setTypeDocument(typeDocument);
            doc.setNumeroDocument(numeroDocument);
            if (dateEmission != null && !dateEmission.isEmpty()) doc.setDateEmission(LocalDateTime.parse(dateEmission));
            if (estDisponible != null) doc.setEstDisponible(estDisponible); else doc.setEstDisponible(true);
            doc.setNotes(notes);
            doc.setImportePar(importePar);
            DocumentVehicule saved = service.create(doc, fichier);
            return ResponseEntity.ok(Map.of("success", true, "document", saved));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); }
    }

    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            DocumentVehicule updated = new DocumentVehicule();
            if (body.containsKey("numeroDocument") && body.get("numeroDocument") != null) updated.setNumeroDocument(body.get("numeroDocument").toString());
            if (body.containsKey("dateEmission") && body.get("dateEmission") != null && !body.get("dateEmission").toString().isEmpty()) {
                try { updated.setDateEmission(LocalDateTime.parse(body.get("dateEmission").toString())); } catch (Exception e) { }
            }
            if (body.containsKey("dateExpiration") && body.get("dateExpiration") != null && !body.get("dateExpiration").toString().isEmpty()) {
                try { updated.setDateExpiration(LocalDateTime.parse(body.get("dateExpiration").toString())); } catch (Exception e) { }
            }
            if (body.containsKey("estDisponible") && body.get("estDisponible") != null) {
                updated.setEstDisponible(Boolean.parseBoolean(body.get("estDisponible").toString()));
            }
            if (body.containsKey("notes") && body.get("notes") != null) updated.setNotes(body.get("notes").toString());
            DocumentVehicule saved = service.update(id, updated, null);
            return ResponseEntity.ok(Map.of("success", true, "document", saved));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); }
    }

    @PutMapping("/{id}/disponibilite") public ResponseEntity<?> updateDisponibilite(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Boolean estDisponible = Boolean.valueOf(body.getOrDefault("estDisponible", true).toString());
        DocumentVehicule saved = service.updateDisponibilite(id, estDisponible);
        return ResponseEntity.ok(Map.of("success", true, "document", saved));
    }

    @PutMapping("/{id}/archive") public ResponseEntity<?> archive(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String archivedBy = body.getOrDefault("archivedBy", "SYSTEM");
        boolean result = service.archive(id, archivedBy);
        return result ? ResponseEntity.ok(Map.of("success", true, "message", "Document archive")) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/restore") public ResponseEntity<?> restore(@PathVariable Long id) {
        boolean result = service.restore(id);
        return result ? ResponseEntity.ok(Map.of("success", true, "message", "Document restaure")) : ResponseEntity.notFound().build();
    }
}