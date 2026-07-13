package com.example.usermanagement.service;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MyGeotabService {

    private static final String GEOTAB_API_URL = "https://my.geotab.com/api/v1";
    private static final ObjectMapper mapper = new ObjectMapper();

    private final GeotabConfigRepository configRepository;
    private final GeotabSyncLogRepository syncLogRepository;
    private final VehiculeRepository vehiculeRepository;
    private final FleetAlertRepository fleetAlertRepository;
    private final DeclarationRepository declarationRepository;
    private final RestTemplate restTemplate;

    private String cachedSessionId;
    private String cachedServer;
    private LocalDateTime sessionExpiry;

    public MyGeotabService(GeotabConfigRepository configRepository,
                           GeotabSyncLogRepository syncLogRepository,
                           VehiculeRepository vehiculeRepository,
                           FleetAlertRepository fleetAlertRepository,
                           DeclarationRepository declarationRepository) {
        this.configRepository = configRepository;
        this.syncLogRepository = syncLogRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.fleetAlertRepository = fleetAlertRepository;
        this.declarationRepository = declarationRepository;
        this.restTemplate = new RestTemplate();
    }

    public boolean authenticate() {
        Optional<GeotabConfig> configOpt = configRepository.findTopByActifTrue();
        if (configOpt.isEmpty()) return false;
        GeotabConfig config = configOpt.get();
        try {
            ObjectNode params = mapper.createObjectNode();
            params.put("database", config.getDatabase());
            params.put("userName", config.getUsername());
            params.put("password", config.getPassword());

            ObjectNode body = mapper.createObjectNode();
            body.put("method", "Authenticate");
            body.set("params", params);
            body.put("id", 1);
            body.put("jsonrpc", "2.0");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), headers);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(GEOTAB_API_URL, entity, JsonNode.class);
            JsonNode result = response.getBody();
            if (result != null && result.has("result")) {
                JsonNode credentials = result.get("result").get("credentials");
                this.cachedSessionId = credentials.get("sessionId").asText();
                this.cachedServer = result.get("result").get("path").asText();
                this.sessionExpiry = LocalDateTime.now().plusHours(1);

                config.setDernierStatut("OK");
                config.setDerniereErreur(null);
                config.setActif(true);
                configRepository.save(config);
                return true;
            } else {
                String err = result != null && result.has("error") ? result.get("error").get("message").asText() : "Echec auth";
                config.setDernierStatut("ERROR");
                config.setDerniereErreur(err);
                configRepository.save(config);
                return false;
            }
        } catch (Exception e) {
            config.setDernierStatut("ERROR");
            config.setDerniereErreur(e.getMessage());
            configRepository.save(config);
            return false;
        }
    }

    private JsonNode call(String method, ObjectNode params) {
        if (cachedSessionId == null || sessionExpiry == null || LocalDateTime.now().isAfter(sessionExpiry)) {
            if (!authenticate()) return null;
        }
        try {
            ObjectNode credentials = mapper.createObjectNode();
            credentials.put("sessionId", cachedSessionId);
            credentials.put("userName", configRepository.findTopByActifTrue().map(GeotabConfig::getUsername).orElse(""));
            credentials.put("database", configRepository.findTopByActifTrue().map(GeotabConfig::getDatabase).orElse(""));
            params.set("credentials", credentials);

            ObjectNode body = mapper.createObjectNode();
            body.put("method", method);
            body.set("params", params);
            body.put("id", System.currentTimeMillis());
            body.put("jsonrpc", "2.0");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), headers);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(GEOTAB_API_URL, entity, JsonNode.class);
            JsonNode result = response.getBody();
            if (result != null && result.has("error")) {
                if (result.get("error").get("code").asInt() == -32000) {
                    cachedSessionId = null;
                    return call(method, params);
                }
            }
            return result;
        } catch (Exception e) {
            return null;
        }
    }

    public GeotabSyncLog syncAll() {
        GeotabSyncLog logEntry = new GeotabSyncLog();
        syncLogRepository.save(logEntry);
        try {
            if (!authenticate()) {
                logEntry.setStatut("ERROR");
                logEntry.setMessageErreur("Authentification echouee");
                logEntry.setDateFin(LocalDateTime.now());
                return syncLogRepository.save(logEntry);
            }

            List<Vehicule> syncedVehicles = syncDevices();
            int nbPos = syncPositions(syncedVehicles);
            syncFuelStatus(syncedVehicles);
            int nbAnomalies = detectAnomalies(syncedVehicles);

            logEntry.setStatut("SUCCESS");
            logEntry.setNbVehicules(syncedVehicles.size());
            logEntry.setNbPositions(nbPos);
            logEntry.setNbAnomalies(nbAnomalies);

            Optional<GeotabConfig> configOpt = configRepository.findTopByActifTrue();
            configOpt.ifPresent(c -> { c.setDernierSync(LocalDateTime.now()); c.setDernierStatut("OK"); configRepository.save(c); });
        } catch (Exception e) {
            logEntry.setStatut("ERROR");
            logEntry.setMessageErreur(e.getMessage());
        }
        logEntry.setDateFin(LocalDateTime.now());
        return syncLogRepository.save(logEntry);
    }

    private List<Vehicule> syncDevices() {
        JsonNode result = call("Get", mapper.createObjectNode().put("typeName", "Device"));
        if (result == null || !result.has("result")) return List.of();

        List<Vehicule> synced = new ArrayList<>();
        for (JsonNode device : result.get("result")) {
            String geotabId = device.get("id").asText();
            String name = device.has("name") ? device.get("name").asText() : "";
            String serialNumber = device.has("serialNumber") ? device.get("serialNumber").asText() : "";
            String vin = device.has("vehicleIdentificationNumber") ? device.get("vehicleIdentificationNumber").asText() : "";

            List<Vehicule> existing = vehiculeRepository.findAll().stream()
                .filter(v -> geotabId.equals(v.getGeotabId())
                    || (vin != null && !vin.isEmpty() && vin.equals(v.getVehicleId()))
                    || (serialNumber != null && !serialNumber.isEmpty() && serialNumber.equals(v.getTruckNumber())))
                .collect(Collectors.toList());

            Vehicule vehicle;
            if (existing.isEmpty()) {
                vehicle = new Vehicule();
                vehicle.setGeotabId(geotabId);
                vehicle.setImmatriculation(name);
                vehicle.setStatut("DISPONIBLE");
                vehicle.setConforme(true);
            } else {
                vehicle = existing.get(0);
                vehicle.setGeotabId(geotabId);
            }
            synced.add(vehiculeRepository.save(vehicle));
        }
        return synced;
    }

    private int syncPositions(List<Vehicule> vehicles) {
        if (vehicles.isEmpty()) return 0;
        long from = LocalDateTime.now().minusHours(1).toEpochSecond(ZoneOffset.UTC);
        ObjectNode params = mapper.createObjectNode();
        params.put("typeName", "LogRecord");
        params.put("search", mapper.createObjectNode().put("fromDate", from));

        JsonNode result = call("Get", params);
        if (result == null || !result.has("result")) return 0;

        Map<String, JsonNode> latestByDevice = new HashMap<>();
        for (JsonNode record : result.get("result")) {
            String deviceId = record.get("device").get("id").asText();
            latestByDevice.merge(deviceId, record, (a, b) ->
                a.get("dateTime").asLong() > b.get("dateTime").asLong() ? a : b);
        }

        int count = 0;
        for (Vehicule v : vehicles) {
            if (v.getGeotabId() == null) continue;
            JsonNode record = latestByDevice.get(v.getGeotabId());
            if (record != null) {
                v.setDerniereLatitude(record.has("latitude") ? record.get("latitude").asDouble() : null);
                v.setDerniereLongitude(record.has("longitude") ? record.get("longitude").asDouble() : null);
                v.setDerniereVitesse(record.has("speed") ? record.get("speed").asDouble() * 1.852 : null);
                if (record.has("dateTime")) {
                    v.setDernierePositionDate(LocalDateTime.ofEpochSecond(record.get("dateTime").asLong(), 0, ZoneOffset.UTC));
                }
                vehiculeRepository.save(v);
                count++;
            }
        }
        return count;
    }

    private void syncFuelStatus(List<Vehicule> vehicles) {
        if (vehicles.isEmpty()) return;
        long from = LocalDateTime.now().minusHours(1).toEpochSecond(ZoneOffset.UTC);
        ObjectNode params = mapper.createObjectNode();
        params.put("typeName", "StatusData");
        ObjectNode search = mapper.createObjectNode();
        search.put("fromDate", from);
        search.put("version", 1);
        params.set("search", search);

        JsonNode result = call("Get", params);
        if (result == null || !result.has("result")) return;

        for (JsonNode status : result.get("result")) {
            String deviceId = status.get("device").get("id").asText();
            String name = status.has("name") ? status.get("name").asText() : "";
            double value = status.has("data") ? status.get("data").asDouble() : 0;

            vehicles.stream()
                .filter(v -> deviceId.equals(v.getGeotabId()))
                .findFirst().ifPresent(v -> {
                    if (name.toLowerCase().contains("fuel") || name.toLowerCase().contains("carburant")) {
                        v.setNiveauCarburant(value);
                    }
                    if (name.toLowerCase().contains("ignition") || name.toLowerCase().contains("engine")) {
                        v.setMoteurAllume(value > 0);
                    }
                    vehiculeRepository.save(v);
                });
        }
    }

    private int detectAnomalies(List<Vehicule> vehicles) {
        long from = LocalDateTime.now().minusHours(1).toEpochSecond(ZoneOffset.UTC);
        ObjectNode params = mapper.createObjectNode();
        params.put("typeName", "Diagnostic");
        ObjectNode search = mapper.createObjectNode();
        search.put("fromDate", from);
        params.set("search", search);

        JsonNode result = call("Get", params);
        if (result == null || !hasResult(result)) return 0;

        int count = 0;
        for (JsonNode diag : result.get("result")) {
            String deviceId = diag.get("device").get("id").asText();
            String code = diag.has("code") ? diag.get("code").asText() : "";
            String description = diag.has("description") ? diag.get("description").asText() : "";
            String severity = diag.has("severity") ? diag.get("severity").asText() : "MOYENNE";

            Optional<Vehicule> vOpt = vehicles.stream()
                .filter(v -> deviceId.equals(v.getGeotabId()))
                .findFirst();

            if (vOpt.isEmpty()) continue;
            Vehicule v = vOpt.get();

            if ("CRITIQUE".equals(severity) || "HAUTE".equals(severity)) {
                v.setStatut("BLOQUE");
                v.setConforme(false);
                v.setDateBlocage(LocalDateTime.now());
                v.setBloquePar("MyGeotab");
                v.setRaisonBlocage("Defaut " + code + ": " + description);
                vehiculeRepository.save(v);

                FleetAlert alert = new FleetAlert("AUTO_BLOCK", "Blocage auto: " + code + " - " + description, severity);
                alert.setVehiculeId(v.getId());
                alert.setVehiculeImmatriculation(v.getImmatriculation());
                alert.setChauffeurNom(v.getChauffeurNom());
                fleetAlertRepository.save(alert);

                DeclarationIncident decl = new DeclarationIncident();
                decl.setTypePanne("PROBLEME_MOTEUR");
                decl.setTypePanneFrancais("Probleme moteur (Geotab: " + code + ")");
                decl.setDescriptionFrancais("Detection automatique Geotab: " + description);
                decl.setCriticite("BLOQUANT");
                decl.setStatut("EN_ATTENTE");
                decl.setVehiculeId(v.getId());
                decl.setVehiculeImmatriculation(v.getImmatriculation());
                decl.setDateHeure(LocalDateTime.now());
                declarationRepository.save(decl);
                count++;
            } else {
                FleetAlert alert = new FleetAlert("ANOMALIE", "Defaut " + code + ": " + description, severity);
                alert.setVehiculeId(v.getId());
                alert.setVehiculeImmatriculation(v.getImmatriculation());
                fleetAlertRepository.save(alert);
                count++;
            }
        }
        return count;
    }

    private boolean hasResult(JsonNode node) {
        return node != null && node.has("result");
    }

    @Scheduled(fixedRateString = "${geotab.sync.interval.ms:300000}")
    public void scheduledSync() {
        Optional<GeotabConfig> configOpt = configRepository.findTopByActifTrue();
        if (configOpt.isPresent() && Boolean.TRUE.equals(configOpt.get().getActif())) {
            syncAll();
        }
    }

    public Map<String, Object> getLiveData() {
        List<Vehicule> vehicles = vehiculeRepository.findAll().stream()
            .filter(v -> v.getDerniereLatitude() != null || v.getGeotabId() != null)
            .collect(Collectors.toList());

        List<Map<String, Object>> liveVehicles = vehicles.stream().map(v -> {
            Map<String, Object> vm = new LinkedHashMap<>();
            vm.put("id", v.getId());
            vm.put("immatriculation", v.getImmatriculation());
            vm.put("geotabId", v.getGeotabId());
            vm.put("latitude", v.getDerniereLatitude());
            vm.put("longitude", v.getDerniereLongitude());
            vm.put("vitesse", v.getDerniereVitesse());
            vm.put("niveauCarburant", v.getNiveauCarburant());
            vm.put("dernierePositionDate", v.getDernierePositionDate());
            vm.put("moteurAllume", v.getMoteurAllume());
            vm.put("statut", v.getStatut());
            vm.put("conforme", v.getConforme());
            vm.put("chauffeurNom", v.getChauffeurNom());
            vm.put("chauffeurId", v.getChauffeurId());
            vm.put("marque", v.getMarque());
            vm.put("modele", v.getModele());
            vm.put("kilometrage", v.getKilometrage());
            vm.put("carburant", v.getCarburant());
            return vm;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("vehicles", liveVehicles);
        result.put("total", liveVehicles.size());
        result.put("withPosition", liveVehicles.stream().filter(v -> v.get("latitude") != null).count());
        result.put("moteurAllume", liveVehicles.stream().filter(v -> Boolean.TRUE.equals(v.get("moteurAllume"))).count());
        result.put("syncTime", LocalDateTime.now());
        return result;
    }
}
