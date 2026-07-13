package com.example.usermanagement.service;

import com.example.usermanagement.model.DocumentReglementaire;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.DocumentReglementaireRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DocumentReglementaireService {
    
    private static final Logger logger = LoggerFactory.getLogger(DocumentReglementaireService.class);
    
    private final DocumentReglementaireRepository documentReglementaireRepository;
    private final VehiculeRepository vehiculeRepository;
    private final EmailNotificationService emailNotificationService;
    
    public DocumentReglementaireService(DocumentReglementaireRepository documentReglementaireRepository,
                                       VehiculeRepository vehiculeRepository,
                                       EmailNotificationService emailNotificationService) {
        this.documentReglementaireRepository = documentReglementaireRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.emailNotificationService = emailNotificationService;
    }
    
    public List<DocumentReglementaire> getAllDocuments() {
        return documentReglementaireRepository.findAll();
    }
    
    public Optional<DocumentReglementaire> getDocumentById(Long id) {
        return documentReglementaireRepository.findById(id);
    }
    
    public List<DocumentReglementaire> getDocumentsByVehicule(Long vehiculeId) {
        return documentReglementaireRepository.findByVehiculeId(vehiculeId);
    }
    
    public List<DocumentReglementaire> getDocumentsByVehiculeImmatriculation(String immatriculation) {
        return documentReglementaireRepository.findByVehiculeImmatriculation(immatriculation);
    }
    
    public List<DocumentReglementaire> getDocumentsByType(DocumentReglementaire.TypeDocument type) {
        return documentReglementaireRepository.findByTypeDocument(type);
    }
    
    public List<DocumentReglementaire> getDocumentsByStatut(DocumentReglementaire.StatutDocument statut) {
        return documentReglementaireRepository.findByStatutDocument(statut);
    }
    
    public Optional<DocumentReglementaire> getDocumentByVehiculeAndType(Long vehiculeId, DocumentReglementaire.TypeDocument type) {
        return documentReglementaireRepository.findByVehiculeIdAndTypeDocument(vehiculeId, type);
    }
    
    @Transactional
    public DocumentReglementaire createDocument(DocumentReglementaire document) {
        // Vérifier que le véhicule existe
        if (document.getVehiculeId() != null) {
            Optional<Vehicule> vehicule = vehiculeRepository.findById(document.getVehiculeId());
            if (vehicule.isPresent()) {
                document.setVehiculeImmatriculation(vehicule.get().getImmatriculation());
            }
        }
        
        DocumentReglementaire savedDocument = documentReglementaireRepository.save(document);
        logger.info("Document réglementaire créé: {} pour véhicule {}", 
                savedDocument.getTypeDocument(), savedDocument.getVehiculeImmatriculation());
        
        // Vérifier conformité véhicule après ajout
        verifierConformiteVehicule(document.getVehiculeId());
        
        return savedDocument;
    }
    
    @Transactional
    public DocumentReglementaire updateDocument(Long id, DocumentReglementaire documentDetails) {
        return documentReglementaireRepository.findById(id).map(document -> {
            document.setTypeDocument(documentDetails.getTypeDocument());
            document.setNumeroDocument(documentDetails.getNumeroDocument());
            document.setDateEmission(documentDetails.getDateEmission());
            document.setDateExpiration(documentDetails.getDateExpiration());
            document.setFichierPdf(documentDetails.getFichierPdf());
            document.setFichierUrl(documentDetails.getFichierUrl());
            
            DocumentReglementaire updatedDocument = documentReglementaireRepository.save(document);
            logger.info("Document réglementaire mis à jour: {}", updatedDocument.getTypeDocument());
            
            // Vérifier conformité véhicule après modification
            verifierConformiteVehicule(document.getVehiculeId());
            
            return updatedDocument;
        }).orElse(null);
    }
    
    @Transactional
    public void deleteDocument(Long id) {
        Optional<DocumentReglementaire> document = documentReglementaireRepository.findById(id);
        if (document.isPresent()) {
            Long vehiculeId = document.get().getVehiculeId();
            documentReglementaireRepository.deleteById(id);
            logger.info("Document réglementaire supprimé: {}", id);
            
            // Vérifier conformité véhicule après suppression
            if (vehiculeId != null) {
                verifierConformiteVehicule(vehiculeId);
            }
        }
    }
    
    public List<DocumentReglementaire> getDocumentsExpiringBefore(LocalDate date) {
        return documentReglementaireRepository.findDocumentsExpiringBefore(date);
    }
    
    public List<DocumentReglementaire> getDocumentsExpiringBetween(LocalDate debut, LocalDate fin) {
        return documentReglementaireRepository.findDocumentsExpiringBetween(debut, fin);
    }
    
    public long countExpiredDocumentsByVehicule(Long vehiculeId) {
        return documentReglementaireRepository.countExpiredDocumentsByVehicule(vehiculeId);
    }
    
    public List<DocumentReglementaire> getDocumentsNeedingAlert() {
        return documentReglementaireRepository.findDocumentsNeedingAlert();
    }
    
    public List<DocumentReglementaire> getValidDocumentsByVehicule(Long vehiculeId) {
        return documentReglementaireRepository.findValidDocumentsByVehicule(vehiculeId);
    }
    
    @Transactional
    public void envoyerAlertesExpiration() {
        List<DocumentReglementaire> documentsNeedingAlert = getDocumentsNeedingAlert();
        
        for (DocumentReglementaire document : documentsNeedingAlert) {
            try {
                // Envoyer notification email
                emailNotificationService.sendAlertCritical("Expiration document", "Document " + document.getTypeDocument() + " du véhicule " + document.getVehiculeImmatriculation() + " expire le " + document.getDateExpiration());
                
                // Marquer comme alerte envoyée
                document.setAlerteEnvoyee(true);
                documentReglementaireRepository.save(document);
                
                logger.info("Alerte expiration envoyée pour document {} du véhicule {}", 
                        document.getTypeDocument(), document.getVehiculeImmatriculation());
            } catch (Exception e) {
                logger.error("Erreur lors de l'envoi d'alerte pour document {}", document.getId(), e);
            }
        }
    }
    
    public boolean verifierConformiteVehicule(Long vehiculeId) {
        if (vehiculeId == null) {
            return false;
        }
        
        long expiredDocuments = documentReglementaireRepository.countExpiredDocumentsByVehicule(vehiculeId);
        boolean conforme = expiredDocuments == 0;
        
        // Mettre à jour le statut du véhicule
        Optional<Vehicule> vehicule = vehiculeRepository.findById(vehiculeId);
        if (vehicule.isPresent()) {
            vehicule.get().setConforme(conforme);
            vehiculeRepository.save(vehicule.get());
            
            if (!conforme) {
                logger.warn("Véhicule {} NON CONFORME - {} documents expirés", 
                        vehicule.get().getImmatriculation(), expiredDocuments);
            }
        }
        
        return conforme;
    }
    
    public boolean verifierDocumentsObligatoires(Long vehiculeId) {
        // Vérifier que tous les documents obligatoires sont présents et valides
        DocumentReglementaire.TypeDocument[] documentsObligatoires = {
            DocumentReglementaire.TypeDocument.ASSURANCE,
            DocumentReglementaire.TypeDocument.CARTE_GRISE,
            DocumentReglementaire.TypeDocument.VISITE_TECHNIQUE
        };
        
        for (DocumentReglementaire.TypeDocument type : documentsObligatoires) {
            Optional<DocumentReglementaire> doc = getDocumentByVehiculeAndType(vehiculeId, type);
            if (doc.isEmpty() || !doc.get().estValide()) {
                logger.warn("Document obligatoire manquant ou expiré: {} pour véhicule {}", type, vehiculeId);
                return false;
            }
        }
        
        return true;
    }
}
