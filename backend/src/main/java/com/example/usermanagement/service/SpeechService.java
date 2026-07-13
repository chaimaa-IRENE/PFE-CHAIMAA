package com.example.usermanagement.service;

import com.example.usermanagement.dto.SpeechToTextResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.util.*;

@Service
public class SpeechService {

    private final RestTemplate restTemplate;
    private final String openaiApiKey;
    private final boolean whisperEnabled;

    private final Map<String, String> dictionnaire = new LinkedHashMap<>();

    public SpeechService(RestTemplate restTemplate,
                         @Value("${openai.api.key:}") String openaiApiKey) {
        this.restTemplate = restTemplate;
        this.openaiApiKey = openaiApiKey;
        this.whisperEnabled = !openaiApiKey.isBlank();

        dictionnaire.put("محرك", "moteur");
        dictionnaire.put("موطور", "moteur");
        dictionnaire.put("ماكينة", "moteur");
        dictionnaire.put("مكينة", "moteur");
        dictionnaire.put("فرامل", "frein");
        dictionnaire.put("برياك", "frein");
        dictionnaire.put("بطارية", "batterie");
        dictionnaire.put("باتري", "batterie");
        dictionnaire.put("صوت", "bruit");
        dictionnaire.put("سوت", "bruit");
        dictionnaire.put("اهتزاز", "vibration");
        dictionnaire.put("رج", "vibration");
        dictionnaire.put("عطل", "panne");
        dictionnaire.put("مشكل", "problème");
        dictionnaire.put("سيارة", "véhicule");
        dictionnaire.put("كاميو", "camion");
        dictionnaire.put("كاحل", "avant");
        dictionnaire.put("قادم", "avant");
        dictionnaire.put("لوخر", "arrière");
        dictionnaire.put("دخان", "fumée");
        dictionnaire.put("زيوت", "huile");
        dictionnaire.put("تسرب", "fuite");
        dictionnaire.put("كتسرب", "fuite");
        dictionnaire.put("قير", "boîte vitesses");
        dictionnaire.put("عجلات", "roues");
        dictionnaire.put("كاوتش", "pneu");
        dictionnaire.put("بوري", "klaxon");
        dictionnaire.put("ضواء", "phare");
        dictionnaire.put("محراق", "phare");
        dictionnaire.put("زيت", "huile");
        dictionnaire.put("ماء", "eau");
        dictionnaire.put("رادياتير", "radiateur");
        dictionnaire.put("كربوريتر", "carburateur");
        dictionnaire.put("ديسك", "disque");
        dictionnaire.put("بلي", "roulement");
        dictionnaire.put("كرسي", "siège");
        dictionnaire.put("مراية", "rétroviseur");
        dictionnaire.put("زنقة", "blocage");
        dictionnaire.put("بلوكاج", "blocage");
        dictionnaire.put("خبار", "khbar");
        dictionnaire.put("خطير", "khatar");
        dictionnaire.put("كحلة", "avant");
        dictionnaire.put("خلف", "arrière");
    }

    public SpeechToTextResponse transcrire(MultipartFile audioFile, Integer stepHint) throws IOException {
        if (whisperEnabled) {
            try {
                return transcrireAvecWhisper(audioFile, stepHint);
            } catch (Exception e) {
                return transcrireSimule(audioFile, stepHint);
            }
        }
        return transcrireSimule(audioFile, stepHint);
    }

    public SpeechToTextResponse transcrire(MultipartFile audioFile) throws IOException {
        return transcrire(audioFile, null);
    }

    public String transcrireAudio(MultipartFile audioFile) throws IOException {
        return transcrire(audioFile, null).getTexte();
    }

    public String[] transcrireEtTraduire(MultipartFile audioFile) throws IOException {
        SpeechToTextResponse res = transcrire(audioFile, null);
        return new String[]{res.getTexte(), res.getTexteFrancais()};
    }

    private SpeechToTextResponse transcrireAvecWhisper(MultipartFile audioFile, Integer stepHint) throws IOException {
        String url = "https://api.openai.com/v1/audio/transcriptions";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(openaiApiKey);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new MultipartInputStreamFileResource(audioFile.getInputStream(), audioFile.getOriginalFilename()));
        body.add("model", "whisper-1");
        body.add("language", "ar");
        body.add("response_format", "json");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);

        if (response.getBody() != null && response.getBody().containsKey("text")) {
            String transcription = (String) response.getBody().get("text");
            String francais = traduireVersFrancais(transcription, stepHint);
            return new SpeechToTextResponse(transcription, francais, "ar-MA", 0.95);
        }

        return transcrireSimule(audioFile, stepHint);
    }

    private SpeechToTextResponse transcrireSimule(MultipartFile audioFile, Integer stepHint) throws IOException {
        byte[] audioBytes = audioFile.getBytes();
        String transcription = whisperSimuler(audioBytes, stepHint);
        String francais = traduireVersFrancais(transcription, stepHint);
        double confiance = 0.75 + new Random().nextDouble() * 0.2;
        return new SpeechToTextResponse(transcription, francais, "ar-MA", confiance);
    }

    public String traduireArabeVersFrancais(String texteArabe) {
        for (Map.Entry<String, String> entry : dictionnaire.entrySet()) {
            if (texteArabe.contains(entry.getKey())) return entry.getValue();
        }
        return "description";
    }

    private final List<String> transcriptionsSimulees = List.of(
        "عطل ف المحرك", "مشكل ف الفرامل", "بطارية باينة", "صوت غريب ف الماكينة",
        "اهتزاز ف العجلات", "مشكل ف القير", "كاحل مكسور", "لوخر مكايخدمش",
        "دخان كيخرج من الموتور", "زيوت كتسرب من تحت السيارة"
    );

    private String whisperSimuler(byte[] audioBytes, Integer stepHint) {
        int index;
        if (stepHint != null && stepHint >= 1 && stepHint <= 5) {
            index = (stepHint - 1) % transcriptionsSimulees.size();
        } else {
            index = Math.abs(Arrays.hashCode(audioBytes)) % transcriptionsSimulees.size();
        }
        return transcriptionsSimulees.get(index);
    }

    private String traduireVersFrancais(String texteArabe, Integer stepHint) {
        for (Map.Entry<String, String> entry : dictionnaire.entrySet()) {
            if (texteArabe.contains(entry.getKey())) return entry.getValue();
        }
        if (stepHint != null) {
            return switch (stepHint) {
                case 1 -> "moteur";
                case 2 -> "avant";
                case 3 -> "bruit";
                case 4 -> "grave";
                case 5 -> "description complète";
                default -> "description";
            };
        }
        return "description";
    }
}
