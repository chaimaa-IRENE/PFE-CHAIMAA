package com.example.usermanagement.config;

import com.example.usermanagement.model.User;
import com.example.usermanagement.model.Role;
import com.example.usermanagement.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    private User createOrUpdate(String personCode, String username, String plainPassword,
                                 String email, String firstname, String name,
                                 String branchCode, Role role) {
        User user = userRepository.findByUsername(username).orElse(null);
        String hash = passwordEncoder.encode(plainPassword);
        if (user == null) {
            user = new User(personCode, username, hash, email, firstname, name, branchCode, role);
            user.setStatus("ACTIF");
            user.setLastUpdate(LocalDateTime.now());
        }
        user.setPassword(hash);
        user.setPasswordDigest(hash);
        user.setHoldPerson(false);
        return userRepository.save(user);
    }

    @Override
    public void run(String... args) {
        createOrUpdate("ADM001", "admin", "admin123", "admin@driverhub.ma",
                "Mohammed", "Alami", "CASABLANCA", Role.ADMIN);
        createOrUpdate("CHF001", "chauffeur_casa", "driver123", "chauffeur.casa@driverhub.ma",
                "Youssef", "Amrani", "CASABLANCA", Role.CHAUFFEUR);
        createOrUpdate("CHF002", "chauffeur_rabat", "driver456", "chauffeur.rabat@driverhub.ma",
                "Karim", "Bennani", "RABAT", Role.CHAUFFEUR);
        createOrUpdate("CHF003", "chauffeur_marrakech", "driver789", "chauffeur.marrakech@driverhub.ma",
                "Omar", "Tazi", "MARRAKECH", Role.CHAUFFEUR);
        createOrUpdate("CHF004", "chauffeur_fes", "driver321", "chauffeur.fes@driverhub.ma",
                "Ahmed", "Elmokri", "FES", Role.CHAUFFEUR);
        createOrUpdate("PRS001", "prestataire_auto", "provider123", "prestataire.auto@driverhub.ma",
                "Rachid", "Kabbaj", "CASABLANCA", Role.PRESTATAIRE);
        createOrUpdate("PRS002", "prestataire_mecanique", "mecanic123", "prestataire.mecanique@driverhub.ma",
                "Said", "Ouazzani", "RABAT", Role.PRESTATAIRE);
        createOrUpdate("RSP001", "rs_support", "support123", "rs.support@driverhub.ma",
                "Fatima", "Zahra", "CASABLANCA", Role.RS);
        createOrUpdate("RPF001", "rpf_prestataire", "rpf123", "rpf.prestataire@driverhub.ma",
                "Nadia", "Bensalem", "CASABLANCA", Role.RPF);
        createOrUpdate("CPL001", "cpl_logistic", "cpl123", "cpl.logistic@driverhub.ma",
                "Hassan", "Mansouri", "RABAT", Role.CPL);
        createOrUpdate("DRL001", "drl_regional", "drl123", "drl.regional@driverhub.ma",
                "Khalid", "Jamal", "CASABLANCA", Role.DRL);
        createOrUpdate("RFL001", "rfl_flotte", "rfl123", "rfl.flotte@driverhub.ma",
                "Imane", "Cherkaoui", "MARRAKECH", Role.RFL);
        // NEW: SL (Superviseur Livraison)
        createOrUpdate("SL001", "sl_casa", "sl123", "sl.casa@driverhub.ma",
                "Amine", "Benali", "CASABLANCA", Role.SL);
        createOrUpdate("SL002", "sl_rabat", "sl456", "sl.rabat@driverhub.ma",
                "Samir", "Elouafi", "RABAT", Role.SL);
        // NEW: MAINTENANCE (Équipe Maintenance)
        createOrUpdate("MAINT001", "mecanique_casa", "maint123", "maint.casa@driverhub.ma",
                "Driss", "Boukhriss", "CASABLANCA", Role.MAINTENANCE);
        createOrUpdate("MAINT002", "mecanique_rabat", "maint456", "maint.rabat@driverhub.ma",
                "Hicham", "Fassi", "RABAT", Role.MAINTENANCE);
        // NEW: ASM (Agent Sécurité & Méthodes)
        createOrUpdate("ASM001", "asm_casa", "asm123", "asm.casa@driverhub.ma",
                "Meryem", "Idrissi", "CASABLANCA", Role.ASM);
        createOrUpdate("ASM002", "asm_rabat", "asm456", "asm.rabat@driverhub.ma",
                "Yassine", "Berrada", "RABAT", Role.ASM);
    }
}
