# Workflow Complet de l'Application Smart Fleet Management

## Vue d'ensemble

L'application est un système complet de gestion de flotte avec contrôle de conformité avant départ, intégrant:
- Authentification (JWT + Face ID)
- Gestion des rôles (Admin, Chauffeur, RS, Maintenance, etc.)
- Module Tournées
- Module Documents Réglementaires
- Module Check-up au Vert
- Module Maintenance
- Moteur de Décision (Conformité/Blocage)
- Dashboards Analytiques

---

# 1. AUTHENTIFICATION

## 1.1 Login Standard
```
Utilisateur → Saisit Email/Mot de passe → Backend vérifie JWT → Accès selon rôle
```

## 1.2 Login Face ID (Chauffeurs)
```
Chauffeur → Scan visage → WebAuthnService → Vérification biométrique → Accès tournée
```

## 1.3 Attribution Rôles
- **ADMIN**: Accès total
- **CHAUFFEUR_LIVREUR**: Tournées, Check-up, Historique
- **RS**: Validation anomalies, Dashboards, Alertes
- **MAINTENANCE**: Traitement réparations, Clôture tickets
- **PRESTATAIRE**: Interventions
- **SL**: Supervision
- **ASM, CPL, DRL, RFL**: Dashboards spécifiques

---

# 2. WORKFLOW CHAUFFEUR (PRINCIPAL)

## 2.1 Connexion et Sélection Tournée
```
1. Chauffeur se connecte (Email/Mot de passe ou Face ID)
2. Système affiche ses tournées disponibles
3. Chauffeur sélectionne sa tournée du jour
4. Système affiche le véhicule affecté à cette tournée
```

## 2.2 Scan QR Code Véhicule
```
1. Chauffeur scanne le QR code du véhicule
2. QR code contient: IdVehicule + NumeroTournee
3. Système vérifie:
   - Véhicule appartient bien à la tournée
   - Chauffeur est affecté à cette tournée
4. Si OK → Ouverture fiche véhicule
5. Si KO → Erreur "Véhicule non autorisé pour cette tournée"
```

## 2.3 Chargement Fiche Véhicule
```
1. Système charge les informations véhicule:
   - Immatriculation, Marque, Modèle
   - Kilométrage actuel
   - Statut véhicule
   - Chauffeur affecté
   - Tournée en cours
```

## 2.4 Contrôle Automatique Documents
```
1. Système vérifie tous les documents réglementaires:
   - Assurance
   - Carte Grise
   - Visite Technique
   - ONSSA
   - Autorisation Réglementaire

2. Pour chaque document:
   - Si DateExpiration > DateActuelle → DISPONIBLE (Vert)
   - Si DateExpiration < 30 jours → BIENTOT_EXPIRE (Orange)
   - Si DateExpiration < DateActuelle → EXPIRE (Rouge)

3. Règle métier:
   - Si 1+ documents expirés → Véhicule NON CONFORME
   - Départ interdit
   - Alerte automatique générée
```

## 2.5 Affichage Checklist
```
Catégorie Sécurité:
- Freins
- Pneus
- Feux
- Ceinture
- Extincteur

Catégorie Mécanique:
- Batterie
- Fuite carburant
- Moteur

Catégorie Cabine:
- Rétroviseurs
- Portes
- Tableau de bord

Catégorie Documentation:
- Assurance
- Carte grise
- Visite technique

Catégorie Hygiène:
- Propreté cabine
- Propreté caisse
```

## 2.6 Remplissage Checklist
```
Pour chaque élément:
- Chauffeur coche: Conforme / Non Conforme

Si Non Conforme:
- Système demande obligatoirement:
  * Motif
  * Criticité (Critique/Moyenne/Mineure)
  * Commentaire
  * Photo (obligatoire)
```

## 2.7 Moteur de Décision
```
SI (Tous éléments conformes) ET (Tous documents disponibles)
ALORS
  Statut = CONFORME
  Autorisation départ = OUI
  Véhicule.statut = DISPONIBLE
SINON
  Statut = NON CONFORME
  Autorisation départ = NON
  Véhicule.statut = BLOQUE
  
  SI (Documents expirés) OU (Maintenance critique)
    Niveau blocage = IMMEDIAT
    Départ interdit
  SINON SI (Check-up non conforme)
    Niveau blocage = VALIDATION_RS
    Départ autorisé après validation RS
  FIN SI
FIN SI
```

