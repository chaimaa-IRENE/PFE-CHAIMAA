package com.example.usermanagement.controller;

import com.example.usermanagement.service.VoiceDeclarationAgentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/voice-agent")
@CrossOrigin(origins = "*")
public class VoiceDeclarationAgentController {

    private final VoiceDeclarationAgentService agentService;

    public VoiceDeclarationAgentController(VoiceDeclarationAgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@RequestBody Map<String, Object> body) {
        Long chauffeurId = body.get("chauffeurId") != null ? Long.parseLong(body.get("chauffeurId").toString()) : null;
        String chauffeurNom = (String) body.getOrDefault("chauffeurNom", "Chauffeur");
        String chauffeurMatricule = (String) body.getOrDefault("chauffeurMatricule", "");

        Map<String, Object> response = agentService.startSession(chauffeurId, chauffeurNom, chauffeurMatricule);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/respond")
    public ResponseEntity<?> processResponse(@RequestBody Map<String, Object> body) {
        String sessionId = (String) body.get("sessionId");
        Integer step = body.get("step") != null ? Integer.parseInt(body.get("step").toString()) : 1;
        String userResponse = (String) body.get("response");

        if (sessionId == null || sessionId.isEmpty()) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "Session ID requis");
            return ResponseEntity.badRequest().body(err);
        }

        Map<String, Object> response = agentService.processResponse(sessionId, step, userResponse);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getSession(@PathVariable String sessionId) {
        Map<String, Object> response = agentService.getSession(sessionId);
        if (response.containsKey("error")) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/session/{sessionId}/step")
    public ResponseEntity<?> updateStep(@PathVariable String sessionId, @RequestBody Map<String, Object> body) {
        Integer step = body.get("step") != null ? Integer.parseInt(body.get("step").toString()) : 1;
        String field = (String) body.get("field");
        String value = (String) body.get("value");

        Map<String, Object> response = agentService.updateStep(sessionId, step, field, value);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/steps")
    public ResponseEntity<?> getSteps() {
        List<Map<String, Object>> steps = new ArrayList<>();
        for (var step : VoiceDeclarationAgentService.STEPS) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("number", step.number);
            s.put("field", step.field);
            s.put("questionDarija", step.questionDarija);
            s.put("questionFrancais", step.questionFrancais);
            s.put("questionArabic", step.questionArabic);
            s.put("required", step.required);
            steps.add(s);
        }
        return ResponseEntity.ok(steps);
    }

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribeAudio(@RequestBody Map<String, Object> body) {
        String text = (String) body.getOrDefault("text", "");
        String field = (String) body.getOrDefault("field", "");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("originalText", text);
        response.put("field", field);
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}