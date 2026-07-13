package com.example.usermanagement.controller;

import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.service.ExcelImportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/excel")
@CrossOrigin(origins = "*")
public class ExcelController {
    private final ExcelImportService excelImportService;

    public ExcelController(ExcelImportService excelImportService) {
        this.excelImportService = excelImportService;
    }

    @GetMapping("/declarations")
    public ResponseEntity<List<DeclarationIncident>> getAllDeclarations() {
        return ResponseEntity.ok(excelImportService.getAllDeclarations());
    }

    @GetMapping("/declarations/filter")
    public ResponseEntity<List<DeclarationIncident>> getFilteredDeclarations(
            @RequestParam(required = false) String typePanne,
            @RequestParam(required = false) String criticite,
            @RequestParam(required = false) String statut) {
        return ResponseEntity.ok(excelImportService.getFilteredDeclarations(typePanne, criticite, statut));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(excelImportService.getDashboardStats());
    }

    @GetMapping("/filters")
    public ResponseEntity<Map<String, List<String>>> getFilterValues() {
        return ResponseEntity.ok(Map.of(
            "typePanne", excelImportService.getDistinctTypePanne(),
            "criticite", excelImportService.getDistinctCriticite(),
            "statut", excelImportService.getDistinctStatut()
        ));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) String typePanne,
            @RequestParam(required = false) String criticite,
            @RequestParam(required = false) String statut) {
        try {
            List<DeclarationIncident> declarations = excelImportService.getFilteredDeclarations(typePanne, criticite, statut);
            byte[] excelBytes = excelImportService.exportToExcel(declarations);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "declarations.xlsx");
            return ResponseEntity.ok().headers(headers).body(excelBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
