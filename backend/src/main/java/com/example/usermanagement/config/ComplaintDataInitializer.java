package com.example.usermanagement.config;

import com.example.usermanagement.model.Complaint;
import com.example.usermanagement.repository.ComplaintRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class ComplaintDataInitializer implements CommandLineRunner {

    private final ComplaintRepository complaintRepository;

    public ComplaintDataInitializer(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Override
    public void run(String... args) {
        if (complaintRepository.count() == 0) {
            System.out.println("=== INITIALISATION DES DONNÉES DE RÉCLAMATIONS ===");
            
            // Sample complaints for testing
            Complaint[] sampleComplaints = {
                new Complaint("001", "Janvier", "CAM-001", "Ahmed Benali", 
                    LocalDate.of(2026, 1, 15), "Client", "Moteur", "Fuite d'huile", 
                    "Mécanique", LocalDate.of(2026, 1, 18), 3, "Terminé", "AA-123-BC"),
                new Complaint("002", "Janvier", "CAM-002", "Mohammed Alaoui", 
                    LocalDate.of(2026, 1, 20), "Chauffeur", "Freins", "Usure plaquettes", 
                    "Mécanique", LocalDate.of(2026, 1, 22), 2, "Terminé", "BB-456-DE"),
                new Complaint("003", "Février", "CAM-003", "Youssef Tazi", 
                    LocalDate.of(2026, 2, 5), "Client", "Électricité", "Batterie défaillante", 
                    "Électrique", LocalDate.of(2026, 2, 7), 2, "Terminé", "CC-789-FG"),
                new Complaint("004", "Février", "CAM-001", "Ahmed Benali", 
                    LocalDate.of(2026, 2, 10), "Chauffeur", "Pneus", "Crevaison", 
                    "Mécanique", LocalDate.of(2026, 2, 10), 1, "Terminé", "AA-123-BC"),
                new Complaint("005", "Mars", "CAM-004", "Karim Idrissi", 
                    LocalDate.of(2026, 3, 1), "Client", "Climatisation", "Non fonctionnelle", 
                    "Confort", LocalDate.of(2026, 3, 5), 4, "En cours", "DD-012-HI"),
                new Complaint("006", "Mars", "CAM-005", "Hassan Berrada", 
                    LocalDate.of(2026, 3, 15), "Chauffeur", "Direction", "Volant dur", 
                    "Mécanique", null, null, "En attente", "EE-345-JK"),
                new Complaint("007", "Avril", "CAM-002", "Mohammed Alaoui", 
                    LocalDate.of(2026, 4, 2), "Client", "Transmission", "Vitesse bloquée", 
                    "Mécanique", LocalDate.of(2026, 4, 8), 6, "Terminé", "BB-456-DE"),
                new Complaint("008", "Avril", "CAM-006", "Omar Fassi", 
                    LocalDate.of(2026, 4, 10), "Chauffeur", "Éclairage", "Phare cassé", 
                    "Électrique", LocalDate.of(2026, 4, 11), 1, "Terminé", "FF-678-LM"),
                new Complaint("009", "Mai", "CAM-003", "Youssef Tazi", 
                    LocalDate.of(2026, 5, 5), "Client", "Carrosserie", "Rayon porte", 
                    "Carrosserie", null, null, "En attente", "CC-789-FG"),
                new Complaint("010", "Mai", "CAM-007", "Said Amrani", 
                    LocalDate.of(2026, 5, 20), "Chauffeur", "Moteur", "Surchauffe", 
                    "Mécanique", LocalDate.of(2026, 5, 23), 3, "Terminé", "GG-901-NO")
            };

            complaintRepository.saveAll(java.util.Arrays.asList(sampleComplaints));
            System.out.println("=== " + sampleComplaints.length + " RÉCLAMATIONS DE TEST CRÉÉES ===");
        }
    }
}
