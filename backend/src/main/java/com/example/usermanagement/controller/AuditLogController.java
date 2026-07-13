package com.example.usermanagement.controller;

import com.example.usermanagement.model.AuditLog;
import com.example.usermanagement.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/all")
    public ResponseEntity<List<AuditLog>> getAll() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/entity/{type}/{id}")
    public ResponseEntity<List<AuditLog>> getByEntity(@PathVariable String type, @PathVariable Long id) {
        return ResponseEntity.ok(auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(type, id));
    }

    @GetMapping("/entity/{type}")
    public ResponseEntity<List<AuditLog>> getByType(@PathVariable String type) {
        return ResponseEntity.ok(auditLogRepository.findByEntityTypeOrderByTimestampDesc(type));
    }
}