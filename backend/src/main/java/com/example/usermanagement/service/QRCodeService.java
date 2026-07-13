package com.example.usermanagement.service;

import com.example.usermanagement.model.QRCode;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.QRCodeRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class QRCodeService {

    private final QRCodeRepository qrCodeRepository;
    private final VehiculeRepository vehiculeRepository;

    public QRCodeService(QRCodeRepository qrCodeRepository, VehiculeRepository vehiculeRepository) {
        this.qrCodeRepository = qrCodeRepository;
        this.vehiculeRepository = vehiculeRepository;
    }

    public QRCode generateQRCode(Long vehiculeId) {
        Optional<Vehicule> vehiculeOpt = vehiculeRepository.findById(vehiculeId);
        if (vehiculeOpt.isEmpty()) return null;

        Vehicule vehicule = vehiculeOpt.get();
        String plate = vehicule.getImmatriculation();
        // Use plate number as the QR code content so any QR/barcode scanner reads it
        QRCode qr = new QRCode(vehiculeId, plate, plate);
        return qrCodeRepository.save(qr);
    }

    public List<QRCode> generateAll() {
        List<Vehicule> all = vehiculeRepository.findAll();
        List<QRCode> generated = new java.util.ArrayList<>();
        for (Vehicule v : all) {
            qrCodeRepository.findByVehiculeId(v.getId()).ifPresent(existing -> {
                existing.setActif(false);
                qrCodeRepository.save(existing);
            });
            QRCode qr = new QRCode(v.getId(), v.getImmatriculation(), v.getImmatriculation());
            generated.add(qrCodeRepository.save(qr));
        }
        return generated;
    }

    public QRCode getQRCodeByVehicule(Long vehiculeId) {
        return qrCodeRepository.findByVehiculeId(vehiculeId).orElse(null);
    }

    public Optional<Vehicule> scanQRCode(String code) {
        if (code == null || code.isBlank()) return Optional.empty();
        String c = code.trim().toUpperCase();

        Optional<QRCode> qrOpt = qrCodeRepository.findByCode(c);
        if (qrOpt.isPresent() && qrOpt.get().getActif())
            return vehiculeRepository.findById(qrOpt.get().getVehiculeId());

        Optional<QRCode> qrByImmat = qrCodeRepository.findByVehiculeImmatriculation(c);
        if (qrByImmat.isPresent() && qrByImmat.get().getActif())
            return vehiculeRepository.findById(qrByImmat.get().getVehiculeId());

        Optional<Vehicule> v = vehiculeRepository.findByImmatriculation(c);
        if (v.isPresent()) return v;

        v = vehiculeRepository.findByTruckNumber(c);
        if (v.isPresent()) return v;

        return Optional.empty();
    }

    public QRCode getQRByImmatriculation(String immatriculation) {
        return qrCodeRepository.findByVehiculeImmatriculation(immatriculation).orElse(null);
    }

    public QRCode regenerateQRCode(Long vehiculeId) {
        qrCodeRepository.findByVehiculeId(vehiculeId).ifPresent(qr -> {
            qr.setActif(false);
            qrCodeRepository.save(qr);
        });
        return generateQRCode(vehiculeId);
    }
}
