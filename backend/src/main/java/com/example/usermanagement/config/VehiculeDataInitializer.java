package com.example.usermanagement.config;

import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class VehiculeDataInitializer implements CommandLineRunner {
    
    private final VehiculeRepository vehiculeRepository;

    public VehiculeDataInitializer(VehiculeRepository vehiculeRepository) {
        this.vehiculeRepository = vehiculeRepository;
    }

    @Override
    public void run(String... args) {
        // Créer des véhicules pour chaque site
        createVehiculesForSite("PARIS",
            new Vehicule("AA-123-BC", "Renault", "Kangoo", "Utilitaire", "PARIS", 45000, 2022, "Diesel", "ACTIF", "PARIS"),
            new Vehicule("BB-456-DE", "Peugeot", "Partner", "Utilitaire", "PARIS", 62000, 2021, "Diesel", "ACTIF", "PARIS"),
            new Vehicule("CC-789-FG", "Citroën", "Berlingo", "Utilitaire", "PARIS", 38000, 2023, "Essence", "ACTIF", "PARIS"),
            new Vehicule("BUS-001-PA", "Mercedes", "Citaro", "Bus", "PARIS", 120000, 2020, "Diesel", "ACTIF", "PARIS"),
            new Vehicule("BUS-002-PA", "Irisbus", "Citelis", "Bus", "PARIS", 95000, 2021, "Diesel", "ACTIF", "PARIS")
        );

        createVehiculesForSite("LYON",
            new Vehicule("DD-012-HI", "Renault", "Traffic", "Utilitaire", "LYON", 58000, 2022, "Diesel", "ACTIF", "LYON"),
            new Vehicule("EE-345-JK", "Peugeot", "Expert", "Utilitaire", "LYON", 71000, 2021, "Diesel", "ACTIF", "LYON"),
            new Vehicule("FF-678-LM", "Citroën", "Jumpy", "Utilitaire", "LYON", 42000, 2023, "Essence", "ACTIF", "LYON"),
            new Vehicule("BUS-003-LY", "Mercedes", "Citaro", "Bus", "LYON", 135000, 2019, "Diesel", "ACTIF", "LYON"),
            new Vehicule("BUS-004-LY", "Volvo", "7900", "Bus", "LYON", 88000, 2022, "Diesel", "ACTIF", "LYON")
        );

        createVehiculesForSite("MARSEILLE",
            new Vehicule("GG-901-NO", "Renault", "Master", "Utilitaire", "MARSEILLE", 67000, 2022, "Diesel", "ACTIF", "MARSEILLE"),
            new Vehicule("HH-234-PQ", "Peugeot", "Boxer", "Utilitaire", "MARSEILLE", 79000, 2021, "Diesel", "ACTIF", "MARSEILLE"),
            new Vehicule("II-567-RS", "Citroën", "Jumper", "Utilitaire", "MARSEILLE", 53000, 2023, "Essence", "ACTIF", "MARSEILLE"),
            new Vehicule("BUS-005-MA", "Mercedes", "Citaro", "Bus", "MARSEILLE", 145000, 2019, "Diesel", "ACTIF", "MARSEILLE"),
            new Vehicule("BUS-006-MA", "Irisbus", "Citelis", "Bus", "MARSEILLE", 102000, 2021, "Diesel", "ACTIF", "MARSEILLE")
        );

        System.out.println("=== VÉHICULES INITIALISÉS POUR TOUS LES SITES ===");
    }
    
    private void createVehiculesForSite(String site, Vehicule... vehicules) {
        for (Vehicule vehicule : vehicules) {
            if (!vehiculeRepository.existsByImmatriculation(vehicule.getImmatriculation())) {
                vehiculeRepository.save(vehicule);
                System.out.println("Véhicule créé: " + vehicule.getImmatriculation() + " pour " + site);
            } else {
                // Update existing vehicle with new fields
                Vehicule existing = vehiculeRepository.findByImmatriculation(vehicule.getImmatriculation()).orElse(null);
                if (existing != null) {
                    existing.setKilometrage(vehicule.getKilometrage());
                    existing.setAnnee(vehicule.getAnnee());
                    existing.setCarburant(vehicule.getCarburant());
                    existing.setStatut(vehicule.getStatut());
                    vehiculeRepository.save(existing);
                    System.out.println("Véhicule mis à jour: " + vehicule.getImmatriculation() + " pour " + site);
                }
            }
        }
    }
}
