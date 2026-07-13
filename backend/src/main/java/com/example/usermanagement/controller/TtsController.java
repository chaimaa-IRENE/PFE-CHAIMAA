package com.example.usermanagement.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/tts")
@CrossOrigin(origins = "*")
public class TtsController {

    private static final Logger logger = LoggerFactory.getLogger(TtsController.class);

    @Value("${tts.python.path:python}")
    private String pythonPath;

    @Value("${tts.script.path:C:/Users/EmsiC/Desktop/mon-projet/backend/tts_temp/tts_server.py}")
    private String ttsScriptPath;

    @Value("${tts.voice:ar-MA-JamalNeural}")
    private String defaultVoice;

    @Value("${tts.rate:-5pct}")
    private String defaultRate;

    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();

    @GetMapping("/speak")
    public ResponseEntity<Resource> speak(
            @RequestParam String text,
            @RequestParam(defaultValue = "") String voice,
            @RequestParam(defaultValue = "") String rate) {

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String v = voice.isBlank() ? defaultVoice : voice;
        String r = rate.isBlank() ? defaultRate : rate;

        try {
            String hash = md5(text + "|" + v + "|" + r);

            locks.putIfAbsent(hash, new Object());
            synchronized (locks.get(hash)) {
                TtsResult result = callTtsScript(text, v, r, hash);
                if (result.error != null) {
                    logger.error("TTS error: {}", result.error);
                    locks.remove(hash);
                    return ResponseEntity.internalServerError()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(new org.springframework.core.io.ByteArrayResource(
                                    ("{\"error\":\"" + result.error.replace("\"", "'") + "\"}").getBytes(StandardCharsets.UTF_8)));
                }
                File audioFile = result.file;
                if (audioFile == null || !audioFile.exists() || audioFile.length() == 0) {
                    String errMsg = "TTS produced no audio file";
                    logger.error(errMsg);
                    locks.remove(hash);
                    return ResponseEntity.internalServerError()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(new org.springframework.core.io.ByteArrayResource(
                                    ("{\"error\":\"" + errMsg + "\"}").getBytes(StandardCharsets.UTF_8)));
                }

                locks.remove(hash);
                Resource resource = new FileSystemResource(audioFile);
                return ResponseEntity.ok()
                        .contentType(MediaType.valueOf("audio/mpeg"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + hash + ".mp3\"")
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                        .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                        .body(resource);
            }
        } catch (Exception e) {
            logger.error("TTS error", e);
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new org.springframework.core.io.ByteArrayResource(
                            ("{\"error\":\"" + e.getClass().getSimpleName() + ": " + e.getMessage().replace("\"", "'") + "\"}").getBytes(StandardCharsets.UTF_8)));
        }
    }

    private static class TtsResult {
        File file;
        String error;
        TtsResult(File f, String e) { file = f; error = e; }
    }

    private TtsResult callTtsScript(String text, String voice, String rate, String hash) {
        try {
            File scriptFile = new File(ttsScriptPath);
            if (!scriptFile.exists()) {
                return new TtsResult(null, "Script not found: " + ttsScriptPath);
            }

        ProcessBuilder pb = new ProcessBuilder("cmd", "/c", pythonPath, ttsScriptPath, text, voice, rate);
        pb.redirectErrorStream(true);
        pb.environment().put("PYTHONIOENCODING", "utf-8");
        pb.environment().put("PYTHONUTF8", "1");

        logger.info("TTS: cmd /c {} {} {} {} {}", pythonPath, ttsScriptPath, text.substring(0, Math.min(20, text.length())), voice, rate);

        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
        }

        int exitCode = process.waitFor();
        String resultStr = output.toString().trim();

        if (exitCode != 0) {
            logger.error("TTS process exited with code {}: {}", exitCode, resultStr);
            return new TtsResult(null, "TTS process exit code " + exitCode + ": " + resultStr);
        }

        logger.info("TTS result: {}", resultStr);

        int pathIdx = resultStr.indexOf("\"path\":");
        if (pathIdx < 0) {
            logger.error("TTS: no path in output: {}", resultStr);
            return new TtsResult(null, "No path in TTS output: " + resultStr);
        }

        int start = resultStr.indexOf("\"", pathIdx + 7) + 1;
        int end = resultStr.indexOf("\"", start);
        if (start <= 0 || end <= start) {
            logger.error("TTS: cannot parse path from: {}", resultStr);
            return new TtsResult(null, "Cannot parse TTS path: " + resultStr);
        }

        String generatedPath = resultStr.substring(start, end);
        File generatedFile = new File(generatedPath);

        logger.info("TTS: generated file {} exists={} size={}", generatedPath, generatedFile.exists(),
                generatedFile.exists() ? generatedFile.length() : 0);

        if (!generatedFile.exists() || generatedFile.length() == 0) {
            logger.error("TTS: generated file missing or empty: {}", generatedPath);
            return new TtsResult(null, "TTS file missing or empty: " + generatedPath);
        }

        return new TtsResult(generatedFile, null);
        } catch (Exception e) {
            logger.error("TTS exception", e);
            return new TtsResult(null, e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }
}