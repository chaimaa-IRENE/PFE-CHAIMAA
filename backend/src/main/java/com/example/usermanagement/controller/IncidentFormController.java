package com.example.usermanagement.controller;

import com.example.usermanagement.dto.IncidentFormRequest;
import com.example.usermanagement.dto.IncidentFormResponse;
import com.example.usermanagement.service.IncidentFormService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incident-form")
@CrossOrigin(origins = "*")
public class IncidentFormController {
    private final IncidentFormService incidentFormService;

    public IncidentFormController(IncidentFormService incidentFormService) {
        this.incidentFormService = incidentFormService;
    }

    @PostMapping("/start")
    public ResponseEntity<IncidentFormResponse> startSession() {
        return ResponseEntity.ok(incidentFormService.startSession());
    }

    @PostMapping("/step")
    public ResponseEntity<IncidentFormResponse> processStep(@RequestBody IncidentFormRequest request) {
        return ResponseEntity.ok(incidentFormService.processStep(request));
    }
}
