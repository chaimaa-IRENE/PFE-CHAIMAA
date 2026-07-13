package com.example.usermanagement.controller;

import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.service.DeclarationService;
import com.example.usermanagement.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/declarations")
@CrossOrigin(origins = "*")
public class PhotoUploadController {

    private final DeclarationService declarationService;
    private final FileStorageService fileStorageService;
    private final RestTemplate restTemplate;
    private final String PYTHON_SERVICE_URL = "http://localhost:5001/api";

    public PhotoUploadController(DeclarationService declarationService, FileStorageService fileStorageService) {
        this.declarationService = declarationService;
        this.fileStorageService = fileStorageService;
        this.restTemplate = new RestTemplate();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callPythonAnalysis(MultipartFile file, String endpoint) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                PYTHON_SERVICE_URL + "/" + endpoint, requestEntity, Map.class);

            if (response.getBody() != null && Boolean.TRUE.equals(response.getBody().get("success"))) {
                return (Map<String, Object>) response.getBody().get("analysis");
            }
        } catch (Exception e) {
            System.err.println("[PhotoUpload] Python IA unreachable for " + endpoint + ": " + e.getMessage());
        }
        return null;
    }

    private Map<String, Object> buildFallbackAnalysis(String filename, String source, String description, boolean isVideo) {
        Map<String, Object> mapped = new LinkedHashMap<>();
        mapped.put("elementVehicule", "CAISSE");
        mapped.put("detailElement", isVideo ? "video_incident" : "photo_incident");
        mapped.put("categorie", "MECANIQUE");
        mapped.put("criticite", "NON_BLOQUANT");
        mapped.put("description", description);
        mapped.put("typePanne", "MECANIQUE");
        mapped.put("plaqueDetectee", "");
        mapped.put("immatriculation", "");
        mapped.put("kilometrage", 0);
        mapped.put("source", source);
        mapped.put("lieu", "");

        Map<String, Object> analysis = new LinkedHashMap<>();
        analysis.put("imageId", filename);
        analysis.put("detections", List.of(Map.of("label", isVideo ? "video_incident" : "vehicule", "confidence", 0.85)));
        analysis.put("clipDescription", description);
        analysis.put("ocrTexts", List.of());
        analysis.put("mapped", mapped);
        analysis.put("confidence", Map.of(
            "elementVehicule", Map.of("value", "CAISSE", "confidence", 0.3),
            "typePanne", Map.of("value", "MECANIQUE", "confidence", 0.3),
            "criticite", Map.of("value", "NON_BLOQUANT", "confidence", 0.3)
        ));
        if (isVideo) {
            analysis.put("video_info", Map.of("note", "Python IA indisponible - analyse de secours"));
        }
        return analysis;
    }

    private Map<String, Object> buildDeclarationMap(DeclarationIncident dec, String location, String userName,
                                                      Map<String, Object> analysis, boolean isVideo) {
        Map<String, Object> mapped = (Map<String, Object>) analysis.getOrDefault("mapped", Map.of());
        Map<String, Object> declMap = new LinkedHashMap<>();

        String plaque = getStr(mapped, "immatriculation");
        if (plaque == null || plaque.isEmpty()) plaque = getStr(mapped, "plaqueDetectee");
        if (plaque == null || plaque.isEmpty()) plaque = dec.getVehiculeImmatriculation() != null ? dec.getVehiculeImmatriculation() : "";

        int km = getInt(mapped, "kilometrage");
        String elemVeh = getStr(mapped, "elementVehicule") != null ? getStr(mapped, "elementVehicule") : (dec.getElementVehicule() != null ? dec.getElementVehicule() : "");
        String detailElem = getStr(mapped, "detailElement") != null ? getStr(mapped, "detailElement") : (dec.getDetailElement() != null ? dec.getDetailElement() : "");
        String cat = getStr(mapped, "categorie") != null ? getStr(mapped, "categorie") : (dec.getCategorie() != null ? dec.getCategorie() : "");
        String typePanne = getStr(mapped, "typePanne") != null ? getStr(mapped, "typePanne") : (dec.getTypePanne() != null ? dec.getTypePanne() : "");
        String criticite = getStr(mapped, "criticite") != null ? getStr(mapped, "criticite") : (dec.getCriticite() != null ? dec.getCriticite() : "NON_BLOQUANT");
        String desc = getStr(mapped, "description") != null ? getStr(mapped, "description") : (dec.getDescriptionFrancais() != null ? dec.getDescriptionFrancais() : "");
        String src = getStr(mapped, "source") != null ? getStr(mapped, "source") : (isVideo ? "Check-up vidéo" : "Photo IA");
        String lieu = getStr(mapped, "lieu") != null ? getStr(mapped, "lieu") : (location != null ? location : "");

        declMap.put("id", dec.getIdIncident());
        declMap.put("numeroDeclaration", dec.getNumeroDemande());
        declMap.put("statut", dec.getStatut());
        declMap.put("descriptionFrancais", desc);
        declMap.put("criticite", criticite);
        declMap.put("source", src);
        declMap.put("elementVehicule", elemVeh);
        declMap.put("detailElement", detailElem);
        declMap.put("categorie", cat);
        declMap.put("typePanne", typePanne);
        declMap.put("vehiculeImmatriculation", plaque);
        declMap.put("kilometrage", km);
        declMap.put("location", lieu);
        declMap.put("chauffeurNom", userName != null ? userName : "");
        declMap.put("dateDeclaration", dec.getDateHeure() != null ? dec.getDateHeure().toString() : LocalDateTime.now().toString());

        List<String> missing = new ArrayList<>();
        if (plaque.isEmpty()) missing.add("immatriculation");
        if (km == 0) missing.add("kilometrage");

        declMap.put("missingFields", missing);
        if (!missing.isEmpty()) {
            String darijaMsg = missing.contains("immatriculation") ? "شحال كيلوميتراج؟ عطني رقم الطونوبيل" : "عطني الكيلوميتراج";
            declMap.put("darijaMessage", darijaMsg);
        }

        return declMap;
    }

    private ResponseEntity<?> handleAnalyze(MultipartFile file, Long userId, String userName, String location,
                                              Double gpsLat, Double gpsLon, boolean isVideo,
                                              String headerImmat, String headerKm) {
        try {
            String filename = fileStorageService.store(file);
            String numero = declarationService.generateRequestNumber();
            String source = isVideo ? "Check-up vidéo" : "Photo IA";
            String descPrefix = isVideo ? "Analyse vidéo IA : " : "Analyse photo IA : ";

            String endpoint = isVideo ? "analyze-video" : "analyze-image";
            Map<String, Object> analysis = callPythonAnalysis(file, endpoint);
            if (analysis == null) {
                analysis = buildFallbackAnalysis(filename, source, descPrefix + file.getOriginalFilename(), isVideo);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> mapped = (Map<String, Object>) analysis.getOrDefault("mapped", Map.of());

            String plaque = getStr(mapped, "immatriculation");
            if (plaque == null || plaque.isEmpty()) plaque = getStr(mapped, "plaqueDetectee");
            if (plaque == null) plaque = "";
            if ((plaque.isEmpty()) && headerImmat != null && !headerImmat.isEmpty()) {
                plaque = headerImmat;
            }

            int km = getInt(mapped, "kilometrage");
            if (km <= 0 && headerKm != null && !headerKm.isEmpty()) {
                try { km = Integer.parseInt(headerKm); } catch (NumberFormatException ignored) {}
            }

            System.out.println("[PhotoUpload] Python analysis mapped: " + mapped);
            System.out.println("[PhotoUpload] plaque='" + plaque + "' km=" + km + " headerImmat='" + headerImmat + "' headerKm='" + headerKm + "'");
            String criticite = getStr(mapped, "criticite") != null ? getStr(mapped, "criticite") : "NON_BLOQUANT";
            String element = getStr(mapped, "elementVehicule") != null ? getStr(mapped, "elementVehicule") : "";
            String detailElem = getStr(mapped, "detailElement") != null ? getStr(mapped, "detailElement") : "";
            String categorie = getStr(mapped, "categorie") != null ? getStr(mapped, "categorie") : "";
            String typePanne = getStr(mapped, "typePanne") != null ? getStr(mapped, "typePanne") : "";
            String analysisDesc = getStr(analysis, "clipDescription") != null ? getStr(analysis, "clipDescription") : "";
            String description = !analysisDesc.isEmpty() ? analysisDesc : descPrefix + file.getOriginalFilename();
            String lieu = getStr(mapped, "lieu") != null ? getStr(mapped, "lieu") : (location != null ? location : "");

            DeclarationIncident dec = declarationService.createDeclaration(
                numero, LocalDateTime.now().toString(), typePanne,
                description, criticite,
                location != null ? location : "", lieu, userId, userName,
                km > 0 ? String.valueOf(km) : "", "", // kilometrage, vehiculeType
                null, null, // photo, video (stored via videoUrl)
                gpsLat, gpsLon, // latitude, longitude
                null, // vehiculeId
                plaque, // vehiculeImmatriculation
                "", "", // vehiculeMarque, vehiculeModele
                km > 0 ? String.valueOf(km) : "", // vehiculeKilometrage
                "", // vehiculeAgence
                null, null, null, null); // source, elementVehicule, detailElement, categorie

            if (isVideo) {
                declarationService.updateVideoUrl(dec.getIdIncident(), filename);
                dec.setVideoUrl(filename);
            }

            if (!plaque.isEmpty() || km > 0) {
                dec = declarationService.updateFieldsFromAI(
                    dec.getIdIncident(),
                    plaque.isEmpty() ? null : plaque,
                    km > 0 ? km : null,
                    element.isEmpty() ? null : element,
                    detailElem.isEmpty() ? null : detailElem,
                    categorie.isEmpty() ? null : categorie,
                    typePanne.isEmpty() ? null : typePanne,
                    criticite.isEmpty() ? null : criticite,
                    description,
                    source,
                    lieu.isEmpty() ? null : lieu
                );
            }

            Map<String, Object> declMap = buildDeclarationMap(dec, location, userName, analysis, isVideo);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("declaration", declMap);
            body.put("analysis", analysis);
            body.put("filename", filename);
            body.put("missingFields", declMap.get("missingFields"));
            body.put("darijaMessage", declMap.get("darijaMessage"));
            if (analysis.containsKey("confidence")) {
                body.put("confidence", analysis.get("confidence"));
            }
            if (isVideo && analysis.containsKey("video_info")) {
                body.put("videoInfo", analysis.get("video_info"));
            }
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            System.err.println("[PhotoUpload] Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/auto-analyze")
    public ResponseEntity<?> autoAnalyze(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Location", required = false) String location,
            @RequestHeader(value = "X-GPS-Lat", required = false) Double gpsLat,
            @RequestHeader(value = "X-GPS-Lon", required = false) Double gpsLon,
            @RequestHeader(value = "X-Immatriculation", required = false) String headerImmat,
            @RequestHeader(value = "X-Kilometrage", required = false) String headerKm) {
        return handleAnalyze(file, userId, userName, location, gpsLat, gpsLon, false, headerImmat, headerKm);
    }

    @PostMapping("/auto-analyze-video")
    public ResponseEntity<?> autoAnalyzeVideo(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Location", required = false) String location,
            @RequestHeader(value = "X-GPS-Lat", required = false) Double gpsLat,
            @RequestHeader(value = "X-GPS-Lon", required = false) Double gpsLon,
            @RequestHeader(value = "X-Immatriculation", required = false) String headerImmat,
            @RequestHeader(value = "X-Kilometrage", required = false) String headerKm) {
        return handleAnalyze(file, userId, userName, location, gpsLat, gpsLon, true, headerImmat, headerKm);
    }

    @PutMapping("/{id}/update-fields")
    public ResponseEntity<?> updateFields(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String immatriculation = body.get("immatriculation") != null ? (String) body.get("immatriculation") : null;
            Integer kilometrage = null;
            if (body.get("kilometrage") != null) {
                try { kilometrage = Integer.parseInt(String.valueOf(body.get("kilometrage"))); } catch (NumberFormatException ignored) {}
            }
            String elementVehicule = body.get("elementVehicule") != null ? (String) body.get("elementVehicule") : null;
            String detailElement = body.get("detailElement") != null ? (String) body.get("detailElement") : null;
            String categorie = body.get("categorie") != null ? (String) body.get("categorie") : null;
            String typePanne = body.get("typePanne") != null ? (String) body.get("typePanne") : null;
            String criticite = body.get("criticite") != null ? (String) body.get("criticite") : null;
            String description = body.get("description") != null ? (String) body.get("description") : null;
            String source = body.get("source") != null ? (String) body.get("source") : null;
            String lieu = body.get("lieu") != null ? (String) body.get("lieu") : null;

            DeclarationIncident dec = declarationService.updateFieldsFromAI(
                id, immatriculation, kilometrage, elementVehicule, detailElement,
                categorie, typePanne, criticite, description, source, lieu);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", dec.getIdIncident());
            result.put("numeroDeclaration", dec.getNumeroDemande());
            result.put("statut", dec.getStatut());
            result.put("descriptionFrancais", dec.getDescriptionFrancais());
            result.put("criticite", dec.getCriticite());
            result.put("source", dec.getSource());
            result.put("elementVehicule", dec.getElementVehicule());
            result.put("detailElement", dec.getDetailElement());
            result.put("categorie", dec.getCategorie());
            result.put("typePanne", dec.getTypePanne());
            result.put("vehiculeImmatriculation", dec.getVehiculeImmatriculation());
            result.put("kilometrage", dec.getKilometrage());
            result.put("location", dec.getLocation());
            result.put("chauffeurNom", dec.getChauffeurNom());
            result.put("dateDeclaration", dec.getDateHeure() != null ? dec.getDateHeure().toString() : "");
            result.put("missingFields", List.of());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    private String getStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private int getInt(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return 0; }
    }

    @PostMapping("/extract")
    public ResponseEntity<?> extractData(@RequestParam("file") MultipartFile file,
                                         @RequestHeader(value = "X-Extract-Type", required = false, defaultValue = "auto") String extractType) {
        try {
            String endpoint = "analyze-image";
            Map<String, Object> analysis = callPythonAnalysis(file, endpoint);
            if (analysis == null) {
                String filename = fileStorageService.store(file);
                analysis = buildFallbackAnalysis(filename, "Extraction IA", "Extraction " + extractType, false);
            }
            Map<String, Object> mapped = (Map<String, Object>) analysis.getOrDefault("mapped", Map.of());
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("immatriculation", getStr(mapped, "immatriculation"));
            result.put("plaqueDetectee", getStr(mapped, "plaqueDetectee"));
            result.put("kilometrage", getInt(mapped, "kilometrage"));
            result.put("elementVehicule", getStr(mapped, "elementVehicule"));
            result.put("detailElement", getStr(mapped, "detailElement"));
            result.put("categorie", getStr(mapped, "categorie"));
            result.put("typePanne", getStr(mapped, "typePanne"));
            result.put("criticite", getStr(mapped, "criticite"));
            result.put("description", getStr(mapped, "description"));
            result.put("detections", analysis.getOrDefault("detections", List.of()));
            result.put("analysisTimeMs", analysis.getOrDefault("analysis_time_ms", 0));
            if (analysis.containsKey("confidence")) {
                result.put("confidence", analysis.get("confidence"));
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/extract-km")
    public ResponseEntity<?> extractKm(@RequestParam("file") MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                PYTHON_SERVICE_URL + "/extract-km", requestEntity, Map.class);

            if (response.getBody() != null) {
                Map<String, Object> pyResult = response.getBody();
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("success", pyResult.getOrDefault("success", true));
                result.put("kilometrage", pyResult.getOrDefault("kilometrage", 0));
                result.put("confidence", pyResult.getOrDefault("confidence", 0));
                result.put("sources", pyResult.getOrDefault("sources", List.of()));
                result.put("analysisTimeMs", pyResult.getOrDefault("analysis_time_ms", 0));
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Pas de reponse du service IA"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/extract-plate")
    public ResponseEntity<?> extractPlate(@RequestParam("file") MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                PYTHON_SERVICE_URL + "/extract-plate", requestEntity, Map.class);

            if (response.getBody() != null) {
                Map<String, Object> pyResult = response.getBody();
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("success", pyResult.getOrDefault("success", true));
                result.put("immatriculation", pyResult.getOrDefault("immatriculation", ""));
                result.put("plaqueDetectee", pyResult.getOrDefault("plaqueDetectee", ""));
                result.put("confidence", pyResult.getOrDefault("confidence", 0));
                result.put("sources", pyResult.getOrDefault("sources", List.of()));
                result.put("detections", pyResult.getOrDefault("detections", List.of()));
                result.put("analysisTimeMs", pyResult.getOrDefault("analysis_time_ms", 0));
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Pas de reponse du service IA"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}