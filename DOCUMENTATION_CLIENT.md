# Documentation Client — Smart Fleet Management (DriverHub v2.0)

## Table des matières

0. [Démarrage rapide (Quick Start)](#0-démarrage-rapide-quick-start)
1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture technique](#2-architecture-technique)
3. [Prérequis techniques](#3-prérequis-techniques)
4. [Installation avec SQL Server (Production)](#4-installation-avec-sql-server-production)
5. [Installation avec H2 (Développement/Test)](#5-installation-avec-h2-développementtest)
6. [Comptes par défaut](#6-comptes-par-défaut)
7. [API REST — Référence](#7-api-rest--référence)
8. [Configuration avancée](#8-configuration-avancée)
9. [Dépannage](#9-dépannage)
10. [Parcours utilisateur dans l'interface](#10-parcours-utilisateur-dans-linterface)
    - [Écran d'accueil](#101-écran-daccueil-cover-page)
    - [Connexion](#102-page-de-connexion)
    - [Dashboard central](#103-dashboard-central)
    - [Module Chauffeur](#104-module-chauffeur)
    - [Module Maintenance](#105-module-maintenance)
    - [Module Responsable Support](#106-module-responsable-support-rs)
    - [Module Administrateur](#107-module-administrateur)
    - [Autres rôles](#108-autres-rôles)
11. [Fonctionnalité vocale (Voice/Vocal)](#11-fonctionnalité-vocale-voicevocal)
    - [Présentation](#111-présentation)
    - [Agent vocal de déclaration (VoiceDeclarationAgent)](#112-agent-vocal-de-déclaration-voicedeclarationagent)
    - [Assistant vocal Darija (VoiceChatIA)](#113-assistant-vocal-darija-voicechatia)
    - [Déclaration vocale simple (VocalDeclarationIA)](#114-déclaration-vocale-simple-vocaldeclarationia)
    - [Service TTS (Text-to-Speech)](#115-service-tts-text-to-speech)
    - [Service STT (Speech-to-Text)](#116-service-stt-speech-to-text)
    - [Installation et configuration du vocal](#117-installation-et-configuration-du-vocal)
    - [Utilisation pas à pas](#118-utilisation-pas-à-pas)
    - [Voix et langues supportées](#119-voix-et-langues-supportées)

---

## 0. Démarrage rapide (Quick Start)

> **Objectif :** Lancer l'application complète en moins de 5 minutes.

### 0.1 Vérifier les prérequis

Ouvrir **un terminal PowerShell** et exécuter chaque commande :

```powershell
# ── Java 21 (backend) ──
java -version
# Résultat attendu : openjdk version "21" 2023-09-19 LTS
# Si introuvable : https://adoptium.net/ (Temurin 21 LTS)

# ── Node.js 18+ (frontend) ──
node --version
# Résultat attendu : v18.x.x ou v20.x.x ou v22.x.x
# npm est inclus automatiquement
# Si introuvable : https://nodejs.org/ (v18 LTS minimum)

# ── Python 3.8+ (TTS vocal) ──
python --version
# Résultat attendu : Python 3.10.x ou 3.11.x ou 3.12.x
# Si "Python was not found" :
#   1. Installer Python depuis https://www.python.org/downloads/
#   2. Dans Paramètres Windows → Applications → Alias d'exécution d'application
#      → Décocher "python.exe" et "python3.exe" (désactive le stub du Windows Store)
#   3. Redémarrer le terminal

# ── Maven 3.9+ (build backend) ──
C:\Users\moutaoch\Downloads\apache-maven-3.9.15-bin\apache-maven-3.9.15\bin\mvn.cmd --version
# Résultat attendu : Apache Maven 3.9.x
# Si introuvable : télécharger depuis https://maven.apache.org/download.cgi
```

#### 0.1.1 Installer edge-tts (une seule fois)

```powershell
# Moteur de synthèse vocale (obligatoire pour l'agent vocal)
python -m pip install edge-tts
# Résultat : Successfully installed edge-tts-7.2.8 ...

# Vérifier l'installation
python -c "import edge_tts; print('edge-tts OK')"
# Résultat : edge-tts OK
```

#### 0.1.2 Installer les dépendances frontend (une seule fois)

```powershell
Set-Location frontend
npm install --legacy-peer-deps
# Résultat : added XXXX packages in Y seconds
Set-Location ..
```

> **⚠️ Important SSL :** Si edge-tts échoue avec une erreur `CERTIFICATE_VERIFY_FAILED`,
> le script `backend/tts_temp/tts_server.py` désactive automatiquement la vérification SSL
> via `edge_comm._SSL_CTX.verify_mode = ssl.CERT_NONE`.
> Voir section [9.6](#96-le-tts-voix-ne-fonctionne-pas) point 6 pour le diagnostic complet.

### 0.2 Lancer les serveurs (ordre à respecter)

> **Important :** Lancer chaque serveur dans **un terminal PowerShell séparé**.

```powershell
# ════════════════════════════════════════════════════════════
# TERMINAL 1 — Backend Spring Boot (port 8080)
# ════════════════════════════════════════════════════════════
Set-Location "C:\Users\moutaoch\Downloads\mon-projet-extraction (2)\mon-projet-extraction\backend"

# Lancer le backend
C:\Users\moutaoch\Downloads\apache-maven-3.9.15-bin\apache-maven-3.9.15\bin\mvn.cmd spring-boot:run

# Attendre ~50 secondes. Le démarrage est terminé quand vous voyez :
#   "Started UserManagementApplication in XX seconds"
#   "Tomcat started on port 8080"
```

```powershell
# ════════════════════════════════════════════════════════════
# TERMINAL 2 — Frontend React (port 3000)
# ════════════════════════════════════════════════════════════
Set-Location "C:\Users\moutaoch\Downloads\mon-projet-extraction (2)\mon-projet-extraction\frontend"

# Lancer le frontend (dev server)
npm start
# Résultat attendu dans les 30 secondes :
#   "Compiled successfully!"
#   "Local: http://localhost:3000"
```

```powershell
# ════════════════════════════════════════════════════════════
# TERMINAL 3 — Serveur TTS Python (port 5000) — OPTIONNEL
# ════════════════════════════════════════════════════════════
# Note : Le TTS fonctionne aussi via le backend (architecture par défaut).
# Ce serveur supplémentaire n'est nécessaire que si vous voulez
# une architecture dédiée (TTS_BASE = "/tts" dans api.ts).
python backend/tts_temp/tts_http_server.py 5000
```

### 0.3 Vérifier que les serveurs tournent

```powershell
# ── Vérifier les processus ──
Get-Process -Name java, node, python -ErrorAction SilentlyContinue |
  Select-Object Id, ProcessName, @{N="Port";E={...}} -Unique

# ── Vérifier les ports ──
netstat -ano | Select-String ":8080 |:3000 |:5000 "
# 8080 → Backend Spring Boot (java)
# 3000 → Frontend React (node)
# 5000 → TTS HTTP (python, optionnel)

# ── Tester l'API backend ──
Invoke-RestMethod -Uri "http://localhost:8080/users/login" -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"admin","password":"admin123"}'
# Résultat : {"token":"eyJ...","role":"ADMIN","username":"admin","id":1}

# ── Tester le frontend ──
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
# Résultat : StatusCode 200 (page HTML)
```

### 0.4 Accéder à l'application

| URL | Service |
|-----|---------|
| `http://localhost:3000` | Interface utilisateur (Frontend React) |
| `http://localhost:8080` | API REST (Backend Spring Boot) |
| `http://localhost:8080/swagger-ui.html` | Documentation API (si Swagger est configuré) |
| `http://localhost:8080/h2-console` | Console H2 (uniquement si profil `h2`) |

### 0.5 Test du TTS (synthèse vocale)

#### Option A : Test direct via Python CLI

```powershell
# Exécute edge-tts directement (sans backend)
python "C:\Users\moutaoch\Downloads\mon-projet-extraction (2)\mon-projet-extraction\backend\tts_temp\tts_server.py" `
  "salam test" "ar-MA-JamalNeural" "-5pct"
# Résultat OK : {"status":"ok","path":"...tts_cache/xxxx.mp3"}
# Résultat ERREUR SSL : {"status":"error","error":"[SSL: CERTIFICATE_VERIFY_FAILED]..."}
#   → Voir 0.1.2 (patch SSL automatique dans tts_server.py)

# Vérifier que le MP3 généré a une taille > 0
Get-Item "C:\Users\moutaoch\Downloads\mon-projet-extraction (2)\mon-projet-extraction\backend\tts_temp\tts_cache\*.mp3" |
  Select-Object Name, Length | Sort-Object LastWriteTime -Descending | Select-Object -First 3
# Chaque fichier doit faire au moins 5 KB (5000+ octets). Si 0 → SSL bloqué.
```

#### Option B : Test via l'API backend

```powershell
# Le backend appelle le script Python et retourne le MP3
Invoke-WebRequest -Uri "http://localhost:8080/api/tts/speak?text=salam&voice=ar-MA-JamalNeural&rate=-5pct" `
  -OutFile "$env:TEMP\tts_test_backend.mp3" -TimeoutSec 60
$f = Get-Item "$env:TEMP\tts_test_backend.mp3"
Write-Host "Taille: $($f.Length) octets"
Write-Host "OK si taille > 5000, ERREUR si taille = 0"

# Vérifier que c'est un vrai MP3 (entête valide)
$bytes = [System.IO.File]::ReadAllBytes($f.FullName)
if ($bytes[0] -eq 0xFF -and ($bytes[1] -band 0xE0) -eq 0xE0) {
  Write-Host "Format MP3: VALIDE (sync byte trouvé)"
} else {
  Write-Host "Format MP3: INVALIDE"
}
```

#### Option C : Test via le frontend proxy

```powershell
# Passe par le proxy CRA (setupProxy.js) → backend → Python
Invoke-WebRequest -Uri "http://localhost:3000/api/tts/speak?text=salam&voice=ar-MA-JamalNeural&rate=-5pct" `
  -OutFile "$env:TEMP\tts_test_frontend.mp3" -TimeoutSec 60
$f = Get-Item "$env:TEMP\tts_test_frontend.mp3"
Write-Host "Taille: $($f.Length) octets (identique à option B si tout fonctionne)"
```

#### Option D : Nettoyage du cache TTS

```powershell
# Supprimer TOUS les fichiers MP3 du cache (force la régénération)
Remove-Item "C:\Users\moutaoch\Downloads\mon-projet-extraction (2)\mon-projet-extraction\backend\tts_temp\tts_cache\*.mp3"

# Ou supprimer uniquement les fichiers vides (0 octets)
Get-ChildItem "C:\Users\moutaoch\Downloads\mon-projet-extraction (2)\mon-projet-extraction\backend\tts_temp\tts_cache" |
  Where-Object { $_.Length -eq 0 } | Remove-Item
```

### 0.6 Test de l'agent vocal complet

```powershell
# ── 1. Démarrer une session (greeting) ──
$headers = @{ "Content-Type" = "application/json" }
$body = '{ "chauffeurId": 2, "chauffeurNom": "Hicham", "chauffeurMatricule": "CH-001" }'
$session = Invoke-RestMethod -Uri "http://localhost:8080/api/voice-agent/start" `
  -Method Post -Headers $headers -Body $body
Write-Host "Session ID : $($session.sessionId)"
Write-Host "Step : $($session.step)"
Write-Host "Question FR : $($session.questionFrancais)"
Write-Host "Question AR : $($session.questionArabic)"

# ── 2. Répondre "oui" au greeting (step 1 → step 2) ──
$respondBody = "{ `"sessionId`": `"$($session.sessionId)`", `"step`": 1, `"response`": `"oui`" }"
$step2 = Invoke-RestMethod -Uri "http://localhost:8080/api/voice-agent/respond" `
  -Method Post -Headers $headers -Body $respondBody
Write-Host "Step 2 : $($step2.field)"
Write-Host "Question FR : $($step2.questionFrancais)"
Write-Host "Choix disponibles : $($step2.choices.Count)"
foreach ($c in $step2.choices) {
  Write-Host "  $($c.id) - $($c.label_fr)"
}

# ── 3. Choisir un véhicule (step 2 → step 3) ──
$respondBody2 = "{ `"sessionId`": `"$($session.sessionId)`", `"step`": 2, `"response`": `"1`" }"
$step3 = Invoke-RestMethod -Uri "http://localhost:8080/api/voice-agent/respond" `
  -Method Post -Headers $headers -Body $respondBody2
Write-Host "Step 3 : $($step3.field)"
Write-Host "Question FR : $($step3.questionFrancais)"
```

### 0.7 Résumé des commandes essentielles

| Action | Commande | Où l'exécuter |
|--------|----------|---------------|
| Démarrer backend | `cd backend && mvn spring-boot:run` | Terminal 1 |
| Démarrer frontend | `cd frontend && npm start` | Terminal 2 |
| Tester TTS (backend) | `curl "http://localhost:8080/api/tts/speak?text=test&rate=-5pct"` | N'importe où |
| Tester TTS (Python) | `python backend/tts_temp/tts_server.py "test" "ar-MA-JamalNeural" "-5pct"` | Terminal 3 |
| Vider cache TTS | `del backend\tts_temp\tts_cache\*.mp3` | N'importe où |
| Vérifier port 8080 | `netstat -ano \| findstr :8080` | N'importe où |
| Login API | `curl -X POST http://localhost:8080/users/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"` | N'importe où |
| Login chauffeur | `chauffeur_casa` / `driver123` | Navigateur |
| Login admin | `admin` / `admin123` | Navigateur |
| Login RS | `rs_support` / `support123` | Navigateur |

---

## 1. Présentation du projet

**Smart Fleet Management (DriverHub v2.0)** est une application complète de gestion de flotte automobile développée pour **Danone Maroc**. Elle permet de :

- Gérer les véhicules (CRUD, affectation chauffeur, suivi kilométrage)
- Planifier et suivre les **tournées** (chauffeurs, routes)
- Réaliser des **check-ups avant départ** (procédure "au Vert") avec signature numérique
- Gérer les **documents réglementaires** avec alerte d'expiration automatique
- Suivre les **tickets de maintenance** (signalement → réparation → clôture)
- Bloquer/débloquer les véhicules non conformes via un **moteur de décision**
- Analyser les **KPI** via des dashboards interactifs
- Authentification sécurisée par **JWT + Face ID (WebAuthn)**

### Modules fonctionnels

| Module | Acteurs principaux | Description |
|--------|-------------------|-------------|
| Authentication | Tous | Login JWT + Face ID, 12 rôles distincts |
| Véhicules | Admin, Chauffeur | CRUD, QR code, géolocalisation (Geotab) |
| Tournées | Chauffeur, Admin | Planification → En cours → Terminée |
| Check-up "Au Vert" | Chauffeur | Inspection pré-départ (5 catégories - Sécurité, Mécanique, Cabine, Documents, Hygiène) |
| Documents | RS, Admin | Suivi expiration (assurance, carte grise, visite technique, ONSSA) |
| Maintenance | Chauffeur, Mécanicien | Tickets : Ouvert → Assigné → En cours → Réparé → Clos |
| Décision/Blocage | Automatique | Vérification conformité (documents + maintenance + check-up) |
| Alertes | Tous | Notifications email pour documents expirés |
| Dashboards | RS, RPF, DRL, CPL, etc. | KPI, Power BI, cartographie Leaflet |
| Audit Trail | Admin | Historique complet des actions |

---

## 2. Architecture technique

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│            React 19 + TypeScript + Tailwind               │
│            Port 3000 (CRA proxy → 8080)                   │
│              │                                            │
│  ┌───────────┴────────────┐                               │
│  │ /api/*  (dont /api/tts)│    /tts/* (optionnel)         │
│  │    → proxy :8080       │    → proxy :5000              │
│  └───────────┬────────────┘                               │
└──────────────┼────────────────────────────────────────────┘
               │
┌──────────────┼────────────────────────────────────────────┐
│              ▼             BACKEND                        │
│    ┌─────────────────┐   Spring Boot 3.2 / Java 21        │
│    │  TtsController   │          Port 8080                │
│    │  /api/tts/speak  │                                   │
│    └────────┬────────┘  ┌──────────┐  ┌────────────────┐  │
│             │           │Services  │→│  Repositories   │  │
│             ▼           └──────────┘  └────────┬───────┘  │
│    ┌──────────────────┐                        │          │
│    │ Python CLI (cmd) │                        │          │
│    │ edge-tts → MP3   │                        │          │
│    └──────────────────┘                        │          │
└────────────────────────────────────────────────┼──────────┘
                                                 │
                      ┌──────────────────────────┼──────────────┐
                      ▼                          ▼              ▼
           ┌────────────────┐       ┌────────────────┐    ┌──────────┐
           │   SQL Server    │       │   H2 (dev)     │    │ Service  │
           │  (Production)   │       │  (Test)         │    │  IA      │
           │  Port 1433      │       │  .mv.db fichier │    │ Python   │
           └────────────────┘       └────────────────┘    │Port 5001 │
                                                           └──────────┘
```

### Stack technique détaillée

| Couche | Technologie | Version |
|--------|------------|---------|
| **Backend** | Java (JDK) | 21 LTS |
| | Spring Boot | 3.2.0 |
| | Maven | 3.9+ |
| | Base de données principale | SQL Server 2019+ |
| | Base de données dev | H2 (file-based) |
| | JWT | jjwt 0.12.5 |
| | Face ID | WebAuthn |
| **Frontend** | React | 19 |
| | TypeScript | 5.5 |
| | Tailwind CSS | 3.4 |
| | Material UI | 7 |
| | CRA (Create React App) | 5 |
| **Service IA** (optionnel) | Python | 3.8+ |
| | Flask | - |
| | YOLOv8 | Détection objets |
| | Tesseract / EasyOCR | OCR plaques |
| | Edge TTS | Synthèse vocale arabe |

---

## 3. Prérequis techniques

### 3.1 Backend

| Logiciel | Version | Téléchargement |
|----------|---------|----------------|
| Java JDK | **21 LTS** | https://adoptium.net/ |
| Maven | **3.9+** | https://maven.apache.org/download.cgi |
| SQL Server | **2019+** | Installation locale avec port **1433** |
| SQL Server Management Studio (SSMS) | - | Optionnel pour la gestion de la base |

### 3.2 Frontend

| Logiciel | Version | Téléchargement |
|----------|---------|----------------|
| Node.js | **18+ (LTS recommandé)** | https://nodejs.org/ |
| npm | Inclus avec Node.js | - |

### 3.3 Service IA (optionnel — pour l'OCR et la détection de défauts)

| Logiciel | Téléchargement |
|----------|----------------|
| Python 3.8+ | https://www.python.org/downloads/ |
| Tesseract OCR | https://github.com/UB-Mannheim/tesseract/wiki |
| Modèle YOLOv8 | Inclus dans le projet (`ia/yolov8n.pt`) |

### 3.4 Réseau

- Les ports suivants doivent être ouverts/localement disponibles :
  - **8080** — Backend Spring Boot
  - **3000** — Frontend React (dev)
  - **1433** — SQL Server (optionnel, uniquement pour le profil `sqlserver`)
  - **5000** — TTS HTTP Server (optionnel, alternative au TTS via backend)
  - **5001** — API IA Python (optionnel)

---

## 4. Installation avec SQL Server (Production)

> **Important :** Cette section est la configuration recommandée pour l'exploitation en production.

### 4.1 Préparer la base de données SQL Server

1. Ouvrir **SQL Server Management Studio (SSMS)**.
2. Se connecter à l'instance SQL Server (locale ou distante).
3. Créer la base de données :
   ```sql
   CREATE DATABASE driverhub_sql;
   ```
4. Créer l'utilisateur dédié :
   ```sql
   CREATE LOGIN CH WITH PASSWORD = 'Chaimaa#2026SecureA1';
   CREATE USER CH FOR LOGIN CH;
   ALTER ROLE db_owner ADD MEMBER CH;
   ```
   > **Note :** Vous pouvez modifier le nom d'utilisateur et le mot de passe. Pensez alors à mettre à jour la configuration (section 4.3).

5. Vérifier que le serveur SQL écoute sur le port **1433** :
   - Ouvrir **Configuration Manager SQL Server** > **SQL Server Network Configuration** > **Protocols for MSSQLSERVER**
   - Activer **TCP/IP** si ce n'est pas déjà fait
   - Redémarrer le service SQL Server si nécessaire

### 4.2 Vérifier l'accès à SQL Server

```cmd
sqlcmd -S localhost,1433 -U CH -P Chaimaa#2026SecureA1
```
Vous devez obtenir une invite `1>` confirmant la connexion.

### 4.3 Configurer l'application

Le fichier de configuration SQL Server se trouve ici :

📄 **`backend/src/main/resources/application-sqlserver.properties`**

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=driverhub_sql;encrypt=true;trustServerCertificate=true
spring.datasource.driverClassName=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.datasource.username=CH
spring.datasource.password=Chaimaa#2026SecureA1
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect
spring.jpa.hibernate.ddl-auto=update
```

**Paramètres à personnaliser :**

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `url` | URL de connexion SQL Server | `localhost:1433` |
| `databaseName` | Nom de la base | `driverhub_sql` |
| `username` | Utilisateur SQL | `CH` |
| `password` | Mot de passe | `Chaimaa#2026SecureA1` |

### 4.4 Activer le profil SQL Server

Dans **`backend/src/main/resources/application.properties`**, modifier la ligne 4 :

```properties
spring.profiles.active=sqlserver
```

> **Important :** Le profil `sqlserver` doit être actif, PAS `h2`.

### 4.5 Construire et lancer le backend

```cmd
cd backend
mvn clean package -DskipTests
java -jar target\user-management-0.0.1-SNAPSHOT.jar
```

> **Note :** Au premier démarrage, Hibernate crée automatiquement toutes les tables (`ddl-auto=update`) et `DataInitializer` insère **18 utilisateurs par défaut**.

### 4.6 Lancer le frontend

```cmd
cd frontend
npm install --legacy-peer-deps
npm start
```

---

## 5. Installation avec H2 (Développement/Test)

H2 est une base de données embarquée qui ne nécessite aucune installation. Idéale pour les tests ou la démonstration.

### 5.1 Configurer le profil H2

Dans **`backend/src/main/resources/application.properties`**, activer le profil H2 :

```properties
spring.profiles.active=h2
```

### 5.2 Ajouter la configuration H2

Créer le fichier **`backend/src/main/resources/application-h2.properties`** :

```properties
spring.datasource.url=jdbc:h2:file:./data/driverhub;DB_CLOSE_ON_EXIT=FALSE;DB_CLOSE_DELAY=-1
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
spring.jpa.hibernate.ddl-auto=update
```

> **Note :** La console H2 sera accessible à l'adresse `http://localhost:8080/h2-console` (JDBC URL : `jdbc:h2:file:./data/driverhub`).

### 5.3 Lancer le backend

```cmd
cd backend
mvn clean package -DskipTests
java -jar target\user-management-0.0.1-SNAPSHOT.jar
```

---

## 6. Comptes par défaut

> **Note :** Tous les mots de passe ci-dessous sont définis en dur dans `DataInitializer.java`. Ils doivent être changés pour la production.

### Administrateur

| Login | Mot de passe | Rôle | Agence |
|-------|-------------|------|--------|
| `admin` | `admin123` | ADMIN | CASABLANCA |

### Chauffeurs

| Login | Mot de passe | Rôle | Agence |
|-------|-------------|------|--------|
| `chauffeur_casa` | `driver123` | CHAUFFEUR | CASABLANCA |
| `chauffeur_rabat` | `driver456` | CHAUFFEUR | RABAT |
| `chauffeur_marrakech` | `driver789` | CHAUFFEUR | MARRAKECH |
| `chauffeur_fes` | `driver321` | CHAUFFEUR | FES |

### Support & Supervision

| Login | Mot de passe | Rôle | Agence |
|-------|-------------|------|--------|
| `rs_support` | `support123` | RS (Responsable Support) | CASABLANCA |
| `sl_casa` | `sl123` | SL (Superviseur Livraison) | CASABLANCA |
| `sl_rabat` | `sl456` | SL | RABAT |

### Maintenance

| Login | Mot de passe | Rôle | Agence |
|-------|-------------|------|--------|
| `mecanique_casa` | `maint123` | MAINTENANCE | CASABLANCA |
| `mecanique_rabat` | `maint456` | MAINTENANCE | RABAT |

### Prestataires

| Login | Mot de passe | Rôle | Agence |
|-------|-------------|------|--------|
| `prestataire_auto` | `provider123` | PRESTATAIRE | CASABLANCA |
| `prestataire_mecanique` | `mecanic123` | PRESTATAIRE | RABAT |

### Gestion & Supervision

| Login | Mot de passe | Rôle | Agence |
|-------|-------------|------|--------|
| `rpf_prestataire` | `rpf123` | RPF | CASABLANCA |
| `cpl_logistic` | `cpl123` | CPL | RABAT |
| `drl_regional` | `drl123` | DRL | CASABLANCA |
| `rfl_flotte` | `rfl123` | RFL | MARRAKECH |
| `asm_casa` | `asm123` | ASM (Sécurité & Méthodes) | CASABLANCA |
| `asm_rabat` | `asm456` | ASM | RABAT |

### Rôles & permissions

| Rôle | Description | Accès principaux |
|------|-------------|-----------------|
| **ADMIN** | Super-utilisateur | Tout le système |
| **CHAUFFEUR** | Conducteur de livraison | Tournées, check-up, déclarations |
| **RS** | Responsable Support | Validation anomalies, dashboards |
| **MAINTENANCE** | Équipe technique | Tickets réparation, clôture |
| **PRESTATAIRE** | Prestataire externe | Interventions assignées |
| **SL** | Superviseur Livraison | Supervision tournées |
| **ASM** | Agent Sécurité & Méthodes | Conformité, audit |
| **CPL** | Chef de parc logistique | Gestion flotte |
| **DRL** | Directeur régional | Dashboards régionaux |
| **RFL** | Responsable flotte | Gestion complète flotte |
| **RPF** | Responsable parc & fournisseurs | Prestataires, contrats |

---

## 7. API REST — Référence

Toutes les API sont accessibles via `http://localhost:8080`.

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/users/login` | Authentification (username + password) |
| POST | `/users/face-login` | Login par reconnaissance faciale |
| POST | `/users/webauthn/login/begin` | Début authentification WebAuthn |
| POST | `/users/webauthn/login/complete` | Finalisation authentification WebAuthn |

**Exemple de login :**
```json
POST /users/login
{
  "username": "admin",
  "password": "admin123"
}
```

**Réponse :**
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "role": "ADMIN",
  "username": "admin",
  "id": 1
}
```

### Véhicules

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/vehicles` | Liste tous les véhicules |
| GET | `/api/vehicles/{id}` | Détail d'un véhicule |
| POST | `/api/vehicles` | Créer un véhicule |
| PUT | `/api/vehicles/{id}` | Modifier un véhicule |
| DELETE | `/api/vehicles/{id}` | Supprimer un véhicule |
| GET | `/api/vehicles/blocked` | Liste des véhicules bloqués |

### Documents réglementaires

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/legal-documents` | Liste tous les documents |
| GET | `/api/legal-documents/expiring` | Documents proches de l'expiration |
| POST | `/api/legal-documents` | Ajouter un document |

### Check-up & Maintenance

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/checkups` | Liste des check-ups |
| POST | `/api/checkups` | Créer un check-up |
| GET | `/api/interventions` | Liste des interventions |
| POST | `/api/interventions` | Créer une intervention |

### Dashboards

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/fleet/dashboard` | Dashboard principal flotte |
| GET | `/api/kpi/reports` | Rapports KPI |

---

## 8. Configuration avancée

### 8.1 Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `MAIL_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Port SMTP | `587` |
| `MAIL_USERNAME` | Identifiant SMTP | `""` |
| `MAIL_PASSWORD` | Mot de passe SMTP | `""` |
| `MAIL_FROM` | Expéditeur email | `no-reply@driverhub.ma` |
| `MAIL_ENABLED` | Activer les emails | `false` |
| `OPENAI_API_KEY` | Clé API OpenAI (OCR) | `""` (optionnel) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (OCR) | `""` (optionnel) |

### 8.2 Fichier de configuration principal

📄 **`backend/src/main/resources/application.properties`**

```properties
# Profil actif : sqlserver ou h2
spring.profiles.active=sqlserver

# Port du serveur
server.port=8080

# JWT (durée : 24h)
jwt.secret=DriverHubSecureAuthKey2024Minimum256BitsRequiredForHS256
jwt.expiration-ms=86400000

# Upload fichiers (max 10MB)
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Ollama (NLP Darija)
ollama.url=http://localhost:11434
ollama.model=llama3.2:1b
```

### 8.3 Configuration proxy du frontend

Le fichier **`frontend/src/setupProxy.js`** redirige :
- `/api/*` → `http://localhost:8080` (inclut `/api/tts/speak` pour le TTS)
- `/users/*` → `http://localhost:8080`
- `/admin/*` → `http://localhost:8080`
- `/uploads/*` → `http://localhost:8080`
- `/tts/*` → `http://localhost:5000` (service TTS HTTP alternatif, inutilisé par défaut)

> **Note :** Le TTS (`/api/tts/speak`) passe par le backend Spring Boot qui appelle le script Python. Aucun serveur TTS séparé n'est nécessaire.

Pour changer l'URL du backend en production, décommentez dans `frontend/.env` :
```env
REACT_APP_API_URL=http://192.168.1.40:8080
```

### 8.4 Service IA (Python) — Optionnel

Pour activer la détection de défauts et l'OCR de plaques :

```cmd
cd ia
pip install -r requirements.txt
python app.py 5001
```

> **Prérequis :** Tesseract OCR doit être installé sur le système.
> 
> Le dossier `ia/models/` contient la configuration YOLOv8 fine-tunée pour 14 classes :
> (pneu crevé, pare-brise fissuré, phare cassé, carrosserie endommagée, etc.)

### 8.5 TTS (Synthèse vocale) — Optionnel

```cmd
cd ia
pip install edge-tts
python tts_server.py
```

> Voix arabe marocaine : `ar-MA-JamalNeural`

---

## 9. Dépannage

### 9.1 SQL Server — Échec de connexion

**Symptôme :** `Échec de l'ouverture de session de l'utilisateur 'CH'`

**Solutions :**
1. Vérifier que SQL Server est en mode **SQL Server and Windows Authentication** :
   ```sql
   EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE',
     N'Software\Microsoft\MSSQLServer\MSSQLServer',
     N'LoginMode', REG_DWORD, 2;
   ```
2. Créer ou recréer l'utilisateur `CH` :
   ```sql
   CREATE LOGIN CH WITH PASSWORD = 'Chaimaa#2026SecureA1';
   CREATE USER CH FOR LOGIN CH;
   ALTER ROLE db_owner ADD MEMBER CH;
   ```
3. Vérifier que le port 1433 est accessible : `telnet localhost 1433`

### 9.2 Port déjà utilisé

**Symptôme :** `Address already in use: bind`

**Solutions :**
- Changer le port dans `application.properties` : `server.port=8081`
- Ou tuer le processus occupant le port :
  ```cmd
  netstat -ano | findstr :8080
  taskkill /PID <PID> /F
  ```

### 9.3 Maven — Build échoué

**Symptôme :** `BUILD FAILURE`

**Solutions :**
```cmd
# Vérifier la version Java
java -version  # Doit être 21+

# Nettoyer et rebuild
mvn clean
mvn package -DskipTests
```

### 9.4 npm — Erreurs de dépendances

**Symptôme :** `ERESOLVE unable to resolve dependency tree`

**Solution :**
```cmd
npm install --legacy-peer-deps
```

### 9.5 Base de données H2 — Fichier corrompu

**Symptôme :** Erreur au démarrage avec le profil H2

**Solutions :**
```cmd
# Supprimer les fichiers de la base H2 et redémarrer
del backend\data\driverhub.mv.db
del backend\data\driverhub.trace.db
```

### 9.6 Le TTS (voix) ne fonctionne pas

**Symptôme :** L'agent vocal parle mais aucun son n'est produit

**Solutions :**
1. Vérifier que Python est accessible :
   ```cmd
   python --version
   ```
   Si "Python was not found", désactiver les **App execution aliases** dans Paramètres Windows > Applications > Alias d'exécution (décocher python.exe et python3.exe)

2. Vérifier que edge-tts est installé :
   ```cmd
   python -m pip show edge-tts
   ```
   Sinon : `python -m pip install edge-tts`

3. Vérifier le chemin Python dans `application.properties` :
   ```properties
   tts.python.path=C:/Users/votre_user/AppData/Local/Programs/Python/Python310/python.exe
   ```

4. Test direct via l'API :
   ```powershell
   curl "http://localhost:8080/api/tts/speak?text=salam&voice=ar-MA-JamalNeural&rate=-5pct" -o test.mp3
   ```
   Si erreur `TTS process exit code 9009` → Python introuvable
   Si erreur `ModuleNotFoundError` → edge-tts non installé

5. Vérifier que le script CLI existe :
   ```cmd
   dir backend\tts_temp\tts_server.py
   ```
   (Ne pas confondre avec `ia/tts_server.py` qui est un serveur Flask, pas la CLI)

6. **Erreur SSL — CERTIFICATE_VERIFY_FAILED** (message dans la console backend ou Python) :

   **Cause :** Sur certains réseaux (proxy d'entreprise, antivirus), la vérification SSL du certificat de `speech.platform.bing.com` échoue.

   **Symptôme :** Le fichier MP3 généré fait **0 octet** (cache vide/corrompu). Le navigateur ne peut rien lire.

   **Solution :** Le script `backend/tts_temp/tts_server.py` patche automatiquement la vérification SSL. Si le problème persiste, vérifier que les lignes suivantes sont présentes au début du fichier :
   ```python
   import ssl
   import edge_tts.communicate as edge_comm
   # Désactiver la vérification SSL
   edge_comm._SSL_CTX.check_hostname = False
   edge_comm._SSL_CTX.verify_mode = ssl.CERT_NONE
   ```

7. **Cache TTS corrompu (0 octet) :** Si un fichier MP3 vide a été créé, le supprimer pour forcer sa régénération :
   ```cmd
   del backend\tts_temp\tts_cache\*.mp3
   ```
   > Ne supprimez que les fichiers de **0 octet** si certains MP3 précédents fonctionnaient encore.

### 9.7 Agent vocal bloqué — pas de son après autoplay

**Symptôme :** L'agent semble parler (animation "Parle en cours") mais aucun son ne sort. Un bandeau jaune "Cliquez pour activer la voix" peut apparaître.

**Cause :** Les navigateurs modernes (Chrome, Edge) bloquent l'autoplay audio. L'utilisateur doit **cliquer une fois** sur l'interface pour autoriser la lecture audio.

**Solutions :**
1. Cliquer sur le bandeau jaune **"Cliquez pour activer la voix"** en bas de l'écran
2. Cliquer n'importe où dans la zone de l'agent vocal
3. Vérifier que l'icône 🔊 (haut à droite) n'est pas barrée (mode muet)

### 9.8 Erreurs TypeScript au build frontend

**Symptôme :** `TS2802: Type 'Set<string>' can only be iterated through when using '--downlevelIteration'`

**Solution :** Dans `frontend/tsconfig.json`, ajouter :
```json
"compilerOptions": {
  "target": "es5",
  "downlevelIteration": true,
  ...
}
```

---

## 10. Parcours utilisateur dans l'interface

### 10.1 Écran d'accueil (Cover Page)

Lorsque vous ouvrez `http://localhost:3000`, la première page affichée est un **écran de couverture animé** avec :
- Logo DriverHub et nom de l'application
- Illustration 3D d'un camion (via React Three Fiber)
- Bouton **"Accéder à l'application"**
- Fond animé de type "aurore boréale" (AuroraBackground)

### 10.2 Page de connexion

Deux modes d'authentification sont disponibles :

| Méthode | Description |
|---------|-------------|
| **Mot de passe** | Saisie de l'identifiant et du mot de passe (voir section 6 pour les comptes) |
| **Face ID** | Authentification biométrique via WebAuthn (appareil photo requis) |

**Étapes :**
1. Saisir le nom d'utilisateur (ex: `admin`)
2. Saisir le mot de passe (ex: `admin123`)
3. Cliquer sur **Se connecter**
4. Le système vérifie les identifiants via JWT et redirige vers le dashboard correspondant au rôle

### 10.3 Dashboard central

Après connexion, l'utilisateur arrive sur un **dashboard adapté à son rôle**. Tous les dashboards partagent :

| Élément | Description |
|---------|-------------|
| **Barre latérale gauche** | Navigation principale avec icônes animées |
| **En-tête** | Photo de profil, notifications, paramètres |
| **Barre de navigation mobile** | 5 premiers éléments en bas (affichage responsive) |
| **Fond Aurora** | Animation d'arrière-plan dynamique |

### 10.4 Module Chauffeur

**Accès :** Connexion avec un compte `CHAUFFEUR` (ex: `chauffeur_casa` / `driver123`)

**Onglets disponibles :**

| Onglet | Icône | Description |
|--------|-------|-------------|
| **Nouvelle déclaration** | 📄 | Formulaire de déclaration d'incident manuel |
| **Mes déclarations** | 📋 | Historique des déclarations soumises |
| **Checklist** | ✅ | Check-up pré-départ "au Vert" avec signature |
| **🎤 Agent IA Vocal** | 🎤 | Déclaration vocale en Darija (voir section 11) |
| **Profil** | 👤 | Informations personnelles |

**Workflow complet d'une tournée :**

```
Connexion → Sélection tournée → QR code véhicule → 
  Check-up (10 items) → Check-up conforme ? → 
  Oui → Départ en tournée
  Non → Déclaration d'incident (manuelle ou vocale)
```

### 10.5 Module Maintenance

**Accès :** Connexion avec un compte `MAINTENANCE` (ex: `mecanique_casa` / `maint123`)

**Fonctionnalités :**
- Vue des tickets de maintenance ouverts
- Assignation des réparations aux mécaniciens
- Suivi de l'état (Ouvert → Assigné → En cours → Réparé → Clos)
- Historique des interventions par véhicule

### 10.6 Module Responsable Support (RS)

**Accès :** Connexion avec un compte `RS` (ex: `rs_support` / `support123`)

**Fonctionnalités :**
- Dashboard analytique avec KPI (véhicules conformes, bloqués, check-ups en attente)
- Validation des anomalies signalées
- Gestion des alertes flotte
- Rapports d'audit
- **Power BI Dashboard** intégré (graphiques Recharts)

### 10.7 Module Administrateur

**Accès :** Connexion avec `admin` / `admin123`

**Fonctionnalités :**
- Gestion complète des utilisateurs (CRUD, rôles)
- Gestion des véhicules (CRUD, affectation chauffeur)
- Gestion des documents réglementaires
- Configuration du système
- Audit trail complet
- Tous les dashboards

### 10.8 Autres rôles

| Rôle | Dashboard | Accès principal |
|------|-----------|-----------------|
| **SL** (Superviseur Livraison) | ModernSLDashboard | Supervision des tournées |
| **PRESTATAIRE** | ModernPrestataireDashboard | Interventions assignées |
| **CPL** (Chef Parc Logistique) | ModernCPLDashboard | Gestion de la flotte |
| **DRL / RFL** | ModernLDDashboard | Dashboards régionaux |
| **RPF** | ModernRPFDashboard | Gestion prestataires |
| **ASM** (Sécurité & Méthodes) | ASMDashboard | Conformité et audit |

---

## 11. Fonctionnalité vocale (Voice/Vocal)

### 11.1 Présentation

L'application intègre trois composants vocaux permettant aux chauffeurs de déclarer des incidents **sans avoir à écrire**, en utilisant leur voix en **Darija (arabe marocain)** ou en **français**. Cette fonctionnalité est particulièrement adaptée aux conducteurs ne maîtrisant pas l'écrit.

| Composant | Usage | Technologie |
|-----------|-------|-------------|
| **VoiceDeclarationAgent** | Déclaration complète par étapes | SpeechRecognition + TTS HTTP |
| **VoiceChatIA** | Assistant vocal de提问-réponse | SpeechRecognition + SpeechSynthesis |
| **VocalDeclarationIA** | Déclaration rapide en un coup | SpeechRecognition + SpeechSynthesis |

### 11.2 Agent vocal de déclaration (VoiceDeclarationAgent)

C'est le composant vocal **principal**, intégré dans le module chauffeur (onglet "🎤 Agent IA Vocal").

**Processus complet en 9 étapes vocales :**

```
Étape 1 : Salutation
  "Salut [chauffeur]! Je vais t'aider à remplir la déclaration."
  → Le chauffeur répond "Oui", "Naam", "Wakha"...

Étape 2 : Immatriculation du véhicule
  "Quelle est l'immatriculation du véhicule ?"
  → Le chauffeur dit "12345 A 6" ou "AA-123-BC"
  → Le système normalise automatiquement le format marocain

Étape 3 : Type de panne (choix avec numéros)
  "Quel type de panne ? 1-Mécanique, 2-Électrique, 3-Caisse..."
  → Le chauffeur dit le numéro ou le nom

Étape 4 : Élément du véhicule (choix avec numéros)
  "Où exactement est le problème ? 1-Cabine, 2-Caisse, 3-Éclairage..."
  → Le chauffeur choisit

Étape 5 : Criticité (choix avec numéros)
  "Le problème est bloquant ? 1-Bloquant, 2-Non bloquant, 3-Sécurité"
  → Le chauffeur répond

Étape 6 : Localisation (choix avec numéros)
  "Où s'est produit l'incident ? 1-Casablanca, 2-Rabat, 3-Marrakech..."
  → Le chauffeur dit la ville ou "Autre" + nom

Étape 7 : Date et heure
  "Quand s'est produit l'incident ? Aujourd'hui, hier ou la date ?"
  → Le chauffeur répond "Lyouma" (aujourd'hui), "Imer l'awel" (hier)

Étape 8 : Kilométrage
  "Quel est le kilométrage actuel ?"
  → Le chauffeur lit le chiffre sur le compteur

Étape 9 : Source (choix avec numéros)
  "Quelle est la source ? 1-Check-up, 2-Alerte, 3-Maintenance..."
  → Le chauffeur choisit

→ Création automatique de la déclaration avec le numéro INC-YYYY-XXXXXX
```

**Interaction vocale :**
- L'agent parle en arabe marocain (voix `ar-MA-JamalNeural`)
- Le chauffeur répond oralement
- Le système détecte la fin de parole (1 seconde de silence)
- Les choix sont énoncés avec des numéros
- L'utilisateur peut dire le numéro ou le texte du choix
- En cas d'erreur de reconnaissance, une zone de texte permet de taper la réponse

### 11.3 Assistant vocal Darija (VoiceChatIA)

**Composant secondaire** (non intégré activement mais disponible dans le code).

**Fonctionnement :**
- L'assistant pose des questions en Darija sur l'état du véhicule
- Le chauffeur répond oralement
- À la fin du dialogue, un rapport JSON est généré
- Un bouton permet de pré-remplir le formulaire de déclaration

**Technologie :**
- API backend : `POST /api/voice-chat/message`
- Reconnaissance vocale : navigateur (ar-MA → ar → fr-FR → fr)
- Synthèse vocale : `speechSynthesis` du navigateur

### 11.4 Déclaration vocale simple (VocalDeclarationIA)

**Composant simplifié** (type seulement importé, non affiché activement).

**Fonctionnement :**
- L'utilisateur clique sur le micro et parle
- L'audio est envoyé à `POST /api/anomalie-ia/analyser`
- Le système retourne les informations extraites
- Confirmation vocale par "oui", "wah", "wakha"...

### 11.5 Service TTS (Text-to-Speech)

Le service TTS convertit le texte en parole (synthèse vocale) pour permettre à l'agent vocal de parler aux chauffeurs.

**Architecture :**

```
Frontend (VoiceDeclarationAgent.tsx)
  ↓  playTts("salam") → URL: /api/tts/speak?text=...&voice=ar-MA-JamalNeural&rate=-5%25
  ↓  (proxy CRA /api/* → http://localhost:8080)
  ↓
Backend Spring Boot (TtsController.java)
  ↓  GET /api/tts/speak
  ↓
Commande système : cmd /c python backend/tts_temp/tts_server.py "salam" "ar-MA-JamalNeural" "-5pct"
  ↓  Edge TTS (Microsoft Cognitive Services)
  ↓
Fichier MP3 généré → Retourné au frontend
  ↓
Frontend : lit le MP3 avec <audio> et le joue
```

**Architecture alternative (serveur HTTP Python dédié) :**

```
Frontend (VoiceDeclarationAgent.tsx)
  ↓  playTts("salam") → URL: /tts/api/tts/speak?text=...
  ↓  (proxy CRA /tts/* → http://localhost:5000, pathRewrite: ^/tts → "")
  ↓
Serveur TTS Python (backend/tts_temp/tts_http_server.py)
  ↓  GET /api/tts/speak
  ↓  edge-tts → MP3
```

> **Recommandation :** Utiliser la 1ʳᵉ architecture (via backend), plus simple à déployer (pas de processus Python supplémentaire).

**Détails techniques :**

| Propriété | Valeur |
|-----------|--------|
| Moteur | `edge-tts` 7.2.8 (Microsoft Edge TTS) |
| Voix par défaut | `ar-MA-JamalNeural` (Arabe marocain) |
| Débit | `-5pct` (ralenti → `-5%` après conversion dans le script) |
| Format | MP3 (audio/mpeg) |
| Cache | MD5 du texte + voix → fichier MP3 dans `backend/tts_temp/tts_cache/` |
| Endpoint backend | `GET /api/tts/speak?text=...&voice=...&rate=...` |
| Endpoint Python | `GET /api/tts/speak` (sur port 5000) |

**🔧 Correctif SSL connu :**

Sur certains réseaux (proxy d'entreprise, antivirus), la connexion de `edge-tts` à `speech.platform.bing.com` échoue avec une erreur `CERTIFICATE_VERIFY_FAILED`. Le script `backend/tts_temp/tts_server.py` applique automatiquement ce patch au démarrage :

```python
import ssl
import edge_tts.communicate as edge_comm
edge_comm._SSL_CTX.check_hostname = False
edge_comm._SSL_CTX.verify_mode = ssl.CERT_NONE
```

**Symptôme du problème SSL :** Le fichier MP3 généré fait **0 octet** (pas d'audio). Voir [Dépannage 9.6](#96-le-tts-voix-ne-fonctionne-pas) pour supprimer le cache corrompu.

### 11.6 Service STT (Speech-to-Text)

La reconnaissance vocale transforme la parole du chauffeur en texte.

**Deux modes :**

| Mode | Technologie | Utilisation |
|------|-------------|-------------|
| **Côté client (navigateur)** | `webkitSpeechRecognition` / `SpeechRecognition` | VoiceDeclarationAgent, VoiceChatIA |
| **Côté serveur (backend)** | OpenAI Whisper API ou simulation | Déclarations audio uploadées (fichier audio) |

**STT navigateur :**
- Utilisé par les composants vocaux frontend
- Détection automatique de la langue (arabe marocain → français)
- Seuil de silence : 1 seconde pour déclencher l'envoi
- Fallback : saisie texte si la reconnaissance n'est pas disponible

**STT serveur :**
- Endpoint : `POST /api/speech-to-text` et `POST /api/speech-to-text/transcrire`
- Technologies : OpenAI Whisper API (clé API requise) ou simulation locale
- Si `openai.api.key` est vide, une simulation basée sur la taille du fichier audio est utilisée

### 11.7 Installation et configuration du vocal

#### Prérequis

```cmd
# 1. Installer Python 3.8+ (https://www.python.org/downloads/)
#    Important : décocher "App execution aliases" dans Paramètres Windows
#    pour que "python" fonctionne en ligne de commande

# 2. Installer edge-tts (moteur de synthèse vocale)
python -m pip install edge-tts

# 3. Vérifier l'installation
python -c "import edge_tts; print('OK')"
```

#### Patch SSL (indispensable sur certains réseaux)

Le script `backend/tts_temp/tts_server.py` désactive automatiquement la vérification SSL
pour `edge-tts` via ce patch au démarrage :

```python
# Dans backend/tts_temp/tts_server.py (déjà présent, ne pas modifier)
import ssl
import edge_tts.communicate as edge_comm
edge_comm._SSL_CTX.check_hostname = False
edge_comm._SSL_CTX.verify_mode = ssl.CERT_NONE
```

> **⚠️ Ne pas supprimer ces lignes.** Sans ce patch, la génération TTS échoue
> avec une erreur `CERTIFICATE_VERIFY_FAILED` sur certains réseaux,
> et le fichier MP3 produit fait 0 octet.

#### Vérification du patch SSL

```powershell
# Tester que edge-tts fonctionne (avec le patch)
python backend/tts_temp/tts_server.py "test vocal" "ar-MA-JamalNeural" "-5pct"
# Réponse attendue : {"status":"ok","path":"...cache/xxxx.mp3"}
# Si statut "error" : vérifier le message d'erreur SSL
```

#### Configuration backend (déjà préconfigurée)

Dans `backend/src/main/resources/application.properties` :
```properties
# Chemin absolu vers Python (important : utiliser le chemin complet)
tts.python.path=C:/Users/moutaoch/AppData/Local/Programs/Python/Python310/python.exe

# Chemin vers le script TTS CLI (backend/tts_temp/tts_server.py, PAS ia/tts_server.py)
tts.script.path=C:/chemin/vers/backend/tts_temp/tts_server.py

# Voix par défaut
tts.voice=ar-MA-JamalNeural
tts.rate=-5pct
```

> ⚠️ **Important :** Le script TTS est `backend/tts_temp/tts_server.py` (CLI), pas `ia/tts_server.py` (Flask web server).

#### Test rapide du TTS

```powershell
# Via le backend (recommendé)
curl "http://localhost:8080/api/tts/speak?text=salam&voice=ar-MA-JamalNeural&rate=-5pct" -o test.mp3
# Vérifier : le fichier test.mp3 doit faire ~10KB et contenir l'audio
# Si 0 octet → SSL bloqué (voir section Patch SSL ci-dessus)

# Directement via Python
python backend/tts_temp/tts_server.py "salam" "ar-MA-JamalNeural" "-5pct"
# Résultat : {"status":"ok","path":"...tts_cache/xxxx.mp3"}
# Si {"status":"error","error":"SSL:..."} → SSL bloqué
```

#### Référence complète des commandes TTS

| # | Action | Commande | Résultat OK | Résultat ERREUR |
|---|--------|----------|-------------|-----------------|
| 1 | **Tester Python** | `python --version` | `Python 3.10.x` | `Python was not found` → désactiver App aliases |
| 2 | **Installer edge-tts** | `python -m pip install edge-tts` | `Successfully installed edge-tts-7.2.8` | `pip not found` → réparer Python |
| 3 | **Vérifier edge-tts** | `python -c "import edge_tts; print('OK')"` | `OK` | `ModuleNotFoundError` → réinstaller |
| 4 | **TTS via Python CLI** | `python backend/tts_temp/tts_server.py "salam" "ar-MA-JamalNeural" "-5pct"` | `{"status":"ok","path":"...mp3"}` | `{"status":"error","error":"SSL:..."}` → SSL bloqué |
| 5 | **TTS via backend** | `Invoke-WebRequest -Uri "http://localhost:8080/api/tts/speak?text=salam&voice=ar-MA-JamalNeural&rate=-5pct" -OutFile test.mp3` | Taille > 5000 octets | Taille = 0 → SSL ou cache corrompu |
| 6 | **TTS via frontend** | `Invoke-WebRequest -Uri "http://localhost:3000/api/tts/speak?text=salam&voice=ar-MA-JamalNeural&rate=-5pct" -OutFile test.mp3` | Taille > 5000 octets | Taille = 0 → proxy ou backend |
| 7 | **Vérifier format MP3** | `$b = [System.IO.File]::ReadAllBytes("test.mp3"); $b[0] -eq 0xFF -and ($b[1] -band 0xE0) -eq 0xE0` | `True` | `False` → fichier corrompu |
| 8 | **Vider cache TTS** | `Remove-Item "backend/tts_temp/tts_cache/*.mp3"` | Aucune erreur | Chemin introuvable |
| 9 | **Vider caches vides** | `Get-ChildItem "backend/tts_temp/tts_cache" \| Where-Object Length -eq 0 \| Remove-Item` | Aucune erreur | Chemin introuvable |
| 10 | **Tester agent vocal** | `Invoke-RestMethod -Uri "http://localhost:8080/api/voice-agent/start" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"chauffeurId":2,"chauffeurNom":"Hicham","chauffeurMatricule":"CH-001"}'` | `sessionId` + `step=1` | `404` → backend pas lancé |
| 11 | **Vérifier port 8080** | `netstat -ano \| Select-String ":8080 "` | Ligne avec `LISTENING` | Rien → backend pas lancé |
| 12 | **Vérifier port 3000** | `netstat -ano \| Select-String ":3000 "` | Ligne avec `LISTENING` | Rien → frontend pas lancé |
| 13 | **Tuer processus 8080** | `taskkill /PID $(netstat -ano \| Select-String ":8080 " \| ForEach-Object { \$_.ToString().Split()[-1] }) /F` | `SUCCESS` | `not found` |
| 14 | **Lire logs backend** | `Get-Content "backend/logs/*.log" -Tail 20` (ou la sortie du terminal 1) | Voir `Started UserManagementApplication` | Voir erreur Java |

**Détail des codes d'erreur Python CLI (commande 4) :**

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| `ok` | (aucun) | Succès | ✅ |
| `error` | `[SSL: CERTIFICATE_VERIFY_FAILED]` | Vérification SSL bloquée | Vérifier que `tts_server.py` contient le patch SSL (section 11.5) |
| `error` | `No module named 'edge_tts'` | edge-tts non installé | `python -m pip install edge-tts` |
| `error` | aucun message | Script introuvable | Vérifier le chemin : `dir backend\tts_temp\tts_server.py` |
| `error` | `Invalid rate` | Format du débit invalide | Utiliser `-5pct` ou `-5%` |

**Codes de retour du backend (commande 5) :**

| Code HTTP | Signification | Cause |
|-----------|---------------|-------|
| `200` + MP3 | Succès | Le MP3 est joué normalement |
| `200` + 0 octet | Cache corrompu | Le script Python a échoué mais le fichier existe (0 o). Vider le cache (commande 8) |
| `500` | Erreur serveur | Python introuvable, script introuvable, ou edge-tts non installé |
| `500` + `exit code 9009` | Python introuvable | `tts.python.path` incorrect dans `application.properties` |

#### Configuration alternative : serveur HTTP Python

Pour une architecture avec serveur TTS dédié (port 5000) :
```cmd
# Lancer le serveur HTTP
python backend/tts_temp/tts_http_server.py 5000
```

Puis modifier `frontend/src/config/api.ts` :
```typescript
export const TTS_BASE = process.env.REACT_APP_TTS_URL || "/tts";
```

Le proxy `frontend/src/setupProxy.js` redirigera `/tts/*` → `http://localhost:5000`.

#### Configuration réseau (production)

Pour un accès depuis d'autres machines (tablettes, téléphones) :
```env
# Dans frontend/.env (décommentez et adaptez)
REACT_APP_API_URL=http://192.168.1.40:8080
```
> Remplacez `192.168.1.40` par l'adresse IP du serveur.
> Le TTS passe par le backend, donc pas besoin de configurer `REACT_APP_TTS_URL`.

### 11.8 Utilisation pas à pas

#### Pour le chauffeur (utilisateur principal) :

**Étape 1 : Connexion**
1. Ouvrir `http://localhost:3000`
2. Cliquer sur "Accéder à l'application"
3. Saisir `chauffeur_casa` / `driver123`
4. Cliquer sur "Se connecter"

**Étape 2 : Accéder à l'agent vocal**
1. Dans le menu latéral, cliquer sur **"🎤 Agent IA Vocal"**
2. L'agent vous salue en arabe marocain :
   > *"السلام عليكم [prénom]! سأساعدك في ملء التصريح..."*

**Étape 3 : Répondre oralement**
1. Cliquer sur le bouton **microphone** (ou autoriser le micro si le navigateur le demande)
2. Répondre clairement à chaque question
3. L'agent passe automatiquement à l'étape suivante
4. Les choix sont lus avec des numéros (ex: "1-ميكانيك, 2-كهربائي...")

**Étape 4 : Finaliser**
1. Après la dernière question, l'agent récapitule la déclaration
2. Confirmer en disant "Oui", "Naam" ou "Wakha"
3. Le numéro de déclaration est affiché : `INC-2026-000042`

#### Conseils d'utilisation :

| Situation | Action |
|-----------|--------|
| Micro ne marche pas | Utiliser Chrome ou Edge (pas Firefox ni Safari) |
| Reconnaissance erronée | Taper la réponse dans la zone de texte |
| Agent ne parle pas | Cliquer sur le bouton "Activer la voix" (bloqueur de popup) |
| Bruit ambiant | Parler plus fort ou se rapprocher du micro |
| Langue non reconnue | Le système bascule automatiquement en français |

### 11.9 Voix et langues supportées

**Synthèse vocale (TTS) :**

| Voix | Langue | Utilisation |
|------|--------|-------------|
| `ar-MA-JamalNeural` | Arabe marocain (MAS) ✅ | **Voix par défaut** |
| `ar-SA-HamedNeural` | Arabe standard (MSA) | Fallback |
| Autres voix Azure | Multi-langues | Configurable |

**Reconnaissance vocale (STT) :**

| Langue | Code | Ordre de priorité |
|--------|------|-------------------|
| Arabe marocain | `ar-MA` | 1er |
| Arabe standard | `ar` | 2e |
| Français | `fr-FR` | 3e |
| Français (fallback) | `fr` | 4e |

> **Note :** Le navigateur **Chrome** ou **Edge** (Chromium) sont recommandés pour une meilleure reconnaissance vocale. Firefox et Safari ont un support limité du SpeechRecognition API.

---

## Annexe : Structure du projet

```
mon-projet-extraction/
├── backend/                          # Spring Boot (Java 21)
│   ├── pom.xml                       # Dépendances Maven
│   ├── src/main/java/com/example/usermanagement/
│   │   ├── UserManagementApplication.java
│   │   ├── config/                   # 9 fichiers (CORS, JWT, DataInitializer...)
│   │   ├── controller/               # 45 contrôleurs REST
│   │   ├── dto/                      # 12 DTOs
│   │   ├── model/                    # 33 entités JPA
│   │   ├── repository/              # 30 repositories
│   │   └── service/                 # 39 services
│   └── src/main/resources/
│       ├── application.properties          # Config principale
│       └── application-sqlserver.properties # Config SQL Server
│
├── frontend/                         # React 19 + TypeScript
│   ├── package.json
│   ├── .env                          # Variables d'environnement
│   ├── tsconfig.json                 # Configuration TypeScript
│   ├── tailwind.config.js            # Thème personnalisé
│   └── src/
│       ├── App.tsx                   # Point d'entrée
│       ├── components/               # Composants React
│       ├── config/api.ts             # Configuration API
│       ├── contexts/                 # Contextes (thème)
│       ├── lib/                      # Utilitaires
│       └── types/                    # Types TypeScript
│
├── ia/                               # Service IA (Python)
│   ├── app.py                        # Serveur Flask
│   ├── analyzer.py                   # Pipeline YOLOv8 + OCR
│   ├── vlm_ocr.py                    # OCR via GPT-4V / Claude
│   ├── requirements.txt
│   ├── models/                       # Modèles YOLOv8 fine-tunés
│   └── tts_server.py                 # Synthèse vocale (Edge TTS)
│
├── data/                             # Base H2 (profil dev)
├── uploads/                          # Fichiers uploadés
├── docs/                             # Documentation complémentaire
├── DOCUMENTATION_CLIENT.md           # Ce fichier
├── ANALYSE_PROJET.md                 # Gap analysis
├── WORKFLOW_APPLICATION.md           # Workflow complet
└── start_backend.bat                 # Script de démarrage JAR
```

---

## Contact technique

Pour toute question ou incident technique, veuillez contacter l'équipe de développement.

---
*Document mis à jour le 17/07/2026 — Smart Fleet Management DriverHub v2.0*