## 2.8 Gestion Non Conformités
```
Si Criticité = CRITIQUE (Freins, Direction, Fuite carburant, Documents expirés):
  → Blocage immédiat
  → Ticket maintenance créé automatiquement
  → Véhicule immobilisé
  → Alerte envoyée à Maintenance

Si Criticité = MOYENNE (Feux, Batterie, Rétroviseurs):
  → Validation RS requise
  → Départ autorisé après validation

Si Criticité = MINEURE (Propreté, Carrosserie):
  → Départ autorisé
  → Information enregistrée
```

## 2.9 Signature et Validation
```
1. Si CONFORME:
   - Chauffeur signe électroniquement
   - Check-up validé
   - Tournée peut démarrer

2. Si NON CONFORME (Validation RS):
   - Check-up envoyé au RS
   - RS valide ou refuse
   - Si validé → Départ autorisé
   - Si refusé → Motif obligatoire

3. Si NON CONFORME (Blocage immédiat):
   - Départ interdit
   - Maintenance requise
```

## 2.10 Démarrage Tournée
```
1. Si autorisation départ = OUI:
   - Tournée.statut = EN_COURS
   - Heure début enregistrée
   - Véhicule peut sortir

2. Suivi en temps réel:
   - GPS activé
   - Position véhicule
   - Kilométrage
```

## 2.11 Fin de Tournée
```
1. Chauffeur termine sa tournée
2. Tournée.statut = TERMINEE
3. Heure fin enregistrée
4. Distance totale calculée
5. Nombre arrêts enregistré
```

---

# 3. WORKFLOW MAINTENANCE

## 3.1 Création Ticket (Automatique ou Manuel)
```
Automatique:
- Check-up non conforme (critique)
- Document expiré
- Anomalie détectée

Manuel:
- Maintenance crée ticket
- Spécifie: véhicule, élément, criticité, description
```

## 3.2 Workflow Ticket
```
OUVERT → AFFECTE → EN_COURS → REPARÉ → CLÔTURÉ
```

## 3.3 Blocage Véhicule
```
Si Ticket.criticite = CRITIQUE:
  - Véhicule.statut = IMMOBILISE
  - Véhicule.conforme = false
  - VehicleBlocking créé
  - Départ interdit
```

## 3.4 Réparation
```
1. Maintenance affecte ticket à technicien
2. Technicien démarre réparation
3. Technicien enregistre:
   - Actions réalisées
   - Pièces utilisées
   - Coût réel
4. Ticket.statut = REPARÉ
```

## 3.5 Clôture et Déblocage
```
1. Maintenance clôture ticket
2. Ticket.statut = CLÔTURÉ
3. Vérification autres tickets critiques:
   - Si aucun autre ticket critique
     - Véhicule.statut = DISPONIBLE
     - Véhicule.conforme = true
     - VehicleBlocking désactivé
```

---

# 4. WORKFLOW DOCUMENTS RÉGLEMENTAIRES

## 4.1 Ajout Document
```
1. Admin/Maintenance ajoute document
2. Spécifie: véhicule, type, numéro, dates, fichier PDF
3. Système calcule automatiquement statut:
   - DISPONIBLE (vert)
   - BIENTOT_EXPIRE (orange, < 30 jours)
   - EXPIRE (rouge)
```

## 4.2 Vérification Conformité
```
Après ajout/modification/suppression document:
1. Système compte documents expirés pour le véhicule
2. Si count > 0:
   - Vehicule.conforme = false
   - Vehicule.statut = BLOQUE
   - Alerte générée
3. Sinon:
   - Vehicule.conforme = true
   - Vehicule.statut = DISPONIBLE
```

## 4.3 Alertes Expiration
```
Tâche planifiée (quotidienne):
1. Cherche documents avec statut = BIENTOT_EXPIRE
2. Si alerte non envoyée:
   - Envoi email notification
   - Marque alerte_envoyee = true
```

