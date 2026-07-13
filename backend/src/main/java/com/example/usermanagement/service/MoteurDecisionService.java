package com.example.usermanagement.service;

import com.example.usermanagement.model.*;
import com.example.usermanagement.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MoteurDecisionService {
    
    private static final Logger logger = LoggerFactory.getLogger(MoteurDecisionService.class);
    
    private final DriverChecklistRepository driverChecklistRepository;
    private final DocumentReglementaireRepository documentReglementaireRepository;
    private final VehiculeRepository vehiculeRepository;
    private final TicketMaintenanceRepository ticketMaintenanceRepository;
    private final VehicleBlockingRepository vehicleBlockingRepository;
    private final AuditLogRepository auditLogRepository;
    
    public MoteurDecisionService(DriverChecklistRepository driverChecklistRepository,
                                   DocumentReglementaireRepository documentReglementaireRepository,
                                   VehiculeRepository vehiculeRepository,
                                   TicketMaintenanceRepository ticketMaintenanceRepository,
                                   VehicleBlockingRepository vehicleBlockingRepository,
                                   AuditLogRepository auditLogRepository) {
        this.driverChecklistRepository = driverChecklistRepository;
        this.documentReglementaireRepository = documentReglementaireRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.ticketMaintenanceRepository = ticketMaintenanceRepository;
        this.vehicleBlockingRepository = vehicleBlockingRepository;
        this.auditLogRepository = auditLogRepository;
    }
    
    public ResultatConformite verifierConformiteVehicule(Long vehiculeId, Long chauffeurId) {
        ResultatConformite resultat = new ResultatConformite();
        resultat.setVehiculeId(vehiculeId);
        resultat.setChauffeurId(chauffeurId);
        resultat.setDateVerification(LocalDateTime.now());
        
        // 1. Vérifier les documents réglementaires
        VerificationDocuments verificationDocuments = verifierDocumentsVehicule(vehiculeId);
        resultat.setVerificationDocuments(verificationDocuments);
        
        // 2. Vérifier les tickets de maintenance critiques
        VerificationMaintenance verificationMaintenance = verifierMaintenanceVehicule(vehiculeId);
        resultat.setVerificationMaintenance(verificationMaintenance);
        
        // 3. Vérifier le dernier check-up si disponible
        VerificationCheckup verificationCheckup = verifierDernierCheckup(vehiculeId);
        resultat.setVerificationCheckup(verificationCheckup);
        
        // 4. Moteur de décision final
        appliquerMoteurDecision(resultat);
        
        // 5. Mettre à jour le statut du véhicule
        mettreAJourStatutVehicule(vehiculeId, resultat);
        
        // 6. Logger l'audit
        loggerAuditConformite(resultat);
        
        return resultat;
    }
    
    private VerificationDocuments verifierDocumentsVehicule(Long vehiculeId) {
        VerificationDocuments verification = new VerificationDocuments();
        
        if (vehiculeId == null) {
            verification.setConforme(false);
            verification.setMessage("Véhicule non spécifié");
            return verification;
        }
        
        List<DocumentReglementaire> documents = documentReglementaireRepository.findByVehiculeId(vehiculeId);
        long documentsExpirés = documents.stream()
                .filter(doc -> doc.estExpiré())
                .count();
        
        long documentsBientotExpires = documents.stream()
                .filter(doc -> doc.getStatutDocument() == DocumentReglementaire.StatutDocument.BIENTOT_EXPIRE)
                .count();
        
        verification.setTotalDocuments(documents.size());
        verification.setDocumentsExpirés((int) documentsExpirés);
        verification.setDocumentsBientotExpires((int) documentsBientotExpires);
        verification.setConforme(documentsExpirés == 0);
        
        if (documentsExpirés > 0) {
            verification.setMessage("Documents expirés: " + documentsExpirés);
            verification.setNiveauBlocage(NiveauBlocage.IMMEDIAT);
        } else if (documentsBientotExpires > 0) {
            verification.setMessage("Documents bientôt expirés: " + documentsBientotExpires);
            verification.setNiveauBlocage(NiveauBlocage.ALERTE);
        } else {
            verification.setMessage("Tous les documents sont valides");
            verification.setNiveauBlocage(NiveauBlocage.AUCUN);
        }
        
        return verification;
    }
    
    private VerificationMaintenance verifierMaintenanceVehicule(Long vehiculeId) {
        VerificationMaintenance verification = new VerificationMaintenance();
        
        if (vehiculeId == null) {
            verification.setConforme(true);
            verification.setMessage("Véhicule non spécifié");
            return verification;
        }
        
        List<TicketMaintenance> ticketsCritiques = ticketMaintenanceRepository
                .findOpenTicketsByCriticite(TicketMaintenance.CriticiteTicket.CRITIQUE)
                .stream()
                .filter(t -> t.getVehiculeId().equals(vehiculeId))
                .toList();
        
        verification.setTicketsCritiques(ticketsCritiques.size());
        verification.setConforme(ticketsCritiques.isEmpty());
        
        if (!ticketsCritiques.isEmpty()) {
            verification.setMessage("Tickets critiques ouverts: " + ticketsCritiques.size());
            verification.setNiveauBlocage(NiveauBlocage.IMMEDIAT);
            verification.setTickets(ticketsCritiques);
        } else {
            verification.setMessage("Aucun ticket critique");
            verification.setNiveauBlocage(NiveauBlocage.AUCUN);
        }
        
        return verification;
    }
    
    private VerificationCheckup verifierDernierCheckup(Long vehiculeId) {
        VerificationCheckup verification = new VerificationCheckup();
        
        if (vehiculeId == null) {
            verification.setConforme(true);
            verification.setMessage("Véhicule non spécifié");
            return verification;
        }
        
        // Récupérer le dernier check-up pour ce véhicule
        List<DriverChecklist> checkups = driverChecklistRepository.findByVehiculeIdOrderByDateChecklistDesc(vehiculeId);
        
        if (checkups.isEmpty()) {
            verification.setConforme(true);
            verification.setMessage("Aucun check-up effectué");
            verification.setNiveauBlocage(NiveauBlocage.AUCUN);
            return verification;
        }
        
        // Prendre le plus récent
        DriverChecklist dernierCheckup = checkups.get(checkups.size() - 1);
        
        verification.setDernierCheckupId(dernierCheckup.getId());
        verification.setDateDernierCheckup(dernierCheckup.getDateChecklist());
        verification.setEstConforme(dernierCheckup.getEstConforme());
        
        if (!dernierCheckup.getEstConforme()) {
            verification.setMessage("Dernier check-up non conforme");
            verification.setNiveauBlocage(NiveauBlocage.VALIDATION_RS);
            verification.setConforme(false);
        } else {
            verification.setMessage("Dernier check-up conforme");
            verification.setNiveauBlocage(NiveauBlocage.AUCUN);
            verification.setConforme(true);
        }
        
        return verification;
    }
    
    private void appliquerMoteurDecision(ResultatConformite resultat) {
        boolean documentsConformes = resultat.getVerificationDocuments().isConforme();
        boolean maintenanceConforme = resultat.getVerificationMaintenance().isConforme();
        boolean checkupConforme = resultat.getVerificationCheckup().isConforme();
        
        // Règle métier principale
        if (!documentsConformes || !maintenanceConforme) {
            resultat.setStatutFinal(StatutFinal.NON_CONFORME);
            resultat.setAutorisationDepart(false);
            resultat.setMotifBlocage("Documents expirés ou maintenance critique requise");
            resultat.setNiveauBlocage(NiveauBlocage.IMMEDIAT);
        } else if (!checkupConforme) {
            resultat.setStatutFinal(StatutFinal.NON_CONFORME);
            resultat.setAutorisationDepart(false);
            resultat.setMotifBlocage("Check-up non conforme - validation RS requise");
            resultat.setNiveauBlocage(NiveauBlocage.VALIDATION_RS);
        } else {
            resultat.setStatutFinal(StatutFinal.CONFORME);
            resultat.setAutorisationDepart(true);
            resultat.setMotifBlocage(null);
            resultat.setNiveauBlocage(NiveauBlocage.AUCUN);
        }
        
        logger.info("Moteur décision - Véhicule {}: Statut={}, Autorisation={}, Niveau={}", 
                resultat.getVehiculeId(), resultat.getStatutFinal(), 
                resultat.isAutorisationDepart(), resultat.getNiveauBlocage());
    }
    
    @Transactional
    private void mettreAJourStatutVehicule(Long vehiculeId, ResultatConformite resultat) {
        if (vehiculeId == null) return;
        
        Optional<Vehicule> vehicule = vehiculeRepository.findById(vehiculeId);
        if (vehicule.isPresent()) {
            Vehicule v = vehicule.get();
            v.setConforme(resultat.getStatutFinal() == StatutFinal.CONFORME);
            
            if (!resultat.isAutorisationDepart()) {
                v.setStatut("BLOQUE");
                
                // Créer ou mettre à jour le blocage
                creerOuMettreAJourBlocage(vehiculeId, resultat);
            } else {
                v.setStatut("DISPONIBLE");
                
                // Supprimer le blocage s'il existe
                supprimerBlocage(vehiculeId);
            }
            
            vehiculeRepository.save(v);
        }
    }
    
    private void creerOuMettreAJourBlocage(Long vehiculeId, ResultatConformite resultat) {
        Optional<VehicleBlocking> existingBlock = vehicleBlockingRepository.findByVehiculeId(vehiculeId);
        
        VehicleBlocking block;
        if (existingBlock.isPresent()) {
            block = existingBlock.get();
        } else {
            block = new VehicleBlocking();
            block.setVehiculeId(vehiculeId);
        }
        
        block.setRaison(resultat.getMotifBlocage());
        block.setDateBlocage(LocalDateTime.now());
        block.setBloque(true);
        
        vehicleBlockingRepository.save(block);
    }
    
    private void supprimerBlocage(Long vehiculeId) {
        Optional<VehicleBlocking> existingBlock = vehicleBlockingRepository.findByVehiculeId(vehiculeId);
        if (existingBlock.isPresent()) {
            VehicleBlocking block = existingBlock.get();
            block.setBloque(false);
            block.setDateDeblocage(LocalDateTime.now());
            vehicleBlockingRepository.save(block);
        }
    }
    
    private void loggerAuditConformite(ResultatConformite resultat) {
        AuditLog audit = new AuditLog();
        audit.setEntityType("Vehicule");
        audit.setEntityId(resultat.getVehiculeId());
        audit.setAction("VERIFICATION_CONFORMITE");
        audit.setOldValue(null);
        audit.setNewValue("Statut: " + resultat.getStatutFinal() + ", Autorisation: " + resultat.isAutorisationDepart());
        audit.setUserName("SYSTEME");
        audit.setTimestamp(LocalDateTime.now());
        
        auditLogRepository.save(audit);
    }
    
    // Classes internes pour structurer les résultats
    public static class ResultatConformite {
        private Long vehiculeId;
        private Long chauffeurId;
        private LocalDateTime dateVerification;
        private VerificationDocuments verificationDocuments;
        private VerificationMaintenance verificationMaintenance;
        private VerificationCheckup verificationCheckup;
        private StatutFinal statutFinal;
        private boolean autorisationDepart;
        private String motifBlocage;
        private NiveauBlocage niveauBlocage;
        
        // Getters and Setters
        public Long getVehiculeId() { return vehiculeId; }
        public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }
        public Long getChauffeurId() { return chauffeurId; }
        public void setChauffeurId(Long chauffeurId) { this.chauffeurId = chauffeurId; }
        public LocalDateTime getDateVerification() { return dateVerification; }
        public void setDateVerification(LocalDateTime dateVerification) { this.dateVerification = dateVerification; }
        public VerificationDocuments getVerificationDocuments() { return verificationDocuments; }
        public void setVerificationDocuments(VerificationDocuments verificationDocuments) { this.verificationDocuments = verificationDocuments; }
        public VerificationMaintenance getVerificationMaintenance() { return verificationMaintenance; }
        public void setVerificationMaintenance(VerificationMaintenance verificationMaintenance) { this.verificationMaintenance = verificationMaintenance; }
        public VerificationCheckup getVerificationCheckup() { return verificationCheckup; }
        public void setVerificationCheckup(VerificationCheckup verificationCheckup) { this.verificationCheckup = verificationCheckup; }
        public StatutFinal getStatutFinal() { return statutFinal; }
        public void setStatutFinal(StatutFinal statutFinal) { this.statutFinal = statutFinal; }
        public boolean isAutorisationDepart() { return autorisationDepart; }
        public void setAutorisationDepart(boolean autorisationDepart) { this.autorisationDepart = autorisationDepart; }
        public String getMotifBlocage() { return motifBlocage; }
        public void setMotifBlocage(String motifBlocage) { this.motifBlocage = motifBlocage; }
        public NiveauBlocage getNiveauBlocage() { return niveauBlocage; }
        public void setNiveauBlocage(NiveauBlocage niveauBlocage) { this.niveauBlocage = niveauBlocage; }
    }
    
    public static class VerificationDocuments {
        private int totalDocuments;
        private int documentsExpirés;
        private int documentsBientotExpires;
        private boolean conforme;
        private String message;
        private NiveauBlocage niveauBlocage;
        
        // Getters and Setters
        public int getTotalDocuments() { return totalDocuments; }
        public void setTotalDocuments(int totalDocuments) { this.totalDocuments = totalDocuments; }
        public int getDocumentsExpirés() { return documentsExpirés; }
        public void setDocumentsExpirés(int documentsExpirés) { this.documentsExpirés = documentsExpirés; }
        public int getDocumentsBientotExpires() { return documentsBientotExpires; }
        public void setDocumentsBientotExpires(int documentsBientotExpires) { this.documentsBientotExpires = documentsBientotExpires; }
        public boolean isConforme() { return conforme; }
        public void setConforme(boolean conforme) { this.conforme = conforme; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public NiveauBlocage getNiveauBlocage() { return niveauBlocage; }
        public void setNiveauBlocage(NiveauBlocage niveauBlocage) { this.niveauBlocage = niveauBlocage; }
    }
    
    public static class VerificationMaintenance {
        private int ticketsCritiques;
        private boolean conforme;
        private String message;
        private NiveauBlocage niveauBlocage;
        private List<TicketMaintenance> tickets;
        
        // Getters and Setters
        public int getTicketsCritiques() { return ticketsCritiques; }
        public void setTicketsCritiques(int ticketsCritiques) { this.ticketsCritiques = ticketsCritiques; }
        public boolean isConforme() { return conforme; }
        public void setConforme(boolean conforme) { this.conforme = conforme; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public NiveauBlocage getNiveauBlocage() { return niveauBlocage; }
        public void setNiveauBlocage(NiveauBlocage niveauBlocage) { this.niveauBlocage = niveauBlocage; }
        public List<TicketMaintenance> getTickets() { return tickets; }
        public void setTickets(List<TicketMaintenance> tickets) { this.tickets = tickets; }
    }
    
    public static class VerificationCheckup {
        private Long dernierCheckupId;
        private LocalDateTime dateDernierCheckup;
        private boolean estConforme;
        private boolean conforme;
        private String message;
        private NiveauBlocage niveauBlocage;
        
        // Getters and Setters
        public Long getDernierCheckupId() { return dernierCheckupId; }
        public void setDernierCheckupId(Long dernierCheckupId) { this.dernierCheckupId = dernierCheckupId; }
        public LocalDateTime getDateDernierCheckup() { return dateDernierCheckup; }
        public void setDateDernierCheckup(LocalDateTime dateDernierCheckup) { this.dateDernierCheckup = dateDernierCheckup; }
        public boolean isEstConforme() { return estConforme; }
        public void setEstConforme(boolean estConforme) { this.estConforme = estConforme; }
        public boolean isConforme() { return conforme; }
        public void setConforme(boolean conforme) { this.conforme = conforme; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public NiveauBlocage getNiveauBlocage() { return niveauBlocage; }
        public void setNiveauBlocage(NiveauBlocage niveauBlocage) { this.niveauBlocage = niveauBlocage; }
    }
    
    public enum StatutFinal {
        CONFORME,
        NON_CONFORME
    }
    
    public enum NiveauBlocage {
        AUCUN,
        ALERTE,
        VALIDATION_RS,
        IMMEDIAT
    }
}
