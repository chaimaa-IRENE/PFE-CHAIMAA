package com.example.usermanagement.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RasaService {

    private static final Map<String, String> INTENT_MOTS = new LinkedHashMap<>();
    private static final List<String> INTENT_KEYS = new ArrayList<>();

    static {
        INTENT_MOTS.put("moteur", "moteur");
        INTENT_MOTS.put("موتور", "moteur");
        INTENT_MOTS.put("ماكينة", "moteur");
        INTENT_MOTS.put("مكينة", "moteur");
        INTENT_MOTS.put("موطور", "moteur");
        INTENT_MOTS.put("engine", "moteur");
        INTENT_MOTS.put("motuer", "moteur");
        INTENT_MOTS.put("محرك", "moteur");
        INTENT_MOTS.put("limotion", "moteur");

        INTENT_MOTS.put("frein", "frein");
        INTENT_MOTS.put("brake", "frein");
        INTENT_MOTS.put("frain", "frein");
        INTENT_MOTS.put("برياك", "frein");
        INTENT_MOTS.put("فرامل", "frein");

        INTENT_MOTS.put("batterie", "batterie");
        INTENT_MOTS.put("battery", "batterie");
        INTENT_MOTS.put("batri", "batterie");
        INTENT_MOTS.put("بطارية", "batterie");
        INTENT_MOTS.put("باتري", "batterie");

        INTENT_MOTS.put("pneu", "pneu");
        INTENT_MOTS.put("tire", "pneu");
        INTENT_MOTS.put("koutch", "pneu");
        INTENT_MOTS.put("كاوتش", "pneu");
        INTENT_MOTS.put("عجلة", "pneu");
        INTENT_MOTS.put("roue", "roue");
        INTENT_MOTS.put("wheel", "roue");
        INTENT_MOTS.put("عجلات", "roue");

        INTENT_MOTS.put("avant", "avant");
        INTENT_MOTS.put("9dam", "avant");
        INTENT_MOTS.put("قدام", "avant");
        INTENT_MOTS.put("كاحل", "avant");
        INTENT_MOTS.put("قادم", "avant");
        INTENT_MOTS.put("كحلة", "avant");
        INTENT_MOTS.put("front", "avant");

        INTENT_MOTS.put("arriere", "arrière");
        INTENT_MOTS.put("arrière", "arrière");
        INTENT_MOTS.put("lor", "arrière");
        INTENT_MOTS.put("لوخر", "arrière");
        INTENT_MOTS.put("lo5er", "arrière");
        INTENT_MOTS.put("خلف", "arrière");
        INTENT_MOTS.put("rear", "arrière");
        INTENT_MOTS.put("back", "arrière");

        INTENT_MOTS.put("cabine", "cabine");
        INTENT_MOTS.put("kabina", "cabine");
        INTENT_MOTS.put("cabina", "cabine");

        INTENT_MOTS.put("caisse", "caisse");
        INTENT_MOTS.put("caissa", "caisse");

        INTENT_MOTS.put("bruit", "bruit");
        INTENT_MOTS.put("noise", "bruit");
        INTENT_MOTS.put("sound", "bruit");
        INTENT_MOTS.put("صوت", "bruit");
        INTENT_MOTS.put("سوت", "bruit");
        INTENT_MOTS.put("tla3", "bruit");
        INTENT_MOTS.put("sout", "bruit");
        INTENT_MOTS.put("voix", "bruit");

        INTENT_MOTS.put("vibration", "vibration");
        INTENT_MOTS.put("اهتزاز", "vibration");
        INTENT_MOTS.put("رج", "vibration");
        INTENT_MOTS.put("رجاج", "vibration");
        INTENT_MOTS.put("shake", "vibration");

        INTENT_MOTS.put("grave", "grave");
        INTENT_MOTS.put("khatar", "grave");
        INTENT_MOTS.put("خطر", "grave");
        INTENT_MOTS.put("خطير", "grave");
        INTENT_MOTS.put("khbar", "grave");
        INTENT_MOTS.put("خبار", "grave");
        INTENT_MOTS.put("kbar", "grave");
        INTENT_MOTS.put("serious", "grave");
        INTENT_MOTS.put("urgent", "grave");
        INTENT_MOTS.put("bezzaf", "grave");
        INTENT_MOTS.put("بزاف", "grave");
        INTENT_MOTS.put("kbiro", "grave");
        INTENT_MOTS.put("كبير", "grave");

        INTENT_MOTS.put("non_bloquant", "non_bloquant");
        INTENT_MOTS.put("kammel", "non_bloquant");
        INTENT_MOTS.put("sghir", "non_bloquant");
        INTENT_MOTS.put("صغير", "non_bloquant");
        INTENT_MOTS.put("سغير", "non_bloquant");
        INTENT_MOTS.put("ماشي", "non_bloquant");
        INTENT_MOTS.put("minor", "non_bloquant");

        INTENT_MOTS.put("bloquant", "bloquant");
        INTENT_MOTS.put("block", "bloquant");
        INTENT_MOTS.put("blocking", "bloquant");
        INTENT_MOTS.put("bloque", "bloquant");
        INTENT_MOTS.put("مبلوك", "bloquant");
        INTENT_MOTS.put("بلوكاج", "bloquant");
        INTENT_MOTS.put("واقف", "bloquant");
        INTENT_MOTS.put("ma9f", "bloquant");

        INTENT_MOTS.put("securite", "sécurité");
        INTENT_MOTS.put("sécurité", "sécurité");
        INTENT_MOTS.put("safety", "sécurité");
        INTENT_MOTS.put("amen", "sécurité");
        INTENT_MOTS.put("أمان", "sécurité");
        INTENT_MOTS.put("خطيرة", "sécurité");

        INTENT_MOTS.put("panne", "panne");
        INTENT_MOTS.put("عطل", "panne");
        INTENT_MOTS.put("مشكل", "panne");
        INTENT_MOTS.put("probleme", "panne");
        INTENT_MOTS.put("problème", "panne");
        INTENT_MOTS.put("problem", "panne");
        INTENT_MOTS.put("issue", "panne");

        INTENT_MOTS.put("huile", "huile");
        INTENT_MOTS.put("زيت", "huile");
        INTENT_MOTS.put("oil", "huile");

        INTENT_MOTS.put("fumee", "fumée");
        INTENT_MOTS.put("fumée", "fumée");
        INTENT_MOTS.put("دخان", "fumée");
        INTENT_MOTS.put("smoke", "fumée");

        INTENT_MOTS.put("fuite", "fuite");
        INTENT_MOTS.put("leak", "fuite");
        INTENT_MOTS.put("تسرب", "fuite");
        INTENT_MOTS.put("كتسرب", "fuite");
        INTENT_MOTS.put("قطرة", "fuite");

        INTENT_MOTS.put("eclairage", "éclairage");
        INTENT_MOTS.put("éclairage", "éclairage");
        INTENT_MOTS.put("light", "éclairage");
        INTENT_MOTS.put("phare", "éclairage");
        INTENT_MOTS.put("ضواء", "éclairage");
        INTENT_MOTS.put("محراق", "éclairage");

        INTENT_MOTS.put("klaxon", "klaxon");
        INTENT_MOTS.put("horn", "klaxon");
        INTENT_MOTS.put("بوري", "klaxon");

        INTENT_MOTS.put("radiateur", "radiateur");
        INTENT_MOTS.put("رادياتير", "radiateur");
        INTENT_MOTS.put("température", "radiateur");
        INTENT_MOTS.put("حرارة", "radiateur");

        INTENT_MOTS.put("boite", "boîte_vitesses");
        INTENT_MOTS.put("boîte", "boîte_vitesses");
        INTENT_MOTS.put("vitesse", "boîte_vitesses");
        INTENT_MOTS.put("gear", "boîte_vitesses");
        INTENT_MOTS.put("قير", "boîte_vitesses");

        INTENT_MOTS.put("embrayage", "embrayage");
        INTENT_MOTS.put("clutch", "embrayage");
        INTENT_MOTS.put("cloche", "embrayage");

        INTENT_MOTS.put("direction", "direction");
        INTENT_MOTS.put("steering", "direction");

        INTENT_MOTS.put("suspension", "suspension");
        INTENT_MOTS.put("suspension", "suspension");

        INTENT_MOTS.put("echappement", "échappement");
        INTENT_MOTS.put("échappement", "échappement");
        INTENT_MOTS.put("exhaust", "échappement");

        INTENT_MOTS.put("casablanca", "casablanca");
        INTENT_MOTS.put("casa", "casablanca");
        INTENT_MOTS.put("الدار البيضاء", "casablanca");

        INTENT_MOTS.put("rabat", "rabat");
        INTENT_MOTS.put("الرباط", "rabat");

        INTENT_MOTS.put("marrakech", "marrakech");
        INTENT_MOTS.put("مراكش", "marrakech");

        INTENT_MOTS.put("tanger", "tanger");
        INTENT_MOTS.put("طنجة", "tanger");

        INTENT_MOTS.put("fes", "fès");
        INTENT_MOTS.put("fès", "fès");
        INTENT_MOTS.put("فاس", "fès");

        INTENT_KEYS.addAll(INTENT_MOTS.keySet());
        INTENT_KEYS.sort((a, b) -> Integer.compare(b.length(), a.length()));
    }

    public Map<String, String> analyser(String texte) {
        Map<String, String> result = new HashMap<>();
        String texteLower = texte.toLowerCase().trim();
        String bestMatch = null;
        int bestDistance = Integer.MAX_VALUE;
        String bestOriginal = null;

        for (String key : INTENT_KEYS) {
            if (texteLower.contains(key)) {
                result.put("intent", INTENT_MOTS.get(key));
                result.put("original", key);
                return result;
            }
            int dist = levenshteinDistance(texteLower, key);
            if (dist < bestDistance && dist <= Math.max(2, key.length() / 3)) {
                bestDistance = dist;
                bestMatch = INTENT_MOTS.get(key);
                bestOriginal = key;
            }
        }

        for (String key : INTENT_KEYS) {
            String[] words = texteLower.split("\\s+");
            for (String word : words) {
                if (word.length() < 2) continue;
                int dist = levenshteinDistance(word, key);
                if (dist < bestDistance && dist <= Math.max(1, key.length() / 4)) {
                    bestDistance = dist;
                    bestMatch = INTENT_MOTS.get(key);
                    bestOriginal = key;
                }
            }
        }

        if (bestMatch != null) {
            result.put("intent", bestMatch);
            result.put("original", bestOriginal);
            result.put("fuzzy", "true");
            return result;
        }

        result.put("intent", texteLower);
        result.put("original", texteLower);
        return result;
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }
}
