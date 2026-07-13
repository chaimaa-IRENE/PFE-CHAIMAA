package com.example.usermanagement.service;

import com.example.usermanagement.dto.LegalDocumentDTO;
import com.example.usermanagement.model.LegalDocument;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.LegalDocumentRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class LegalDocumentService {

    private final LegalDocumentRepository documentRepository;
    private final VehiculeRepository vehiculeRepository;

    // Patterns de dates françaises/anglaises courantes dans les OCR
    private static final Pattern[] DATE_PATTERNS = {
        Pattern.compile("\\b(\\d{2})[/-](\\d{2})[/-](\\d{4})\\b"),
        Pattern.compile("\\b(\\d{4})[/-](\\d{2})[/-](\\d{2})\\b"),
        Pattern.compile("\\b(\\d{2})\\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december)\\s+(\\d{4})\\b", Pattern.CASE_INSENSITIVE),
    };
    private static final Pattern NUMERO_DOC_PATTERN = Pattern.compile("(?:N[°º]?\\s*|numéro\\s*|numero\\s*|n\\s*)[:.]?\\s*([A-Z0-9/-]{5,20})", Pattern.CASE_INSENSITIVE);
    private static final Pattern PROPRIETAIRE_PATTERN = Pattern.compile("(?:Nom|Propriétaire|Proprietaire|Titulaire|Société|Societe|Client)\\s*[:\\.]?\\s*(.+)", Pattern.CASE_INSENSITIVE);

    private static final java.util.Map<String, Integer> FRENCH_MONTHS = java.util.Map.ofEntries(
        java.util.Map.entry("janvier", 1), java.util.Map.entry("février", 2), java.util.Map.entry("mars", 3),
        java.util.Map.entry("avril", 4), java.util.Map.entry("mai", 5), java.util.Map.entry("juin", 6),
        java.util.Map.entry("juillet", 7), java.util.Map.entry("août", 8), java.util.Map.entry("septembre", 9),
        java.util.Map.entry("octobre", 10), java.util.Map.entry("novembre", 11), java.util.Map.entry("décembre", 12)
    );
    private static final java.util.Map<String, Integer> ENGLISH_MONTHS = java.util.Map.ofEntries(
        java.util.Map.entry("january", 1), java.util.Map.entry("february", 2), java.util.Map.entry("march", 3),
        java.util.Map.entry("april", 4), java.util.Map.entry("may", 5), java.util.Map.entry("june", 6),
        java.util.Map.entry("july", 7), java.util.Map.entry("august", 8), java.util.Map.entry("september", 9),
        java.util.Map.entry("october", 10), java.util.Map.entry("november", 11), java.util.Map.entry("december", 12)
    );

    public LegalDocumentService(LegalDocumentRepository documentRepository, VehiculeRepository vehiculeRepository) {
        this.documentRepository = documentRepository;
        this.vehiculeRepository = vehiculeRepository;
    }

    public LegalDocument importDocument(String vehiculeImmatriculation, String type, String numeroDocument,
                                        LocalDate dateExpiration, String proprietaire, String importePar,
                                        String ocrData, String fichierUrl) {
        Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(vehiculeImmatriculation);
        if (vOpt.isEmpty()) return null;

        Vehicule v = vOpt.get();
        LegalDocument doc = new LegalDocument(v.getId(), vehiculeImmatriculation, type);
        doc.setNumeroDocument(numeroDocument);
        doc.setDateExpiration(dateExpiration);
        doc.setProprietaire(proprietaire);
        doc.setImportePar(importePar);
        doc.setOcrData(ocrData);
        doc.setFichierUrl(fichierUrl);
        doc.updateStatut();
        return documentRepository.save(doc);
    }

    public LegalDocument importDocumentWithOCR(String vehiculeImmatriculation, String type, MultipartFile file,
                                                String importePar) {
        Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(vehiculeImmatriculation);
        if (vOpt.isEmpty()) return null;

        Vehicule v = vOpt.get();
        try {
            String ocrText = new String(file.getBytes());
            LegalDocument doc = new LegalDocument(v.getId(), vehiculeImmatriculation, type);
            doc.setImportePar(importePar);
            doc.setOcrData(ocrText);
            doc.setFichierUrl("/uploads/documents/" + file.getOriginalFilename());

            // Extraction automatique depuis OCR
            LocalDate dateExp = extractDateExpiration(ocrText);
            if (dateExp != null) doc.setDateExpiration(dateExp);

            String numero = extractNumeroDocument(ocrText);
            if (numero != null) doc.setNumeroDocument(numero);

            String proprietaire = extractProprietaire(ocrText);
            if (proprietaire != null) doc.setProprietaire(proprietaire);

            doc.updateStatut();
            return documentRepository.save(doc);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate extractDateExpiration(String text) {
        // Cherche la date la plus récente (probablement date d'expiration)
        LocalDate latest = null;
        for (Pattern p : DATE_PATTERNS) {
            Matcher m = p.matcher(text);
            while (m.find()) {
                try {
                    LocalDate date = null;
                    if (m.groupCount() == 3) {
                        if (m.group(1).length() == 4) {
                            // yyyy-MM-dd
                            date = LocalDate.of(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3)));
                        } else {
                            // dd/MM/yyyy ou MM/dd/yyyy
                            int first = Integer.parseInt(m.group(1));
                            int second = Integer.parseInt(m.group(2));
                            int year = Integer.parseInt(m.group(3));
                            if (year < 100) year += 2000;
                            // Si premier > 12, c'est jour
                            if (first > 12) date = LocalDate.of(year, second, first);
                            else date = LocalDate.of(year, first, second);
                        }
                    }
                    if (date != null && date.getYear() >= 2020 && date.getYear() <= 2035) {
                        if (latest == null || date.isAfter(latest)) latest = date;
                    }
                } catch (Exception ignored) {}
            }
        }
        // Cherche aussi les dates avec mois en texte
        for (java.util.Map.Entry<String, Integer> entry : FRENCH_MONTHS.entrySet()) {
            Pattern monthPattern = Pattern.compile("\\b(\\d{2})\\s+" + entry.getKey() + "\\s+(\\d{4})\\b", Pattern.CASE_INSENSITIVE);
            Matcher m = monthPattern.matcher(text.toLowerCase());
            while (m.find()) {
                try {
                    int day = Integer.parseInt(m.group(1));
                    int year = Integer.parseInt(m.group(2));
                    if (day >= 1 && day <= 31 && year >= 2020 && year <= 2035) {
                        LocalDate date = LocalDate.of(year, entry.getValue(), Math.min(day, 28));
                        if (latest == null || date.isAfter(latest)) latest = date;
                    }
                } catch (Exception ignored) {}
            }
        }
        return latest;
    }

    private String extractNumeroDocument(String text) {
        Matcher m = NUMERO_DOC_PATTERN.matcher(text);
        return m.find() ? m.group(1).trim() : null;
    }

    private String extractProprietaire(String text) {
        Matcher m = PROPRIETAIRE_PATTERN.matcher(text);
        if (m.find()) {
            String val = m.group(1).trim();
            // Limiter à 60 caractères
            return val.length() > 60 ? val.substring(0, 60) : val;
        }
        return null;
    }

    public List<LegalDocument> getDocumentsByVehicule(String immatriculation) {
        return documentRepository.findByVehiculeImmatriculation(immatriculation);
    }

    public List<LegalDocument> getDocumentsByType(String type) {
        return documentRepository.findByType(type);
    }

    public List<LegalDocument> getAllDocuments() {
        return documentRepository.findAll();
    }

    public LegalDocument updateDocument(Long id, LocalDate dateExpiration, String numeroDocument, String proprietaire) {
        Optional<LegalDocument> opt = documentRepository.findById(id);
        if (opt.isEmpty()) return null;

        LegalDocument doc = opt.get();
        if (dateExpiration != null) doc.setDateExpiration(dateExpiration);
        if (numeroDocument != null) doc.setNumeroDocument(numeroDocument);
        if (proprietaire != null) doc.setProprietaire(proprietaire);
        doc.updateStatut();
        return documentRepository.save(doc);
    }

    public LegalDocumentDTO toDTO(LegalDocument doc) {
        if (doc == null) return null;
        LegalDocumentDTO dto = new LegalDocumentDTO();
        dto.setId(doc.getId());
        dto.setVehiculeId(doc.getVehiculeId());
        dto.setVehiculeImmatriculation(doc.getVehiculeImmatriculation());
        dto.setType(doc.getType());
        dto.setNumeroDocument(doc.getNumeroDocument());
        dto.setDateExpiration(doc.getDateExpiration());
        dto.setProprietaire(doc.getProprietaire());
        dto.setFichierUrl(doc.getFichierUrl());
        dto.setStatut(doc.getStatut());
        dto.setDateImport(doc.getDateImport());
        return dto;
    }

    public List<LegalDocumentDTO> toDTOList(List<LegalDocument> docs) {
        return docs.stream().map(this::toDTO).collect(Collectors.toList());
    }
}
