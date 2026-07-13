package com.example.usermanagement.service;

import com.example.usermanagement.model.User;
import com.example.usermanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class UserValidationService {

    private static final Logger logger = LoggerFactory.getLogger(UserValidationService.class);
    private static final int VALIDATION_CODE_LENGTH = 6;
    private static final int VALIDATION_CODE_EXPIRY_HOURS = 24;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailNotificationService emailNotificationService;

    /**
     * Génère et envoie un code de validation par email
     */
    public String generateAndSendValidationCode(Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            logger.error("Utilisateur non trouvé avec ID: {}", userId);
            throw new RuntimeException("Utilisateur non trouvé");
        }

        User user = userOptional.get();
        
        // Générer un code de validation aléatoire
        String validationCode = generateRandomCode();
        
        // Définir la date d'expiration
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(VALIDATION_CODE_EXPIRY_HOURS);
        
        // Mettre à jour l'utilisateur
        user.setValidationCode(validationCode);
        user.setValidationCodeExpiresAt(expiresAt);
        user.setEmailValidated(false);
        
        userRepository.save(user);
        
        // Envoyer l'email avec le code de validation
        sendValidationEmail(user, validationCode);
        
        logger.info("Code de validation généré et envoyé pour l'utilisateur: {}", user.getUsername());
        
        return validationCode;
    }

    /**
     * Valide le code de validation
     */
    public boolean validateUserCode(String username, String code) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            logger.error("Utilisateur non trouvé avec username: {}", username);
            return false;
        }

        User user = userOptional.get();
        
        // Vérifier si le code est expiré
        if (user.getValidationCodeExpiresAt() != null && 
            user.getValidationCodeExpiresAt().isBefore(LocalDateTime.now())) {
            logger.warn("Code de validation expiré pour l'utilisateur: {}", username);
            return false;
        }
        
        // Vérifier si le code correspond
        if (user.getValidationCode() != null && user.getValidationCode().equals(code)) {
            user.setEmailValidated(true);
            user.setValidationCode(null);
            user.setValidationCodeExpiresAt(null);
            userRepository.save(user);
            
            logger.info("Code de validation validé avec succès pour l'utilisateur: {}", username);
            return true;
        }
        
        logger.warn("Code de validation invalide pour l'utilisateur: {}", username);
        return false;
    }

    /**
     * Régénère et renvoie un nouveau code de validation
     */
    public String regenerateValidationCode(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            logger.error("Utilisateur non trouvé avec username: {}", username);
            throw new RuntimeException("Utilisateur non trouvé");
        }

        User user = userOptional.get();
        
        // Générer un nouveau code
        String validationCode = generateRandomCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(VALIDATION_CODE_EXPIRY_HOURS);
        
        user.setValidationCode(validationCode);
        user.setValidationCodeExpiresAt(expiresAt);
        user.setEmailValidated(false);
        
        userRepository.save(user);
        
        // Envoyer l'email avec le nouveau code
        sendValidationEmail(user, validationCode);
        
        logger.info("Nouveau code de validation généré pour l'utilisateur: {}", username);
        
        return validationCode;
    }

    /**
     * Vérifie si l'utilisateur a validé son email
     */
    public boolean isEmailValidated(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return false;
        }
        return userOptional.get().getEmailValidated() != null && userOptional.get().getEmailValidated();
    }

    /**
     * Génère un code aléatoire de 6 chiffres
     */
    private String generateRandomCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < VALIDATION_CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    /**
     * Envoie l'email de validation
     */
    private void sendValidationEmail(User user, String validationCode) {
        String subject = "Validation de votre compte DriverHub";
        String message = String.format(
            "Bonjour %s %s,\n\n" +
            "Votre code de validation est: %s\n\n" +
            "Ce code expire dans %d heures.\n\n" +
            "Si vous n'avez pas demandé cette validation, veuillez ignorer cet email.\n\n" +
            "Cordialement,\n" +
            "L'équipe DriverHub",
            user.getFirstname(),
            user.getName(),
            validationCode,
            VALIDATION_CODE_EXPIRY_HOURS
        );
        
        try {
            emailNotificationService.sendAlertCritical(subject, message);
            logger.info("Email de validation envoyé à: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de validation à: {}", user.getEmail(), e);
        }
    }
}
