package com.example.usermanagement.controller;

import com.example.usermanagement.model.BudgetTrimestriel;
import com.example.usermanagement.service.BudgetTrimestrielService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/budget")
@CrossOrigin(origins = "*")
public class BudgetController {
    private final BudgetTrimestrielService budgetService;

    public BudgetController(BudgetTrimestrielService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createBudget(@RequestBody Map<String, Object> data) {
        try {
            Integer annee = Integer.valueOf(data.get("annee").toString());
            Integer trimestre = Integer.valueOf(data.get("trimestre").toString());
            Double budgetTotal = Double.valueOf(data.get("budgetTotal").toString());
            return ResponseEntity.ok(budgetService.createBudget(annee, trimestre, budgetTotal));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveBudget() {
        return ResponseEntity.ok(budgetService.getBudgetDetails());
    }

    @GetMapping("/all")
    public ResponseEntity<List<BudgetTrimestriel>> getAllBudgets() {
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }

    @GetMapping("/year/{annee}")
    public ResponseEntity<List<BudgetTrimestriel>> getBudgetsByYear(@PathVariable Integer annee) {
        return ResponseEntity.ok(budgetService.getBudgetsByYear(annee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBudget(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Double nouveauBudgetTotal = Double.valueOf(data.get("budgetTotal").toString());
            return ResponseEntity.ok(budgetService.updateBudget(id, nouveauBudgetTotal));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> desactiverBudget(@PathVariable Long id) {
        try {
            budgetService.desactiverBudget(id);
            return ResponseEntity.ok(Map.of("message", "Budget désactivé"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check/{montant}")
    public ResponseEntity<Map<String, Object>> checkBudget(@PathVariable Double montant) {
        boolean suffisant = budgetService.verifierBudgetSuffisant(montant);
        return ResponseEntity.ok(Map.of("suffisant", suffisant));
    }
}