---

# 5. WORKFLOW MOTEUR DE DÉCISION

## 5.1 Vérification Complète
```
POST /api/moteur-decision/verifier-conformite
Params: vehiculeId, chauffeurId

1. Vérifier Documents Réglementaires
   - Compter documents expirés
   - Compter documents bientôt expirés
   - Déterminer niveau blocage

2. Vérifier Maintenance
   - Chercher tickets critiques ouverts
   - Déterminer niveau blocage

3. Vérifier Dernier Check-up
   - Récupérer dernier check-up véhicule
   - Vérifier conformité

4. Appliquer Règles Métier
   - Documents expirés OU Maintenance critique
     → Blocage immédiat
   - Check-up non conforme
     → Validation RS requise
   - Tout conforme
     → Autorisation départ

5. Mettre à jour Véhicule
   - conforme = true/false
   - statut = DISPONIBLE/BLOQUE

6. Gérer VehicleBlocking
   - Créer si blocage
   - Désactiver si déblocage

7. Logger Audit
   - Qui, Quand, Quoi, Ancienne valeur, Nouvelle valeur
```

## 5.2 Résultat
```json
{
  "vehiculeId": 123,
  "chauffeurId": 456,
  "dateVerification": "2026-06-13T23:00:00",
  "verificationDocuments": {
    "totalDocuments": 5,
    "documentsExpirés": 1,
    "documentsBientotExpires": 2,
    "conforme": false,
    "message": "Documents expirés: 1",
    "niveauBlocage": "IMMEDIAT"
  },
  "verificationMaintenance": {
    "ticketsCritiques": 0,
    "conforme": true,
    "message": "Aucun ticket critique",
    "niveauBlocage": "AUCUN"
  },
  "verificationCheckup": {
    "dernierCheckupId": 789,
    "estConforme": true,
    "conforme": true,
    "message": "Dernier check-up conforme",
    "niveauBlocage": "AUCUN"
  },
  "statutFinal": "NON_CONFORME",
  "autorisationDepart": false,
  "motifBlocage": "Documents expirés ou maintenance critique requise",
  "niveauBlocage": "IMMEDIAT"
}
```

---

# 6. WORKFLOW ADMIN

## 6.1 Gestion Utilisateurs
```
1. Admin crée utilisateurs
2. Attribue rôle (ADMIN, CHAUFFEUR, RS, etc.)
3. Définit permissions selon rôle
```

## 6.2 Gestion Véhicules
```
1. Admin ajoute véhicules
2. Attribue à site/agence
3. Affecte à tournées
4. Suit statut et conformité
```

## 6.3 Gestion Tournées
```
1. Admin crée tournées
2. Affecte véhicule et chauffeur
3. Définit date et itinéraire
4. Suit progression en temps réel
```

## 6.4 Dashboards
```
- Dashboard Exécutif: KPIs globaux
- Dashboard Smart Fleet: Analyses détaillées
- Dashboard par rôle: RS, Maintenance, etc.
```

---

# 7. WORKFLOW RS (RESPONSABLE SUPPORT)

## 7.1 Validation Check-ups
```
1. RS reçoit check-ups non conformes
2. Examine motif et photos
3. Valide ou refuse
4. Si refuse → Motif obligatoire
```

## 7.2 Gestion Anomalies
```
1. RS consulte anomalies
2. Valide réparations
3. Suit progression
```

## 7.3 Dashboards
```
- Taux conformité
- Véhicules bloqués
- Documents expirés
- Tickets ouverts
```

---

# 8. WORKFLOW MAINTENANCE

## 8.1 Traitement Tickets
```
1. Maintenance reçoit tickets
2. Affecte à technicien
3. Suit progression
4. Clôture après réparation
```

## 8.2 Gestion Pièces
```
1. Enregistre pièces nécessaires
2. Enregistre pièces utilisées
3. Suit coûts
```

## 8.3 Rapports
```
- Temps moyen réparation
- Taux réparation
- Coûts maintenance
```

---

# 9. ALERTES ET NOTIFICATIONS

