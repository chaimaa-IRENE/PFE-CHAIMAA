package com.example.usermanagement.controller;

import com.example.usermanagement.dto.SpeechToTextResponse;
import com.example.usermanagement.service.SpeechService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech-to-text")
@CrossOrigin(origins = "*")
public class SpeechToTextController {
    private final SpeechService speechService;

    public SpeechToTextController(SpeechService speechService) {
        this.speechService = speechService;
    }

    @PostMapping
    public ResponseEntity<SpeechToTextResponse> transcrire(@RequestParam("audio") MultipartFile audio, @RequestParam("lang") Integer lang) {
        try {
            return ResponseEntity.ok(speechService.transcrire(audio, lang));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
