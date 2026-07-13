package com.example.usermanagement.service;

import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.model.DriverChecklist;
import com.example.usermanagement.repository.DeclarationRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExcelImportService {

    private final DeclarationRepository declarationRepository;

    public ExcelImportService(DeclarationRepository declarationRepository) {
        this.declarationRepository = declarationRepository;
    }

    // Get all declarations (reusing existing data)
    public List<DeclarationIncident> getAllDeclarations() {
        return declarationRepository.findAll();
    }

    // Get filtered declarations
    public List<DeclarationIncident> getFilteredDeclarations(String typePanne, String criticite, String statut) {
        List<DeclarationIncident> all = declarationRepository.findAll();
        
        return all.stream()
            .filter(d -> typePanne == null || typePanne.isEmpty() || 
                       d.getTypePanneFrancais() != null && d.getTypePanneFrancais().equalsIgnoreCase(typePanne))
            .filter(d -> criticite == null || criticite.isEmpty() || 
                       d.getCriticite() != null && d.getCriticite().equalsIgnoreCase(criticite))
            .filter(d -> statut == null || statut.isEmpty() || 
                       d.getStatut() != null && d.getStatut().equalsIgnoreCase(statut))
            .collect(Collectors.toList());
    }

    // Get distinct values for filters
    public List<String> getDistinctTypePanne() {
        return declarationRepository.findAll().stream()
            .map(DeclarationIncident::getTypePanneFrancais)
            .filter(type -> type != null && !type.isEmpty())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    public List<String> getDistinctCriticite() {
        return declarationRepository.findAll().stream()
            .map(DeclarationIncident::getCriticite)
            .filter(c -> c != null && !c.isEmpty())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    public List<String> getDistinctStatut() {
        return declarationRepository.findAll().stream()
            .map(DeclarationIncident::getStatut)
            .filter(s -> s != null && !s.isEmpty())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    // Export declarations to Excel
    public byte[] exportToExcel(List<DeclarationIncident> declarations) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Déclarations");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "N° Déclaration", "Date", "Type Panne", "Criticité", 
                "Statut", "Description", "Chauffeur", "Immatriculation", 
                "Kilométrage", "Lieu", "Date Réparation", "Durée Réparation", "État"
            };
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(createHeaderStyle(workbook));
            }
            
            // Fill data rows
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int rowNum = 1;
            
            for (DeclarationIncident decl : declarations) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(decl.getNumeroDemande() != null ? decl.getNumeroDemande() : "");
                row.createCell(1).setCellValue(decl.getDateHeure() != null ? decl.getDateHeure().format(dateFormatter) : "");
                row.createCell(2).setCellValue(decl.getTypePanneFrancais() != null ? decl.getTypePanneFrancais() : "");
                row.createCell(3).setCellValue(decl.getCriticite() != null ? decl.getCriticite() : "");
                row.createCell(4).setCellValue(decl.getStatut() != null ? decl.getStatut() : "");
                row.createCell(5).setCellValue(decl.getDescriptionFrancais() != null ? decl.getDescriptionFrancais() : "");
                row.createCell(6).setCellValue(decl.getChauffeurNom() != null ? decl.getChauffeurNom() : "");
                row.createCell(7).setCellValue(decl.getVehiculeImmatriculation() != null ? decl.getVehiculeImmatriculation() : "");
                row.createCell(8).setCellValue(decl.getKilometrage() != null ? decl.getKilometrage().toString() : "");
                row.createCell(9).setCellValue(decl.getLocation() != null ? decl.getLocation() : "");
                row.createCell(10).setCellValue(decl.getDateReparation() != null ? decl.getDateReparation().format(dateFormatter) : "");
                row.createCell(11).setCellValue(decl.getDureeReparation() != null ? decl.getDureeReparation().toString() : "");
                row.createCell(12).setCellValue(decl.getEtat() != null ? decl.getEtat() : "");
            }
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    // Get dashboard statistics
    public Map<String, Object> getDashboardStats() {
        List<DeclarationIncident> all = declarationRepository.findAll();
        
        Map<String, Long> byTypePanne = all.stream()
            .filter(d -> d.getTypePanneFrancais() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getTypePanneFrancais, Collectors.counting()));
        
        Map<String, Long> byCriticite = all.stream()
            .filter(d -> d.getCriticite() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getCriticite, Collectors.counting()));
        
        Map<String, Long> byStatut = all.stream()
            .filter(d -> d.getStatut() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getStatut, Collectors.counting()));
        
        Map<String, Long> byImmatriculation = all.stream()
            .filter(d -> d.getVehiculeImmatriculation() != null)
            .collect(Collectors.groupingBy(DeclarationIncident::getVehiculeImmatriculation, Collectors.counting()));
        
        return Map.of(
            "totalDeclarations", all.size(),
            "byTypePanne", byTypePanne,
            "byCriticite", byCriticite,
            "byStatut", byStatut,
            "byImmatriculation", byImmatriculation
        );
    }

    public byte[] exportChecklistsToExcel(List<DriverChecklist> checklists) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Check-ups");

            CellStyle headerStyle = createHeaderStyle(workbook);
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "ID", "Date Check-up", "Chauffeur", "Matricule Chauffeur",
                "Vehicule", "Tournee", "Statut", "Conforme",
                "Pneus", "Freins", "Feux", "Extincteur", "Documents",
                "Carrosserie", "Huile Niveau", "Batterie", "Essuie-glaces", "Ceintures Securite",
                "Defauts", "Reparations", "Valide Par", "Date Validation", "Motif Refus",
                "Commentaire", "Feedback"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int rowNum = 1;
            for (DriverChecklist cl : checklists) {
                Row row = sheet.createRow(rowNum++);
                int col = 0;
                row.createCell(col++).setCellValue(cl.getId());
                row.createCell(col++).setCellValue(cl.getDateChecklist() != null ? cl.getDateChecklist().format(fmt) : "");
                row.createCell(col++).setCellValue(cl.getChauffeurNom() != null ? cl.getChauffeurNom() : "");
                row.createCell(col++).setCellValue(cl.getChauffeurMatricule() != null ? cl.getChauffeurMatricule() : "");
                row.createCell(col++).setCellValue(cl.getVehiculeImmatriculation() != null ? cl.getVehiculeImmatriculation() : "");
                row.createCell(col++).setCellValue(cl.getTourneeId() != null ? cl.getTourneeId() : "");
                row.createCell(col++).setCellValue(cl.getStatut() != null ? cl.getStatut() : "");
                row.createCell(col++).setCellValue(cl.getEstConforme() != null ? (cl.getEstConforme() ? "Oui" : "Non") : "");
                row.createCell(col++).setCellValue(cl.getPneus() != null ? (cl.getPneus() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getFreins() != null ? (cl.getFreins() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getFeux() != null ? (cl.getFeux() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getExtincteur() != null ? (cl.getExtincteur() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getDocuments() != null ? (cl.getDocuments() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getCarrosserie() != null ? (cl.getCarrosserie() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getHuileNiveau() != null ? (cl.getHuileNiveau() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getBatterie() != null ? (cl.getBatterie() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getEssuieGlaces() != null ? (cl.getEssuieGlaces() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getCeinturesSecurite() != null ? (cl.getCeinturesSecurite() ? "OK" : "NC") : "-");
                row.createCell(col++).setCellValue(cl.getDefautsJson() != null ? cl.getDefautsJson() : "");
                row.createCell(col++).setCellValue(cl.getReparationsJson() != null ? cl.getReparationsJson() : "");
                row.createCell(col++).setCellValue(cl.getValidePar() != null ? cl.getValidePar() : "");
                row.createCell(col++).setCellValue(cl.getDateValidation() != null ? cl.getDateValidation().format(fmt) : "");
                row.createCell(col++).setCellValue(cl.getMotifRefus() != null ? cl.getMotifRefus() : "");
                row.createCell(col++).setCellValue(cl.getCommentaireGeneral() != null ? cl.getCommentaireGeneral() : "");
                row.createCell(col++).setCellValue(cl.getFeedback() != null ? cl.getFeedback() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
