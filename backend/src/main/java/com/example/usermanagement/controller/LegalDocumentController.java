package com.example.usermanagement.controller;

import com.example.usermanagement.dto.LegalDocumentDTO;
import com.example.usermanagement.model.LegalDocument;
import com.example.usermanagement.service.LegalDocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/fleet/documents")
@CrossOrigin(origins = "*")
public class LegalDocumentController {

    private final LegalDocumentService documentService;

    public LegalDocumentController(LegalDocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/import")
    public ResponseEntity<?> importDocument(@RequestBody Map<String, String> body) {
        String immatriculation = body.get("vehiculeImmatriculation");
        String type = body.get("type");
        String numeroDocument = body.get("numeroDocument");
        String dateExpStr = body.get("dateExpiration");
        String proprietaire = body.get("proprietaire");
        String importePar = body.get("importePar");
        String ocrData = body.get("ocrData");

        if (immatriculation == null || type == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Immatriculation et type requis"));

        LocalDate dateExpiration = dateExpStr != null ? LocalDate.parse(dateExpStr) : null;

        LegalDocument doc = documentService.importDocument(immatriculation, type, numeroDocument,
            dateExpiration, proprietaire, importePar, ocrData, null);

        if (doc == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicule non trouve"));

        return ResponseEntity.ok(documentService.toDTO(doc));
    }

    @PostMapping("/import/ocr")
    public ResponseEntity<?> importWithOCR(@RequestParam("file") MultipartFile file,
                                           @RequestParam("vehiculeImmatriculation") String immatriculation,
                                           @RequestParam("type") String type,
                                           @RequestParam("importePar") String importePar) {
        LegalDocument doc = documentService.importDocumentWithOCR(immatriculation, type, file, importePar);
        if (doc == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Echec import document"));

        return ResponseEntity.ok(documentService.toDTO(doc));
    }

    @GetMapping("/vehicule/{immatriculation}")
    public ResponseEntity<List<LegalDocumentDTO>> getByVehicule(@PathVariable String immatriculation) {
        return ResponseEntity.ok(documentService.toDTOList(
            documentService.getDocumentsByVehicule(immatriculation)));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<LegalDocumentDTO>> getByType(@PathVariable String type) {
        return ResponseEntity.ok(documentService.toDTOList(
            documentService.getDocumentsByType(type)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<LegalDocumentDTO>> getAll() {
        return ResponseEntity.ok(documentService.toDTOList(
            documentService.getAllDocuments()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDocument(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String dateExpStr = body.get("dateExpiration");
        String numeroDocument = body.get("numeroDocument");
        String proprietaire = body.get("proprietaire");

        LocalDate dateExpiration = dateExpStr != null ? LocalDate.parse(dateExpStr) : null;

        LegalDocument doc = documentService.updateDocument(id, dateExpiration, numeroDocument, proprietaire);
        if (doc == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Document non trouve"));

        return ResponseEntity.ok(documentService.toDTO(doc));
    }
}
