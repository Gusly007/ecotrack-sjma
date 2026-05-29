# Architecture Logicielle — EcoTrack

Critères RNCP Ce1.3.1 / Ce1.3.2 / A2.1 : Architecture complète, cohérente et sécurisée

---

## I. Vision Globale de l'Architecture

### Vue d'ensemble

```
                    ┌─────────────────────────────────────┐
                    │         CLIENTS (Navigateurs)        │
                    │   Desktop (Admin/Gestionnaire)       │
                    │   Mobile Web (Citoyen/Agent)         │
                    └──────────────────┬──────────────────┘
                                       │ HTTPS / WSS
                    ┌──────────────────▼──────────────────┐
                    │            API GATEWAY               │
                    │             Port 3000                │
                    │  JWT · Rate Limit · CORS · Logging   │
                    └─┬──┬──┬──┬──┬──┬──┬─────────────────┘
                      │  │  │  │  │  │  │
         ┌────────────┘  │  │  │  │  │  └────────────┐
         │    ┌──────────┘  │  │  │  └────────┐      │
         │    │    ┌────────┘  │  └──────┐    │      │
         ▼    ▼    ▼           ▼         ▼    ▼      ▼
       :3010 :3011 :3012     :3013     :3014 :3015  :3016
       users cont. routes     iot       gamif anal. notif
         │    │    │           │             │      │
         └────┴────┴───────────┴─────────────┴──────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         ┌──────────┐   ┌──────────┐   ┌──────────────┐
         │PostgreSQL│   │  Redis   │   │    Kafka     │
         │  :5432   │   │  :6379   │   │    :9092     │
         │ +PostGIS │   │  Cache   │   │ 5 topics     │
         └──────────┘   └──────────┘   └──────────────┘
                                               │
                               ┌───────────────┘
                               ▼
                    ┌─────────────────┐
                    │   Capteurs IoT  │
                    │  MQTT :1883     │
                    │  2000 capteurs  │
                    └─────────────────┘
```

EcoTrack repose sur une **architecture microservices 3-tiers** organisée autour d'un API Gateway centralisateur. La couche présentation est une Single Page Application React 18 servant deux interfaces adaptées au rôle : une interface desktop riche pour les Gestionnaires et Administrateurs, et une interface mobile-first pour les Citoyens et Agents de collecte. Ces deux interfaces communiquent exclusivement avec l'API Gateway (port 3000), qui assure la validation JWT, le rate limiting, le logging structuré Pino et le routage vers les 8 microservices métier.

