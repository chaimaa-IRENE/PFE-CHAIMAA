package com.example.usermanagement.controller;

import com.example.usermanagement.dto.DiagnosticResponse;
import com.example.usermanagement.service.DiagnosticService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/diagnostic")
@CrossOrigin(origins = "*")
public class DiagnosticController {
    private final DiagnosticService diagnosticService;

    public DiagnosticController(DiagnosticService diagnosticService) {
        this.diagnosticService = diagnosticService;
    }

    @PostMapping
    public ResponseEntity<DiagnosticResponse> diagnostiquer(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(diagnosticService.diagnostiquer(body));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
