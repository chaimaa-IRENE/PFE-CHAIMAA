package com.example.usermanagement.controller;

import com.example.usermanagement.dto.IncidentFormRequest;
import com.example.usermanagement.dto.IncidentFormResponse;
import com.example.usermanagement.service.IncidentFormCompletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incident-form-complet")
@CrossOrigin(origins = "*")
public class IncidentFormCompletController {
    private final IncidentFormCompletService service;

    public IncidentFormCompletController(IncidentFormCompletService service) {
        this.service = service;
    }

    @PostMapping("/start")
    public ResponseEntity<IncidentFormResponse> startSession() {
        return ResponseEntity.ok(service.startSession());
    }

    @PostMapping("/step")
    public ResponseEntity<IncidentFormResponse> processStep(@RequestBody IncidentFormRequest request) {
        return ResponseEntity.ok(service.processStep(request));
    }

    @GetMapping("/steps")
    public ResponseEntity<List<Map<String, Object>>> getSteps() {
        List<IncidentFormCompletService.StepDefinition> steps = IncidentFormCompletService.getSteps();
        List<Map<String, Object>> result = steps.stream()
            .map(s -> Map.<String, Object>of(
                "number", s.number,
                "field", s.field,
                "questionDarija", s.questionDarija,
                "questionFrancais", s.questionFrancais
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
