# DriverHub — Documentation Client

## Architecture

```
Frontend (React + TypeScript + Vite)  →  Backend (Spring Boot 3.2 / Java 21)  →  SQL Server (SQLEXPRESS)
Port 5173 / 3000                           Port 8080                              Port 1433
```

## Connexion Base de Données

| Paramètre       | Valeur                              |
|-----------------|-------------------------------------|
| Instance        | `localhost\SQLEXPRESS`              |
| Base            | `driverhub_sql`                     |
| Login           | `CHAIMAA`                           |
| Mot de passe    | `Chaimaa#2026SecureA2`             |
| Port TCP        | 1433                                |
| URL JDBC        | `jdbc:sqlserver://localhost:1433;databaseName=driverhub_sql;encrypt=true;trustServerCertificate=true` |
| Driver          | `mssql-jdbc-11.2.3.jre11`           |

## Profils Spring Boot

### SQL Server (actif)
Fichier : `backend/src/main/resources/application-sqlserver.properties`
```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=driverhub_sql;encrypt=true;trustServerCertificate=true
spring.datasource.username=CHAIMAA
spring.datasource.password=Chaimaa#2026SecureA2
spring.jpa.hibernate.ddl-auto=update
```

### H2 (fallback — commenté)
Fichier : `backend/src/main/resources/application.properties`
```properties
#spring.datasource.url=jdbc:h2:file:./data/driverhub
#spring.profiles.active=sqlserver ← actif
```

## Démarrage

### Backend
```bash
cd backend
mvn package -DskipTests
java -jar target/user-management-0.0.1-SNAPSHOT.jar --spring.profiles.active=sqlserver
```
Le backend écoute sur **localhost:8080**. Temps de démarrage : ~50-60 secondes (Hibernate crée les tables via `ddl-auto=update`, puis DataInitializer seed les données).

### Frontend
```bash
cd frontend
npm start    # React dev server (port 3000)
# ou
npx vite     # Vite dev server (port 5173)
```

Le frontend utilise un proxy (`setupProxy.js`) pour rediriger `/api/*` vers `localhost:8080`.

## Données Peuplées

### 15 Véhicules
| Immatriculation | VIN               | Agence      | Type       | Carburant  |
|-----------------|-------------------|-------------|------------|------------|
| AA-123-BC       | VF1AAAAAAH0000001 | Paris Nord  | VL         | Diesel     |
| BB-456-DE       | VF1BBBBBBBH0000002 | Paris Sud  | VL         | Diesel     |
| CC-789-FG       | VF1CCCCCCCH0000003 | Paris Est   | VL         | Essence    |
| BUS-001-PA      | VF1DDDDDDDH0000004 | Paris Ouest | Bus        | Diesel     |
| BUS-002-PA      | VF1EEEEEEEH0000005 | Paris Centre| Bus        | Diesel     |
| DD-012-HI       | VF1FFFFFFFH0000006 | Lyon Part-Dieu | VL     | Diesel     |
| EE-345-JK       | VF1GGGGGGGH0000007 | Lyon Perrache | VL       | Diesel     |
| FF-678-LM       | VF1HHHHHHHH0000008 | Lyon Part-Dieu | VL     | Essence    |
| BUS-003-LY      | VF1IIIIIIIH0000009 | Lyon Perrache | Bus      | Diesel     |
| BUS-004-LY      | VF1JJJJJJJH0000010 | Lyon Part-Dieu | Bus    | Diesel     |
| GG-901-NO       | VF1KKKKKKKH0000011 | Marseille Vieux-Port | VL | Diesel   |
| HH-234-PQ       | VF1LLLLLLLH0000012 | Marseille Vieux-Port | VL | Diesel   |
| II-567-RS       | VF1MMMMMMMH0000013 | Casablanca Centre | VL  | Essence    |
| BUS-005-MA      | VF1NNNNNNNH0000014 | Rabat Agdal | Bus        | Diesel     |
| BUS-006-MA      | VF1OOOOOOOH0000015 | Rabat Agdal | Bus        | Diesel     |

### Tracking GPS
- **63 points de tracking** (3-5 par véhicule sur 7 jours)
- Coordonnées : Paris, Lyon, Marseille, Casablanca, Rabat
- Vitesses : 20-95 km/h, niveaux carburant : 15-95%

