package com.example.usermanagement.controller;

import com.example.usermanagement.model.TrackingHistory;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.TrackingHistoryRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*")
public class TrackingController {

    private final VehiculeRepository vehiculeRepository;
    private final TrackingHistoryRepository historyRepository;

    public TrackingController(VehiculeRepository vehiculeRepository, TrackingHistoryRepository historyRepository) {
        this.vehiculeRepository = vehiculeRepository;
        this.historyRepository = historyRepository;
    }

    @PostMapping("/update")
    public ResponseEntity<?> updatePosition(@RequestBody Map<String, Object> body) {
        String immatriculation = (String) body.get("immatriculation");
        if (immatriculation == null || immatriculation.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "immatriculation requis"));

        Optional<Vehicule> opt = vehiculeRepository.findByImmatriculation(immatriculation);
        if (opt.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicule non trouve: " + immatriculation));

        Vehicule v = opt.get();
        if (body.containsKey("latitude")) v.setDerniereLatitude(toDouble(body.get("latitude")));
        if (body.containsKey("longitude")) v.setDerniereLongitude(toDouble(body.get("longitude")));
        if (body.containsKey("vitesse")) v.setDerniereVitesse(toDouble(body.get("vitesse")));
        if (body.containsKey("moteurAllume")) v.setMoteurAllume(Boolean.TRUE.equals(body.get("moteurAllume")));
        if (body.containsKey("niveauCarburant")) v.setNiveauCarburant(toDouble(body.get("niveauCarburant")));
        if (body.containsKey("kilometrage") && body.get("kilometrage") instanceof Number) v.setKilometrage(((Number)body.get("kilometrage")).intValue());
        LocalDateTime posTimestamp = LocalDateTime.now();
        if (body.containsKey("timestamp")) {
            try { posTimestamp = LocalDateTime.parse(body.get("timestamp").toString().substring(0, 19)); } catch (Exception ignored) {}
        }
        v.setDernierePositionDate(posTimestamp);
        vehiculeRepository.save(v);

        // Log history
        TrackingHistory h;
        if (body.containsKey("timestamp")) {
            try {
                LocalDateTime ts = LocalDateTime.parse(body.get("timestamp").toString().substring(0, 19));
                h = new TrackingHistory(immatriculation, v.getDerniereLatitude(), v.getDerniereLongitude(),
                    v.getDerniereVitesse(), v.getNiveauCarburant(), v.getKilometrage(), v.getMoteurAllume(), ts);
            } catch (Exception ignored) {
                h = new TrackingHistory(immatriculation, v.getDerniereLatitude(), v.getDerniereLongitude(),
                    v.getDerniereVitesse(), v.getNiveauCarburant(), v.getKilometrage(), v.getMoteurAllume());
            }
        } else {
            h = new TrackingHistory(immatriculation, v.getDerniereLatitude(), v.getDerniereLongitude(),
                v.getDerniereVitesse(), v.getNiveauCarburant(), v.getKilometrage(), v.getMoteurAllume());
        }
        historyRepository.save(h);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("message", "Position mise a jour");
        res.put("immatriculation", immatriculation);
        res.put("timestamp", v.getDernierePositionDate().toString());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/vehicule/{immatriculation}")
    public ResponseEntity<?> getVehiculePosition(@PathVariable String immatriculation) {
        Optional<Vehicule> opt = vehiculeRepository.findByImmatriculation(immatriculation);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        Vehicule v = opt.get();
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", v.getId());
        res.put("immatriculation", v.getImmatriculation());
        res.put("latitude", v.getDerniereLatitude());
        res.put("longitude", v.getDerniereLongitude());
        res.put("vitesse", v.getDerniereVitesse());
        res.put("moteurAllume", v.getMoteurAllume());
        res.put("niveauCarburant", v.getNiveauCarburant());
        res.put("kilometrage", v.getKilometrage());
        res.put("dernierePositionDate", v.getDernierePositionDate());
        res.put("statut", v.getStatut());
        res.put("chauffeurNom", v.getChauffeurNom());
        return ResponseEntity.ok(res);
    }

    private Double toDouble(Object v) {
        if (v instanceof Number) return ((Number) v).doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return null; }
    }
}
