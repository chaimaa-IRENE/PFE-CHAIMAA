package com.example.usermanagement.controller;

import com.example.usermanagement.model.GeotabConfig;
import com.example.usermanagement.model.GeotabSyncLog;
import com.example.usermanagement.repository.GeotabConfigRepository;
import com.example.usermanagement.repository.GeotabSyncLogRepository;
import com.example.usermanagement.service.MyGeotabService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geotab")
@CrossOrigin(origins = "*")
public class GeotabController {

    private final MyGeotabService myGeotabService;
    private final GeotabConfigRepository configRepository;
    private final GeotabSyncLogRepository syncLogRepository;

    public GeotabController(MyGeotabService myGeotabService,
                            GeotabConfigRepository configRepository,
                            GeotabSyncLogRepository syncLogRepository) {
        this.myGeotabService = myGeotabService;
        this.configRepository = configRepository;
        this.syncLogRepository = syncLogRepository;
    }

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        var config = configRepository.findAll();
        if (config.isEmpty()) return ResponseEntity.ok(Map.of("success", true, "configured", false));
        GeotabConfig c = config.get(0);
        Map<String, Object> masked = new LinkedHashMap<>();
        masked.put("id", c.getId());
        masked.put("database", c.getDatabase());
        masked.put("username", c.getUsername());
        masked.put("password", "***");
        masked.put("serveur", c.getServeur());
        masked.put("syncIntervalMs", c.getSyncIntervalMs());
        masked.put("actif", c.getActif());
        masked.put("dernierSync", c.getDernierSync());
        masked.put("dernierStatut", c.getDernierStatut());
        masked.put("derniereErreur", c.getDerniereErreur());
        return ResponseEntity.ok(Map.of("success", true, "configured", true, "config", masked));
    }

    @PostMapping("/config")
    public ResponseEntity<?> saveConfig(@RequestBody GeotabConfig config) {
        var existing = configRepository.findAll();
        GeotabConfig c;
        if (existing.isEmpty()) {
            c = new GeotabConfig();
        } else {
            c = existing.get(0);
        }
        c.setDatabase(config.getDatabase());
        c.setUsername(config.getUsername());
        if (config.getPassword() != null && !config.getPassword().isBlank()
            && !"***".equals(config.getPassword())) {
            c.setPassword(config.getPassword());
        }
        if (config.getServeur() != null) c.setServeur(config.getServeur());
        if (config.getSyncIntervalMs() != null) c.setSyncIntervalMs(config.getSyncIntervalMs());
        if (config.getActif() != null) c.setActif(config.getActif());
        configRepository.save(c);
        return ResponseEntity.ok(Map.of("success", true, "message", "Configuration sauvegardee"));
    }

    @PostMapping("/sync")
    public ResponseEntity<?> triggerSync() {
        GeotabSyncLog log = myGeotabService.syncAll();
        boolean success = "SUCCESS".equals(log.getStatut());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", success);
        result.put("statut", log.getStatut());
        result.put("nbVehicules", log.getNbVehicules());
        result.put("nbPositions", log.getNbPositions());
        result.put("nbAnomalies", log.getNbAnomalies());
        result.put("messageErreur", log.getMessageErreur());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        var config = configRepository.findTopByActifTrue();
        List<GeotabSyncLog> logs = syncLogRepository.findTop20ByOrderByDateDebutDesc();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("configActif", config.isPresent() && Boolean.TRUE.equals(config.get().getActif()));
        result.put("dernierSync", config.isPresent() ? config.get().getDernierSync() : null);
        result.put("dernierStatut", config.isPresent() ? config.get().getDernierStatut() : null);
        result.put("derniereErreur", config.isPresent() ? config.get().getDerniereErreur() : null);
        result.put("logs", logs);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/live")
    public ResponseEntity<?> getLiveData() {
        return ResponseEntity.ok(Map.of("success", true, "data", myGeotabService.getLiveData()));
    }
}
