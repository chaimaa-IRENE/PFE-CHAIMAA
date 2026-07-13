package com.example.usermanagement.controller;

import com.example.usermanagement.model.QRCode;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.service.QRCodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/fleet/qrcode")
@CrossOrigin(origins = "*")
public class QRCodeController {

    private final QRCodeService qrCodeService;

    public QRCodeController(QRCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @PostMapping("/generate-all")
    public ResponseEntity<?> generateAll() {
        try {
            List<QRCode> generated = qrCodeService.generateAll();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "generated", generated.size(),
                "message", generated.size() + " QR codes generated"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate/{vehiculeId}")
    public ResponseEntity<Map<String, Object>> generateQR(@PathVariable Long vehiculeId) {
        QRCode qr = qrCodeService.generateQRCode(vehiculeId);
        if (qr == null) return ResponseEntity.badRequest().body(Map.of("error", "Vehicule non trouve"));
        return ResponseEntity.ok(Map.of(
            "id", qr.getId(),
            "code", qr.getCode(),
            "vehiculeImmatriculation", qr.getVehiculeImmatriculation(),
            "dateGeneration", qr.getDateGeneration().toString()
        ));
    }

    @GetMapping("/vehicle/{vehiculeId}")
    public ResponseEntity<?> getQRByVehicule(@PathVariable Long vehiculeId) {
        QRCode qr = qrCodeService.getQRCodeByVehicule(vehiculeId);
        if (qr == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(qr);
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scanQR(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Code QR requis"));

        Optional<Vehicule> vehiculeOpt = qrCodeService.scanQRCode(code);
        if (vehiculeOpt.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "QR Code invalide ou inactif"));

        Vehicule v = vehiculeOpt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("id", v.getId());
        result.put("immatriculation", v.getImmatriculation());
        result.put("marque", v.getMarque());
        result.put("modele", v.getModele());
        result.put("type", v.getType());
        result.put("branchCode", v.getBranchCode());
        result.put("kilometrage", v.getKilometrage());
        result.put("annee", v.getAnnee());
        result.put("statut", v.getStatut());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/regenerate/{vehiculeId}")
    public ResponseEntity<?> regenerateQR(@PathVariable Long vehiculeId) {
        QRCode qr = qrCodeService.regenerateQRCode(vehiculeId);
        if (qr == null) return ResponseEntity.badRequest().body(Map.of("error", "Vehicule non trouve"));
        return ResponseEntity.ok(qr);
    }
}