## 9.1 Alertes Automatiques
```
- Document expiré
- Visite technique expirée
- Assurance expirée
- Véhicule bloqué
- Anomalie critique
- Réparation retardée
- Maintenance préventive
```

## 9.2 Canaux
```
- Email (EmailNotificationService)
- Notifications temps réel (à implémenter)
- Dashboard alerts
```

---

# 10. AUDIT ET HISTORIQUE

## 10.1 Audit Log
```
- Qui (utilisateur)
- Quand (date/heure)
- Quoi (action)
- Ancienne valeur
- Nouvelle valeur
```

## 10.2 Historique
```
- Contrôles
- Réparations
- Alertes
- Documents
- Connexions
- Modifications
```

---

# 11. FONCTIONNALITÉS AVANCÉES

## 11.1 QR Code
```
- Chaque véhicule a QR code unique
- Contient: IdVehicule + NumeroTournee
- Scan rapide pour accès fiche véhicule
```

## 11.2 Signature Électronique
```
- Chauffeur signe check-up
- RS valide avec signature
- Traçabilité complète
```

## 11.3 Génération PDF
```
- Check-up en PDF
- Rapport intervention
- Documents réglementaires
```

## 11.4 Score Conformité
```
- Calcul par véhicule
- Basé sur: documents, maintenance, check-ups
- Affichage dashboard
```

## 11.5 Score Performance Chauffeur
```
- Calcul par chauffeur
- Basé sur: check-ups conformes, respect horaires, incidents
- Affichage dashboard
```

---

# 12. INTEGRATION POWER BI

## 12.1 Dashboards
```
- PowerBIDashboard component
- Intégration rapports Power BI
- KPIs visuels
```

---

# 13. FLOW COMPLET CHAUFFEUR (RÉSUMÉ)

```
LOGIN
  ↓
SÉLECTION TOURNÉE
  ↓
SCAN QR VÉHICULE
  ↓
VÉRIFICATION AUTORISATION
  ↓
CHARGEMENT FICHE VÉHICULE
  ↓
CONTRÔLE DOCUMENTS (Auto)
  ↓
AFFICHAGE CHECKLIST
  ↓
REMPLISSAGE CHECKLIST
  ↓
MOTEUR DE DÉCISION
  ├─ CONFORME → Signature → DÉPART AUTORISÉ
  ├─ NON CONFORME (Validation RS) → RS valide → DÉPART AUTORISÉ
  └─ NON CONFORME (Blocage) → Maintenance → DÉPART INTERDIT
  ↓
DÉMARRAGE TOURNÉE
  ↓
SUIVI GPS
  ↓
FIN TOURNÉE
```

---

# 14. API ENDPOINTS PRINCIPAUX

## Tournées
- GET /api/tournees
- POST /api/tournees
- POST /api/tournees/{id}/demarrer
- POST /api/tournees/{id}/terminer

## Documents Réglementaires
- GET /api/documents-reglementaires/vehicule/{id}
- POST /api/documents-reglementaires
- GET /api/documents-reglementaires/vehicule/{id}/conforme
- POST /api/documents-reglementaires/envoyer-alertes

## Tickets Maintenance
- GET /api/tickets-maintenance
- POST /api/tickets-maintenance
- POST /api/tickets-maintenance/{id}/affecter
- POST /api/tickets-maintenance/{id}/terminer
- POST /api/tickets-maintenance/{id}/cloturer

## Moteur Décision
- POST /api/moteur-decision/verifier-conformite
- POST /api/moteur-decision/verifier-conformite/vehicule/{id}

---

# 15. BASE DE DONNÉES

## Tables Principales
- users
- roles
- vehicules
- tournees
- documents_reglementaires
- tickets_maintenance
- driver_checklists
- checkups
- anomalie_checkups
- vehicle_blocking
- audit_log
- fleet_alerts

---

# 16. SÉCURITÉ

## Authentification
- JWT tokens
- Face ID (WebAuthn)
- Rôles et permissions

## Autorisations
- @PreAuthorize basé sur rôles
- Vérification appartenance tournée
- Vérification appartenance véhicule

## Audit
- Journal complet des actions
- Traçabilité qui/quand/quoi