### Checkups
- **128 checkups** créés (7-15 éléments de détail chacun)
- 93.8% de conformité
- 15/15 véhicules couverts
- Éléments : Pneus, Freins, Feux, Batterie, Huile Moteur, etc.

### Déclarations / Interventions
- **25 déclarations** avec coûts
- **8 avec prestataire** (actions_realisees renseignées)
- Prestataires : Garage Auto Plus, MecaPro Services, Elite Pneus, Dépannage Express, Rapid Répar, Auto Sécurité 2000

## API Endpoints Principaux

| Endpoint                          | Méthode | Description                          |
|-----------------------------------|---------|--------------------------------------|
| `/api/vehicles`                   | GET     | Liste des véhicules                  |
| `/api/vehicles/{id}`              | GET     | Détail d'un véhicule                 |
| `/api/vehicles/{id}`              | PUT     | Mettre à jour (VIN, truckNumber, etc.) |
| `/api/vehicles/{id}/history`      | GET     | Historique complet (checkups, déclarations) |
| `/api/vehicules`                  | GET     | Liste des véhicules (ancien endpoint) |
| `/api/declarations`               | GET     | Liste des déclarations               |
| `/api/declarations/{id}/update`   | PUT     | Mettre à jour déclaration (form-data) |
| `/api/checkups`                   | GET     | Liste des checkups                   |
| `/api/checkups`                   | POST    | Créer un checkup                     |
| `/api/tracking/update`            | POST    | Envoyer un point GPS                 |
| `/api/powerbi/stats-interventions`| GET     | Stats interventions (Power BI)       |
| `/api/analytics/summary`          | GET     | Résumé tracking GPS                  |
| `/admin/stats`                    | GET     | Statistiques globales                |
| `/users`                          | GET     | Liste des utilisateurs               |

## Tests

### Suite de tests automatisés
```bash
node "C:\Users\EmsiC\AppData\Local\Temp\opencode\global-test-final.mjs"
```

48/50 tests passent — couvre :
- 15 champs obligatoires par véhicule
- Déclarations, actions prestataires
- Checkups conformité
- Tracking GPS
- KPIs Dashboard v4
- Cohérence chauffeurs

### Script de population de données
```bash
node "C:\Users\EmsiC\AppData\Local\Temp\opencode\populate-data.mjs"
```

Repeuple : VINs, GPS, checkups, prestataires (idempotent).

## Résolution de Problèmes

### SSL/TLS — `PKIX path building failed`
**Symptôme :** `Le pilote n'a pas pu établir de connexion sécurisée au serveur SQL Server à l'aide du chiffrement SSL`

**Solution :** Utiliser `mssql-jdbc-11.2.3.jre11` (pas v12.x) avec `encrypt=true;trustServerCertificate=true` dans l'URL JDBC.

**Cause :** SQL Server force le chiffrement SSL. La v12 du driver a timeout sur le handshake TLS. La v11 fonctionne correctement avec `trustServerCertificate=true`.

### Ports
- **1433** : Port TCP statique de SQLEXPRESS
- **50457** : Port dynamique (même instance, géré par SQL Server)
- **8080** : Backend Spring Boot
- **9092** : H2 TCP Server (démarré même avec SQL Server, sans impact)

### Mots-clés SQL réservés
La colonne `database` dans `GeotabConfig` a été échappée avec `@Column(name = "[database]")` pour éviter le conflit avec le mot-clé SQL Server.

## Modifications Clés

1. **`GeotabConfig.java`** — `@Column(name = "[database]")` pour le champ réservé
2. **`pom.xml`** — `mssql-jdbc` version `11.2.3.jre11` (fix SSL)
3. **`application-sqlserver.properties`** — Nouveau profil Spring avec config SQL Server
4. **`PowerBiAnalyticsController.java`** — Champ `prestataire` extrait de `actionsRealisees`
5. **`VehicleDetail.tsx`** — `scoreColor` déplacé avant le useMemo (fix TDZ)
6. **`Login.tsx` / `Vehicle3DDetail.tsx`** — `ContactShadows` et `Environment` remplacés par ground plane (fix HDR manquant)
