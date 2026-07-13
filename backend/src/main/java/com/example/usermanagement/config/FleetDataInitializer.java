package com.example.usermanagement.config;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Component
public class FleetDataInitializer implements CommandLineRunner {

    private final DriverChecklistRepository checklistRepository;
    private final LegalDocumentRepository documentRepository;
    private final FleetAlertRepository alertRepository;
    private final VehicleBlockingRepository blockingRepository;
    private final QRCodeRepository qrCodeRepository;
    private final VehiculeRepository vehiculeRepository;

    public FleetDataInitializer(DriverChecklistRepository checklistRepository,
                                LegalDocumentRepository documentRepository,
                                FleetAlertRepository alertRepository,
                                VehicleBlockingRepository blockingRepository,
                                QRCodeRepository qrCodeRepository,
                                VehiculeRepository vehiculeRepository) {
        this.checklistRepository = checklistRepository;
        this.documentRepository = documentRepository;
        this.alertRepository = alertRepository;
        this.blockingRepository = blockingRepository;
        this.qrCodeRepository = qrCodeRepository;
        this.vehiculeRepository = vehiculeRepository;
    }

    @Override
    public void run(String... args) {
        if (checklistRepository.count() > 0) return;

        List<Vehicule> vehicules = vehiculeRepository.findAll();
        if (vehicules.isEmpty()) return;

        Random rnd = new Random(123);
        String[] chauffeurNoms = {"Youssef Amrani", "Karim Bennani", "Omar Tazi", "Ahmed Elmokri"};
        Long[] chauffeurIds = {2L, 3L, 4L, 5L};
        String[] docTypes = {"CARTE_GRISE", "ASSURANCE", "ONSSA", "METROLOGIQUE"};

        for (int i = 0; i < vehicules.size() && i < 10; i++) {
            Vehicule v = vehicules.get(i);
            int ci = i % chauffeurNoms.length;

            DriverChecklist cl = new DriverChecklist(chauffeurIds[ci], chauffeurNoms[ci], "CHF00" + (ci + 1),
                v.getId(), v.getImmatriculation());
            cl.setPneus(true);
            cl.setFreins(true);
            cl.setFeux(i % 3 != 0);
            cl.setExtincteur(i % 4 != 0);
            cl.setDocuments(i % 5 != 0);
            cl.setCommentaireGeneral("Checklist matinale OK");
            cl.setStatut("COMPLETE");
            cl.setDateChecklist(LocalDateTime.now().minusHours(i * 2));
            checklistRepository.save(cl);

            for (int d = 0; d < docTypes.length; d++) {
                LegalDocument doc = new LegalDocument(v.getId(), v.getImmatriculation(), docTypes[d]);
                doc.setNumeroDocument(docTypes[d].substring(0, 3) + "-" + (10000 + i * 100 + d));
                doc.setDateExpiration(LocalDate.now().plusMonths(1 + rnd.nextInt(18)));
                doc.setProprietaire("Danone " + v.getBranchCode());
                doc.setImportePar("Admin System");
                doc.setOcrData("{\"extracted\":\"Donnees OCR simulees pour " + docTypes[d] + "\"}");
                doc.updateStatut();
                documentRepository.save(doc);
            }

            if (i == 0) {
                QRCode qr = new QRCode(v.getId(), v.getImmatriculation(),
                    "DANONE-" + v.getImmatriculation().replaceAll("[^A-Z0-9]", ""));
                qrCodeRepository.save(qr);
            }
        }
    }
}
