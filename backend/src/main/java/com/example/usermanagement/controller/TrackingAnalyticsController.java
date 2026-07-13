package com.example.usermanagement.controller;

import com.example.usermanagement.model.TrackingHistory;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.TrackingHistoryRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class TrackingAnalyticsController {

    private final TrackingHistoryRepository historyRepository;
    private final VehiculeRepository vehiculeRepository;

    public TrackingAnalyticsController(TrackingHistoryRepository historyRepository, VehiculeRepository vehiculeRepository) {
        this.historyRepository = historyRepository;
        this.vehiculeRepository = vehiculeRepository;
    }

    @GetMapping("/vehicle/{immatriculation}")
    public ResponseEntity<?> getVehicleAnalytics(@PathVariable String immatriculation,
                                                  @RequestParam(defaultValue = "7") int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<TrackingHistory> records = historyRepository
            .findByImmatriculationAndTimestampBetweenOrderByTimestampAsc(immatriculation, since, LocalDateTime.now());

        if (records.isEmpty())
            return ResponseEntity.ok(Map.of("immatriculation", immatriculation, "records", 0, "message", "Aucune donnee"));

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("immatriculation", immatriculation);
        analytics.put("records", records.size());
        analytics.put("days", days);

        // Vitesse
        DoubleSummaryStatistics speedStats = records.stream()
            .filter(r -> r.getVitesse() != null)
            .mapToDouble(TrackingHistory::getVitesse)
            .summaryStatistics();
        analytics.put("vitesseMoyenne", round(speedStats.getAverage()));
        analytics.put("vitesseMax", round(speedStats.getMax()));
        analytics.put("vitesseMin", round(speedStats.getMin()));

        // Distance parcourue (Haversine)
        double totalKm = 0;
        for (int i = 1; i < records.size(); i++) {
            TrackingHistory prev = records.get(i - 1);
            TrackingHistory cur = records.get(i);
            if (prev.getLatitude() != null && cur.getLatitude() != null) {
                totalKm += haversine(prev.getLatitude(), prev.getLongitude(), cur.getLatitude(), cur.getLongitude());
            }
        }
        analytics.put("distanceKm", round(totalKm));

        // Temps actif (quand vitesse > 0)
        long activeSeconds = 0;
        for (int i = 0; i < records.size(); i++) {
            if (records.get(i).getVitesse() != null && records.get(i).getVitesse() > 1) {
                if (i > 0 && records.get(i - 1).getTimestamp() != null && records.get(i).getTimestamp() != null) {
                    activeSeconds += ChronoUnit.SECONDS.between(records.get(i - 1).getTimestamp(), records.get(i).getTimestamp());
                }
            }
        }
        analytics.put("tempsActif_h", round(activeSeconds / 3600.0));
        analytics.put("tempsTotal_h", records.size() > 1 ? round(ChronoUnit.SECONDS.between(
            records.get(0).getTimestamp(), records.get(records.size() - 1).getTimestamp()) / 3600.0) : 0);

        // Carburant evolution
        List<Map<String, Object>> carburantHistory = records.stream()
            .filter(r -> r.getNiveauCarburant() != null)
            .map(r -> {
                Map<String, Object> pt = new LinkedHashMap<>();
                pt.put("timestamp", r.getTimestamp().toString());
                pt.put("valeur", r.getNiveauCarburant());
                return pt;
            })
            .collect(Collectors.toList());
        analytics.put("carburantEvolution", carburantHistory);

        // Kilometrage evolution
        List<Map<String, Object>> kmHistory = records.stream()
            .filter(r -> r.getKilometrage() != null)
            .map(r -> {
                Map<String, Object> pt = new LinkedHashMap<>();
                pt.put("timestamp", r.getTimestamp().toString());
                pt.put("valeur", r.getKilometrage());
                return pt;
            })
            .collect(Collectors.toList());
        analytics.put("kilometrageEvolution", kmHistory);

        // Stats par jour
        Map<LocalDate, List<TrackingHistory>> byDay = records.stream()
            .collect(Collectors.groupingBy(r -> r.getTimestamp().toLocalDate(), TreeMap::new, Collectors.toList()));
        List<Map<String, Object>> dailyStats = new ArrayList<>();
        for (Map.Entry<LocalDate, List<TrackingHistory>> entry : byDay.entrySet()) {
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", entry.getKey().toString());
            double dayKm = 0;
            List<TrackingHistory> dayRecords = entry.getValue();
            for (int i = 1; i < dayRecords.size(); i++) {
                TrackingHistory p = dayRecords.get(i - 1);
                TrackingHistory c = dayRecords.get(i);
                if (p.getLatitude() != null && c.getLatitude() != null)
                    dayKm += haversine(p.getLatitude(), p.getLongitude(), c.getLatitude(), c.getLongitude());
            }
            day.put("distanceKm", round(dayKm));
            day.put("points", dayRecords.size());
            day.put("vitesseMoyenne", round(dayRecords.stream().filter(r -> r.getVitesse() != null)
                .mapToDouble(TrackingHistory::getVitesse).average().orElse(0)));
            dailyStats.add(day);
        }
        analytics.put("statsQuotidiennes", dailyStats);

        // Score conduite (0-100)
        int nbSpeeding = (int) records.stream().filter(r -> r.getVitesse() != null && r.getVitesse() > 80).count();
        double consoL100 = 10;
        double consoEstimee = totalKm > 0 ? round((totalKm / 100) * consoL100) : 0;
        double distanceScore = Math.min(60, totalKm / 2);
        double baseScore = distanceScore + 25 + 15; // distance + discipline + efficience
        double score = totalKm > 0 ? round(baseScore - nbSpeeding * 3) : 0;
        score = Math.max(0, Math.min(100, score));
        analytics.put("scoreConduite", score);
        analytics.put("nbExcesVitesse", nbSpeeding);
        analytics.put("consommationEstimee_L", round(consoEstimee));

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        List<Vehicule> vehicules = vehiculeRepository.findAll();
        List<String> trackedImmats = historyRepository.findDistinctImmatriculations();

        List<Map<String, Object>> summary = new ArrayList<>();
        for (Vehicule v : vehicules) {
            if (v.getImmatriculation() == null) continue;
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("immatriculation", v.getImmatriculation());
            s.put("chauffeurNom", v.getChauffeurNom());
            s.put("marque", v.getMarque());
            s.put("modele", v.getModele());
            s.put("statut", v.getStatut());
            s.put("latitude", v.getDerniereLatitude());
            s.put("longitude", v.getDerniereLongitude());
            s.put("vitesse", v.getDerniereVitesse());
            s.put("niveauCarburant", v.getNiveauCarburant());
            s.put("moteurAllume", v.getMoteurAllume());
            s.put("dernierePositionDate", v.getDernierePositionDate());
            s.put("aDesDonnees", trackedImmats.contains(v.getImmatriculation()));
            summary.add(s);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("vehicules", summary);
        result.put("total", summary.size());
        result.put("avecDonnees", trackedImmats.size());
        return ResponseEntity.ok(result);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        if (lat1 == 0 || lon1 == 0 || lat2 == 0 || lon2 == 0) return 0;
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
