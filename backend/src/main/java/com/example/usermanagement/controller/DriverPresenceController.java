package com.example.usermanagement.controller;

import com.example.usermanagement.model.DriverPresence;
import com.example.usermanagement.model.User;
import com.example.usermanagement.repository.DriverPresenceRepository;
import com.example.usermanagement.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/driver-presence")
@CrossOrigin(origins = "*")
public class DriverPresenceController {

    private final DriverPresenceRepository presenceRepository;
    private final UserService userService;

    public DriverPresenceController(DriverPresenceRepository presenceRepository, UserService userService) {
        this.presenceRepository = presenceRepository;
        this.userService = userService;
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> body) {
        String matricule = body.get("matricule");
        if (matricule == null || matricule.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Matricule requis"));
        }
        Optional<User> userOpt = userService.getUserByPersonCode(matricule);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Aucun chauffeur trouvé avec ce matricule"));
        }
        User driver = userOpt.get();
        Optional<DriverPresence> active = presenceRepository
                .findFirstByChauffeurIdAndStatutOrderByCheckInTimeDesc(driver.getId(), "PRESENT");
        if (active.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true, "message", "Déjà enregistré",
                "presence", active.get(),
                "driver", Map.of("id", driver.getId(), "matricule", driver.getPersonCode(),
                    "name", driver.getName(), "firstname", driver.getFirstname(),
                    "email", driver.getEmail(), "branchCode", driver.getBranchCode())
            ));
        }
        DriverPresence presence = new DriverPresence(driver.getId(), driver.getPersonCode(),
                driver.getFirstname() + " " + driver.getName(), "QR_SCAN");
        presenceRepository.save(presence);
        return ResponseEntity.ok(Map.of(
            "success", true, "message", "Présence enregistrée",
            "presence", presence,
            "driver", Map.of("id", driver.getId(), "matricule", driver.getPersonCode(),
                "name", driver.getName(), "firstname", driver.getFirstname(),
                "email", driver.getEmail(), "branchCode", driver.getBranchCode())
        ));
    }

    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@RequestBody Map<String, Long> body) {
        Long chauffeurId = body.get("chauffeurId");
        if (chauffeurId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "chauffeurId requis"));
        }
        Optional<DriverPresence> active = presenceRepository
                .findFirstByChauffeurIdAndStatutOrderByCheckInTimeDesc(chauffeurId, "PRESENT");
        if (active.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Aucune présence active"));
        }
        DriverPresence p = active.get();
        p.setStatut("DEPART");
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        p.setCheckOutTime(now);
        presenceRepository.save(p);
        return ResponseEntity.ok(Map.of("success", true, "message", "Départ enregistré", "presence", p));
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodayPresences() {
        java.time.LocalDateTime start = java.time.LocalDate.now().atStartOfDay();
        java.time.LocalDateTime end = start.plusDays(1);
        List<DriverPresence> list = presenceRepository.findByCheckInTimeBetweenOrderByCheckInTimeDesc(start, end);
        return ResponseEntity.ok(Map.of("success", true, "presences", list));
    }

    @GetMapping("/chauffeur/{chauffeurId}")
    public ResponseEntity<?> getPresencesByDriver(@PathVariable Long chauffeurId) {
        List<DriverPresence> list = presenceRepository.findByChauffeurIdOrderByCheckInTimeDesc(chauffeurId);
        return ResponseEntity.ok(Map.of("success", true, "presences", list));
    }

    @GetMapping("/active/{chauffeurId}")
    public ResponseEntity<?> getActivePresence(@PathVariable Long chauffeurId) {
        Optional<DriverPresence> active = presenceRepository
                .findFirstByChauffeurIdAndStatutOrderByCheckInTimeDesc(chauffeurId, "PRESENT");
        return ResponseEntity.ok(Map.of("active", active.isPresent(), "presence", active.orElse(null)));
    }
}
