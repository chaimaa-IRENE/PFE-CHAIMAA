package com.example.usermanagement.service;

import com.example.usermanagement.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendPasswordReset(User user, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(user.getEmail());
            message.setSubject("Réinitialisation de mot de passe - DriverHub");
            message.setText(String.format(
                "Bonjour %s %s,\n\n" +
                "Vous avez demandé la réinitialisation de votre mot de passe DriverHub.\n\n" +
                "Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :\n" +
                "http://localhost:3000/reset-password?token=%s\n\n" +
                "Ce lien est valable 1 heure.\n\n" +
                "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n" +
                "Cordialement,\nL'équipe DriverHub",
                user.getFirstname(), user.getName(), token
            ));
            mailSender.send(message);
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Email non envoyé (SMTP non configuré). Token de réinitialisation :");
            log.warn("═══════════════════════════════════════════════════");
            log.warn("  UTILISATEUR : {} {}", user.getFirstname(), user.getName());
            log.warn("  Email       : {}", user.getEmail());
            log.warn("  Token       : {}", token);
            log.warn("  Lien        : http://localhost:3000/reset-password?token={}", token);
            log.warn("═══════════════════════════════════════════════════");
        }
    }

    public void sendCredentials(User user, String tempPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(user.getEmail());
            message.setSubject("Votre compte DriverHub a été créé");
            message.setText(String.format(
                "Bonjour %s %s,\n\n" +
                "Votre compte sur DriverHub a été créé par l'administrateur.\n\n" +
                "Voici vos informations de connexion :\n" +
                "  Login : %s\n" +
                "  Mot de passe temporaire : %s\n\n" +
                "Lien de connexion : http://localhost:3000\n\n" +
                "Nous vous recommandons de changer votre mot de passe dès votre première connexion.\n\n" +
                "Cordialement,\nL'équipe DriverHub",
                user.getFirstname(), user.getName(),
                user.getUsername(),
                tempPassword
            ));
            mailSender.send(message);
            log.info("Credentials email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Email non envoyé (SMTP non configuré). Identifiants affichés ci-dessous :");
            log.warn("═══════════════════════════════════════════════════");
            log.warn("  NOUVEL UTILISATEUR : {} {}", user.getFirstname(), user.getName());
            log.warn("  Login             : {}", user.getUsername());
            log.warn("  Mot de passe      : {}", tempPassword);
            log.warn("  Email             : {}", user.getEmail());
            log.warn("═══════════════════════════════════════════════════");
        }
    }
}