La couche logique métier est décomposée en 8 microservices Node.js 20 indépendants, chacun responsable d'un domaine fonctionnel clairement délimité : authentification/profils (service-users), gestion des conteneurs et zones (service-containers), tournées et optimisation (service-routes), ingestion IoT (service-iot), gamification (service-gamifications), analytique (service-analytics) et notifications (service-notification). Cette décomposition permet une évolution, un déploiement et une mise à l'échelle indépendants de chaque domaine. Les communications sont synchrones (HTTP REST via l'API Gateway) pour les interactions client-serveur, et asynchrones (Kafka) pour les événements inter-services à forte volumétrie (mesures capteurs, alertes IoT, nouveaux signalements).

La couche données s'appuie sur trois systèmes de persistance complémentaires : PostgreSQL 16 avec l'extension PostGIS pour les données relationnelles et géospatiales (base de vérité unique), Redis 7 pour le cache applicatif et les sessions JWT (hautes performances, TTL configurable), et Apache Kafka 3 comme bus d'événements asynchrone pour le découplage des producteurs et consommateurs de données temps réel. L'ensemble est containerisé via Docker Compose, avec Prometheus et Grafana pour le monitoring opérationnel.

---

### A. Principes Architecturaux

| Principe | Implémentation concrète dans EcoTrack |
|----------|--------------------------------------|
| **Modularité** | 8 microservices indépendants, chacun avec sa propre base de code, ses tests, son Dockerfile et son `package.json`. Aucun couplage direct entre services (communication via HTTP ou Kafka). |
| **Scalabilité** | Services stateless (état dans PostgreSQL/Redis), containerisation Docker permettant le scale horizontal par duplication de containers, Kafka partitionné (6 partitions sensor.data, 3 autres topics). |
| **Résilience** | Dégradation gracieuse : service-notification fonctionne sans Kafka (pas de notifications automatiques, HTTP REST intact). Kafka absorbe les pics IoT sans back-pressure sur les consumers. Redis optionnel avec fallback DB. |
| **Sécurité** | Defense in depth : JWT à l'API Gateway + RBAC dans chaque service + validation Joi des payloads + Helmet (headers HTTP) + rate limiting + MFA TOTP + audit log. |
| **Maintenabilité** | Architecture Controller → Service → Repository uniformisée sur les 8 services. Swagger généré depuis les JSDoc routes. Jest >= 70 % de couverture. CI/CD GitHub Actions (lint + tests + build). |

---

### B. Vue d'Ensemble des Composants

| Couche | Composants | Technologies |
|--------|-----------|-------------|
| **Présentation** | SPA React desktop, Interface mobile-responsive, Carte Leaflet, Charts Recharts, Socket.IO client | React 18, Vite 5, Tailwind CSS, Leaflet, Socket.IO |
| **Routage / Sécurité** | API Gateway, JWT Validator, Rate Limiter, Logger, Swagger unifié | Express 5, http-proxy-middleware, prom-client, swagger-ui |
| **Métier** | 8 microservices Node.js (auth, conteneurs, tournées, IoT, gamification, analytique, notifications) | Node.js 20, Express 5, Joi, Pino, KafkaJS |
| **Messaging** | Kafka (5 topics), MQTT Broker Aedes embarqué | Kafka 3, KafkaJS, Aedes, mqtt |
| **Données** | PostgreSQL + PostGIS, Redis, Fichiers (avatars, PDF) | PostgreSQL 16, PostGIS 3, Redis 7, Sharp, pdfkit |
| **Monitoring** | Prometheus, Grafana, Health checks | prom-client, node-cron, /health endpoints |

---

## II. Architecture Détaillée par Couche

### A. Tier 1 — Frontend (Présentation)

#### Structure de l'application React

```
frontend/src/
├── App.jsx                          ← Routes globales (React Router v7)
│   ├── /login, /register            ← Auth communes
│   ├── /dashboard/*                 ← Desktop : Admin, Gestionnaire
│   │   ├── /containers              ← CRUD conteneurs
│   │   ├── /zones                   ← Gestion zones
│   │   ├── /routes                  ← Tournées, optimisation
│   │   ├── /analytics               ← Dashboards, rapports
│   │   └── /users                   ← Gestion utilisateurs (Admin)
│   ├── /citoyen/*                   ← Mobile : Citoyen (18 pages)
│   │   ├── /citoyen/login           ← Auth isolée CitoyenAuthContext
│   │   ├── /citoyen/carte           ← Leaflet (lazy loaded)
│   │   ├── /citoyen/scanner         ← QR Code html5-qrcode (lazy)
│   │   └── /citoyen/defis           ← Gamification
│   └── /agent/*                     ← Mobile : Agent (10 pages)
│       ├── /agent/tournee           ← Tournée du jour
│       └── /agent/scan              ← Scan QR conteneur
│
├── context/
│   ├── AuthContext.jsx              ← Auth Admin/Gestionnaire/Agent
│   └── citoyen/CitoyenAuthContext   ← Auth Citoyen isolée
│
├── services/
│   ├── api.js                       ← Axios instance + interceptors JWT refresh
│   ├── authService.js
│   ├── citoyenService.js            ← ~25 wrappers API citoyen
│   └── notificationService.js
│
├── components/
│   ├── layout/                      ← Sidebar, Header, Navbar desktop
│   └── mobile/                      ← MobileLayout, BottomNav, QRScanner
│
└── hooks/
    ├── useGeolocation.js
    └── useNotifications.js
```

#### Fonctionnalités par interface

| Interface | Rôles | Framework principal | Fonctionnalités clés |
|-----------|-------|:------------------:|----------------------|
| Desktop | ADMIN, GESTIONNAIRE | React 18 + Tailwind | Tableau de bord KPIs, carte zones, gestion tournées, analytics, CRUD utilisateurs, notifications |
| Mobile Citoyen | CITOYEN | React 18 mobile-first | Carte conteneurs, scan QR, signalements, gamification (points/badges/défis), profil |
| Mobile Agent | AGENT | React 18 mobile-first | Tournée du jour, collectes, scan QR, signalement anomalies, historique |

**Patterns frontend** :
- Context API + hooks personnalisés (pas de Redux — state local par domaine, `useContext` pour l'auth)
- `React.lazy()` + `Suspense` pour les composants lourds (CitoyenMap ~300 KB, CitoyenScanner)
- Axios interceptors pour le refresh automatique des tokens JWT (sans déconnecter l'utilisateur)
- CitoyenAuthContext isolé de AuthContext : zéro couplage entre le contexte citoyen et le contexte admin/gestionnaire

---

### B. Tier 2 — Backend (Logique Métier)

#### Architecture uniforme de chaque microservice

```
service-[nom]/
├── index.js                 ← Entrée : Express + Swagger + /health + /metrics
├── src/
│   ├── routes/              ← Définition endpoints + documentation JSDoc Swagger
│   ├── controllers/         ← Handlers HTTP (req/res), délèguent aux services
│   ├── services/            ← Logique métier, orchestration, règles
│   ├── repositories/        ← Accès données SQL (requêtes préparées pg)
│   ├── middleware/
│   │   ├── auth.js          ← Vérification JWT Bearer (headers x-user-id, x-user-role)
│   │   ├── rbac.js          ← Contrôle d'accès par rôle et permission
│   │   ├── validation.js    ← Schémas Joi (body, params, query)
│   │   ├── error-handler.js ← Gestion centralisée des erreurs (ApiError)
│   │   └── request-logger.js← Morgan/Pino logging HTTP
│   ├── db/
│   │   └── connexion.js     ← Pool PostgreSQL (pg-pool)
│   └── utils/
│       ├── api-response.js  ← Format standardisé {data, total, page, limit}
│       ├── api-error.js     ← Classe ApiError(statusCode, message)
│       └── logger.js        ← Instance Pino (prod) / console (test)
```

**Pattern Controller → Service → Repository** :

```
Requête HTTP
    ↓
Middleware (auth → rbac → validation)
    ↓
Controller  → validation business → appel Service
    ↓
Service     → logique métier, orchestration, cache Redis
    ↓
Repository  → requête SQL paramétrée → Pool pg
    ↓
PostgreSQL
```

#### Détail des 8 microservices

**service-users (port 3010)**

```
Responsabilité : Authentification, profils, rôles, RGPD, avatars, sessions
│
├── Auth : POST /auth/login|register|logout|refresh|forgot-password|reset-password
├── MFA  : POST /auth/mfa/setup|verify|complete-setup|disable|regenerate
│          POST /auth/login/mfa  (validation code TOTP / code secours)
├── Profil : GET|PUT /users/profile, POST /users/change-password
├── Avatars : POST /users/avatar/upload (Sharp multipart, max 5MB)
│             → 3 tailles : original 1000px, thumbnail 200px, mini 64px
├── Roles : GET|POST|DELETE /admin/roles/users/:id
├── RGPD : GET /me/data, DELETE /me, POST /gdpr/consent
└── Sessions : GET|DELETE /sessions (max 3 simultanées par utilisateur)

Sécurité spécifique :
- bcryptjs cost 12
- speakeasy TOTP (RFC 6238) + 10 codes secours
- Rate limiting : 5 tentatives login / 15 min
- Audit log : toutes tentatives connexion (table audit_log)
- Cron RGPD : purge soft-deleted après 90 jours
```

**service-containers (port 3011)**

```
Responsabilité : Conteneurs, zones géographiques, types, statistiques, Socket.IO
│
├── Conteneurs : GET|POST /api/V1/containers
│               GET|PATCH|DELETE /api/V1/containers/:id
│               GET /api/V1/containers/uid/:uid  ← Scan QR code
│               GET /api/V1/containers/:id/history
├── Zones : GET|POST|PATCH|DELETE /api/V1/zones
├── Types : GET|POST /api/V1/typecontainers
├── Stats : GET /api/V1/stats/dashboard|critical|collections|maintenance
│           GET /api/V1/stats/zones|fill-distribution
└── Socket.IO :
    - subscribe-zone :idZone → abonnement aux changements de la zone
    - unsubscribe-zone :idZone
    - emit container:status-changed → {id, uid, ancien_statut, nouveau_statut, id_zone}

PostGIS : ST_Within, ST_GeomFromGeoJSON pour filtrage géospatial
UID conteneur : format CNT-XXXXXXXXXXXX (12 caractères alphanum)
```

**service-routes (port 3012)**

```
Responsabilité : Tournées de collecte, optimisation itinéraires, véhicules, signalements
│
├── Tournées CRUD : GET|POST /api/V1/routes/tournees
│                  GET|PATCH|DELETE /api/V1/routes/tournees/:id
│                  GET /api/V1/routes/tournees/:id/etapes|progress|map
│                  PATCH /api/V1/routes/tournees/:id/statut
├── Optimisation : POST /api/V1/routes/optimize (NN + 2-opt, GeoJSON en sortie)
│                  POST /api/V1/routes/optimize/preview (sans persistance)
├── Collectes : POST /api/V1/routes/tournees/:id/collecte
│              POST /api/V1/routes/tournees/:id/anomalie
│              GET  /api/V1/routes/tournees/:id/collectes|anomalies
├── Véhicules : GET|POST|PATCH|DELETE /api/V1/routes/vehicules
├── Signalements : POST|GET /api/V1/routes/signalements
│                  GET /api/V1/routes/signalements/my
│                  GET /api/V1/routes/signalements/:id
└── Stats : GET /api/V1/routes/stats/dashboard|kpis|collectes

Algorithme 2-opt :
- Phase 1 — Nearest Neighbor : O(n²), sélection conteneur le plus proche non visité
- Phase 2 — 2-opt : inversions d'arêtes jusqu'à convergence, -15% à -45% distance
- Haversine pour distances GPS
- < 500ms pour 50 conteneurs (objectif 30s largement tenu)

Kafka Producer : ecotrack.signalements.nouveau
→ Déclenché à chaque POST /signalements
→ Consumer : service-notification (ALERTE gestionnaire de zone)
```

**service-iot (port 3013)**

```
Responsabilité : Broker MQTT embarqué, mesures capteurs, alertes seuil
│
├── MQTT Broker Aedes (TCP :1883)
│   └── Topic : containers/{uid_capteur}/data
│       → Payload : {fill_level, battery, temperature, timestamp}
│
├── MQTT Handler :
│   ├── Parsing + Validation Joi (fill_level 0-100, battery 0-100)
│   ├── Outlier detection
│   ├── INSERT mesure (PostgreSQL)
│   └── Kafka Producer si seuil dépassé :
│       ├── fill_level >= 90%  → ecotrack.alerts (DEBORDEMENT)
│       ├── battery <= 20%     → ecotrack.alerts (BATTERIE_FAIBLE)
│       └── temp hors [-10, 60°C] → ecotrack.alerts (TEMPERATURE)
│
├── API REST :
│   ├── GET /api/V1/iot/capteurs|mesures|alertes
│   ├── GET /api/V1/iot/stats
│   ├── POST /api/V1/iot/simulate ← Test (rate-limited 10/min)
│   └── PATCH /api/V1/iot/alertes/:id (RESOLUE|IGNOREE)
│
└── Kafka Producer :
    ├── ecotrack.alerts       (topic 3 partitions, rétention 30j)
    └── ecotrack.sensor.data  (topic 6 partitions, rétention 7j)

Déduplication alertes : une seule alerte ACTIVE par conteneur/type à la fois
```

**service-gamifications (port 3014)**

```
Responsabilité : Points, badges, défis, classement, statistiques citoyens
│
├── Actions : POST /api/V1/gamification/actions
│             → Attribution points + déclenchement badges
├── Badges : GET /api/V1/gamification/badges
│            GET /api/V1/gamification/badges/utilisateurs/:id
├── Défis : GET|POST /api/V1/gamification/defis
│           POST /api/V1/gamification/defis/:id/participations
│           PATCH /api/V1/gamification/defis/:id/participations/:userId
├── Classement : GET /api/V1/gamification/classement?limite=10
├── Stats : GET /api/V1/gamification/stats/:id
│           GET /api/V1/gamification/utilisateurs/:id/stats
└── Points : GET /api/V1/gamification/points/historique

Badges événementiels :
- FIRST_REPORT, REPORTER_* (paliers 1/5/25/100/250)
- URGENT_HERO, PHOTO_REPORTER, NIGHT_OWL, CLEAN_CITY
Transaction PostgreSQL : points + badges + progression défis en une seule TX
```

**service-analytics (port 3015)**

```
Responsabilité : Agrégations, dashboard, ML predictions, rapports PDF/Excel
│
├── Agrégations : GET /api/V1/analytics/aggregations|zones|agents
│                 → Vues matérialisées PostgreSQL (cron refresh)
├── Dashboard : GET /api/V1/analytics/dashboard|realtime|heatmap|evolution
├── Rapports : POST /api/V1/analytics/reports/generate (PDF/Excel)
│              POST /api/V1/analytics/reports/environmental|routes-performance
│              GET  /api/V1/analytics/reports/download/:file
├── ML : POST /api/V1/analytics/ml/predict (régression linéaire)
│        GET  /api/V1/analytics/ml/predict-critical
│        GET  /api/V1/analytics/ml/anomalies/:id (Z-score)
│        GET  /api/V1/analytics/ml/defective-sensors
└── WebSocket : Socket.IO — events dashboard, alerts, container updates

Kafka Consumer : ecotrack.sensor.data + ecotrack.alerts
node-cache pour les résultats ML (TTL 5 min)
```

**service-notification (port 3016)**

```
Responsabilité : Notifications GESTIONNAIRE/ADMIN, consumer Kafka, RBAC
│
├── Notifications utilisateur : /api/V1/notifications
│   ├── GET  /list      ← Mes notifications (paginé, filtrable)
│   ├── GET  /unread-count
│   ├── POST /          ← Créer (ADMIN)
│   ├── POST /bulk      ← Créer en masse (ADMIN, transaction atomique)
│   ├── PATCH /read-all ← Tout marquer lu
│   ├── PATCH /:id/read ← Marquer une notif lue
│   └── DELETE /:id     ← Supprimer
│
├── Notifications admin : /api/V1/admin/notifications
│   ├── GET  /          ← Liste (ADMIN + GESTIONNAIRE)
│   ├── GET  /stats|types|priorities
│   ├── POST /|/bulk
│   ├── PATCH /read-all|/:id/read
│   └── DELETE /:id
│
└── Kafka Consumer (groupId: notification-gestionnaire-group)
    ├── ecotrack.alerts
    │   └── id_conteneur → zone → id_gestionnaire + id_admin → INSERT notification
    ├── ecotrack.signalements.nouveau
    │   └── même résolution → INSERT notification ALERTE
    └── ecotrack.admin.notifications
        └── adminNotificationService.processKafkaEvent()

Matrice type/rôle :
- ALERTE : GESTIONNAIRE, ADMIN uniquement
- TOURNEE : GESTIONNAIRE, ADMIN uniquement
- BADGE   : CITOYEN, AGENT uniquement
- SYSTEME : tous rôles
```

---

### C. Tier 3 — Données (Persistance)

#### PostgreSQL 16 + PostGIS 3

```
Base : ecotrack (partagée entre tous les services)
Extensions : postgis, uuid-ossp

Schéma principal :

UTILISATEURS & AUTH
├── utilisateur        (id, email, prenom, nom, role_par_defaut, mfa_enabled, totp_secret, backup_codes)
├── role               (id, nom, description)
├── utilisateur_role   (id_utilisateur, id_role)
├── refresh_token      (id, id_utilisateur, token_hash, expires_at)
├── session            (id, id_utilisateur, device_info, created_at)
└── audit_log          (id, email, success, ip, timestamp)

GÉOGRAPHIE & CONTENEURS
├── zone               (id, nom, geom GEOMETRY(Polygon,4326), id_gestionnaire, id_admin)
├── type_conteneur     (id, nom, capacite_max)
├── conteneur          (id, uid, localisation GEOMETRY(Point,4326), id_zone, id_type, niveau_remplissage, statut)
└── historique_statut_conteneur (id, id_conteneur, ancien_statut, nouveau_statut, date_changement)

IoT
├── capteur            (id, uid_capteur, id_conteneur, statut, date_installation)
├── mesure             (id, id_capteur, niveau_remplissage, batterie, temperature, timestamp)
│   └── [INDEX BRIN sur timestamp, PARTITION candidat par mois]
└── alerte_capteur     (id, id_capteur, type_alerte, valeur_detectee, seuil, statut, created_at)

TOURNÉES & COLLECTES
├── vehicule           (id, immatriculation, capacite, type_vehicule)
├── tournee            (id, code T-YYYY-NNN, date_tournee, statut, id_agent, id_vehicule, id_zone, heure_debut_prevue, est_en_retard)
├── etape_tournee      (id, id_tournee, id_conteneur, ordre, heure_estimee, statut_collecte)
├── collecte           (id, id_tournee, id_etape, id_agent, quantite, heure_collecte)
├── anomalie_tournee   (id, id_tournee, id_conteneur, type_anomalie, description, photo_url)
├── signalement        (id, id_conteneur, id_citoyen, id_type, description, urgence, url_photo, statut)
└── type_signalement   (id, nom, description)

GAMIFICATION
├── badge              (id, nom, description, icone_url, seuil_points)
├── user_badge         (id, id_utilisateur, id_badge, date_obtention)
├── historique_points  (id, id_utilisateur, delta_points, raison, created_at)
├── gamification_defi  (id, titre, description, type_action, objectif, recompense, date_debut, date_fin)
└── gamification_participation_defi (id, id_defi, id_utilisateur, progression, statut)

NOTIFICATIONS
└── notification       (id, type, titre, corps, est_lu, date_creation, id_utilisateur)
```

#### Redis 7

```
Namespaces utilisés :

service-users :
├── session:{userId}:{sessionId}     TTL 7 jours  (refresh token)
├── blacklist:{jti}                  TTL 15 min   (tokens révoqués)
└── ratelimit:login:{ip}             TTL 15 min   (brute-force)

service-notification :
└── notif:unread:{userId}            TTL 60s      (compteur non-lus)

service-analytics :
├── dashboard:{hash_params}          TTL 300s     (résultats agrégés)
└── ml:predict:{containerId}         TTL 300s     (prédiction remplissage)

api-gateway :
└── cache:{method}:{url}:{userId}    TTL 60-300s  (réponses GET fréquentes)
```

#### Kafka 3 — Topics

```
Cluster : 1 broker (dev), 3 brokers (prod, 3 AZ)

Topics :

ecotrack.sensor.data       Partitions: 6   Rétention: 7j
  Producer  : service-iot
  Consumer  : service-analytics (ML, agrégations)
  Clé msg   : uid_capteur
  Format    : {timestamp, capteur:{id, uid}, mesure:{fill_level, battery, temperature}}

ecotrack.alerts            Partitions: 3   Rétention: 30j
  Producer  : service-iot
  Consumers : service-notification, service-analytics
  Clé msg   : id_alerte
  Format    : {timestamp, alert:{id_alerte, type_alerte, valeur_detectee, seuil, id_conteneur}}

ecotrack.signalements.nouveau  Partitions: 3  Rétention: 7j
  Producer  : service-routes
  Consumer  : service-notification
  Clé msg   : id_signalement
  Format    : {timestamp, signalement:{id, description, id_conteneur, id_citoyen, statut}}

ecotrack.container.status  Partitions: 3   Rétention: 7j
  Producer  : service-iot
  Consumer  : service-routes (déclenchement collecte prioritaire)

ecotrack.admin.notifications  Partitions: 3  Rétention: 7j
  Producer  : service-notification
  Consumer  : service-notification (self-consume pour events structurés)
```

---

### D. Patterns de Conception Utilisés

| Pattern | Localisation | Rôle |
|---------|-------------|------|
| **Repository Pattern** | `src/repositories/` dans chaque service | Isolation de l'accès SQL — les services ne connaissent pas pg directement |
| **Strategy Pattern** | `service-routes` — algorithmes NN et 2-opt interchangeables | Permet de brancher un autre algorithme (génétique) sans modifier le service |
| **Observer Pattern (Kafka)** | service-iot → Kafka → service-notification/analytics | Découplage producteur/consommateur événements IoT |
| **Middleware Chain** | API Gateway + chaque service (auth → rbac → validation → controller) | Séparation des préoccupations transversales |
| **Adapter Pattern** | `gamificationClient` dans service-routes | Appel interne vers service-gamifications — abstraite l'URL et le timeout |
| **Singleton Pool** | `db/connexion.js` dans chaque service | Pool pg partagé dans tout le processus Node.js |
| **Factory (API Response)** | `utils/api-response.js` | Format de réponse standardisé `{data, total, page, limit}` |
| **Circuit Breaker (partiel)** | service-notification sans Kafka | Mode dégradé explicite — HTTP REST reste opérationnel si Kafka down |

---

## III. Schémas d'Architecture

Les diagrammes Mermaid source sont localisés dans `docs/diagrams/flows/`. Le tableau ci-dessous en recense l'intégralité.

### Index des Diagrammes

| Fichier | Type | Description |
|---------|------|-------------|
| [`01-architecture.mmd`](diagrams/flows/01-architecture.mmd) | flowchart | Routing API Gateway → 8 microservices, PostgreSQL, Redis, Kafka |
| [`architecture-globale.mmd`](diagrams/flows/architecture-globale.mmd) | flowchart | Vue synthétique de l'architecture complète avec topics Kafka |
| [`02-authentication.mmd`](diagrams/flows/02-authentication.mmd) | sequenceDiagram | Flux JWT access/refresh, MFA TOTP, blacklist Redis |
| [`03-authorization.mmd`](diagrams/flows/03-authorization.mmd) | sequenceDiagram | Middleware RBAC : vérification rôles par endpoint |
| [`04-iot-data.mmd`](diagrams/flows/04-iot-data.mmd) | flowchart | Ingestion MQTT → Kafka → service-analytics / service-notification |
| [`05-tournee.mmd`](diagrams/flows/05-tournee.mmd) | sequenceDiagram | Création tournée, déclenchement algorithme NN+2-opt, étapes GPS |
| [`06-gamification.mmd`](diagrams/flows/06-gamification.mmd) | flowchart | Attribution points, vérification badges, progression défis |
| [`07-analytics-ml.mmd`](diagrams/flows/07-analytics-ml.mmd) | flowchart | Pipeline ML : agrégations, prédiction remplissage, détection anomalies Z-score |
| [`08-cache.mmd`](diagrams/flows/08-cache.mmd) | sequenceDiagram | Stratégie cache Redis : cache hit/miss, TTL par namespace de service |
| [`09-logging-monitoring.mmd`](diagrams/flows/09-logging-monitoring.mmd) | flowchart | Pino structuré → Prometheus /metrics → Grafana dashboards |
| [`10-request-flow.mmd`](diagrams/flows/10-request-flow.mmd) | flowchart | Cycle complet d'une requête HTTP dans le système (rate limit → JWT → RBAC → service) |
| [`11-citoyen-mobile-architecture.mmd`](diagrams/flows/11-citoyen-mobile-architecture.mmd) | flowchart | Pages mobile citoyen (React.lazy + Suspense), CitoyenAuthContext |
| [`12-citoyen-auth-flows.mmd`](diagrams/flows/12-citoyen-auth-flows.mmd) | flowchart | Inscription citoyen (activation email + code), connexion, refresh JWT |
| [`13-citoyen-signalement-gamification.mmd`](diagrams/flows/13-citoyen-signalement-gamification.mmd) | sequenceDiagram | Signalement → Kafka → service-notification + service-gamifications |
| [`notifications-flux.mmd`](diagrams/flows/notifications-flux.mmd) | flowchart | Flux complet notifications : producteurs Kafka, consumer, matrice type/rôle |
| [`signalement-cycle.mmd`](diagrams/flows/signalement-cycle.mmd) | flowchart | Cycle de vie signalement : citoyen → Kafka → notification gestionnaire |
| [`agent-flux.mmd`](diagrams/flows/agent-flux.mmd) | flowchart | Parcours agent de collecte : connexion, tournée, scan QR, clôture |
| [`citoyen-parcours.mmd`](diagrams/flows/citoyen-parcours.mmd) | flowchart | Parcours citoyen : connexion, signalement, carte, défis, profil |
| [`gestionnaire-flux.mmd`](diagrams/flows/gestionnaire-flux.mmd) | flowchart | Tableau de bord gestionnaire : tournées, alertes, conteneurs, statistiques |
| [`admin-architecture.mmd`](diagrams/flows/admin-architecture.mmd) | flowchart | Vue administrateur : gestion utilisateurs, monitoring Prometheus, notifications |

---

### 1. Architecture Globale

Fichier : [`docs/diagrams/flows/01-architecture.mmd`](diagrams/flows/01-architecture.mmd)

```
Frontend (React 18 / Vite)
  └── HTTPS/WSS
      └── API Gateway :3000  [JWT · RateLimit · CORS · Logging · Prometheus]
          ├── /api/V1/users/*         → service-users    :3010
          ├── /api/V1/containers/*    → service-containers :3011
          ├── /api/V1/zones/*         → service-containers :3011
          ├── /api/V1/routes/*        → service-routes   :3012
          ├── /api/V1/iot/*           → service-iot      :3013
          ├── /api/V1/gamification/*  → service-gamifications :3014
          ├── /api/V1/analytics/*     → service-analytics :3015
          ├── /api/V1/notifications/* → service-notification :3016
          └── /ws                     → service-notification :3016 (WebSocket)

Chaque service :
  ├── PostgreSQL :5432 (base partagée ecotrack)
  ├── Redis :6379 (cache / sessions)
  └── Kafka :9092 (async events — selon service)

service-iot :3013
  └── MQTT :1883 (capteurs IoT)
```

### 2. Flux de Données — Ingestion IoT vers Notification

Fichier : [`docs/diagrams/flows/04-iot-data.mmd`](diagrams/flows/04-iot-data.mmd)

```
Capteur IoT
  │  MQTT containers/{uid}/data
  ▼
service-iot :3013
  ├── Validation Joi (fill_level, battery, temperature)
  ├── INSERT mesure → PostgreSQL
  └── Seuil dépassé ?
      ├── NON → fin
      └── OUI → Kafka Producer
                ├── ecotrack.sensor.data ──────────────→ service-analytics
                │                                         (ML, agrégations)
                └── ecotrack.alerts
                      └── service-notification :3016
                            ├── Consumer Kafka
                            ├── zone.repository :
                            │   id_conteneur → zone → id_gestionnaire + id_admin
                            └── INSERT notification (type=ALERTE)
                                  └── API GET /api/V1/notifications/list
                                        └── Gestionnaire de zone
```

### 3. Flux de Données — Signalement Citoyen

Fichier : [`docs/diagrams/flows/13-citoyen-signalement-gamification.mmd`](diagrams/flows/13-citoyen-signalement-gamification.mmd)

```
Citoyen (mobile)
  │  POST /api/V1/routes/signalements
  ▼
API Gateway → service-routes
  ├── INSERT signalement → PostgreSQL
  ├── Kafka Producer → ecotrack.signalements.nouveau
  │     └── service-notification → ALERTE gestionnaire de zone
  └── gamificationClient (interne, fire-and-await)
        └── service-gamifications
              ├── UPDATE utilisateur.points += 10
              ├── INSERT historique_points
              ├── CHECK badges événementiels → INSERT user_badge si seuil atteint
              └── CHECK défis actifs → UPDATE progression
```

### 4. Architecture Déploiement — Environnements

```
DÉVELOPPEMENT (local)
├── docker-compose.yml (12 containers)
│   ├── postgres :5432
│   ├── redis :6379
│   ├── zookeeper :2181
│   ├── kafka :9092 / :29092
│   ├── kafka-ui :8080
│   ├── pgadmin :5050
│   ├── prometheus :9090
│   └── grafana :3001
└── Services Node.js en local (npm run dev + nodemon)
    └── Accès via api-gateway :3000

STAGING (Google Cloud Platform — région europe-west1)
├── 2 Compute Engine e2-standard-2 (2 vCPU, 8 GB RAM)
├── Cloud SQL PostgreSQL 16 (db-g1-small, 100 GB SSD)
├── Memorystore for Redis (1 GB, zone unique)
├── Confluent Cloud on GCP — Kafka (2 brokers, cluster Basic)
└── CI/CD GitHub Actions → build Docker → push Artifact Registry → deploy Cloud Run

PRODUCTION (Google Cloud Platform — région europe-west1)
├── Cloud Run (8 services containerisés — scale 1→N instances, min-instances=1)
├── Cloud SQL PostgreSQL 16 (db-custom-2-7680) + 1 replica de lecture
├── Memorystore for Redis (Tier Standard, 5 GB, HA avec failover)
├── Confluent Cloud on GCP — Kafka (3 brokers, 3 zones, cluster Standard)
├── Cloud CDN + Cloud Storage GCS (assets statiques, avatars, exports PDF)
└── Cloud Load Balancing HTTPS (Global LB devant Cloud Run, certificat SSL géré)
```

### 5. Schéma Base de Données (ERD — relations principales)

```
utilisateur ──< utilisateur_role >── role
    │
    ├── 1:N refresh_token
    ├── 1:N session
    ├── 1:N historique_points
    ├── 1:N user_badge >── badge
    ├── 1:N signalement
    ├── 1:N notification
    └── 1:N tournee (en tant qu'agent)

zone ──< conteneur >── type_conteneur
  │           │
  │           ├── 1:1 capteur ──< mesure
  │           │              └──< alerte_capteur
  │           └──< etape_tournee >── tournee
  │                                    │
  │                               ──< collecte
  │                               ──< anomalie_tournee
  └── id_gestionnaire → utilisateur
  └── id_admin        → utilisateur

gamification_defi ──< gamification_participation_defi >── utilisateur

notification.id_utilisateur → utilisateur
signalement.id_conteneur    → conteneur
signalement.id_type         → type_signalement
```

### 6. Architecture Sécurité — Défense en Profondeur

Fichier : [`docs/diagrams/flows/02-authentication.mmd`](diagrams/flows/02-authentication.mmd)

```
COUCHE 1 — Réseau / Périmètre
├── HTTPS/TLS 1.3 (certificat Let's Encrypt, auto-renew)
├── ALB (prod) : terminaison TLS, redirection HTTP → HTTPS
└── CORS : origines whitelistées (ALLOWED_ORIGINS env)

COUCHE 2 — API Gateway
├── Helmet : X-Frame-Options, CSP, HSTS, X-Content-Type-Options
├── Rate Limiting : 100 req/min global, 5 tentatives login/15 min
├── JWT Validator : vérification signature + expiration (access 15 min)
└── Injection headers aval : x-user-id, x-user-role, x-user-email

COUCHE 3 — Microservices
├── Re-vérification JWT dans chaque service (defense in depth)
├── RBAC : requireRole('ADMIN','GESTIONNAIRE') par endpoint
├── Validation Joi : body, params, query — rejette tout input non conforme
└── BOLA protection : id_citoyen = req.headers['x-user-id'] (non trust client)

COUCHE 4 — Données
├── Requêtes paramétrées PostgreSQL (pg driver — 0 concaténation SQL)
├── bcryptjs cost 12 (hash mots de passe)
├── Secrets .env / Docker secrets (pas de valeurs en dur dans le code)
└── Chiffrement at-rest : Cloud SQL encryption (AES-256, Cloud KMS)

COUCHE 5 — Identité
├── JWT : Access Token 15 min + Refresh Token 7 jours
├── MFA TOTP (speakeasy RFC 6238) : obligatoire activable par utilisateur
├── 10 codes de secours (hex 8 chars) — usage unique
├── Max 3 sessions simultanées par utilisateur
└── Blacklist JWT sur logout (Redis TTL = durée restante access token)

COUCHE 6 — Conformité et Audit
├── Audit log : toutes tentatives de connexion (succès + échecs)
├── RGPD : export données (GET /me/data), effacement (DELETE /me)
├── Consentement cookies : banner + API POST /api/V1/cookies/consent
└── Cron purge : soft-deleted users purged après 90 jours
```

---

## IV. Scalabilité et Performance

### A. Stratégies de Scalabilité

#### Scalabilité Horizontale

Les services sont stateless par conception — l'état de session est externalisé dans Redis et la base de données. N'importe quel service peut être dupliqué à chaud sans coordination.

```
Scénario de charge : 15 000 citoyens connectés simultanément

api-gateway (actuel) :     1 instance  → scaling : 2-3 instances derrière ALB
service-users :            1 instance  → scaling : 2 instances (sessions Redis partagées)
service-containers :       1 instance  → scaling : 2 instances (PostgreSQL partagé)
service-notification :     1 instance  → scaling : 2 instances (Kafka consumer group)
service-iot :              1 instance  → scaling limité (MQTT broker Aedes single-process)
                                                  → solution : EMQX externe si > 5000 capteurs
```

**Kafka** : scalabilité native par partitionnement. Ajouter une instance consumer dans le même `groupId` distribue automatiquement les partitions entre les consommateurs (ex : 3 instances de service-notification → 3 partitions du topic alerts traitées en parallèle).

**PostgreSQL** : réplication streaming vers un replica de lecture. Les requêtes `SELECT` analytiques lourdes (service-analytics) sont routées vers le replica — le primaire est réservé aux écritures et lectures critiques.

#### Scalabilité Verticale

| Composant | Actuel (dev) | Staging | Production | Limite |
|-----------|:------------:|:-------:|:----------:|--------|
| Serveurs app | Docker local | Compute Engine e2-standard-2 / Cloud Run | Cloud Run (scale auto 1→N) | Cloud Run max 1 000 instances simultanées |
| PostgreSQL | Docker postgres:16 | Cloud SQL db-g1-small (1,7 GB) | Cloud SQL db-custom-2-7680 (8 GB) + replica | Cloud Spanner si > 10 TB |
| Redis | Docker redis:7 | Memorystore Basic 1 GB | Memorystore Standard 5 GB (HA) | Cluster Redis si > 16 GB |

### B. Objectifs de Performance

| Métrique | Objectif | Mesuré (staging) | Outil de mesure |
|----------|:--------:|:----------------:|----------------|
| Temps réponse GET /containers (cache chaud) | < 50 ms | ~12 ms | Prometheus p95 |
| Temps réponse POST /auth/login | < 200 ms | ~85 ms | Prometheus p95 |
| Calcul tournée optimisée 50 conteneurs | < 30 s | < 500 ms | Log service |
| Débit ingestion MQTT (régime nominal) | 33 msg/s | 33 msg/s | Prometheus counter |
| Débit MQTT (pic) | 200 msg/s | Testé 250 msg/s | Test charge MQTT |
| Connexions WebSocket simultanées | 1 000 | 500 (testé) | Socket.IO admin |
| Disponibilité production | 99,5 % | — | Uptime Robot |
| Temps réponse API p95 global | < 200 ms | — | Prometheus Grafana |

### C. Monitoring et Observabilité

Chaque service expose :
- `GET /health` → statut + connexion PostgreSQL (JSON)
- `GET /metrics` → métriques Prometheus (compteurs HTTP, durées)

```
Métriques collectées par service (prom-client) :
├── http_requests_total{method, route, status}
├── http_request_duration_seconds{method, route}
├── active_connections
└── custom : mqtt_messages_total, kafka_messages_produced, cache_hit_ratio

Dashboards Grafana :
├── Overview Gateway : trafic global, taux erreur, latence p50/p95/p99
├── Service IoT : débit MQTT, alertes créées, mesures/min
├── PostgreSQL : connexions actives, slow queries, transactions/s
└── Kafka : lag consumer, throughput par topic, offset
```

### D. Tests de Charge Prévus

| Phase | Outil | Scénario | Métriques cibles |
|-------|-------|----------|-----------------|
| Sprint 4 | autocannon (npm) | 1 000 users simultanés, 60s | Taux erreur < 1%, p95 < 200ms |
| Sprint 6 | autocannon | 5 000 users, endpoints critiques | Taux erreur < 1%, p95 < 500ms |
| Sprint 8 (pre-prod) | k6 | 10 000 req/min, scénarios mixtes | Débit 10K req/min, 0 dégradation |
| Continu (post-prod) | Prometheus + Grafana | Monitoring temps réel | Alertes si p95 > 500ms |

---

## V. Sécurité et Conformité

### A. Authentification et Autorisation

**Flux d'authentification standard** :
```
POST /api/V1/users/auth/login
  └── bcryptjs.compare(password, hash) → cost 12
  └── MFA activé ? OUI → {requiresMfa: true, userId}
                   NON → generateToken(userId, role) → {token, refreshToken}

Flux MFA :
POST /auth/login/mfa  {userId, code TOTP 6 digits}
  └── speakeasy.totp.verify(code, secret, window=4) ← tolérance décalage horaire
  └── OU code secours (parmi les 10 hex, usage unique)
  └── → {token, refreshToken}

Refresh Token :
POST /auth/refresh  {refreshToken}
  └── Vérification hash en base (refresh_token table)
  └── Vérification non-blacklisté (Redis)
  └── → nouveau {token, refreshToken}
```

**RBAC (Role-Based Access Control)** :

| Rôle | Périmètre d'accès |
|------|-------------------|
| ADMIN | Accès total + gestion utilisateurs + création notifications + purge logs |
| GESTIONNAIRE | Dashboard, zones assignées, tournées, notifications propres, analytics |
| AGENT | App mobile, tournées assignées, collectes, signalements |
| CITOYEN | App mobile, carte publique, signalements propres, gamification |

### B. Chiffrement et Secrets

| Donnée | Mécanisme | Algorithme |
|--------|-----------|-----------|
| Mots de passe | bcryptjs | bcrypt, cost 12 (~250ms/hash) |
| Tokens JWT | Signature HMAC | HS256, secret 256 bits |
| Codes TOTP | speakeasy | TOTP RFC 6238, HMAC-SHA1, base32 |
| Codes secours | crypto.randomBytes | 4 octets hex × 10, usage unique |
| Transport | TLS | TLS 1.3 (HTTPS + WSS) |
| At-rest (prod) | Cloud KMS (GCP) | AES-256 (Cloud SQL + Cloud Storage encryption) |
| Secrets applicatifs | .env + Docker secrets | Variables d'environnement, jamais dans le code |

### C. Conformité RGPD

| Obligation | Implémentation |
|-----------|---------------|
| Consentement explicite | Banner cookies + `POST /api/V1/cookies/consent` — stockage horodaté |
| Droit d'accès | `GET /me/data` — export JSON toutes données personnelles |
| Droit à l'effacement | `DELETE /me` — soft delete immédiat + purge définitive cron J+90 |
| Portabilité | Export JSON/CSV sur demande (service-analytics) |
| Minimisation | Seuls les champs nécessaires collectés — pas de tracking comportemental |
| Registre des traitements | Document DPO — conteneurs, tournées, signalements, gamification |
| Durées de conservation | Mesures IoT 12 mois, logs 12 mois, données utilisateur : actif jusqu'à suppression |
| DPO désigné | Délégué à la Protection des Données de la collectivité |

### D. Recommandations ANSSI appliquées

| Recommandation | Implémentation |
|----------------|---------------|
| Chiffrement TLS 1.2 minimum | TLS 1.3 configuré (HTTPS obligatoire, redirection HTTP) |
| Authentification forte | MFA TOTP activable, obligatoire pour les ADMIN |
| Gestion des habilitations | RBAC granulaire, principe du moindre privilège |
| Journalisation des accès | audit_log : toutes connexions + actions sensibles (suppression, export RGPD) |
| Mises à jour sécurité | Dependabot + npm audit en CI/CD, patch CVE dans les 72h |
| Cloisonnement réseau | Réseau Docker interne — seul api-gateway expose un port public |
| Sauvegardes | pg_dump quotidien + snapshots Cloud SQL automatisés (rétention 30j, Cloud Storage GCS) |
| Scan vulnérabilités | SonarCloud (SAST), npm audit (dépendances), revue OWASP trimestrielle |
