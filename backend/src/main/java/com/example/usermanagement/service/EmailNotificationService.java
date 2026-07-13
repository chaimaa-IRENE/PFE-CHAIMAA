package com.example.usermanagement.service;

import com.example.usermanagement.model.DriverChecklist;
import com.example.usermanagement.model.Role;
import com.example.usermanagement.model.User;
import com.example.usermanagement.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EmailNotificationService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:no-reply@driverhub.ma}")
    private String fromAddress;

    @Value("${spring.mail.enabled:true}")
    private boolean mailEnabled;

    public EmailNotificationService(UserRepository userRepository, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public void sendAlertSL(DriverChecklist cl, String subject) {
        List<User> slUsers = userRepository.findByRole(Role.SL);
        String html = buildChecklistHtml("Superviseur Livraison", cl,
            "Non-conformité détectée — Action terrain requise",
            "#e67e22");
        for (User u : slUsers) {
            sendHtmlEmail(u.getEmail(), "[DriverHub SL] " + subject, html);
        }
    }

    public void sendAlertRS(DriverChecklist cl, String subject) {
        List<User> rsUsers = userRepository.findByRole(Role.RS);
        boolean isRepair = cl.getPostRepair() != null && cl.getPostRepair();
        String html = buildChecklistHtml("Responsable Support", cl,
            isRepair ? "Validation technique requise — Réparation signalée" : "Anomalie détectée — Suivi requis",
            isRepair ? "#3498db" : "#e74c3c");
        for (User u : rsUsers) {
            sendHtmlEmail(u.getEmail(), "[DriverHub RS] " + subject, html);
        }
    }

    public void sendAlertRPF(DriverChecklist cl, String subject) {
        List<User> rpfUsers = userRepository.findByRole(Role.RPF);
        String html = buildChecklistHtml("Responsable Plateforme", cl,
            "Véhicule BLOQUÉ — Impact sur le plan de livraison",
            "#9b59b6");
        for (User u : rpfUsers) {
            sendHtmlEmail(u.getEmail(), "[DriverHub RPF] " + subject, html);
        }
    }

    public void sendAlertLD(String subject, String message) {
        List<User> ldUsers = userRepository.findByRole(Role.DRL);
        String html = buildSimpleHtml("Logistics Director", subject, message, "#c0392b");
        for (User u : ldUsers) {
            sendHtmlEmail(u.getEmail(), "[DriverHub LD] " + subject, html);
        }
    }

    public void sendAlertASM(DriverChecklist cl, String subject) {
        List<User> asmUsers = userRepository.findByRole(Role.ASM);
        String html = buildChecklistHtml("Agent Sécurité & Méthodes", cl,
            "Non-conformité détectée — Véhicule bloqué",
            "#e74c3c");
        for (User u : asmUsers) {
            sendHtmlEmail(u.getEmail(), "[DriverHub ASM] " + subject, html);
        }
    }

    public void sendAlertCritical(String subject, String message) {
        List<User> drlUsers = userRepository.findByRole(Role.DRL);
        List<User> rflUsers = userRepository.findByRole(Role.RFL);
        String html = buildSimpleHtml("Direction", "⚠️ ALERTE CRITIQUE — " + subject, message, "#c0392b");
        for (User u : drlUsers) sendHtmlEmail(u.getEmail(), "[DriverHub CRITIQUE] " + subject, html);
        for (User u : rflUsers) sendHtmlEmail(u.getEmail(), "[DriverHub CRITIQUE] " + subject, html);
    }

    public void notifyMaintenance(DriverChecklist cl, String itemKey) {
        List<User> maintUsers = userRepository.findByRole(Role.MAINTENANCE);
        String defectsDetail = cl.getDefautsJson() != null ? cl.getDefautsJson() : "—";
        String statutWorkflow = cl.getStatut() != null ? cl.getStatut() : "—";
        String html = buildChecklistHtml("Équipe Maintenance", cl,
            "Intervention requise — Élément : " + formatItem(itemKey) + " | Défauts: " + defectsDetail + " | Workflow: " + statutWorkflow,
            "#f39c12");
        for (User u : maintUsers) {
            sendHtmlEmail(u.getEmail(), "[DriverHub Maintenance] Intervention requite — " + cl.getVehiculeImmatriculation(), html);
        }
    }

    public void notifyChauffeur(DriverChecklist cl, String subject, String message) {
        List<User> chauffeurs = userRepository.findByRole(Role.CHAUFFEUR);
        Optional<User> targetChauffeur = chauffeurs.stream()
            .filter(u -> u.getId() != null && u.getId().equals(cl.getChauffeurId()))
            .findFirst();
        if (targetChauffeur.isPresent()) {
            String html = buildSimpleHtml("Conducteur", subject, message, "#2ecc71");
            sendHtmlEmail(targetChauffeur.get().getEmail(), "[DriverHub] " + subject, html);
        }
    }

    public void notifyChauffeurUnblock(DriverChecklist cl) {
        String subject = "✅ Véhicule débloqué — " + cl.getVehiculeImmatriculation();
        String message = "Bonjour " + cl.getChauffeurNom() + ",\n\n" +
            "Le véhicule " + cl.getVehiculeImmatriculation() + " est désormais conforme et autorisé à circuler.\n" +
            "Vous pouvez effectuer votre départ en toute sécurité.\n\n" +
            "Détails :\n" +
            "- Véhicule : " + cl.getVehiculeImmatriculation() + "\n" +
            "- Tournée : " + (cl.getTourneeId() != null ? cl.getTourneeId() : "—") + "\n" +
            "- Statut : Validé\n" +
            "- Validé par : " + (cl.getValidePar() != null ? cl.getValidePar() : "—");
        notifyChauffeur(cl, subject, message);
    }

    public void notifyChauffeurBlock(DriverChecklist cl) {
        String subject = "🚫 Véhicule bloqué — " + cl.getVehiculeImmatriculation();
        String arabicMsg = "\n\nيُمنع استعمال الشاحنة لوجود حالة عدم مطابقة. المرجو التواصل مع المسؤول المعني";
        String message = "Bonjour " + cl.getChauffeurNom() + ",\n\n" +
            "Le véhicule " + cl.getVehiculeImmatriculation() + " a été bloqué suite à une non-conformité détectée.\n" +
            "Vous ne pouvez pas effectuer votre départ tant que le problème n'est pas résolu.\n\n" +
            "Défauts signalés : " + (cl.getDefautsJson() != null ? cl.getDefautsJson() : "—") + arabicMsg;
        notifyChauffeur(cl, subject, message);
    }

    public void notifyPrestataire(DriverChecklist cl, String message) {
        List<User> prestataireUsers = userRepository.findByRole(Role.PRESTATAIRE);
        String html = buildChecklistHtml("Prestataire", cl, message, "#8e44ad");
        for (User u : prestataireUsers) {
            sendHtmlEmail(u.getEmail(), "[DriverHub Prestataire] Intervention requise — " + cl.getVehiculeImmatriculation(), html);
        }
    }

    private String buildChecklistHtml(String role, DriverChecklist cl, String description, String color) {
        String defects = cl.getDefautsJson() != null ? cl.getDefautsJson() : "—";
        String status = cl.getEstConforme() != null && cl.getEstConforme() ? "✅ Conforme" : "❌ Non conforme";
        String workflowStatus = cl.getStatut() != null ? cl.getStatut() : "—";
        String repairStatus = cl.getPostRepair() != null && cl.getPostRepair() ? "🔧 Réparation signalée" : "";
        String validatedBy = cl.getValidePar() != null ? cl.getValidePar() : "";
        String dateValidation = cl.getDateValidation() != null ? String.valueOf(cl.getDateValidation()) : "";

        return """
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden'>
              <div style='background:%s;color:#fff;padding:20px;text-align:center'>
                <h2 style='margin:0'>🚛 DriverHub — Alerte %s</h2>
              </div>
              <div style='padding:20px;background:#f9f9f9'>
                <p style='font-size:16px;font-weight:bold;color:#333'>%s</p>
                <table style='width:100%%;border-collapse:collapse;margin-top:15px'>
                  <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;width:140px'>Conducteur</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>%s</td></tr>
                  <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666'>Véhicule</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>%s</td></tr>
                  <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666'>Tournée</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>%s</td></tr>
                  <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666'>Date</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>%s</td></tr>
                  <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666'>Statut</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>%s</td></tr>
                  <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666'>Workflow</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>%s</td></tr>
                  %s%s
                  <tr><td style='padding:8px;color:#666' colspan='2'><strong>Défauts :</strong> %s</td></tr>
                </table>
              </div>
              <div style='background:%s;color:#fff;padding:12px;text-align:center;font-size:12px'>
                DriverHub — Système de gestion de flotte
              </div>
            </div>
            """.formatted(
                color, role, description,
                safe(cl.getChauffeurNom()), safe(cl.getVehiculeImmatriculation()),
                safe(cl.getTourneeId()), safe(String.valueOf(cl.getDateChecklist())),
                status, workflowStatus,
                repairStatus.isEmpty() ? "" : "<tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666'>Réparation</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>" + repairStatus + "</td></tr>",
                validatedBy.isEmpty() ? "" : "<tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666'>Validé par</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold'>" + validatedBy + (dateValidation.isEmpty() ? "" : " — " + dateValidation) + "</td></tr>",
                defects,
                color
        );
    }

    private String buildSimpleHtml(String role, String title, String message, String color) {
        return """
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden'>
              <div style='background:%s;color:#fff;padding:20px;text-align:center'>
                <h2 style='margin:0'>🚛 DriverHub — Alerte %s</h2>
              </div>
              <div style='padding:20px;background:#f9f9f9'>
                <p style='font-size:16px;font-weight:bold;color:#333'>%s</p>
                <p style='color:#555;line-height:1.6'>%s</p>
              </div>
              <div style='background:%s;color:#fff;padding:12px;text-align:center;font-size:12px'>
                DriverHub — Système de gestion de flotte
              </div>
            </div>
            """.formatted(color, role, title, message, color);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) {
            System.out.println("[EMAIL] ⚠️ Adresse email vide — email ignoré");
            return;
        }
        System.out.println("[EMAIL] 📤 Tentative envoi | To: " + to + " | Subject: " + subject + " | Timestamp: " + LocalDateTime.now());
        if (!mailEnabled) {
            System.out.println("[EMAIL] 📋 Mode simulation — email non envoyé (spring.mail.enabled=false)");
            return;
        }
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromAddress);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                mailSender.send(message);
                System.out.println("[EMAIL] ✅ Envoyé avec succès à " + to + " | Tentative: " + attempt);
                return;
            } catch (Exception e) {
                System.err.println("[EMAIL] ❌ Échec envoi à " + to + " | Tentative: " + attempt + "/" + maxRetries + " | Erreur: " + e.getMessage());
                if (attempt == maxRetries) {
                    System.err.println("[EMAIL] ❌ Toutes les tentatives épuisées pour " + to + " — email non envoyé");
                } else {
                    try { Thread.sleep(1000 * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        }
    }

    private String safe(String value) {
        return value != null ? value : "—";
    }

    private String formatItem(String key) {
        if (key == null) return "—";
        return switch (key) {
            case "pneus" -> "🛞 Pneus";
            case "freins" -> "🛑 Freins";
            case "feux" -> "💡 Feux";
            case "extincteur" -> "🧯 Extincteur";
            case "documents" -> "📄 Documents";
            case "carrosserie" -> "🚘 Carrosserie";
            case "huileNiveau" -> "🛢️ Huile";
            case "batterie" -> "🔋 Batterie";
            case "essuieGlaces" -> "💧 Essuie-glaces";
            case "ceinturesSecurite" -> "🔗 Ceintures";
            default -> key;
        };
    }
}
