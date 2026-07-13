package com.example.usermanagement.controller;

import com.example.usermanagement.model.User;
import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.model.AuditLog;
import com.example.usermanagement.service.UserService;
import com.example.usermanagement.service.DeclarationService;
import com.example.usermanagement.service.EmailService;
import com.example.usermanagement.service.EmailNotificationService;
import com.example.usermanagement.service.BudgetTrimestrielService;
import com.example.usermanagement.service.ExcelImportService;
import com.example.usermanagement.service.ChecklistService;
import com.example.usermanagement.repository.DeclarationRepository;
import com.example.usermanagement.repository.AuditLogRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.security.SecureRandom;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    private final UserService userService;
    private final DeclarationService declarationService;
    private final EmailService emailService;
    private final EmailNotificationService emailNotificationService;
    private final BudgetTrimestrielService budgetService;
    private final ExcelImportService excelService;
    private final ChecklistService checklistService;
    private final DeclarationRepository declarationRepository;
    private final AuditLogRepository auditLogRepository;
    private static final SecureRandom RANDOM = new SecureRandom();

    public AdminController(UserService userService, DeclarationService declarationService,
                           EmailService emailService, EmailNotificationService emailNotificationService,
                           BudgetTrimestrielService budgetService, ExcelImportService excelService,
                           ChecklistService checklistService, DeclarationRepository declarationRepository,
                           AuditLogRepository auditLogRepository) {
        this.userService = userService;
        this.declarationService = declarationService;
        this.emailService = emailService;
        this.emailNotificationService = emailNotificationService;
        this.budgetService = budgetService;
        this.excelService = excelService;
        this.checklistService = checklistService;
        this.declarationRepository = declarationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            String tempPassword = generateTemporaryPassword();
            user.setPassword(tempPassword);
            User created = userService.createUser(user);
            emailService.sendCredentials(created, tempPassword);
            return ResponseEntity.ok(Map.of(
                "user", created,
                "message", "Utilisateur créé avec succès. Identifiants envoyés par email."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String holdReason = body != null ? body.get("holdReason") : null;
            if (holdReason == null || holdReason.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "HOLD_REASON is required for deactivation"));
            }
            userService.deleteUser(id, holdReason);
            return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGlobalStats() {
        return ResponseEntity.ok(declarationService.getStats());
    }

    @GetMapping("/budget/check/{declarationId}")
    public ResponseEntity<Map<String, Object>> checkBudget(@PathVariable Long declarationId) {
        Map<String, Object> budgetDetails = budgetService.getBudgetDetails();
        Double budgetRestant = (Double) budgetDetails.getOrDefault("budgetRestant", 0.0);
        Double budgetTotal = (Double) budgetDetails.getOrDefault("budgetTotal", 0.0);

        Double declarationCost = null;
        var declOpt = declarationRepository.findById(declarationId);
        if (declOpt.isPresent()) {
            declarationCost = declOpt.get().getCoutProbleme();
        }

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("declarationId", declarationId);
        result.put("budgetTotal", budgetTotal);
        result.put("budgetUtilise", budgetDetails.get("budgetUtilise"));
        result.put("budgetRestant", budgetRestant);
        result.put("coutDeclaration", declarationCost);
        result.put("suffisant", declarationCost == null || declarationCost <= budgetRestant);
        result.put("pourcentageUtilise", budgetTotal > 0 ? Math.round(((Double) budgetDetails.get("budgetUtilise") / budgetTotal) * 100.0) : 0);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/budget/decision/{declarationId}")
    public ResponseEntity<?> makeBudgetDecision(@PathVariable Long declarationId, @RequestBody Map<String, String> request) {
        String decision = request.get("decision");
        String motif = request.get("motif");

        var declOpt = declarationRepository.findById(declarationId);
        if (declOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Déclaration non trouvée"));
        }

        DeclarationIncident decl = declOpt.get();
        String decisionLower = (decision != null) ? decision.toLowerCase() : "";

        switch (decisionLower) {
            case "approuver":
                decl.setStatut("APPROUVEE");
                break;
            case "rejeter":
                decl.setStatut("REJETEE");
                if (motif != null) {
                    decl.setMotifRefus(motif);
                }
                break;
            case "différer":
                decl.setStatut("DIFFEREE");
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Décision invalide. Utiliser: approuver, rejeter, ou différer"));
        }

        declarationRepository.save(decl);

        AuditLog audit = new AuditLog();
        audit.setEntityType("DECLARATION");
        audit.setEntityId(declarationId);
        audit.setAction("BUDGET_" + decisionLower.toUpperCase());
        audit.setDetails("Décision budget: " + decision + " pour déclaration " + declarationId + (motif != null ? " — Motif: " + motif : ""));
        audit.setTimestamp(java.time.LocalDateTime.now());
        auditLogRepository.save(audit);

        return ResponseEntity.ok(Map.of(
            "message", "Décision " + decision + " enregistrée",
            "declarationId", declarationId,
            "nouveauStatut", decl.getStatut()
        ));
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportDeclarationsExcel() {
        try {
            List<DeclarationIncident> declarations = declarationRepository.findAll();
            byte[] excelData = excelService.exportToExcel(declarations);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "declarations_export.xlsx");
            headers.setContentLength(excelData.length);

            return ResponseEntity.ok().headers(headers).body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/powerbi")
    public ResponseEntity<Map<String, Object>> getPowerBIReport() {
        Map<String, Object> stats = declarationService.getStats();
        Map<String, Object> budgetDetails = budgetService.getBudgetDetails();

        Map<String, Object> report = new java.util.LinkedHashMap<>();
        report.put("stats", stats);
        report.put("budget", budgetDetails);
        report.put("checklists", Map.of(
            "total", checklistService.findAll().size(),
            "nonConformes", checklistService.findNonConformes().size(),
            "blockedVehicles", checklistService.findBlockedVehicules().size()
        ));
        report.put("generatedAt", java.time.LocalDateTime.now().toString());

        return ResponseEntity.ok(report);
    }

    @PostMapping("/relancer/{declarationId}")
    public ResponseEntity<?> relancerDeclaration(@PathVariable Long declarationId) {
        var declOpt = declarationRepository.findById(declarationId);
        if (declOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Déclaration non trouvée"));
        }

        DeclarationIncident decl = declOpt.get();
        decl.setStatut("EN_ATTENTE");
        declarationRepository.save(decl);

        AuditLog audit = new AuditLog();
        audit.setEntityType("DECLARATION");
        audit.setEntityId(declarationId);
        audit.setAction("RELANCER");
        audit.setDetails("Déclaration relancée — ID: " + declarationId);
        audit.setTimestamp(java.time.LocalDateTime.now());
        auditLogRepository.save(audit);

        String subject = "Relance — Déclaration " + decl.getNumeroDemande();
        String message = "La déclaration " + decl.getNumeroDemande() + " pour le véhicule " + decl.getVehiculeImmatriculation() + " a été relancée par l'administration.";
        emailNotificationService.sendAlertLD(subject, message);

        return ResponseEntity.ok(Map.of(
            "message", "Relance envoyée avec succès",
            "declarationId", declarationId,
            "nouveauStatut", "EN_ATTENTE"
        ));
    }

    @PostMapping("/escalader/{declarationId}")
    public ResponseEntity<?> escaladerDeclaration(@PathVariable Long declarationId, @RequestBody(required = false) Map<String, String> body) {
        var declOpt = declarationRepository.findById(declarationId);
        if (declOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Déclaration non trouvée"));
        }

        DeclarationIncident decl = declOpt.get();
        String motifEscalade = (body != null && body.get("motif") != null) ? body.get("motif") : "Escalade administrative";
        decl.setCriticite("CRITIQUE");
        decl.setStatut("ESCALEE");
        declarationRepository.save(decl);

        AuditLog audit = new AuditLog();
        audit.setEntityType("DECLARATION");
        audit.setEntityId(declarationId);
        audit.setAction("ESCALADER");
        audit.setDetails("Déclaration escaladée — Motif: " + motifEscalade);
        audit.setTimestamp(java.time.LocalDateTime.now());
        auditLogRepository.save(audit);

        String subject = "ESCALADE CRITIQUE — Déclaration " + decl.getNumeroDemande();
        String message = "La déclaration " + decl.getNumeroDemande() + " pour le véhicule " + decl.getVehiculeImmatriculation() + " a été escaladée. Motif: " + motifEscalade;
        emailNotificationService.sendAlertCritical(subject, message);

        return ResponseEntity.ok(Map.of(
            "message", "Incident escaladé avec succès",
            "declarationId", declarationId,
            "criticite", "CRITIQUE",
            "statut", "ESCALEE"
        ));
    }
}