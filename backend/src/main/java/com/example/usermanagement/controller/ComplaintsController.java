package com.example.usermanagement.controller;

import com.example.usermanagement.service.ComplaintsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintsController {
    private final ComplaintsService complaintsService;

    public ComplaintsController(ComplaintsService complaintsService) {
        this.complaintsService = complaintsService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllComplaints() {
        return ResponseEntity.ok(complaintsService.getAllComplaints());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<Map<String, Object>>> getFilteredComplaints(
            @RequestParam(required = false) String mois,
            @RequestParam(required = false) String chauffeur,
            @RequestParam(required = false) String immatriculation,
            @RequestParam(required = false) String criticite,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String categorie) {
        return ResponseEntity.ok(complaintsService.getFilteredComplaints(mois, chauffeur, immatriculation, criticite, statut, categorie));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(complaintsService.getDashboardStats());
    }
}
