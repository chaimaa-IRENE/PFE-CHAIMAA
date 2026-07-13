package com.example.usermanagement.service;

import com.example.usermanagement.model.DocumentVehicule;
import com.example.usermanagement.model.DocumentVehicule.TypeDocument;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.DocumentVehiculeRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DocumentVehiculeService {

    private final DocumentVehiculeRepository repository;
    private final VehiculeRepository vehiculeRepository;
    private final FileStorageService fileStorageService;

    public DocumentVehiculeService(DocumentVehiculeRepository repository, VehiculeRepository vehiculeRepository, FileStorageService fileStorageService) {
        this.repository = repository;
        this.vehiculeRepository = vehiculeRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<DocumentVehicule> getAllActive() { return repository.findAllActive(); }
    public List<DocumentVehicule> getAllArchived() { return repository.findAllArchived(); }
    public Optional<DocumentVehicule> getById(Long id) { return repository.findById(id); }

    public List<DocumentVehicule> getByVehiculeId(Long vehiculeId) {
        return repository.findByVehiculeIdAndArchivedFalse(vehiculeId);
    }

    public List<DocumentVehicule> getByVehiculeIdAll(Long vehiculeId) {
        return repository.findByVehiculeId(vehiculeId);
    }

    public List<DocumentVehicule> getByType(TypeDocument type) {
        return repository.findByTypeDocumentActive(type);
    }

    public List<DocumentVehicule> getExpired() {
        return repository.findExpiredActive(LocalDateTime.now());
    }

    public List<DocumentVehicule> getExpiringSoon() {
        LocalDateTime now = LocalDateTime.now();
        return repository.findExpiringSoonActive(now, now.plusDays(30));
    }

    public List<DocumentVehicule> getMissing() {
        return repository.findMissingActive();
    }

    @Transactional
    public DocumentVehicule create(DocumentVehicule doc, MultipartFile file) {
        if (doc.getDateEmission() == null) doc.setDateEmission(LocalDateTime.now());
        if (doc.getDateExpiration() == null) doc.setDateExpiration(calculateExpiration(doc.getTypeDocument(), doc.getDateEmission()));
        doc.setCreatedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());
        if (file != null && !file.isEmpty()) {
            try { String filename = fileStorageService.store(file); doc.setFichierUrl(filename); }
            catch (Exception e) { doc.setFichierUrl(null); }
        }
        if (doc.getVehiculeId() != null) {
            vehiculeRepository.findById(doc.getVehiculeId()).ifPresent(v -> doc.setVehiculeImmatriculation(v.getImmatriculation()));
        }
        return repository.save(doc);
    }

    @Transactional
    public DocumentVehicule update(Long id, DocumentVehicule updated, MultipartFile file) {
        return repository.findById(id).map(doc -> {
            if (updated.getTypeDocument() != null) doc.setTypeDocument(updated.getTypeDocument());
            if (updated.getNumeroDocument() != null) doc.setNumeroDocument(updated.getNumeroDocument());
            if (updated.getDateEmission() != null) doc.setDateEmission(updated.getDateEmission());
            if (updated.getDateExpiration() != null) doc.setDateExpiration(updated.getDateExpiration());
            if (updated.getEstDisponible() != null) doc.setEstDisponible(updated.getEstDisponible());
            if (updated.getNotes() != null) doc.setNotes(updated.getNotes());
            if (file != null && !file.isEmpty()) {
                try { String fn = fileStorageService.store(file); doc.setFichierUrl(fn); }
                catch (Exception e) { }
            }
            doc.setUpdatedAt(LocalDateTime.now());
            return repository.save(doc);
        }).orElseThrow(() -> new RuntimeException("Document non trouve"));
    }

    @Transactional
    public DocumentVehicule updateDisponibilite(Long id, Boolean estDisponible) {
        return repository.findById(id).map(doc -> {
            doc.setEstDisponible(estDisponible);
            doc.setUpdatedAt(LocalDateTime.now());
            return repository.save(doc);
        }).orElseThrow(() -> new RuntimeException("Document non trouve"));
    }

    @Transactional
    public boolean archive(Long id, String archivedBy) {
        return repository.findById(id).map(doc -> {
            doc.setArchived(true);
            doc.setArchivedAt(LocalDateTime.now());
            doc.setArchivedBy(archivedBy);
            doc.setUpdatedAt(LocalDateTime.now());
            repository.save(doc);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean restore(Long id) {
        return repository.findById(id).map(doc -> {
            doc.setArchived(false);
            doc.setArchivedAt(null);
            doc.setArchivedBy(null);
            doc.setUpdatedAt(LocalDateTime.now());
            repository.save(doc);
            return true;
        }).orElse(false);
    }

    private LocalDateTime calculateExpiration(TypeDocument type, LocalDateTime emission) {
        if (emission == null) emission = LocalDateTime.now();
        switch (type) {
            case ASSURANCE: return emission.plusYears(1);
            case ONSSA: return emission.plusYears(2);
            case VISITE_TECHNIQUE: return emission.plusMonths(6);
            case CARTE_GRISE: return emission.plusYears(10);
            case METROLOGIQUE: return emission.plusYears(1);
            default: return emission.plusYears(1);
        }
    }

    public Map<String, Object> getDocumentStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", repository.count());
        stats.put("actifs", repository.findAllActive().size());
        stats.put("archives", repository.findAllArchived().size());
        stats.put("expires", getExpired().size());
        stats.put("expiringSoon", getExpiringSoon().size());
        stats.put("manquants", getMissing().size());
        for (TypeDocument type : TypeDocument.values()) {
            stats.put(type.name().toLowerCase(), repository.countByTypeDocumentAndArchivedFalse(type));
        }
        return stats;
    }

    public Map<String, Object> getVehicleDocumentStatus(Long vehiculeId) {
        Map<String, Object> status = new LinkedHashMap<>();
        List<DocumentVehicule> docs = getByVehiculeId(vehiculeId);
        LocalDateTime now = LocalDateTime.now();
        for (TypeDocument type : TypeDocument.values()) {
            Optional<DocumentVehicule> docOpt = docs.stream()
                .filter(d -> d.getTypeDocument() == type)
                .findFirst();
            if (docOpt.isPresent()) {
                DocumentVehicule doc = docOpt.get();
                String etat;
                if (!Boolean.TRUE.equals(doc.getEstDisponible())) {
                    etat = "MANQUANT";
                } else if (doc.getDateExpiration() != null && doc.getDateExpiration().isBefore(now)) {
                    etat = "EXPIRE";
                } else if (doc.getDateExpiration() != null && doc.getDateExpiration().isBefore(now.plusDays(30))) {
                    etat = "EXPIRE_BIENTOT";
                } else {
                    etat = "VALIDE";
                }
                Map<String, Object> docStatus = new LinkedHashMap<>();
                docStatus.put("type", type.name());
                docStatus.put("label", getLabel(type));
                docStatus.put("etat", etat);
                docStatus.put("numero", doc.getNumeroDocument());
                docStatus.put("dateEmission", doc.getDateEmission());
                docStatus.put("dateExpiration", doc.getDateExpiration());
                docStatus.put("estDisponible", doc.getEstDisponible());
                docStatus.put("id", doc.getId());
                status.put(type.name(), docStatus);
            } else {
                Map<String, Object> docStatus = new LinkedHashMap<>();
                docStatus.put("type", type.name());
                docStatus.put("label", getLabel(type));
                docStatus.put("etat", "MANQUANT");
                docStatus.put("estDisponible", false);
                status.put(type.name(), docStatus);
            }
        }
        return status;
    }

    public boolean verifierDocumentsObligatoires(Long vehiculeId) {
        Map<String, Object> status = getVehicleDocumentStatus(vehiculeId);
        String[] requiredDocs = {"ASSURANCE", "CARTE_GRISE", "VISITE_TECHNIQUE"};
        for (String type : requiredDocs) {
            Object entry = status.get(type);
            if (entry == null) return false;
            @SuppressWarnings("unchecked")
            Map<String, Object> ds = (Map<String, Object>) entry;
            String etat = (String) ds.get("etat");
            if (!"VALIDE".equals(etat)) return false;
        }
        return true;
    }

    private String getLabel(TypeDocument type) {
        switch (type) {
            case ASSURANCE: return "Assurance";
            case ONSSA: return "ONSSA";
            case VISITE_TECHNIQUE: return "Visite Technique";
            case CARTE_GRISE: return "Carte Grise";
            case METROLOGIQUE: return "Metrologique";
            default: return type.name();
        }
    }
}