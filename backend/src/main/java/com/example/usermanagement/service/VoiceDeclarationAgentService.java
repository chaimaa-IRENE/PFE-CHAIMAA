package com.example.usermanagement.service;

import com.example.usermanagement.dto.IncidentFormResponse;
import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.model.Vehicule;
import com.example.usermanagement.repository.DeclarationRepository;
import com.example.usermanagement.repository.VehiculeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class VoiceDeclarationAgentService {

    private static final Logger logger = LoggerFactory.getLogger(VoiceDeclarationAgentService.class);

    private final RasaService rasaService;
    private final OllamaDarijaService ollamaDarijaService;
    private final DeclarationService declarationService;
    private final VehiculeRepository vehiculeRepository;

    private final Map<String, VoiceSession> sessions = new ConcurrentHashMap<>();

    // =====================================================================
    // DARIAJA CHOICE MAPS - bilingual FR + Darija (Latin + Arabic)
    // =====================================================================

    private static final Map<String, DarijaChoice> TYPE_PANNE_CHOICES = new LinkedHashMap<>();
    private static final Map<String, DarijaChoice> CRITICITE_CHOICES = new LinkedHashMap<>();
    private static final Map<String, DarijaChoice> ELEMENT_CHOICES = new LinkedHashMap<>();
    private static final Map<String, DarijaChoice> VILLE_CHOICES = new LinkedHashMap<>();
    private static final Map<String, DarijaChoice> SOURCE_CHOICES = new LinkedHashMap<>();

    static {
        TYPE_PANNE_CHOICES.put("mecanique", new DarijaChoice(1, "M\u00E9canique",
            "\u0627\u0644\u0645\u062D\u0631\u0643\u060C \u0627\u0644\u0641\u0631\u0627\u0645\u0644\u060C \u0627\u0644\u0642\u0627\u0628\u0636 \u0623\u0648 \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0639\u0644\u064A\u0642",
            "\u0627\u0644\u0645\u062D\u0631\u0643\u060C \u0627\u0644\u0641\u0631\u0627\u0645\u0644\u060C \u0627\u0644\u0642\u0627\u0628\u0636 \u0623\u0648 \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0639\u0644\u064A\u0642"));
        TYPE_PANNE_CHOICES.put("electrique", new DarijaChoice(2, "\u00C9lectrique",
            "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629\u060C \u0627\u0644\u0623\u0636\u0648\u0627\u0621\u060C \u0627\u0644\u0645\u0646\u0628\u0647 \u0623\u0648 \u0627\u0644\u0623\u0633\u0644\u0627\u0643 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629",
            "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629\u060C \u0627\u0644\u0623\u0636\u0648\u0627\u0621\u060C \u0627\u0644\u0645\u0646\u0628\u0647 \u0623\u0648 \u0627\u0644\u0623\u0633\u0644\u0627\u0643 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629"));
        TYPE_PANNE_CHOICES.put("caisse", new DarijaChoice(3, "Caisse",
            "\u0627\u0644\u0647\u064A\u0643\u0644\u060C \u0627\u0644\u0628\u062F\u0646\u060C \u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0644\u0641\u064A \u0623\u0648 \u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u0634\u0627\u062D\u0646\u0629",
            "\u0627\u0644\u0647\u064A\u0643\u0644\u060C \u0627\u0644\u0628\u062F\u0646\u060C \u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0644\u0641\u064A \u0623\u0648 \u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u0634\u0627\u062D\u0646\u0629"));
        TYPE_PANNE_CHOICES.put("cabine", new DarijaChoice(4, "Cabine",
            "\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629\u060C \u0627\u0644\u0645\u0642\u0639\u062F\u060C \u0627\u0644\u0632\u062C\u0627\u062C \u0623\u0648 \u0627\u0644\u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629",
            "\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629\u060C \u0627\u0644\u0645\u0642\u0639\u062F\u060C \u0627\u0644\u0632\u062C\u0627\u062C \u0623\u0648 \u0627\u0644\u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629"));
        TYPE_PANNE_CHOICES.put("securite", new DarijaChoice(5, "S\u00E9curit\u00E9",
            "\u0627\u0644\u0641\u0631\u0627\u0645\u0644\u060C \u062D\u0632\u0627\u0645 \u0627\u0644\u0623\u0645\u0627\u0646\u060C \u0627\u0644\u0623\u0636\u0648\u0627\u0621 \u0623\u0648 \u062E\u0637\u0631 \u0639\u0644\u0649 \u0627\u0644\u0633\u0644\u0627\u0645\u0629",
            "\u0627\u0644\u0641\u0631\u0627\u0645\u0644\u060C \u062D\u0632\u0627\u0645 \u0627\u0644\u0623\u0645\u0627\u0646\u060C \u0627\u0644\u0623\u0636\u0648\u0627\u0621 \u0623\u0648 \u062E\u0637\u0631 \u0639\u0644\u0649 \u0627\u0644\u0633\u0644\u0627\u0645\u0629"));
        TYPE_PANNE_CHOICES.put("autres", new DarijaChoice(6, "Autres",
            "\u0634\u064A\u0621 \u0622\u062E\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0623\u0646\u0648\u0627\u0639",
            "\u0634\u064A\u0621 \u0622\u062E\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0623\u0646\u0648\u0627\u0639"));

        CRITICITE_CHOICES.put("bloquant", new DarijaChoice(1, "Bloquant",
            "\u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u0648\u0627\u0642\u0641\u0629 \u0644\u0627 \u062A\u0633\u064A\u0631",
            "\u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u0648\u0627\u0642\u0641\u0629 \u0644\u0627 \u062A\u0633\u064A\u0631"));
        CRITICITE_CHOICES.put("non_bloquant", new DarijaChoice(2, "Non bloquant",
            "\u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u062A\u0633\u064A\u0631 \u062C\u064A\u062F\u0627\u064B\u060C \u0644\u064A\u0633 \u062E\u0637\u0631\u0627\u064B",
            "\u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u062A\u0633\u064A\u0631 \u062C\u064A\u062F\u0627\u064B\u060C \u0644\u064A\u0633 \u062E\u0637\u0631\u0627\u064B"));
        CRITICITE_CHOICES.put("securite", new DarijaChoice(3, "S\u00E9curit\u00E9",
            "\u0641\u064A\u0647 \u062E\u0637\u0631 \u0639\u0644\u0649 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0623\u0648 \u0639\u0644\u0649 \u0627\u0644\u062D\u0645\u0648\u0644\u0629",
            "\u0641\u064A\u0647 \u062E\u0637\u0631 \u0639\u0644\u0649 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0623\u0648 \u0639\u0644\u0649 \u0627\u0644\u062D\u0645\u0648\u0644\u0629"));

        ELEMENT_CHOICES.put("cabine", new DarijaChoice(1, "Cabine",
            "\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629\u060C \u0627\u0644\u0645\u0642\u0639\u062F\u060C \u0627\u0644\u0632\u062C\u0627\u062C \u0623\u0648 \u0627\u0644\u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629",
            "\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629\u060C \u0627\u0644\u0645\u0642\u0639\u062F\u060C \u0627\u0644\u0632\u062C\u0627\u062C \u0623\u0648 \u0627\u0644\u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629"));
        ELEMENT_CHOICES.put("caisse", new DarijaChoice(2, "Caisse",
            "\u0627\u0644\u0647\u064A\u0643\u0644\u060C \u0627\u0644\u0628\u062F\u0646\u060C \u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0644\u0641\u064A \u0623\u0648 \u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u0634\u0627\u062D\u0646\u0629",
            "\u0627\u0644\u0647\u064A\u0643\u0644\u060C \u0627\u0644\u0628\u062F\u0646\u060C \u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0644\u0641\u064A \u0623\u0648 \u0623\u0631\u0636\u064A\u0629 \u0627\u0644\u0634\u0627\u062D\u0646\u0629"));
        ELEMENT_CHOICES.put("eclairage", new DarijaChoice(3, "\u00C9clairage",
            "\u0627\u0644\u0623\u0636\u0648\u0627\u0621\u060C \u0627\u0644\u0645\u0635\u0628\u0627\u062D\u060C \u0627\u0644\u0645\u0646\u0628\u0647 \u0623\u0648 \u0645\u0624\u0634\u0631 \u0627\u0644\u0627\u0646\u0639\u0637\u0627\u0641",
            "\u0627\u0644\u0623\u0636\u0648\u0627\u0621\u060C \u0627\u0644\u0645\u0635\u0628\u0627\u062D\u060C \u0627\u0644\u0645\u0646\u0628\u0647 \u0623\u0648 \u0645\u0624\u0634\u0631 \u0627\u0644\u0627\u0646\u0639\u0637\u0627\u0641"));
        ELEMENT_CHOICES.put("froid", new DarijaChoice(4, "Froid",
            "\u0627\u0644\u062B\u0644\u0627\u062C\u0629\u060C \u0627\u0644\u062A\u0643\u064A\u064A\u0641 \u0623\u0648 \u0627\u0644\u062A\u0628\u0631\u064A\u062F",
            "\u0627\u0644\u062B\u0644\u0627\u062C\u0629\u060C \u0627\u0644\u062A\u0643\u064A\u064A\u0641 \u0623\u0648 \u0627\u0644\u062A\u0628\u0631\u064A\u062F"));
        ELEMENT_CHOICES.put("mecanique", new DarijaChoice(5, "M\u00E9canique",
            "\u0627\u0644\u0645\u062D\u0631\u0643\u060C \u0627\u0644\u0641\u0631\u0627\u0645\u0644\u060C \u0627\u0644\u0642\u0627\u0628\u0636 \u0623\u0648 \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0639\u0644\u064A\u0642",
            "\u0627\u0644\u0645\u062D\u0631\u0643\u060C \u0627\u0644\u0641\u0631\u0627\u0645\u0644\u060C \u0627\u0644\u0642\u0627\u0628\u0636 \u0623\u0648 \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0639\u0644\u064A\u0642"));
        ELEMENT_CHOICES.put("papier", new DarijaChoice(6, "Papier",
            "\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0634\u0627\u062D\u0646\u0629\u060C \u0627\u0644\u062A\u0623\u0645\u064A\u0646 \u0623\u0648 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062A\u0633\u062C\u064A\u0644",
            "\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0634\u0627\u062D\u0646\u0629\u060C \u0627\u0644\u062A\u0623\u0645\u064A\u0646 \u0623\u0648 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062A\u0633\u062C\u064A\u0644"));

        VILLE_CHOICES.put("Casablanca", new DarijaChoice(1, "Casablanca", "Casa", "\u0643\u0627\u0632\u0627"));
        VILLE_CHOICES.put("Rabat", new DarijaChoice(2, "Rabat", "Rbat", "\u0631\u0628\u0627\u0637"));
        VILLE_CHOICES.put("Marrakech", new DarijaChoice(3, "Marrakech", "Marra", "\u0645\u0631\u0627\u0643\u0634"));
        VILLE_CHOICES.put("Tanger", new DarijaChoice(4, "Tanger", "Tanja", "\u0637\u0646\u062C\u0629"));
        VILLE_CHOICES.put("Fes", new DarijaChoice(5, "F\u00E8s", "Fes", "\u0641\u0627\u0633"));
        VILLE_CHOICES.put("autre", new DarijaChoice(6, "Autre", "Blasa akhra goul smiyta", "\u0628\u0644\u0627\u0635\u0629 \u0623\u062E\u0631\u0649 \u06AF\u0648\u0644 \u0633\u0645\u064A\u062A\u0647\u0627"));

        SOURCE_CHOICES.put("Check-up", new DarijaChoice(1, "Check-up",
            "\u0627\u0644\u0641\u062D\u0635 \u0641\u064A \u0627\u0644\u0648\u0631\u0634\u0629 (\u0641\u062D\u0635 \u0627\u0644\u0635\u064A\u0627\u0646\u0629)",
            "\u0627\u0644\u0641\u062D\u0635 \u0641\u064A \u0627\u0644\u0648\u0631\u0634\u0629 (\u0641\u062D\u0635 \u0627\u0644\u0635\u064A\u0627\u0646\u0629)"));
        SOURCE_CHOICES.put("Alerte", new DarijaChoice(2, "Alerte",
            "\u062A\u0646\u0628\u064A\u0647 \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645 \u0623\u0648 \u0627\u0644\u062D\u0633\u0627\u0633",
            "\u062A\u0646\u0628\u064A\u0647 \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645 \u0623\u0648 \u0627\u0644\u062D\u0633\u0627\u0633"));
        SOURCE_CHOICES.put("Maintenance", new DarijaChoice(3, "Maintenance",
            "\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0634\u0627\u062D\u0646\u0629 (\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u062F\u0648\u0631\u064A\u0629)",
            "\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0634\u0627\u062D\u0646\u0629 (\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u062F\u0648\u0631\u064A\u0629)"));
        SOURCE_CHOICES.put("Panne marche", new DarijaChoice(4, "Panne en marche",
            "\u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u062A\u0639\u0637\u0644\u062A \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642",
            "\u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u062A\u0639\u0637\u0644\u062A \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642"));
        SOURCE_CHOICES.put("Incident marche", new DarijaChoice(5, "Incident en marche",
            "\u062D\u0627\u062F\u062B \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 (\u0645\u062B\u0644 \u0627\u0644\u0627\u0646\u0647\u064A\u0627\u0631)",
            "\u062D\u0627\u062F\u062B \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 (\u0645\u062B\u0644 \u0627\u0644\u0627\u0646\u0647\u064A\u0627\u0631)"));
    }

    // NLP keyword maps for matching Darija responses
    private static final Map<String, List<String>> TYPE_PANNE_MAP = new LinkedHashMap<>();
    private static final Map<String, List<String>> CRITICITE_MAP = new LinkedHashMap<>();
    private static final Map<String, List<String>> ELEMENT_MAP = new LinkedHashMap<>();
    private static final Map<String, List<String>> VILLE_MAP = new LinkedHashMap<>();
    private static final Map<String, List<String>> SOURCE_MAP = new LinkedHashMap<>();

    static {
        TYPE_PANNE_MAP.put("mecanique", List.of("moteur", "motuer", "motur", "mowtur", "mecanique", "m\u00e9canique", "m\u00e9cano", "mikanik", "micanique", "frain", "frein", "faramil", "fermel", "embrayage", "ambriyaj", "boite", "kia", "suspension", "direction", "t9eb", "t9ab", "cass\u00e9", "casse", "kas", "panne", "mochkil", "tbriya", "pneu", "roue", "kawtch", "kawch", "kamiyoki", "\u0645\u062D\u0631\u0643", "\u0645\u0648\u0637\u0648\u0631", "\u0645\u0648\u062A\u0648\u0631", "\u0641\u0631\u0627\u0645\u0644", "\u0641\u0631\u0627\u0645\u064A\u0644", "\u0623\u0645\u0628\u0631\u064A\u0627\u062C", "\u062A\u0639\u0637\u0644", "\u0645\u0634\u0643\u0644", "\u0639\u0637\u0644"));
        TYPE_PANNE_MAP.put("electrique", List.of("electrique", "\u00e9lectrique", "kehlowi", "kahlobi", "kahrawi", "kahraba", "batterie", "batoun", "batri", "phare", "\u00e9clairage", "dio", "noor", "klaxon", "fils", "kahraba", "\u0643\u0647\u0631\u0628\u0627", "\u0643\u0647\u0631\u0628\u0627\u0626\u064A", "\u0628\u0627\u0637\u0631\u064A\u0629", "\u0646\u0648\u0631"));
        TYPE_PANNE_MAP.put("caisse", List.of("caisse", "kays", "caissa", "kayce", "hayon", "carrosserie", "karosa", "karossiya", "\u0643\u0627\u064A\u0633", "\u0643\u0631\u0648\u0633\u064A"));
        TYPE_PANNE_MAP.put("cabine", List.of("cabine", "kabine", "cabina", "kabina", "si\u00e8ge", "siyj", "plancher", "blanchar", "planchir", "cockpit", "kabinita", "tiblio", "tablo", "\u0643\u0628\u064A\u0646\u0629", "\u0643\u0627\u0628\u064A\u0646"));
        TYPE_PANNE_MAP.put("securite", List.of("securite", "s\u00e9curit\u00e9", "seckirity", "sikiriti", "ceinture", "zontaj", "frein", "khatar", "hatar", "danger", "risque", "eclairage", "\u062E\u0637\u0631", "\u062E\u0627\u0637\u0631", "\u0633\u0644\u0627\u0645\u0629"));
        TYPE_PANNE_MAP.put("autres", List.of("autres", "okhra", "autre", "okhrin", "akhra", "ma9fich", "hadchi", "\u0623\u062E\u0631", "\u0627\u062E\u0631"));

        CRITICITE_MAP.put("bloquant", List.of("bloquant", "blokan", "block", "wa9ef", "mablok", "ma khdemch", "ma kikhdmch", "ma9f", "waqef", "machi kaymchi", "ma kaymchich", "bloka", "blocage", "blockan", "\u0648\u0627\u0642\u0641", "\u0645\u0628\u0644\u0648\u0643", "\u0645\u0627\u0643\u064A\u062E\u062F\u0645\u0634", "\u0645\u0642\u0641\u0648\u0639", "\u0628\u0644\u0648\u0643\u0627\u0646", "\u0645\u0627\u0643\u0627\u064A\u0645\u0634\u064A\u0634"));
        CRITICITE_MAP.put("non_bloquant", List.of("non bloquant", "non blokan", "nonblokan", "sghir", "kammel", "minor", "passe", "machi khatar", "mashi khatar", "simple", "l\u00e9ger", "seghir", "sghayar", "machi blokan", "kaymchi", "mzyan", "\u0635\u063A\u064A\u0631", "\u0643\u0645\u0644", "\u0645\u0627\u0634\u064A \u062E\u0627\u0637\u0631", "\u0643\u0627\u064A\u0645\u0634\u064A", "\u0645\u0632\u064A\u0627\u0646", "\u0633\u0627\u062F\u0629"));
        CRITICITE_MAP.put("securite", List.of("securite", "s\u00e9curit\u00e9", "seckirity", "sikiriti", "khatar", "khatir", "danger", "risque", "hatar", "mokhatar", "\u062E\u0637\u0631", "\u062E\u0627\u0637\u0631", "\u062D\u0627\u0637\u0631", "\u0633\u0644\u0627\u0645\u0629"));

        ELEMENT_MAP.put("cabine", List.of("cabine", "kabine", "cabina", "kabina", "si\u00e8ge", "siyj", "plancher", "blanchar", "planchir", "cockpit", "volant", "tableau", "dash", "r\u00e9tro", "r\u00e9troviseur", "vitre", "fenetre", "porte", "tiblio", "tablo", "\u0643\u0628\u064A\u0646", "\u0645\u0642\u0639\u062F", "\u0637\u0627\u0628\u0644\u0648", "\u0641\u064A\u062A\u0631"));
        ELEMENT_MAP.put("caisse", List.of("caisse", "kays", "caissa", "hayon", "carrosserie", "karosa", "karossiya", "paroi", "plancher", "fond", "c\u00f4t\u00e9s", "\u0643\u0627\u064A\u0633", "\u0643\u0631\u0648\u0633\u064A", "\u064A\u062F", "\u0643\u062A\u0641"));
        ELEMENT_MAP.put("eclairage", List.of("eclairage", "\u00e9clairage", "phare", "dio", "noor", "klaxon", "feux", "clignotant", "ampoule", "mahrak", "far", "\u0636\u0648", "\u0641\u0627\u0631", "\u0646\u0648\u0631", "\u0643\u0644\u0627\u0643\u0633\u0648\u0646"));
        ELEMENT_MAP.put("froid", List.of("froid", "clim", "climatisation", "ac", "frigo", "broud", "bruda", "\u0641\u0631\u064A\u062C\u0648", "\u062A\u0643\u064A\u064A\u0641"));
        ELEMENT_MAP.put("mecanique", List.of("mecanique", "m\u00e9canique", "moteur", "frein", "frain", "embrayage", "boite", "vitesse", "suspension", "direction", "amortisseur", "rotule", "pneu", "roue", "kawtch", "tbriya", "t9eb", "t9ab", "mkaana", "makina", "radiateur", "courroie", "alternateur", "demarreur", "\u0645\u064A\u0643\u0627\u0646\u064A\u0643", "\u0645\u062D\u0631\u0643", "\u0641\u0631\u0627\u0645\u0644", "\u0623\u0645\u0628\u0631\u064A\u0627\u062C", "\u0628\u0648\u064A\u0637\u0629", "\u0635\u0627\u0644\u0646"));
        ELEMENT_MAP.put("papier", List.of("papier", "document", "warrak", "carte", "assurance", "visite", "technique", "vignette", "carte grise", "grise", "immatriculation", "\u0648\u0631\u0642", "\u0648\u0631\u0627\u0642", "\u0642\u0631\u0637\u0627\u0633", "\u062A\u0623\u0645\u064A\u0646"));

        VILLE_MAP.put("Casablanca", List.of("casablanca", "casa", "kaza", "kazablanka", "bidawiya", "darbaida", "dar lbebda", "lkza", "lbiada", "\u0627\u0644\u0628\u064A\u0636\u0627\u0621", "\u0643\u0627\u0632\u0627", "\u0627\u0644\u062F\u0627\u0631 \u0627\u0644\u0628\u064A\u0636\u0627"));
        VILLE_MAP.put("Rabat", List.of("rabat", "rbat", "lrbat", "\u0627\u0644\u0631\u0628\u0627\u0637", "\u0631\u0628\u0627\u0637"));
        VILLE_MAP.put("Marrakech", List.of("marrakech", "marrakesh", "marakech", "marra", "lmrrakch", "\u0645\u0631\u0627\u0643\u0634", "\u0645\u0631\u0627\u0643\u0634"));
        VILLE_MAP.put("Tanger", List.of("tanger", "tanja", "ltanja", "\u0637\u0646\u062C\u0629", "\u062A\u0627\u0646\u062C\u0627"));
        VILLE_MAP.put("Fes", List.of("fes", "f\u00e8s", "feit", "lfas", "fas", "\u0641\u0627\u0633", "\u0641\u064A\u0633"));
        VILLE_MAP.put("autre", List.of("autre", "okhra", "blasa", "place", "lieu", "\u0628\u0644\u0627\u0635\u0629", "\u0645\u0643\u0627\u0646", "\u0623\u062E\u0631", "\u062C\u0647\u0629"));

        SOURCE_MAP.put("Check-up", List.of("check-up", "checkup", "chik ab", "chikup", "fahs", "control", "contr\u00f4le", "kontrol", "\u0641\u062D\u0635", "\u0643\u0648\u0646\u062A\u0631\u0648\u0644"));
        SOURCE_MAP.put("Alerte", List.of("alerte", "fiche alerte", "alirte", "alirt", "alert", "tanbih", "\u062A\u0646\u0628\u064A\u0647", "\u0625\u0646\u0630\u0627\u0631", "\u062A\u0646\u0628\u064A\u0647\u0627\u062A"));
        SOURCE_MAP.put("Maintenance", List.of("maintenance", "mantinance", "mintinance", "sayana", "entretien", "syana", "\u0635\u064A\u0627\u0646\u0629", "\u0635\u064A\u0627\u0646\u0627"));
        SOURCE_MAP.put("Panne marche", List.of("panne marche", "en marche", "kaydour", "panne mach", "3am f mach", "awarti", "panne f mach", "\u0639\u0637\u0644 \u0641\u064A \u0627\u0644\u0645\u063A\u0631", "\u0645\u0634\u0643\u0644 \u0641\u0627\u0644\u0645\u0634\u064A", "\u0641\u0649 \u0627\u0644\u0637\u0631\u064A\u0642"));
        SOURCE_MAP.put("Incident marche", List.of("incident marche", "incident", "hadith", "hadet", "accident", "aksidan", "incident mach", "hadet f mach", "\u062D\u0627\u062F\u062B", "\u062D\u0627\u062F\u062B\u0629", "\u062D\u062F\u062B", "\u0625\u0646\u0633\u064A\u062F\u0646\u062A"));
    }

    // Steps with numbered choices
    private static final Set<Integer> CHOICE_STEPS = Set.of(2, 3, 4, 5, 6);

    // Arabic letters used in Moroccan plates
    private static final String ARABIC_PLATE_LETTERS = "\u0623\u0628\u062A\u062B\u062C\u062D\u062E\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063A\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u064A";
    private static final Pattern MOROCCAN_PLATE_PATTERN = Pattern.compile(
        "\\b(\\d{1,5})[-\\s\\|\\/]*([" + ARABIC_PLATE_LETTERS + "A-Za-z])[-\\s\\|\\/]*(\\d{1,3})\\b"
    );
    private static final Pattern DIGITS_ONLY_PLATE = Pattern.compile("\\b(\\d{4,8})\\b");
    private static final Pattern EURO_PLATE_PATTERN = Pattern.compile("\\b([A-Za-z]{1,3}[-\\s]?\\d{2,5}[-\\s]?[A-Za-z]{1,3})\\b");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\b(\\d{2,6})\\b");
    private static final Pattern DATE_PATTERN = Pattern.compile("\\b(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})\\b");

    private static String normalizeArabicLetterNames(String text) {
        return text.toLowerCase()
            .replace("alif", "\u0623").replace("alef", "\u0623")
            .replace("ba", "\u0628").replace("ba2", "\u0628").replace("bi", "\u0628").replace("be", "\u0628")
            .replace("jim", "\u062C").replace("jeem", "\u062C").replace("ji", "\u062C")
            .replace("dal", "\u062F").replace("daal", "\u062F").replace("di", "\u062F")
            .replace("ha", "\u0647").replace("ha2", "\u0647").replace("hi", "\u0647")
            .replace("waw", "\u0648")
            .replace("chin", "\u0634").replace("cheen", "\u0634")
            .replace("si", "\u0633").replace("ci", "\u0633")
            .replace("fi", "\u0641").replace("ki", "\u0643")
            .replace("li", "\u0644").replace("mi", "\u0645").replace("ni", "\u0646")
            .replace("zi", "\u0632").replace("ri", "\u0631")
            .replace("ti", "\u062A").replace("3i", "\u0639").replace("qi", "\u0642")
            .replace("shi", "\u0634").replace("ghi", "\u063A").replace("khi", "\u062E")
            // Arabic-script letter names (from STT) — common Moroccan Darija
            .replace("\u0623\u0644\u0641", "\u0623").replace("\u0628\u0627\u0621", "\u0628")
            .replace("\u0628\u0627", "\u0628").replace("\u0628\u0649", "\u0628")
            .replace("\u0628\u064A", "\u0628") // بي
            .replace("\u062A\u0627\u0621", "\u062A").replace("\u062A\u0627", "\u062A").replace("\u062A\u064A", "\u062A") // تا, تي
            .replace("\u062B\u0627\u0621", "\u062B").replace("\u062B\u0627", "\u062B").replace("\u062B\u064A", "\u062B") // ثا, ثي
            .replace("\u062C\u064A\u0645", "\u062C").replace("\u062C\u064A", "\u062C") // جي
            .replace("\u062D\u0627\u0621", "\u062D").replace("\u062D\u0627", "\u062D").replace("\u062D\u064A", "\u062D") // حا, حي
            .replace("\u062E\u0627\u0621", "\u062E").replace("\u062E\u0627", "\u062E").replace("\u062E\u064A", "\u062E") // خا, خي
            .replace("\u062F\u0627\u0644", "\u062F").replace("\u062F\u064A", "\u062F") // دي
            .replace("\u0630\u0627\u0644", "\u0630").replace("\u0630\u064A", "\u0630") // ذي
            .replace("\u0631\u0627\u0621", "\u0631").replace("\u0631\u0627", "\u0631").replace("\u0631\u064A", "\u0631") // را, ري
            .replace("\u0632\u0627\u064A", "\u0632").replace("\u0632\u0627\u0649", "\u0632").replace("\u0632\u064A", "\u0632") // زاي, زي
            .replace("\u0633\u064A\u0646", "\u0633").replace("\u0633\u064A", "\u0633") // سي
            .replace("\u0634\u064A\u0646", "\u0634").replace("\u0634\u064A", "\u0634")
            .replace("\u0635\u0627\u062F", "\u0635").replace("\u0635\u0627", "\u0635").replace("\u0635\u064A", "\u0635") // صا, صي
            .replace("\u0636\u0627\u062F", "\u0636").replace("\u0636\u0627", "\u0636").replace("\u0636\u064A", "\u0636") // ضا, ضي
            .replace("\u0637\u0627\u0621", "\u0637").replace("\u0637\u0627", "\u0637").replace("\u0637\u064A", "\u0637") // طا, طي
            .replace("\u0638\u0627\u0621", "\u0638").replace("\u0638\u0627", "\u0638").replace("\u0638\u064A", "\u0638") // ظا, ظي
            .replace("\u0639\u064A\u0646", "\u0639").replace("\u0639\u064A", "\u0639") // عي
            .replace("\u063A\u064A\u0646", "\u063A").replace("\u063A\u064A", "\u063A") // غي
            .replace("\u0641\u0627\u0621", "\u0641").replace("\u0641\u0627", "\u0641").replace("\u0641\u064A", "\u0641") // فا, في
            .replace("\u0642\u0627\u0641", "\u0642").replace("\u0642\u0627", "\u0642").replace("\u0642\u064A", "\u0642") // قا, قي
            .replace("\u0643\u0627\u0641", "\u0643").replace("\u0643\u0627", "\u0643").replace("\u0643\u064A", "\u0643") // كا, كي
            .replace("\u0644\u0627\u0645", "\u0644").replace("\u0644\u0627", "\u0644").replace("\u0644\u064A", "\u0644") // لا, لي
            .replace("\u0645\u064A\u0645", "\u0645").replace("\u0645\u064A", "\u0645") // مي
            .replace("\u0646\u0648\u0646", "\u0646").replace("\u0646\u0648\u0646", "\u0646").replace("\u0646\u064A", "\u0646") // ني
            .replace("\u0647\u0627\u0621", "\u0647").replace("\u0647\u0627", "\u0647").replace("\u0647\u064A", "\u0647") // ها, هي
            .replace("\u0648\u0627\u0648", "\u0648").replace("\u0648\u064A", "\u0648") // وي
            .replace("\u064A\u0627\u0621", "\u064A").replace("\u064A\u0627", "\u064A").replace("\u064A\u064A", "\u064A"); // يا, يي
    }

    private static String normalizeSpokenDigits(String text) {
        String s = text.toLowerCase();
        // Darija Latin (Arabizi) number words
        s = s.replaceAll("\\bwa[hk]ed?\\b", "1");
        s = s.replaceAll("\\b(tnin|tnen|jouj|jooj|ithnain|snin)\\b", "2");
        s = s.replaceAll("\\b(tlata|talata|tlata|tleta)\\b", "3");
        s = s.replaceAll("\\b(rb3a|rbaa|rb3a|arb3a|arb[aae]?)\\b", "4");
        s = s.replaceAll("\\b(khmsa|khamsa|khemseh)\\b", "5");
        s = s.replaceAll("\\b(sta|sitta|setta|sitt|sita)\\b", "6");
        s = s.replaceAll("\\b(sb3a|sb3a|seb3a|seb3a)\\b", "7");
        s = s.replaceAll("\\b(tminiya|tminia|tmenya|tmen|tmini|tmania|tmanya|tmaniya)\\b", "8");
        s = s.replaceAll("\\b(ts3a|ts9a|tse3a|tis3a|tsa3oud)\\b", "9");
        s = s.replaceAll("\\b(sifr|sifer)\\b", "0");
        // French number words
        s = s.replaceAll("\\bz[e\u00E9]ro\\b", "0");
        s = s.replaceAll("\\bun\\b", "1");
        s = s.replaceAll("\\bdeux\\b", "2");
        s = s.replaceAll("\\btrois\\b", "3");
        s = s.replaceAll("\\bquatre\\b", "4");
        s = s.replaceAll("\\bcinq\\b", "5");
        s = s.replaceAll("\\bsix\\b", "6");
        s = s.replaceAll("\\bsept\\b", "7");
        s = s.replaceAll("\\bhuit\\b", "8");
        s = s.replaceAll("\\bneuf\\b", "9");
        // Arabic-script Darija number words (from STT - with all dialectal variants)
        s = s.replace("\u0648\u0627\u062D\u062F", "1").replace("\u0648\u062D\u062F", "1"); // wahed, whd
        s = s.replace("\u0627\u062B\u0646\u064A\u0646", "2").replace("\u0627\u062A\u0646\u064A\u0646", "2").replace("\u062C\u0648\u062C", "2"); // ithnain, itnain, jouj
        s = s.replace("\u062B\u0644\u0627\u062B\u0629", "3").replace("\u062A\u0644\u0627\u062A\u0629", "3").replace("\u062A\u0644\u0627\u062A", "3").replace("\u062A\u0644\u0627\u062A\u0647", "3"); // tlata, tlat, tlatah
        s = s.replace("\u0623\u0631\u0628\u0639", "4").replace("\u0623\u0631\u0628\u0639\u0629", "4").replace("\u0631\u0628\u0639\u0629", "4").replace("\u0631\u0628\u0639\u0647", "4").replace("\u0631\u0628\u0639", "4"); // arba3, arba3a, rb3a, rb3ah, rb3
        s = s.replace("\u062E\u0645\u0633\u0629", "5").replace("\u062E\u0645\u0633\u0647", "5").replace("\u062E\u0645\u0633", "5"); // khamsa, khamseh, khams
        s = s.replace("\u0633\u062A\u0629", "6").replace("\u0633\u062A\u0647", "6").replace("\u0633\u062A", "6"); // sitta, sitteh, sitt
        s = s.replace("\u0633\u0628\u0639\u0629", "7").replace("\u0633\u0628\u0639\u0647", "7").replace("\u0633\u0628\u0639", "7"); // sb3a, sb3ah, sb3
        s = s.replace("\u062B\u0645\u0627\u0646\u064A\u0629", "8") // thamanya (classical)
            .replace("\u062B\u0645\u0627\u0646\u064A\u0647", "8") // thamanyeh
            .replace("\u062B\u0645\u0627\u0646\u064A", "8") // thamani
            .replace("\u062A\u0645\u0627\u0646\u064A\u0629", "8") // tmanya
            .replace("\u062A\u0645\u0627\u0646\u064A\u0647", "8") // tmanyeh
            .replace("\u062A\u0645\u0627\u0646\u064A", "8") // tmanya
            .replace("\u062A\u0645\u0646\u064A\u0629", "8") // tmenya
            .replace("\u062A\u0645\u0646\u064A\u0647", "8") // tmenyeh
            .replace("\u062A\u0645\u0646\u064A", "8").replace("\u062A\u0645\u0646", "8"); // tmeni, tmenn
        s = s.replace("\u062A\u0633\u0639\u0629", "9").replace("\u062A\u0633\u0639\u0647", "9").replace("\u062A\u0633\u0639", "9").replace("\u062A\u0633\u0639\u0648\u062F", "9"); // ts3a, ts3ah, ts3, tsa3oud
        s = s.replace("\u0635\u0641\u0631", "0"); // sifr
        return s;
    }

    private static final Set<String> AFFIRMATIVE = Set.of(
        "oui", "wakha", "wah", "ah", "eh", "na3am", "naam", "ouioui", "yes", "yep", "mzyan", "s7i7", "iwa", "confirmi", "validi", "ok", "okay", "wakh", "ehwa", "iyeh", "ahwa", "tbarakallah",
        "\u0646\u0639\u0645", "\u0623\u062C\u0644", "\u0625\u064A\u0648\u0647", "\u0623\u064A\u0648\u0647", "\u0647\u0644\u0644\u0627"
    );
    private static final Set<String> NEGATIVE = Set.of(
        "la", "non", "nn", "nope", "machi", "mashi", "walou", "ghir", "la2", "lla", "makaynch", "machi s7i7", "annuli", "cancel", "blacan",
        "\u0644\u0627", "\u0643\u0644\u0627"
    );

    public VoiceDeclarationAgentService(RasaService rasaService,
                                        OllamaDarijaService ollamaDarijaService,
                                        DeclarationService declarationService,
                                        VehiculeRepository vehiculeRepository) {
        this.rasaService = rasaService;
        this.ollamaDarijaService = ollamaDarijaService;
        this.declarationService = declarationService;
        this.vehiculeRepository = vehiculeRepository;
    }

    // =====================================================================
    // STEP DEFINITIONS - 9 steps (greeting to source, auto-create declaration)
    // =====================================================================

    public static final List<ConversationStep> STEPS = List.of(
        new ConversationStep(1, "greeting",
            "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645 {chauffeur}! \u0633\u0623\u0633\u0627\u0639\u062F\u0643 \u0641\u064A \u0645\u0644\u0621 \u0627\u0644\u062A\u0635\u0631\u064A\u062D \u0627\u0644\u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u062A\u064A \u062D\u062F\u062B\u062A \u0641\u064A \u0627\u0644\u0634\u0627\u062D\u0646\u0629. \u0647\u0644 \u0623\u0646\u062A \u0645\u0633\u062A\u0639\u062F\u061f \u0642\u0644 \u0646\u0639\u0645 \u0648\u0633\u0646\u0628\u062F\u0623!",
            "Salut {chauffeur}! Je vais t'aider a remplir la declaration. Tu es pret? Dis oui et on commence!",
            "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645 {chauffeur}! \u0633\u0623\u0633\u0627\u0639\u062F\u0643 \u0641\u064A \u0645\u0644\u0621 \u0627\u0644\u062A\u0635\u0631\u064A\u062D \u0627\u0644\u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u062A\u064A \u062D\u062F\u062B\u062A \u0641\u064A \u0627\u0644\u0634\u0627\u062D\u0646\u0629. \u0647\u0644 \u0623\u0646\u062A \u0645\u0633\u062A\u0639\u062F\u061f \u0642\u0644 \u0646\u0639\u0645 \u0648\u0633\u0646\u0628\u062F\u0623!",
            false, null),
        new ConversationStep(2, "vehicule",
            "\u0645\u0627 \u0647\u0648 \u0631\u0642\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0634\u0627\u062D\u0646\u0629\u061f \u0642\u0644 \u0644\u064A \u0631\u0642\u0645 \u0627\u0644\u0644\u0648\u062D\u0629 \u0641\u0642\u0637\u060C \u0645\u062B\u0644: 12345 \u0623 6 \u0623\u0648 AA-123-BC",
            "Quelle est l'immatriculation du vehicule? (ex: 12345 A 6 ou AA-123-BC)",
            "\u0645\u0627 \u0647\u0648 \u0631\u0642\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0634\u0627\u062D\u0646\u0629\u061f \u0642\u0644 \u0644\u064A \u0631\u0642\u0645 \u0627\u0644\u0644\u0648\u062D\u0629 \u0641\u0642\u0637\u060C \u0645\u062B\u0644: 12345 \u0623 6 \u0623\u0648 AA-123-BC",
            true, "immatriculation"),
        new ConversationStep(3, "typePanne",
            "\u0645\u0627 \u0646\u0648\u0639 \u0627\u0644\u0639\u0637\u0644 \u0627\u0644\u0630\u064A \u0641\u064A \u0627\u0644\u0634\u0627\u062D\u0646\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            "Quel type de panne? Choisissez un numero:",
            "\u0645\u0627 \u0646\u0648\u0639 \u0627\u0644\u0639\u0637\u0644 \u0627\u0644\u0630\u064A \u0641\u064A \u0627\u0644\u0634\u0627\u062D\u0646\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            true, "typePanne"),
        new ConversationStep(4, "elementVehicule",
            "\u0623\u064A\u0646 \u0628\u0627\u0644\u0636\u0628\u0637 \u062A\u0648\u062C\u062F \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            "Ou exactement est le probleme? Choisissez un numero:",
            "\u0623\u064A\u0646 \u0628\u0627\u0644\u0636\u0628\u0637 \u062A\u0648\u062C\u062F \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            true, "elementVehicule"),
        new ConversationStep(5, "criticite",
            "\u0647\u0644 \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u062A\u0648\u0642\u0641 \u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u0623\u0645 \u064A\u0645\u0643\u0646 \u0627\u0644\u0633\u064A\u0631 \u0628\u0647\u0627\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            "Le probleme est bloquant? Choisissez un numero:",
            "\u0647\u0644 \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u062A\u0648\u0642\u0641 \u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u0623\u0645 \u064A\u0645\u0643\u0646 \u0627\u0644\u0633\u064A\u0631 \u0628\u0647\u0627\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            true, "criticite"),
        new ConversationStep(6, "location",
            "\u0623\u064A\u0646 \u0648\u0642\u0639\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0623\u0648 \u0642\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0643\u0627\u0646:",
            "Ou s'est produit l'incident? Choisissez un numero ou dites le nom:",
            "\u0623\u064A\u0646 \u0648\u0642\u0639\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0623\u0648 \u0642\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0643\u0627\u0646:",
            true, "location"),
        new ConversationStep(7, "dateHeure",
            "\u0645\u062A\u0649 \u0648\u0642\u0639\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0642\u0644 \u0627\u0644\u064A\u0648\u0645\u060C \u0623\u0645\u0633\u060C \u0623\u0648 \u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0645\u062B\u0644: 15-06-2026",
            "Quand s'est produit l'incident? aujourd'hui, hier, ou la date comme 15-06-2026",
            "\u0645\u062A\u0649 \u0648\u0642\u0639\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0642\u0644 \u0627\u0644\u064A\u0648\u0645\u060C \u0623\u0645\u0633\u060C \u0623\u0648 \u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0645\u062B\u0644: 15-06-2026",
            true, "dateHeure"),
        new ConversationStep(8, "kilometrage",
            "\u0643\u0645 \u0639\u062F\u062F \u0627\u0644\u0643\u064A\u0644\u0648\u0645\u062A\u0631\u0627\u062A \u0641\u064A \u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u0627\u0644\u0622\u0646\u061f \u0623\u0639\u0637\u0646\u064A \u0631\u0642\u0645\u0627\u064B \u0645\u062B\u0644: 45000",
            "Quel est le kilometrage actuel? (donnez le numero, ex: 45000)",
            "\u0643\u0645 \u0639\u062F\u062F \u0627\u0644\u0643\u064A\u0644\u0648\u0645\u062A\u0631\u0627\u062A \u0641\u064A \u0627\u0644\u0634\u0627\u062D\u0646\u0629 \u0627\u0644\u0622\u0646\u061f \u0623\u0639\u0637\u0646\u064A \u0631\u0642\u0645\u0627\u064B \u0645\u062B\u0644: 45000",
            false, "kilometrage"),
        new ConversationStep(9, "source",
            "\u0645\u0646 \u0623\u064A\u0646 \u0648\u062C\u062F\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            "Quelle est la source? Choisissez un numero:",
            "\u0645\u0646 \u0623\u064A\u0646 \u0648\u062C\u062F\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061f \u0627\u0633\u062A\u0645\u0639 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A:",
            true, "source")
    );

    // =====================================================================
    // SESSION MANAGEMENT
    // =====================================================================

    public Map<String, Object> startSession(Long chauffeurId, String chauffeurNom, String chauffeurMatricule) {
        String sessionId = UUID.randomUUID().toString();
        VoiceSession session = new VoiceSession(sessionId, chauffeurId, chauffeurNom, chauffeurMatricule);
        sessions.put(sessionId, session);

        // Populate vehicle choices from affectations (vehicles assigned to this driver)
        if (chauffeurId != null && chauffeurId > 0) {
            List<Vehicule> assignedVehicles = vehiculeRepository.findByChauffeurId(chauffeurId);
            int idx = 1;
            for (Vehicule v : assignedVehicles) {
                String immat = v.getImmatriculation();
                if (immat != null && !immat.isEmpty()) {
                    String labelFr = immat + " (" + (v.getMarque() != null ? v.getMarque() : "") + " " + (v.getModele() != null ? v.getModele() : "") + ")";
                    session.vehicleChoices.put(immat, new DarijaChoice(idx, labelFr, immat, immat));
                    idx++;
                }
            }
        }

        String greetingDarija = STEPS.get(0).questionDarija.replace("{chauffeur}", chauffeurNom != null ? chauffeurNom : "khoya");
        String greetingArabic = STEPS.get(0).questionArabic.replace("{chauffeur}", chauffeurNom != null ? chauffeurNom : "khoya");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", sessionId);
        response.put("step", 1);
        response.put("field", "greeting");
        response.put("questionDarija", greetingDarija);
        response.put("questionFrancais", STEPS.get(0).questionFrancais.replace("{chauffeur}", chauffeurNom != null ? chauffeurNom : "camarade"));
        response.put("questionArabic", greetingArabic);
        response.put("done", false);
        response.put("formData", new LinkedHashMap<>());
        response.put("choices", getChoicesForStep(1, session));
        return response;
    }

    public Map<String, Object> processResponse(String sessionId, int step, String userResponse) {
        VoiceSession session = sessions.get(sessionId);
        if (session == null) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "Session expir\u00E9e. Red\u00E9marrez la d\u00E9claration.");
            return err;
        }

        if (userResponse == null || userResponse.trim().isEmpty()) {
            return repeatStep(session, step);
        }

        String cleaned = userResponse.trim();
        String lower = cleaned.toLowerCase();

        // Handle greeting step
        if (step == 1) {
            if (isNegative(lower)) {
                Map<String, Object> cancel = new LinkedHashMap<>();
                cancel.put("sessionId", sessionId);
                cancel.put("step", 1);
                cancel.put("field", "greeting");
            cancel.put("questionDarija", "\u0644\u0627 \u0645\u0634\u0643\u0644\u0629! \u0639\u064F\u062F \u0644\u0627\u062D\u0642\u0627\u064B \u0645\u0646 \u0632\u0631 \u0627\u0644\u062A\u0635\u0631\u064A\u062D.");
            cancel.put("questionFrancais", "Pas de probleme! Relancez quand vous etes pret.");
            cancel.put("questionArabic", "\u0644\u0627 \u0645\u0634\u0643\u0644\u0629! \u0639\u064F\u062F \u0644\u0627\u062D\u0642\u0627\u064B \u0645\u0646 \u0632\u0631 \u0627\u0644\u062A\u0635\u0631\u064A\u062D.");
                cancel.put("done", false);
                cancel.put("formData", session.formData);
                cancel.put("cancelled", true);
                return cancel;
            }
            session.formData.put("ready", "true");
            return advanceToStep(session, 2);
        }

        // ============================================================
        // Normal step processing
        // ============================================================
        ConversationStep stepDef = STEPS.stream().filter(s -> s.number == step).findFirst().orElse(null);
        if (stepDef == null) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "\u00C9tape invalide");
            return err;
        }

        String extractedValue = extractValue(stepDef.field, cleaned, lower, session, step);

        if (extractedValue == null || extractedValue.isBlank()) {
            return repeatStep(session, step, "\u0644\u0645 \u0623\u0641\u0647\u0645 \u062C\u064A\u062F\u0627\u064B. \u0623\u0639\u062F \u0642\u0644 \u0644\u064A...");
        }

        session.formData.put(stepDef.field, extractedValue);

        // Vehicle lookup
        if (stepDef.field.equals("vehicule") || stepDef.field.equals("immatriculation")) {
            String immat = extractImmatriculation(cleaned);
            if (immat == null) immat = extractedValue;
            if (immat != null) {
                session.formData.put("immatriculation", immat);
                Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(immat);
                if (vOpt.isPresent()) {
                    Vehicule v = vOpt.get();
                    session.formData.put("vehiculeId", String.valueOf(v.getId()));
                    session.formData.put("vehiculeMarque", v.getMarque());
                    session.formData.put("vehiculeModele", v.getModele());
                    session.formData.put("vehiculeType", v.getType());
                }
            }
            return advanceToStep(session, step + 1);
        }

        // For choice steps: advance immediately (no confirmation)
        if (CHOICE_STEPS.contains(step)) {
            session.formData.put("lastChoiceLabel", extractedValue);
            return advanceToStep(session, step + 1);
        }

        // Non-choice steps: advance immediately
        return advanceToStep(session, step + 1);
    }

    // =====================================================================
    // Repeat step with the numbered announcement
    // =====================================================================
    private Map<String, Object> repeatStepWithAnnouncement(VoiceSession session, int step) {
        ConversationStep stepDef = STEPS.get(step - 1);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", session.sessionId);
        response.put("step", step);
        response.put("field", stepDef.field);
        String choicesArabic = buildChoicesTtsText(step, session);
        String choicesDarija = buildChoicesDarijaText(step, session);
        response.put("questionDarija", stepDef.questionDarija + " " + choicesDarija + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647.");
        response.put("questionFrancais", stepDef.questionFrancais);
        response.put("questionArabic", stepDef.questionArabic + " " + choicesArabic + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647.");
        response.put("done", false);
        response.put("formData", session.formData);
        response.put("choices", getChoicesForStep(step, session));
        return response;
    }

    // =====================================================================
    // VALUE EXTRACTION - accepts numbered responses
    // =====================================================================
    private String extractValue(String field, String original, String lower, VoiceSession session, int step) {
        // Check if it's a numbered response for a choice step
        if (CHOICE_STEPS.contains(step)) {
            String numberedResult = matchByNumber(original, step, session);
            if (numberedResult != null) return numberedResult;
        }

        return switch (field) {
            case "vehicule", "immatriculation" -> extractImmatriculation(original) != null ? extractImmatriculation(original) : original;
            case "typePanne" -> mapToOptions("typePanne", lower, TYPE_PANNE_MAP, "AUTRES");
            case "criticite" -> mapToOptions("criticite", lower, CRITICITE_MAP, "NON_BLOQUANT");
            case "elementVehicule" -> mapToOptions("elementVehicule", lower, ELEMENT_MAP, "MECANIQUE");
            case "location" -> mapToOptions("location", lower, VILLE_MAP, capitalize(original));
            case "source" -> mapToOptions("source", lower, SOURCE_MAP, "Check-up");
            case "kilometrage" -> extractNumber(original);
            case "dateHeure" -> extractDate(original);
            default -> original;
        };
    }

    // =====================================================================
    // Match numbered response (1, 2, 3) to choice
    // =====================================================================
    private String matchByNumber(String input, int step, VoiceSession session) {
        String trimmed = input.trim().toLowerCase();
        Map<String, DarijaChoice> choiceMap = getChoiceMapForStep(step, session);
        if (choiceMap == null || choiceMap.isEmpty()) return null;

        int maxId = 0;
        for (DarijaChoice c : choiceMap.values()) if (c.id > maxId) maxId = c.id;

        String[] darijaNumbers = {"wahed", "wahd", "tnin", "tnen", "jouj", "jooj", "tlata", "talata", "rb3a", "rbaa", "arb3a", "khmsa", "khamsa", "sta", "sitta"};
        for (int i = 0; i < darijaNumbers.length && (i + 1) <= maxId; i++) {
            if (trimmed.contains(darijaNumbers[i])) {
                int num = i + 1;
                for (Map.Entry<String, DarijaChoice> entry : choiceMap.entrySet()) {
                    if (entry.getValue().id == num) return entry.getKey();
                }
            }
        }

        Pattern numPattern = Pattern.compile("\\d+");
        Matcher m = numPattern.matcher(trimmed);
        if (m.find()) {
            int num = Integer.parseInt(m.group());
            for (Map.Entry<String, DarijaChoice> entry : choiceMap.entrySet()) {
                if (entry.getValue().id == num) return entry.getKey();
            }
        }
        return null;
    }

    private String mapToOptions(String field, String input, Map<String, List<String>> mapping, String fallback) {
        String lower = input.toLowerCase().trim();
        String[] words = lower.split("[\\s,;:!?]+");
        for (Map.Entry<String, List<String>> entry : mapping.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (lower.contains(keyword.toLowerCase())) {
                    return entry.getKey();
                }
            }
        }
        for (Map.Entry<String, List<String>> entry : mapping.entrySet()) {
            for (String keyword : entry.getValue()) {
                String kw = keyword.toLowerCase();
                for (String word : words) {
                    if (word.length() >= 2 && levenshteinDistance(word, kw) <= Math.max(1, kw.length() / 3)) {
                        return entry.getKey();
                    }
                }
            }
        }
        Map<String, String> rasaResult = rasaService.analyser(lower);
        String intent = rasaResult.get("intent");
        for (Map.Entry<String, List<String>> entry : mapping.entrySet()) {
            if (entry.getValue().stream().anyMatch(v -> v.equalsIgnoreCase(intent))) {
                return entry.getKey();
            }
        }
        Optional<String> ollamaValue = ollamaDarijaService.extractField(field, input, new ArrayList<>(mapping.keySet()));
        if (ollamaValue.isPresent()) return ollamaValue.get();
        return fallback;
    }

    private String extractImmatriculation(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        String normalized = normalizeSpokenDigits(text);
        normalized = normalizeArabicLetterNames(normalized);
        normalized = normalized.replace(",", "");

        // Multiple normalizations for better Gemini-like detection
        String primaryNormalized = normalizeLicensePlateInput(normalized);
        String secondaryNormalized = normalizeSpokenDigits(normalized);
        secondaryNormalized = normalizeArabicLetterNames(secondaryNormalized);

        // Try primary normalized pattern first
        String result = tryExtractPattern(primaryNormalized, "primary");
        if (result != null) return result;

        // Try STT error patterns (common misrecognitions)
        String withLetter = normalized.replaceAll("000(?=[\\s]*\\d)", " \u0623 ");
        result = tryExtractPattern(withLetter, "with letter");
        if (result != null) return result;

        // Try original normalized (with letter substitution)
        result = tryExtractPattern(secondaryNormalized, "secondary");
        if (result != null) return result;

        // Gemini-like fuzzy matching: try various permutations
        result = tryFuzzyMatching(normalized);
        if (result != null) return result;

        // All other patterns
        Matcher digitsOnlyMatcher = DIGITS_ONLY_PLATE.matcher(normalized);
        if (digitsOnlyMatcher.find()) return digitsOnlyMatcher.group(1);
        Matcher euroMatcher = EURO_PLATE_PATTERN.matcher(normalized.toUpperCase());
        if (euroMatcher.find()) return euroMatcher.group(1);

        return null;
    }

    private String normalizeLicensePlateInput(String text) {
        // Enhanced normalization for better Gemini-like understanding
        String result = text.toLowerCase();

        // Normalize Arabic letter names (including "alif" → "أ")
        result = result.replace("alif", "\u0623").replace("alef", "\u0623")
                     .replace("ba", "\u0628").replace("ba2", "\u0628")
                     .replace("jim", "\u062C").replace("jeem", "\u062C")
                     .replace("dal", "\u062F").replace("daal", "\u062F")
                     .replace("ha", "\u0647").replace("ha2", "\u0647")
                     .replace("waw", "\u0648")
                     .replace("chin", "\u0634").replace("cheen", "\u0634")
                     // Darija common letter names (before single-letter mappings)
                     .replace("bi", "\u0628").replace("be", "\u0628")
                     .replace("ci", "\u0633").replace("si", "\u0633")
                     .replace("di", "\u062F").replace("ji", "\u062C")
                     .replace("fi", "\u0641").replace("gi", "\u06AF")
                     .replace("hi", "\u0647").replace("ki", "\u0643")
                     .replace("li", "\u0644").replace("mi", "\u0645").replace("ni", "\u0646")
                     .replace("pi", "\u067E").replace("qi", "\u0642")
                     .replace("ri", "\u0631").replace("shi", "\u0634")
                     .replace("ti", "\u062A").replace("vi", "\u06A4")
                     .replace("wi", "\u0648").replace("yi", "\u064A")
                     .replace("zi", "\u0632").replace("3i", "\u0639")
                     .replace("7i", "\u062D").replace("5i", "\u062E")
                     .replace("6i", "\u0637").replace("9i", "\u0642")
                     .replace("ghi", "\u063A").replace("khi", "\u062E")
                      .replace("te", "\u062A").replace("seh", "\u0633")
                      .replace("reh", "\u0631").replace("zeh", "\u0632")
                      .replace("qaf", "\u0642").replace("kaaf", "\u0643")
                      .replace("lam", "\u0644").replace("meem", "\u0645")
                      .replace("noon", "\u0646").replace("pe", "\u067E")
                      .replace("feh", "\u0641").replace("ha", "\u0647")
                      .replace("waw", "\u0648").replace("ks", "\u0643\u0633")
                      .replace("ya", "\u064A")
                      .replace("a3", "\u0639").replace("7a", "\u062D")
                      .replace("q9", "\u0642").replace("5a", "\u062E")
                      .replace("6a", "\u0637");

        // Replace Arabic-script letter names with Arabic characters
        result = result.replace("\u0623\u0644\u0641", "\u0623").replace("\u0628\u0627\u0621", "\u0628")
                     .replace("\u0628\u0627", "\u0628").replace("\u0628\u0649", "\u0628")
                     .replace("\u0628\u064A", "\u0628") // بي
                     .replace("\u062A\u0627\u0621", "\u062A").replace("\u062A\u0627", "\u062A").replace("\u062A\u064A", "\u062A")
                     .replace("\u062B\u0627\u0621", "\u062B").replace("\u062B\u0627", "\u062B").replace("\u062B\u064A", "\u062B")
                     .replace("\u062C\u064A\u0645", "\u062C").replace("\u062C\u064A", "\u062C") // جي
                     .replace("\u062D\u0627\u0621", "\u062D").replace("\u062D\u0627", "\u062D").replace("\u062D\u064A", "\u062D")
                     .replace("\u062E\u0627\u0621", "\u062E").replace("\u062E\u0627", "\u062E").replace("\u062E\u064A", "\u062E")
                     .replace("\u062F\u0627\u0644", "\u062F").replace("\u062F\u064A", "\u062F") // دي
                     .replace("\u0630\u0627\u0644", "\u0630").replace("\u0630\u064A", "\u0630") // ذي
                     .replace("\u0631\u0627\u0621", "\u0631").replace("\u0631\u0627", "\u0631").replace("\u0631\u064A", "\u0631")
                     .replace("\u0632\u0627\u064A", "\u0632").replace("\u0632\u0627\u0649", "\u0632").replace("\u0632\u064A", "\u0632")
                     .replace("\u0633\u064A\u0646", "\u0633").replace("\u0633\u064A", "\u0633") // سي
                     .replace("\u0634\u064A\u0646", "\u0634").replace("\u0634\u064A", "\u0634")
                     .replace("\u0635\u0627\u062F", "\u0635").replace("\u0635\u0627", "\u0635").replace("\u0635\u064A", "\u0635")
                     .replace("\u0636\u0627\u062F", "\u0636").replace("\u0636\u0627", "\u0636").replace("\u0636\u064A", "\u0636")
                     .replace("\u0637\u0627\u0621", "\u0637").replace("\u0637\u0627", "\u0637").replace("\u0637\u064A", "\u0637")
                     .replace("\u0638\u0627\u0621", "\u0638").replace("\u0638\u0627", "\u0638").replace("\u0638\u064A", "\u0638")
                     .replace("\u0639\u064A\u0646", "\u0639").replace("\u0639\u064A", "\u0639") // عي
                     .replace("\u063A\u064A\u0646", "\u063A").replace("\u063A\u064A", "\u063A") // غي
                     .replace("\u0641\u0627\u0621", "\u0641").replace("\u0641\u0627", "\u0641").replace("\u0641\u064A", "\u0641")
                     .replace("\u0642\u0627\u0641", "\u0642").replace("\u0642\u0627", "\u0642").replace("\u0642\u064A", "\u0642")
                     .replace("\u0643\u0627\u0641", "\u0643").replace("\u0643\u0627", "\u0643").replace("\u0643\u064A", "\u0643")
                     .replace("\u0644\u0627\u0645", "\u0644").replace("\u0644\u0627", "\u0644").replace("\u0644\u064A", "\u0644")
                     .replace("\u0645\u064A\u0645", "\u0645").replace("\u0645\u064A", "\u0645") // مي
                     .replace("\u0646\u0648\u0646", "\u0646").replace("\u0646\u064A", "\u0646") // ني
                     .replace("\u0647\u0627\u0621", "\u0647").replace("\u0647\u0627", "\u0647").replace("\u0647\u064A", "\u0647")
                     .replace("\u0648\u0627\u0648", "\u0648").replace("\u0648\u064A", "\u0648") // وي
                     .replace("\u064A\u0627\u0621", "\u064A").replace("\u064A\u0627", "\u064A").replace("\u064A\u064A", "\u064A") // يا, يي
                     .replace("\u0639\u0645\u0631", "\u0639").replace("\u0639\u0645\u0631\u0629", "\u0639")
                     .replace("\u062B\u0644\u0627\u062B\u0629", "\u062B").replace("\u062A\u0644\u0627\u062A\u0629", "\u062A");

        // Replace digit words with actual digits (including Arabic-script numbers)
        result = normalizeSpokenDigits(result);

        // Remove common separators and normalize spaces
        result = result.replaceAll("([\\s\\|\\-\\/])+", " ").trim();

        // Remove spaces between consecutive Arabic letters (e.g., "ب س ف" → "بسف")
        result = result.replaceAll("([" + ARABIC_PLATE_LETTERS + "])\\s+([" + ARABIC_PLATE_LETTERS + "])", "$1$2");
        result = result.replaceAll("([" + ARABIC_PLATE_LETTERS + "])\\s+([" + ARABIC_PLATE_LETTERS + "])", "$1$2");
        // Also remove spaces between consecutive Latin letters (e.g., "b c" → "bc")
        result = result.replaceAll("([a-z])\\s+([a-z])", "$1$2");
        result = result.replaceAll("([a-z])\\s+([a-z])", "$1$2");

        // Enhanced pattern matching for license plates
        // Moroccan plate pattern: "123 | أ | 456"
        String plateMidRegex = "[" + ARABIC_PLATE_LETTERS + "a-z]{1,3}";
        result = result.replaceAll("([0-9]{3,4})\\s*[\\|\\|]*\\s*(" + plateMidRegex + ")\\s*[\\|\\|]*\\s*([0-9]{1,4})", "$1 | $2 | $3");
        // Also match without spaces
        result = result.replaceAll("([0-9]{3,4})[\\|\\|]*(" + plateMidRegex + ")[\\|\\|]*([0-9]{1,4})", "$1 | $2 | $3");

        return result;
    }

    private String tryExtractPattern(String text, String patternType) {
        if (text == null || text.trim().isEmpty()) return null;

        String cleanText = text.replaceAll("\\s+", " ").trim();
        String midRegex = "[" + ARABIC_PLATE_LETTERS + "a-z]{1,3}";

        // Pattern 1: Full Moroccan pattern "123 | أ | 456"
        Matcher m = Pattern.compile("([0-9]{3,4})\\s*\\|\\s*(" + midRegex + ")\\s*\\|\\s*([0-9]{1,4})").matcher(cleanText);
        if (m.find()) {
            return m.group(1) + " | " + m.group(2) + " | " + m.group(3);
        }

        // Pattern 2: With spaces around |
        m = Pattern.compile("([0-9]{3,4})\\s+\\|\\s*(" + midRegex + ")\\s+\\|\\s*([0-9]{1,4})").matcher(cleanText);
        if (m.find()) {
            return m.group(1) + " | " + m.group(2) + " | " + m.group(3);
        }

        // Pattern 3: Without spaces
        m = Pattern.compile("([0-9]{3,4})\\s*(" + midRegex + ")\\s*([0-9]{1,4})").matcher(cleanText);
        if (m.find()) {
            return m.group(1) + " | " + m.group(2) + " | " + m.group(3);
        }

        // Pattern 4: Just digits and letter
        m = Pattern.compile("([0-9]{3,4})\\s*(" + midRegex + ")\\s*([0-9]{1,4})").matcher(cleanText);
        if (m.find() && !cleanText.contains("\u0628\u0627\u0645")) {
            return m.group(1) + " | " + m.group(2) + " | " + m.group(3);
        }

        return null;
    }

    private String tryFuzzyMatching(String text) {
        if (text == null) return null;

        String cleanText = text.replaceAll("\\s+", "").trim();

        // Extract all digit sequences
        List<String> digitSegments = new ArrayList<>();
        List<String> letterSegments = new ArrayList<>();
        String remainingText = cleanText;

        // Extract digits
        String digitsPattern = "[0-9]{2,8}";
        Matcher digitMatcher = Pattern.compile(digitsPattern).matcher(remainingText);
        while (digitMatcher.find()) {
            digitSegments.add(digitMatcher.group());
            remainingText = remainingText.substring(digitMatcher.end());
            digitMatcher = Pattern.compile(digitsPattern).matcher(remainingText);
        }

        // Extract any Arabic letter that appears in Moroccan plates
        for (char c : cleanText.toCharArray()) {
            String s = String.valueOf(c);
            if (ARABIC_PLATE_LETTERS.contains(s) && !letterSegments.contains(s)) {
                letterSegments.add(s);
                remainingText = remainingText.replace(s, "");
            }
        }

        // Reconstruct if we have digits + letter + digits
        if (digitSegments.size() >= 2 && letterSegments.size() >= 1) {
            return digitSegments.get(0) + " | " + String.join(" ", letterSegments) + " | " + digitSegments.get(1);
        }
        if (digitSegments.size() >= 1 && letterSegments.size() >= 1) {
            return digitSegments.get(0) + " | " + String.join(" ", letterSegments);
        }

        return null;
    }

    private String extractNumber(String text) {
        String cleaned = text.replace(",", "");
        Matcher m = NUMBER_PATTERN.matcher(cleaned);
        if (m.find()) return m.group(1);
        return cleaned.replaceAll("[^0-9]", "").isEmpty() ? null : cleaned.replaceAll("[^0-9]", "");
    }

    private String extractDate(String text) {
        String lower = text.toLowerCase().trim();
        LocalDateTime now = LocalDateTime.now();
        if (lower.contains("lyoum") || lower.contains("aujourd") || lower.contains("daba")) {
            return now.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
        if (lower.contains("bari7") || lower.contains("hier") || lower.contains("ams")) {
            return now.minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
        Matcher m = DATE_PATTERN.matcher(text);
        if (m.find()) return m.group(1);
        return text;
    }

    private boolean isAffirmative(String input) {
        String lower = input.toLowerCase().trim();
        return AFFIRMATIVE.stream().anyMatch(a -> lower.contains(a));
    }

    private boolean isNegative(String input) {
        String lower = input.toLowerCase().trim();
        return NEGATIVE.stream().anyMatch(n -> lower.contains(n));
    }

    // =====================================================================
    // STEP ADVANCEMENT
    // =====================================================================
    private Map<String, Object> advanceToStep(VoiceSession session, int rawStep) {
        int nextStep = rawStep;
        // Auto-fill date and skip dateHeure step
        if (nextStep == 7) {
            session.formData.put("dateHeure", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
            nextStep = 8;
        }
        final int finalStep = nextStep;
        if (finalStep > 9) {
            return createDeclaration(session);
        }
        ConversationStep stepDef = STEPS.stream().filter(s -> s.number == finalStep).findFirst().orElse(null);
        if (stepDef == null) {
            return createDeclaration(session);
        }
        String questionDarija = stepDef.questionDarija;
        String questionArabic = stepDef.questionArabic;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", session.sessionId);
        response.put("step", nextStep);
        response.put("field", stepDef.field);
        // For choice steps, include full list of numbered Darija choices in TTS
        if (CHOICE_STEPS.contains(nextStep)) {
            String choicesArabic = buildChoicesTtsText(nextStep, session);
            String choicesDarija = buildChoicesDarijaText(nextStep, session);
            response.put("questionDarija", questionDarija + " " + choicesDarija + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647.");
            response.put("questionFrancais", stepDef.questionFrancais);
            response.put("questionArabic", questionArabic + " " + choicesArabic + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647.");
        } else {
            response.put("questionDarija", questionDarija);
            response.put("questionFrancais", stepDef.questionFrancais);
            response.put("questionArabic", questionArabic);
        }
        response.put("done", false);
        response.put("formData", session.formData);
        response.put("choices", getChoicesForStep(nextStep, session));
        return response;
    }

    private Map<String, Object> repeatStep(VoiceSession session, int step) {
        return repeatStep(session, step, null);
    }

    private Map<String, Object> repeatStep(VoiceSession session, int step, String customMessage) {
        ConversationStep stepDef = STEPS.stream().filter(s -> s.number == step).findFirst().orElse(null);
        if (stepDef == null) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "\u00C9tape invalide");
            return err;
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", session.sessionId);
        response.put("step", step);
        response.put("field", stepDef.field);
        response.put("retry", true);
        String choicesArabic = buildChoicesTtsText(step, session);
        String choicesDarija = buildChoicesDarijaText(step, session);
        if (customMessage != null) {
            response.put("retryMessage", customMessage);
            if (CHOICE_STEPS.contains(step) && !choicesDarija.isEmpty()) {
                response.put("questionDarija", customMessage + " " + choicesDarija + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645.");
                response.put("questionArabic", "\u0644\u0645 \u0623\u0641\u0647\u0645 \u062C\u064A\u062F\u0627\u064B. " + choicesArabic + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645.");
            } else {
                response.put("questionDarija", customMessage);
                response.put("questionArabic", "\u0644\u0645 \u0623\u0641\u0647\u0645 \u062C\u064A\u062F\u0627\u064B. \u0623\u0639\u062F \u0642\u0644 \u0644\u064A...");
            }
        } else {
            response.put("retryMessage", stepDef.questionDarija);
            if (CHOICE_STEPS.contains(step) && !choicesDarija.isEmpty()) {
                response.put("questionDarija", stepDef.questionDarija + " " + choicesDarija + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645.");
                response.put("questionArabic", stepDef.questionArabic + " " + choicesArabic + "\u0642\u0644 \u0644\u064A \u0627\u0644\u0631\u0642\u0645.");
            } else {
                response.put("questionDarija", stepDef.questionDarija);
                response.put("questionArabic", stepDef.questionArabic);
            }
        }
        response.put("retryMessageFr", stepDef.questionFrancais);
        response.put("questionFrancais", stepDef.questionFrancais);
        response.put("done", false);
        response.put("formData", session.formData);
        response.put("choices", getChoicesForStep(step, session));
        return response;
    }

    // =====================================================================
    // DECLARATION CREATION
    // =====================================================================
    private Map<String, Object> createDeclaration(VoiceSession session) {
        try {
            DeclarationIncident decl = new DeclarationIncident();
            decl.setChauffeurId(session.chauffeurId);
            decl.setChauffeurNom(session.chauffeurNom);
            decl.setChauffeurMatricule(session.chauffeurMatricule);

            String immat = session.formData.getOrDefault("immatriculation", "");
            if (!immat.isEmpty()) {
                decl.setVehiculeImmatriculation(immat);
                Optional<Vehicule> vOpt = vehiculeRepository.findByImmatriculation(immat);
                vOpt.ifPresent(v -> decl.setVehiculeId(v.getId()));
            }
            decl.setTypePanne(session.formData.getOrDefault("typePanne", ""));
            decl.setElementVehicule(session.formData.getOrDefault("elementVehicule", ""));
            decl.setCriticite(session.formData.getOrDefault("criticite", ""));
            decl.setLocation(session.formData.getOrDefault("location", ""));
            decl.setDateHeure(LocalDateTime.now());
            String km = session.formData.getOrDefault("kilometrage", "0");
            try { decl.setKilometrage(Integer.parseInt(km.replaceAll("[^0-9]", ""))); } catch (Exception e) { decl.setKilometrage(0); }
            decl.setSource(session.formData.getOrDefault("source", ""));
            decl.setStatut("EN_ATTENTE");
            decl.setDateReclamation(LocalDateTime.now());

            DeclarationIncident saved = declarationService.createDeclarationFromVoice(decl);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("sessionId", session.sessionId);
            response.put("step", 9);
            response.put("field", "done");
            response.put("done", true);
            response.put("declarationCreated", true);
            response.put("declarationId", saved.getIdIncident());
            response.put("declaration", saved);
            response.put("formData", session.formData);
            response.put("questionDarija", "Mezyan bezaf! Tsajlat l'd\u00E9claration dyalek b naja7. L'numero dyalha howa " + saved.getIdIncident() + ". Baraka llah fik!");
            response.put("questionFrancais", "Parfait! Votre declaration a ete enregistree. Numero: " + saved.getIdIncident());
            response.put("questionArabic", "\u0645\u0632\u064A\u0627\u0646 \u0628\u0632\u0627\u0641! \u062A\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062A\u0635\u0631\u064A\u062D \u0628\u0646\u062C\u0627\u062D. \u0631\u0642\u0645\u0647\u0627 " + saved.getIdIncident() + ". \u0628\u0627\u0631\u0643\u0627 \u0627\u0644\u0644\u0647 \u0639\u0644\u064A\u0643!");
            sessions.remove(session.sessionId);
            return response;
        } catch (Exception e) {
            logger.error("Erreur creation declaration: {}", e.getMessage(), e);
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("sessionId", session.sessionId);
            err.put("error", "Mochkil f l'enregistrement: " + e.getMessage());
            err.put("questionDarija", "Kayn mochkil f l'enregistrement. 3awed men ba3d.");
            err.put("questionArabic", "\u0643\u0627\u064A\u0646 \u0645\u0634\u0643\u0644 \u0641 \u0627\u0644\u062A\u0633\u062C\u064A\u0644. \u0639\u0627\u0648\u062F \u0645\u0646 \u0628\u0639\u062F.");
            return err;
        }
    }

    // =====================================================================
    // BILINGUAL CHOICES - returns List<Map> with id, label_fr, label_darija, label_arabic
    // =====================================================================
    private String buildChoicesTtsText(int step, VoiceSession session) {
        Map<String, DarijaChoice> choiceMap = getChoiceMapForStep(step, session);
        if (choiceMap == null || choiceMap.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (DarijaChoice choice : choiceMap.values()) {
            if (sb.length() > 0) sb.append("  ");
            sb.append(choice.id).append(" - ").append(choice.label_arabic).append(". ");
        }
        return sb.toString();
    }

    private String buildChoicesDarijaText(int step, VoiceSession session) {
        Map<String, DarijaChoice> choiceMap = getChoiceMapForStep(step, session);
        if (choiceMap == null || choiceMap.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (DarijaChoice choice : choiceMap.values()) {
            if (sb.length() > 0) sb.append("  ");
            sb.append(choice.id).append(" - ").append(choice.label_darija).append(". ");
        }
        return sb.toString();
    }

    private List<Map<String, Object>> getChoicesForStep(int step, VoiceSession session) {
        Map<String, DarijaChoice> choiceMap = getChoiceMapForStep(step, session);
        if (choiceMap == null || choiceMap.isEmpty()) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (DarijaChoice choice : choiceMap.values()) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("id", choice.id);
            c.put("label_fr", choice.label_fr);
            c.put("label_darija", choice.label_darija);
            c.put("label_arabic", choice.label_arabic);
            result.add(c);
        }
        return result;
    }

    private Map<String, DarijaChoice> getChoiceMapForStep(int step, VoiceSession session) {
        if (step == 2 && session != null && !session.vehicleChoices.isEmpty()) {
            return session.vehicleChoices;
        }
        return switch (step) {
            case 3 -> TYPE_PANNE_CHOICES;
            case 4 -> ELEMENT_CHOICES;
            case 5 -> CRITICITE_CHOICES;
            case 6 -> VILLE_CHOICES;
            case 9 -> SOURCE_CHOICES;
            default -> Collections.emptyMap();
        };
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + (s.length() > 1 ? s.substring(1).toLowerCase() : "");
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }

    public Map<String, Object> getSession(String sessionId) {
        VoiceSession session = sessions.get(sessionId);
        if (session == null) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "Session non trouv\u00E9e");
            return err;
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", session.sessionId);
        response.put("formData", session.formData);
        response.put("chauffeurNom", session.chauffeurNom);
        return response;
    }

    public Map<String, Object> updateStep(String sessionId, int step, String field, String value) {
        VoiceSession session = sessions.get(sessionId);
        if (session == null) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "Session non trouv\u00E9e");
            return err;
        }
        if (field != null && value != null) {
            session.formData.put(field, value);
        }
        return advanceToStep(session, step);
    }

    // =====================================================================
    // INNER CLASSES
    // =====================================================================
    static class VoiceSession {
        String sessionId;
        Long chauffeurId;
        String chauffeurNom;
        String chauffeurMatricule;
        Map<String, String> formData = new LinkedHashMap<>();
        Map<String, DarijaChoice> vehicleChoices = new LinkedHashMap<>();
        LocalDateTime createdAt = LocalDateTime.now();

        VoiceSession(String sessionId, Long chauffeurId, String chauffeurNom, String chauffeurMatricule) {
            this.sessionId = sessionId;
            this.chauffeurId = chauffeurId;
            this.chauffeurNom = chauffeurNom;
            this.chauffeurMatricule = chauffeurMatricule;
        }
    }

    public static class DarijaChoice {
        public int id;
        public String label_fr;
        public String label_darija;
        public String label_arabic;

        public DarijaChoice(int id, String label_fr, String label_darija, String label_arabic) {
            this.id = id;
            this.label_fr = label_fr;
            this.label_darija = label_darija;
            this.label_arabic = label_arabic;
        }
    }

    public static class ConversationStep {
        public int number;
        public String field;
        public String questionDarija;
        public String questionFrancais;
        public String questionArabic;
        public boolean required;
        public String mappedField;

        public ConversationStep(int number, String field, String questionDarija, String questionFrancais, String questionArabic, boolean required, String mappedField) {
            this.number = number;
            this.field = field;
            this.questionDarija = questionDarija;
            this.questionFrancais = questionFrancais;
            this.questionArabic = questionArabic;
            this.required = required;
            this.mappedField = mappedField;
        }
    }
}
