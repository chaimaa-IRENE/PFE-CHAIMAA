package com.example.usermanagement.service;

import com.example.usermanagement.dto.AuthResponse;
import com.example.usermanagement.model.ConnectionAudit;
import com.example.usermanagement.model.Role;
import com.example.usermanagement.model.User;
import com.example.usermanagement.repository.ConnectionAuditRepository;
import com.example.usermanagement.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final ConnectionAuditRepository auditRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FaceService faceService;
    private final EmailService emailService;

    public UserService(UserRepository userRepository, ConnectionAuditRepository auditRepository,
                       JwtService jwtService, FaceService faceService, EmailService emailService) {
        this.userRepository = userRepository;
        this.auditRepository = auditRepository;
        this.jwtService = jwtService;
        this.faceService = faceService;
        this.emailService = emailService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Map<String, Object> requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return Map.of("success", true, "message", "Si cet email existe, un lien de réinitialisation a été envoyé.");
        }
        User user = userOpt.get();
        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(1));
        userRepository.save(user);
        emailService.sendPasswordReset(user, token);
        return Map.of("success", true, "message", "Si cet email existe, un lien de réinitialisation a été envoyé.");
    }

    public Map<String, Object> resetPassword(String token, String newPassword) {
        Optional<User> userOpt = userRepository.findByPasswordResetToken(token);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "error", "Token invalide ou déjà utilisé.");
        }
        User user = userOpt.get();
        if (user.getPasswordResetTokenExpiresAt() == null ||
            user.getPasswordResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            return Map.of("success", false, "error", "Token expiré. Veuillez refaire une demande.");
        }
        if (newPassword == null || newPassword.length() < 4) {
            return Map.of("success", false, "error", "Le mot de passe doit contenir au moins 4 caractères.");
        }
        String hash = passwordEncoder.encode(newPassword);
        user.setPassword(hash);
        user.setPasswordDigest(hash);
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        user.setLastUpdate(LocalDateTime.now());
        userRepository.save(user);
        return Map.of("success", true, "message", "Mot de passe réinitialisé avec succès.");
    }

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (user.getPersonCode() == null || user.getPersonCode().isBlank()) {
            throw new RuntimeException("PERSON_CODE is required");
        }

        user.setCreationDate(LocalDate.now());
        user.setLastUpdate(LocalDateTime.now());
        if (user.getStatus() == null) {
            user.setStatus("ACTIF");
        }
        if (user.getHoldPerson() == null) {
            user.setHoldPerson(false);
        }

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            String hash = passwordEncoder.encode(user.getPassword());
            user.setPassword(hash);
            user.setPasswordDigest(hash);
        }

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByPersonCode(String personCode) {
        return userRepository.findByPersonCode(personCode);
    }

    public Optional<AuthResponse> authenticateWithToken(String username, String password) {
        return authenticate(username, password).map(user -> buildAuthResponse(user, "PASSWORD"));
    }

    public Map<String, Object> registerFace(Long userId, String faceImage) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "error", "Utilisateur non trouvé");
        }
        Optional<String> normalized = faceService.detectAndNormalizeFace(faceImage);
        if (normalized.isEmpty()) {
            return Map.of("success", false, "error", "Aucun visage détecté dans l'image");
        }
        User user = userOpt.get();
        user.setFaceDescriptor(normalized.get());
        user.setFaceRegistered(true);
        userRepository.save(user);
        return Map.of("success", true, "message", "Visage enregistré avec succès");
    }

    public boolean hasFaceRegistered(String username) {
        return userRepository.findByUsername(username)
                .map(User::getFaceRegistered)
                .orElse(false);
    }

    public boolean hasFaceRegisteredById(Long userId) {
        return userRepository.findById(userId)
                .map(User::getFaceRegistered)
                .orElse(false);
    }

    public Optional<AuthResponse> authenticateWithFace(String username, String faceImage) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            auditLogin(null, username, null, "FACE_ID", false);
            return Optional.empty();
        }
        User user = userOpt.get();
        if (user.getHoldPerson() != null && user.getHoldPerson()) {
            auditLogin(user.getId(), username, user.getRole() != null ? user.getRole().name() : null, "FACE_ID", false);
            return Optional.empty();
        }
        if (!user.getFaceRegistered() || user.getFaceDescriptor() == null) {
            auditLogin(user.getId(), username, user.getRole() != null ? user.getRole().name() : null, "FACE_ID", false);
            return Optional.empty();
        }
        boolean match = faceService.isMatch(user.getFaceDescriptor(), faceImage);
        if (!match) {
            double sim = faceService.compareFaces(user.getFaceDescriptor(), faceImage);
            auditLogin(user.getId(), username, user.getRole() != null ? user.getRole().name() : null, "FACE_ID", false);
            return Optional.empty();
        }
        user.setLastConnectionDate(LocalDateTime.now());
        userRepository.save(user);
        auditLogin(user.getId(), username, user.getRole() != null ? user.getRole().name() : null, "FACE_ID", true);
        return Optional.of(buildAuthResponse(user, "FACE_ID"));
    }

    public Map<String, Object> removeFace(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "error", "Utilisateur non trouvé");
        }
        User user = userOpt.get();
        user.setFaceDescriptor(null);
        user.setFaceRegistered(false);
        userRepository.save(user);
        return Map.of("success", true, "message", "Visage supprimé");
    }

    public Optional<AuthResponse> completeWebAuthnLogin(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            auditLogin(null, null, null, "WEBAUTHN", false);
            return Optional.empty();
        }
        User user = userOpt.get();
        if (user.getHoldPerson() != null && user.getHoldPerson()) {
            auditLogin(user.getId(), user.getUsername(),
                    user.getRole() != null ? user.getRole().name() : null, "WEBAUTHN", false);
            return Optional.empty();
        }
        user.setLastConnectionDate(LocalDateTime.now());
        userRepository.save(user);
        auditLogin(user.getId(), user.getUsername(),
                user.getRole() != null ? user.getRole().name() : null, "WEBAUTHN", true);
        return Optional.of(buildAuthResponse(user, "WEBAUTHN"));
    }

    public AuthResponse buildAuthResponse(User user, String authMethod) {
        String roleLabel = roleToFrenchLabel(user.getRole());
        String message = "Bienvenue, rôle appliqué : " + roleLabel + ".";
        return new AuthResponse(user, jwtService.generateToken(user), message, authMethod);
    }

    private String roleToFrenchLabel(Role role) {
        if (role == null) return "Utilisateur";
        return switch (role) {
            case ADMIN -> "Admin";
            case CHAUFFEUR -> "Chauffeur";
            case SL -> "Superviseur Livraison";
            case PRESTATAIRE -> "Prestataire";
            case RS -> "Support RS";
            case RPF -> "RPF";
            case ASM -> "ASM";
            case CPL -> "CPL";
            case DRL -> "DRL";
            case RFL -> "RFL";
            case MAINTENANCE -> "Maintenance";
        };
    }

    public User updateUser(Long id, User userDetails) {
        return userRepository.findById(id).map(user -> {
            if (userDetails.getPersonCode() != null) user.setPersonCode(userDetails.getPersonCode());
            if (userDetails.getUsername() != null) user.setUsername(userDetails.getUsername());
            if (userDetails.getEmail() != null) user.setEmail(userDetails.getEmail());
            if (userDetails.getFirstname() != null) user.setFirstname(userDetails.getFirstname());
            if (userDetails.getName() != null) user.setName(userDetails.getName());
            if (userDetails.getBranchCode() != null) user.setBranchCode(userDetails.getBranchCode());
            if (userDetails.getProfileCode() != null) user.setProfileCode(userDetails.getProfileCode());
            if (userDetails.getRole() != null) user.setRole(userDetails.getRole());
            if (userDetails.getPhone() != null) user.setPhone(userDetails.getPhone());
            if (userDetails.getCellularPhone() != null) user.setCellularPhone(userDetails.getCellularPhone());
            if (userDetails.getVille() != null) user.setVille(userDetails.getVille());
            if (userDetails.getStatus() != null) user.setStatus(userDetails.getStatus());
            if (userDetails.getRoleCode() != null) user.setRoleCode(userDetails.getRoleCode());
            if (userDetails.getRoleDepartement() != null) user.setRoleDepartement(userDetails.getRoleDepartement());
            if (userDetails.getRoleBranch() != null) user.setRoleBranch(userDetails.getRoleBranch());


            if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
                String hash = passwordEncoder.encode(userDetails.getPassword());
                user.setPassword(hash);
                user.setPasswordDigest(hash);
            }

            if (userDetails.getHoldPerson() != null) {
                user.setHoldPerson(userDetails.getHoldPerson());
                if (Boolean.TRUE.equals(userDetails.getHoldPerson()) && userDetails.getHoldReason() != null) {
                    user.setHoldReason(userDetails.getHoldReason());
                    user.setStatus("INACTIF");
                } else if (Boolean.FALSE.equals(userDetails.getHoldPerson())) {
                    user.setHoldReason(null);
                    user.setStatus("ACTIF");
                }
            }
            if (userDetails.getHoldReason() != null && Boolean.TRUE.equals(user.getHoldPerson())) {
                user.setHoldReason(userDetails.getHoldReason());
            }

            user.setLastUpdate(LocalDateTime.now());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void deleteUser(Long id, String holdReason) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (holdReason == null || holdReason.isBlank()) {
            throw new RuntimeException("HOLD_REASON is required for deactivation");
        }

        user.setHoldPerson(true);
        user.setHoldReason(holdReason);
        user.setStatus("INACTIF");
        user.setLastUpdate(LocalDateTime.now());
        userRepository.save(user);
    }

    public Optional<User> authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            auditLogin(null, username, null, "PASSWORD", false);
            return Optional.empty();
        }

        User user = userOpt.get();
        if (user.getHoldPerson() != null && user.getHoldPerson()) {
            auditLogin(user.getId(), username, user.getRole() != null ? user.getRole().name() : null, "PASSWORD", false);
            return Optional.empty();
        }

        boolean passwordMatch = passwordEncoder.matches(password, user.getPassword());
        if (!passwordMatch) {
            auditLogin(user.getId(), username, user.getRole() != null ? user.getRole().name() : null, "PASSWORD", false);
            return Optional.empty();
        }

        user.setLastConnectionDate(LocalDateTime.now());
        userRepository.save(user);

        auditLogin(user.getId(), username, user.getRole() != null ? user.getRole().name() : null, "PASSWORD", true);
        return Optional.of(user);
    }

    public List<ConnectionAudit> getAuditLogs(Long userId) {
        return auditRepository.findByUserIdOrderByConnectionDateDesc(userId);
    }

    public List<ConnectionAudit> getAllAuditLogs() {
        return auditRepository.findAllByOrderByConnectionDateDesc();
    }

    private void auditLogin(Long userId, String username, String role, String authMethod, Boolean success) {
        ConnectionAudit audit = new ConnectionAudit(userId != null ? userId : 0L, username, role, authMethod, success);
        auditRepository.save(audit);
    }

    public boolean checkPassword(String rawPassword, String storedHash) {
        return passwordEncoder.matches(rawPassword, storedHash);
    }

    public String hashPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

}
