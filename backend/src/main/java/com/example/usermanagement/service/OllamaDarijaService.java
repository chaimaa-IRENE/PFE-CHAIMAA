package com.example.usermanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OllamaDarijaService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String ollamaUrl;
    private final String model;
    private final boolean enabled;

    public OllamaDarijaService(@Value("${ollama.url:http://localhost:11434}") String ollamaUrl,
                               @Value("${ollama.model:llama3.1:8b}") String model,
                               @Value("${ollama.enabled:true}") boolean enabled) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(requestFactory);
        this.objectMapper = new ObjectMapper();
        this.ollamaUrl = ollamaUrl;
        this.model = model;
        this.enabled = enabled;
    }

    public Optional<String> extractField(String field, String text, List<String> allowedValues) {
        if (!enabled || text == null || text.isBlank() || allowedValues == null || allowedValues.isEmpty()) {
            return Optional.empty();
        }

        try {
            String prompt = """
                You are a Moroccan Darija NLP extraction engine for a fleet incident declaration system.
                Understand Moroccan Darija written in Latin, Arabic script, French, and mixed speech.
                Extract the value for field: %s.
                Allowed values: %s.
                Driver answer: %s

                Rules:
                - Return ONLY one compact JSON object.
                - Choose exactly one allowed value.
                - If uncertain, choose the closest allowed value.
                - JSON format: {"value":"allowed_value","confidence":0.0}
                """.formatted(field, allowedValues, text);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("prompt", prompt);
            body.put("stream", false);
            body.put("options", Map.of("temperature", 0.0, "num_predict", 80));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map> response = restTemplate.postForEntity(ollamaUrl + "/api/generate", new HttpEntity<>(body, headers), Map.class);
            Object raw = response.getBody() != null ? response.getBody().get("response") : null;
            if (raw == null) return Optional.empty();

            String generated = raw.toString().trim();
            String json = extractJson(generated);
            JsonNode node = objectMapper.readTree(json);
            String value = node.path("value").asText("").trim();

            return allowedValues.stream()
                .filter(v -> v.equalsIgnoreCase(value))
                .findFirst();
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    public boolean isAvailable() {
        if (!enabled) return false;
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(ollamaUrl + "/api/tags", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) return text.substring(start, end + 1);
        return text;
    }
}
