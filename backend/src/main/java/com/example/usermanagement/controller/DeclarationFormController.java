package com.example.usermanagement.controller;

import com.example.usermanagement.model.DeclarationFormData;
import com.example.usermanagement.service.DeclarationFormService;
import com.example.usermanagement.service.DeclarationTransmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/declarations")
@CrossOrigin(origins = "*")
public class DeclarationFormController {
    @Autowired
    private DeclarationFormService declarationFormService;
    @Autowired
    private DeclarationTransmissionService declarationTransmissionService;

    @PostMapping("/audio-form/transcribe")
    public ResponseEntity<?> transcrireAudio(@RequestParam("audio") MultipartFile audio, @RequestParam String champ) {
        try {
            return ResponseEntity.ok(declarationFormService.traiterReponseAudio(audio, champ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/audio-form")
    public ResponseEntity<?> sauvegarderDeclaration(@RequestBody DeclarationFormData data) {
        try {
            return ResponseEntity.ok(declarationFormService.sauvegarderDeclaration(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/audio-form/chauffeur/{chauffeurId}")
    public ResponseEntity<List<DeclarationFormData>> getDeclarationsParChauffeur(@PathVariable Long chauffeurId) {
        return ResponseEntity.ok(declarationFormService.getDeclarationsParChauffeur(chauffeurId));
    }

    @GetMapping("/audio-form/{id}")
    public ResponseEntity<DeclarationFormData> getDeclarationById(@PathVariable Long id) {
        return ResponseEntity.ok(declarationFormService.getDeclarationById(id));
    }
}
