package com.example.usermanagement.config;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Component
@DependsOn({"fleetDataInitializer", "complaintDataInitializer"})
public class PowerBiSeedDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PowerBiSeedDataInitializer.class);

    private final DeclarationRepository declarationRepository;
    private final TicketMaintenanceRepository ticketRepository;
    private final AnomalieCheckupRepository anomalieRepository;
    private final DepartHistoriqueRepository departRepository;
    private final DriverPresenceRepository presenceRepository;
    private final VehiculeRepository vehiculeRepository;

    public PowerBiSeedDataInitializer(DeclarationRepository declarationRepository,
                                      TicketMaintenanceRepository ticketRepository,
                                      AnomalieCheckupRepository anomalieRepository,
                                      DepartHistoriqueRepository departRepository,
                                      DriverPresenceRepository presenceRepository,
                                      VehiculeRepository vehiculeRepository) {
        this.declarationRepository = declarationRepository;
        this.ticketRepository = ticketRepository;
        this.anomalieRepository = anomalieRepository;
        this.departRepository = departRepository;
        this.presenceRepository = presenceRepository;
        this.vehiculeRepository = vehiculeRepository;
    }

    @Override
    public void run(String... args) {
        if (declarationRepository.count() > 0) {
            log.info("PowerBiSeedDataInitializer: données déjà présentes, skip");
            return;
        }

        List<Vehicule> vehs = vehiculeRepository.findAll();
        if (vehs.isEmpty()) {
            log.warn("PowerBiSeedDataInitializer: aucun véhicule trouvé, skip");
            return;
        }
        log.info("PowerBiSeedDataInitializer: seeding {} véhicules trouvés", vehs.size());

        Random rnd = new Random(456);

        // ===== DECLARATIONS =====
        String[] sources = {"Check-up quotidien", "Fiche d'alerte", "Maintenance curative", "Maintenance préventive", "Panne marché", "Incident"};
        String[] elements = {"Moteur", "Freins", "Pneus", "Transmission", "Direction", "Éclairage", "Carrosserie", "Batterie", "Climatisation", "Échappement"};
        String[] categories = {"Mécanique", "Électrique", "Carrosserie", "Confort", "Sécurité"};
        String[] chauffeurs = {"Youssef Amrani", "Karim Bennani", "Omar Tazi", "Ahmed Elmokri"};
        Long[] chauffeurIds = {2L, 3L, 4L, 5L};
        String[] statuts = {"OUVERTE", "EN_COURS", "CLOTURE", "RESOLU"};
        String[] qualifications = {"CURATIVE", "PREVENTIVE"};
        String[] criticites = {"CRITIQUE", "MAJEURE", "MINEURE"};

        for (int i = 1; i <= 25; i++) {
            Vehicule v = vehs.get(i % vehs.size());
            int ci = rnd.nextInt(chauffeurs.length);
            DeclarationIncident d = new DeclarationIncident();
            d.setNumeroDemande("DEC-" + String.format("%03d", i));
            d.setDateHeure(LocalDateTime.now().minusDays(rnd.nextInt(120)).minusHours(rnd.nextInt(24)));
            d.setDateReclamation(LocalDateTime.now().minusDays(rnd.nextInt(120)).minusHours(rnd.nextInt(24)));
            d.setChauffeurNom(chauffeurs[ci]);
            d.setChauffeurId(chauffeurIds[ci]);
            d.setChauffeurMatricule("CHF00" + (ci + 1));
            d.setVehiculeId(v.getId());
            d.setVehiculeImmatriculation(v.getImmatriculation());
            d.setVehiculeMarque(v.getMarque());
            d.setVehiculeModele(v.getModele());
            d.setVehiculeType(v.getType());
            d.setSource(sources[rnd.nextInt(sources.length)]);
            d.setElementVehicule(elements[rnd.nextInt(elements.length)]);
            d.setCategorie(categories[rnd.nextInt(categories.length)]);
            d.setStatut(statuts[rnd.nextInt(statuts.length)]);
            d.setQualification(qualifications[rnd.nextInt(qualifications.length)]);
            d.setCriticite(criticites[rnd.nextInt(criticites.length)]);
            d.setTypePanne(elements[rnd.nextInt(elements.length)]);
            d.setDescriptionFrancais("Problème " + d.getElementVehicule() + " sur " + v.getImmatriculation());
            d.setKilometrage(10000 + rnd.nextInt(80000));
            d.setSla(2 + rnd.nextInt(5));
            d.setTournee("TOUR-" + (100 + i));
            d.setNumeroOrdreCamion(v.getImmatriculation());
            d.setMois("Mois " + (1 + rnd.nextInt(12)));
            if (rnd.nextBoolean()) {
                d.setDateDebutIntervention(LocalDateTime.now().minusDays(rnd.nextInt(60)));
                d.setDateReparation(LocalDateTime.now().minusDays(rnd.nextInt(30)));
                d.setDureeReparation(1 + rnd.nextInt(8));
            }
            d.setCoutProbleme(100.0 + rnd.nextDouble() * 5000);
            d.setBudgetMensuel(10000.0);
            declarationRepository.save(d);
        }

        // ===== TICKETS MAINTENANCE =====
        String[] techniciens = {"Ali Mansouri", "Said Lamrani", "Hassan Rafik"};
        for (int i = 1; i <= 18; i++) {
            Vehicule v = vehs.get(i % vehs.size());
            TicketMaintenance t = new TicketMaintenance();
            t.setNumeroTicket("TKT-" + String.format("%03d", i));
            t.setVehiculeId(v.getId());
            t.setVehiculeImmatriculation(v.getImmatriculation());
            t.setElement(elements[rnd.nextInt(elements.length)]);
            t.setCriticite(i % 4 == 0 ? TicketMaintenance.CriticiteTicket.CRITIQUE
                : i % 3 == 0 ? TicketMaintenance.CriticiteTicket.MINEURE
                : TicketMaintenance.CriticiteTicket.MOYENNE);
            TicketMaintenance.StatutTicket[] sts = TicketMaintenance.StatutTicket.values();
            t.setStatut(sts[rnd.nextInt(sts.length)]);
            t.setDescription("Ticket maintenance " + t.getElement() + " - " + v.getImmatriculation());
            t.setTechnicien(techniciens[rnd.nextInt(techniciens.length)]);
            t.setDateOuverture(LocalDateTime.now().minusDays(rnd.nextInt(90)));
            if (t.getStatut() == TicketMaintenance.StatutTicket.REPARÉ || t.getStatut() == TicketMaintenance.StatutTicket.CLÔTURÉ) {
                t.setDateCloture(LocalDateTime.now().minusDays(rnd.nextInt(30)));
            }
            t.setCoutEstime(200.0 + rnd.nextDouble() * 3000);
            t.setCoutReel(180.0 + rnd.nextDouble() * 3500);
            t.setPriorite(1 + rnd.nextInt(4));
            t.setCreePar("System");
            ticketRepository.save(t);
        }

        // ===== ANOMALIES CHECKUP =====
        for (int i = 1; i <= 20; i++) {
            Vehicule v = vehs.get(i % vehs.size());
            int ci = rnd.nextInt(chauffeurs.length);
            AnomalieCheckup a = new AnomalieCheckup();
            a.setAnomalieCode("ANO-" + String.format("%03d", i));
            a.setElement(elements[rnd.nextInt(elements.length)]);
            a.setCategorie(categories[rnd.nextInt(categories.length)]);
            a.setCriticite(criticites[rnd.nextInt(criticites.length)]);
            a.setDescription("Anomalie " + a.getElement() + " détectée");
            a.setVehiculeId(v.getId());
            a.setVehiculeImmatriculation(v.getImmatriculation());
            a.setChauffeurId(chauffeurIds[ci]);
            a.setChauffeurNom(chauffeurs[ci]);
            a.setSource("CHECKUP");
            a.setStatut(i % 3 == 0 ? AnomalieCheckup.AnomalieStatut.REPAREE
                : i % 2 == 0 ? AnomalieCheckup.AnomalieStatut.EN_REPARATION
                : AnomalieCheckup.AnomalieStatut.DETECTEE);
            a.setDateDetection(LocalDateTime.now().minusDays(rnd.nextInt(90)));
            a.setObservation("Observation " + i);
            anomalieRepository.save(a);
        }

        // ===== DEPARTS HISTORIQUE =====
        for (int i = 1; i <= 20; i++) {
            Vehicule v = vehs.get(i % vehs.size());
            int ci = rnd.nextInt(chauffeurs.length);
            DepartHistorique dh = new DepartHistorique(
                "DEP-" + String.format("%03d", i),
                "TOUR-" + (100 + i),
                chauffeurIds[ci],
                chauffeurs[ci],
                v.getId(),
                v.getImmatriculation(),
                rnd.nextBoolean() ? "CONFORME" : "NON_CONFORME"
            );
            dh.setStatutVehicule(v.getStatut() != null ? v.getStatut() : "DISPONIBLE");
            dh.setBranchCode(v.getBranchCode());
            departRepository.save(dh);
        }

        // ===== DRIVER PRESENCE =====
        for (int i = 0; i < chauffeurs.length; i++) {
            DriverPresence dp = new DriverPresence(
                chauffeurIds[i], "CHF00" + (i + 1), chauffeurs[i], "MANUAL");
            presenceRepository.save(dp);
        }

        log.info("PowerBiSeedDataInitializer: terminé - {} déc, {} tickets, {} anomalies, {} départs, {} présences",
            declarationRepository.count(), ticketRepository.count(), anomalieRepository.count(),
            departRepository.count(), presenceRepository.count());
    }
}
