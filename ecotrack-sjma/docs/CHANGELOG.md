# Changelog - EcoTrack

> Historique des versions et changements du projet EcoTrack

---

### [3.5.1] 2026-03 - Metrics API pour Frontend

#### API REST Metrics

Le service-analytics expose maintenant des endpoints pour le frontend :

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/overview` | Vue d'ensemble services + infrastructure |
| `/api/metrics/services` | Santé des services avec latence/erreur |
| `/api/metrics/iot` | Capteurs, conteneurs, batterie |
| `/api/metrics/kafka` | Messages, consumer lag |
| `/api/metrics/database` | Connexions DB, cache hit ratio |
| `/api/metrics/alerts` | Alertes actives (filtrables par sévérité/service) |
| `/api/metrics/alerts/counts` | Compteurs alertes par sévérité |
| `/api/metrics/history` | Données historiques |

#### Format Alertes

```json
{
  "alerts": [
    {
      "id": "ServiceDown-service-iot-1711000000000",
      "name": "ServiceDown",
      "severity": "critical",
      "severityLevel": 1,
      "service": "service-iot",
      "summary": "Service IoT en panne",
      "description": "Connection perdue avec le broker MQTT...",
      "timeAgo": "il y a 35min",
      "minutesAgo": 35
    }
  ],
  "counts": { "critical": 1, "warning": 2, "info": 0 },
  "total": 3
}
```

#### Sevérités

| Level | Severity | Couleur |
|-------|----------|---------|
| 1 | critical | 🔴 Rouge |
| 2 | warning | 🟡 Jaune |
| 3 | medium | 🟠 Orange |
| 4 | info | 🔵 Bleu |

#### Exemple Frontend

```javascript
// Alertes filtrées
const res = await fetch('http://localhost:3015/api/metrics/alerts?severity=critical');
const { alerts, counts, total } = await res.json();

// Compteurs badge
const counts = await fetch('http://localhost:3015/api/metrics/alerts/counts');
```

#### Fichiers

- `services/service-analytics/src/routes/metrics.js` - Routes API
- `services/service-analytics/src/index.js` - Routes registradas
- `docker-compose.yml` - Ajout `PROMETHEUS_URL` env

#### Documentation

- `docs/PROMETHEUS.md` - Endpoints API documentés
- `docs/GRAFANA.md` - Dashboards et panels mis à jour

---

### [3.5.0] 2026-03 - Kafka Message Broker

#### Pourquoi Kafka ?

**Contexte Scale** :
- 2000 conteneurs avec capteurs
- ~2000 mesures / 5 min = ~7 msg/sec (pic: 100+ msg/sec)
- 15000 citoyens, 50 agents, 10 gestionnaires

**Problèmes résolus** :
| Problème | Solution |
|----------|----------|
| Pic de mesures IoT | Buffer asynchrone |
| Découplage services | Producers/Consumers |
| Temps réel | Streaming alerts |
| Scalabilité | Partitionnement |

#### Architecture

```
[Capteurs] → [service-iot] → [Kafka] → [service-analytics]
                                          ↓
                                     [service-users]
```

#### Topics Kafka

| Topic | Description | Partitions |
|-------|-------------|------------|
| `ecotrack.sensor.data` | Données capteurs | 6 |
| `ecotrack.alerts` | Alertes conteneurs | 3 |
| `ecotrack.container.status` | Statut conteneurs | 3 |
| `ecotrack.notifications` | Notifications | 3 |

#### Services

| Service | Rôle | Fonction |
|---------|------|----------|
| **service-iot** | Producer | Envoie données/alertes vers Kafka |
| **service-analytics** | Consumer | ML predictions, stats |
| **service-users** | Consumer | Notifications push/email |

#### Docker

```yaml
# docker-compose.yml
zookeeper:
  image: confluentinc/cp-zookeeper:7.5.0
kafka:
  image: confluentinc/cp-kafka:7.5.0
kafka-ui:
  image: provectuslabs/kafka-ui:latest  # http://localhost:8080
```

#### Documentation

- `docs/KAFKA.md` - Documentation complète avec architecture, API, monitoring

#### Fichiers

- `docker-compose.yml` - Ajout zookeeper, kafka, kafka-ui
- `docs/KAFKA.md` - Documentation
- `services/service-iot/kafkaProducer.js` - Producer
- `services/service-analytics/kafkaConsumer.js` - Consumer
- `services/service-users/src/services/kafkaNotificationConsumer.js` - Consumer

---

### [3.4.0] 2026-03 - Configuration Dynamique & Constantes

#### Système de Configuration Dynamique (Admin)

**Nouveau**: Les administrateurs peuvent maintenant modifier les paramètres système sans redéploiement.

##### Table `configurations`
- **Migration**: `014_configurations.sql`
- **Seed**: `017_configurations_default.sql`
- **22 paramètres configurables** par catégorie :

| Catégorie | Paramètres |
|-----------|------------|
| `jwt` | access_token_expiration, refresh_token_expiration |
| `security` | bcrypt_rounds (défaut: 10), max_login_attempts, lockout_duration |
| `session` | max_concurrent_sessions (défaut: 3), token_expiration_hours |
| `rate_limit` | window_ms, max_requests (100/min), auth limits |
| `upload` | max_file_size_mb (5), allowed_extensions, max_files_per_request |
| `password` | min_length, require_uppercase, require_special, etc. |
| `notifications` | email_enabled, push_enabled |

##### API Endpoints
```
GET  /admin/config                 # Toutes les configs
GET  /admin/config/:key           # Une config
GET  /admin/config/category/:cat  # Par catégorie
PUT  /admin/config/:key           # Modifier (ADMIN only)
```

#### Constantes Environnementales (Admin)

**Nouveau**: Paramètres environnementaux pour calculs CO2 et coûts.

##### Table `environmental_constants`
- **Migration**: `015_environmental_constants.sql`
- **Seed**: `018_environmental_constants.sql`

| Clé | Valeur | Unité | Description |
|-----|--------|-------|-------------|
| CO2_PER_KM | 0.85 | kg/km | Émissions CO2 camion benne |
| FUEL_CONSUMPTION_PER_100KM | 35 | L/100km | Consommation carburant |
| FUEL_PRICE_PER_LITER | 1.65 | €/L | Prix carburant |
| LABOR_COST_PER_HOUR | 50 | €/h | Coût main d'œuvre |
| MAINTENANCE_COST_PER_KM | 0.15 | €/km | Coût maintenance |
| CO2_PER_TREE_PER_YEAR | 20 | kg/an | CO2 absorbé par arbre |
| CO2_PER_KM_CAR | 0.12 | kg/km | CO2 voiture moyenne |

##### API Endpoints
```
GET  /admin/environmental-constants              # Toutes les constantes
GET  /admin/environmental-constants/:key        # Une constante
PUT  /admin/environmental-constants/:key         # Modifier (ADMIN only)
```

##### Fichier JS
```javascript
// src/config/ENVIRONMENTAL_CONSTANTS.js
import {
  calculateCO2Emissions,
  calculateFuelCost,
  calculateTotalCost,
  calculateCarEquivalent
} from './ENVIRONMENTAL_CONSTANTS.js';
```

#### Constantes Performance Agents (Admin)

**Nouveau**: Pondérations pour calcul du score global des agents.

##### Table `agent_performance_constants`
- **Migration**: `016_agent_performance_constants.sql`
- **Seed**: `019_agent_performance_constants.sql`

```javascript
AGENT_PERFORMANCE_CONSTANTS = {
  WEIGHTS: {
    COLLECTION_RATE: 0.4,      // 40% : collecte effective
    COMPLETION_RATE: 0.3,      // 30% : complétion tournées
    TIME_EFFICIENCY: 0.15,    // 15% : respect temps
    DISTANCE_EFFICIENCY: 0.15  // 15% : respect distance
  }
}
```

##### Formule Score Global
```
Score = collection_rate * 0.4 + completion_rate * 0.3 + time_efficiency * 0.15 + distance_efficiency * 0.15
```

##### API Endpoints
```
GET  /admin/agent-performance              # Toutes les constantes
GET  /admin/agent-performance/:key        # Une constante
PUT  /admin/agent-performance/:key        # Modifier (ADMIN only)
```

#### Fichiers Créés
- `database/migrations/014_configurations.sql`
- `database/migrations/015_environmental_constants.sql`
- `database/migrations/016_agent_performance_constants.sql`
- `database/seeds/017_configurations_default.sql`
- `database/seeds/018_environmental_constants.sql`
- `database/seeds/019_agent_performance_constants.sql`
- `services/service-users/src/config/ENVIRONMENTAL_CONSTANTS.js`
- `services/service-users/src/config/AGENT_PERFORMANCE_CONSTANTS.js`
- `services/service-users/src/repositories/configuration.repository.js`
- `services/service-users/src/repositories/environmentalConstants.repository.js`
- `services/service-users/src/repositories/agentPerformanceConstants.repository.js`
- `services/service-users/src/routes/admin-config.js`
- `services/service-users/src/routes/admin-environmental-constants.js`
- `services/service-users/src/routes/admin-agent-performance.js`
- `docs/CONFIGURATIONS.md`

---

### [3.3.0] 2026-03 - Redis Caching + Centralized Logging

#### Cache Redis Multi-Services

**Nouveau**: Implémentation du cache Redis pour améliorer les performances API.

- **service-users** (port 3010)
  - Cache des profils utilisateurs (`user:{id}:profile`) - TTL 5min
  - Cache des stats utilisateur (`user:{id}:stats`) - TTL 5min
  - Cache des rôles utilisateur (`user:{id}:roles`) - TTL 30min
  - Invalidation automatique lors des mises à jour

- **service-containers** (port 3011)
  - Cache des détails conteneur (`container:{id}`) - TTL 2min
  - Cache UID conteneur (`container:uid:{uid}`) - TTL 2min
  - Cache liste conteneurs (`containers:list:*`) - TTL 1min
  - Cache conteneurs par zone (`containers:zone:{id}`) - TTL 2min

- **service-routes** (port 3012)
  - Cache tournée par ID (`tournee:{id}`) - TTL 1min
  - Cache liste tournées (`tournees:list:*`) - TTL 30s
  - Cache tournées actives (`tournee:active`) - TTL 1min

- **service-analytics** (port 3015)
  - Migration NodeCache → Redis avec fallback mémoire
  - Cache KPIs dashboard - TTL 1min
  - Cache agrégations zones - TTL 5min

- **service-gamifications** (port 3014)
  - Cache classement (`gamification:leaderboard`) - TTL 5min
  - Cache points utilisateurs - TTL 10min
  - Cache badges disponibles - TTL 1h

- **service-iot** (port 3013)
  - Cache dernières mesures - TTL 30s
  - Cache capteurs actifs - TTL 5min
  - Cache statistiques conteneur - TTL 5min

#### Configuration

- **Package**: `redis@4.7.0` ajouté aux services
- **Variables d'environnement**:
  ```
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_PASSWORD=
  REDIS_DB=0
  ```
- **Service**: Pattern Cache-Aside avec invalidation automatique
- **Logging**: Utilisation du logger Pino existant

#### Améliorations Performance (objectifs)

- Réduction latence API (objectif < 500ms P95 - à mesurer)
- Réduction charge PostgreSQL
- Cache hit ratio cible > 80% (à mesurer)

#### Système de Logging Centralisé

**Nouveau**: Système de logs centralisé pour administration et monitoring.

- **Base de données**: Table `centralized_logs` avec index sur timestamp, service, level, action
- **Champs**:
  - `timestamp` - Date/heure du log
  - `level` - Niveau (info, warning, error, critical)
  - `action` - Action (login, logout, create, update, delete, view, etc.)
  - `service` - Service source
  - `message` - Message du log
  - `metadata` - Données supplémentaires (JSON)
  - `user_id` - ID utilisateur
  - `ip_address` - Adresse IP

##### API Endpoints

| Endpoint | Description |
|---------|-------------|
| `POST /api/logs` | Créer un log |
| `GET /api/logs` | Liste avec filtres |
| `GET /api/logs/filters` | Valeurs disponibles |
| `GET /api/logs/summary` | Statistiques globales |
| `GET /api/logs/export` | Export JSON ou CSV |

##### Client de Logging

```javascript
centralLogClient.login('User logged in', { ip: req.ip }, userId);
centralLogClient.error('Failed to connect', { error: err.message });
```

---

### [3.1.0] 2026-03 - Service Routes

#### Nouveau Microservice : service-routes (port 3012)
- **Nouveau**: Gestion complète des tournées de collecte
  - CRUD tournées avec code auto-généré (T-YYYY-NNN)
  - Liste paginée avec filtres (statut, zone, agent, dates)
  - Détail avec JOIN zone, agent, véhicule, progression étapes
  - Changement de statut avec audit trail
  - Suppression protégée (impossible si EN_COURS)
- **Nouveau**: Optimisation des itinéraires
  - Algorithme Nearest Neighbor (O(n²))
  - Algorithme 2-opt (solution optimale -15% à -45%)
  - Distance Haversine pour précision GPS
  - Filtre par seuil de remplissage
  - Création automatique des étapes ordonnées avec heure estimée
- **Nouveau**: Suivi des collectes (Agent terrain)
  - Enregistrement collecte avec quantité (transaction atomique)
  - Clôture automatique de la tournée
  - Signalement anomalies : CONTENEUR_INACCESSIBLE, CONTENEUR_ENDOMMAGE, CAPTEUR_DEFAILLANT
- **Nouveau**: Statistiques & KPIs
  - Dashboard : tournées, collectes 30j, véhicules
  - KPIs : taux complétion, distances, quantité, CO2 économisé
  - Comparaison algorithmes NN vs 2-opt

#### Export & Visualisation (service-routes)
- **Nouveau**: Génération PDF de feuille de route (`GET /tournees/:id/pdf`)
  - Informations tournée, agent, véhicule
  - Itinéraire complet avec conteneurs, adresses, ordre, statut
  - Zone signature agent
- **Nouveau**: Export GeoJSON pour carte (`GET /tournees/:id/map`)
  - FeatureCollection avec points GPS des conteneurs
  - Propriétés : id, uid, sequence, collectee, niveau_remplissage

#### Intégration
- `docker-compose.yml` - Activation service-routes (port 3012)
- API Gateway - Route `/routes/*` activée
- CI/CD - service-routes ajouté au pipeline

#### Documentation
- docs/service-routes/ - Documentation complète (INDEX, ARCHITECTURE, SETUP, API, ALGORITHMS, TESTING, DEPLOYMENT, CHANGELOG)

#### Tests
- 141 tests unitaires, 12 suites

---

### [3.0.0] 2026-03 - Service IoT

#### API Gateway
- Intégration service-iot, service-analytics et service-routes dans swagger unifié
- Documentation Swagger unifiée (http://localhost:3000/api-docs)

#### Documentation
- `SERVICE-IOT.md` - Guide complet du service IoT
- PHASE1.md - Réception des données (MQTT, TLS, Auth)
- PHASE2.md - Traitement et Stockage
- PHASE3.md - Alertes automatiques (seuils, notifications)
- docs/service-routes/ - Documentation complète (INDEX, ARCHITECTURE, SETUP, API, ALGORITHMS, TESTING, DEPLOYMENT)

#### Tests
- service-iot: tests unitaires complets (4 Suites, 42 tests)
- service-routes: 141 tests unitaires, 12 suites

#### Services Disponibles
| Service | Port | Status |
|---------|------|--------|
| Frontend | 5173 | ✅ |
| API Gateway | 3000 | ✅ |
| Service Users | 3010 | ✅ |
| Service Containers | 3011 | ✅ |
| Service Routes | 3012 | ✅ |
| Service IoT | 3013 | ✅ |
| Service Gamifications | 3014 | ✅ |
| Service Analytics | 3015 | ✅ |
| PostgreSQL | 5432 | ✅ |
| Redis | 6379 | ✅ |
| PgAdmin | 5052 | ✅ |
| Prometheus | 9090 | ✅ |
| Grafana | 3001 | ✅ |

---

### [3.0.0] 2026-03 - Service IoT

#### Nouveau Microservice : service-iot (port 3013)
- **Nouveau**: Broker MQTT embarqué (Aedes) sur port 1883
  - Réception temps réel des données capteurs (topic: `containers/{uid}/data`)
  - Parsing, validation et stockage automatique des mesures
- **Nouveau**: Alertes automatiques avec seuils configurables
  - `DEBORDEMENT` : remplissage ≥ 90%
  - `BATTERIE_FAIBLE` : batterie ≤ 20%
  - `CAPTEUR_DEFAILLANT` : température hors plage ou-capteur silencieux > 24h
  - Déduplication (pas de doublon d'alerte ACTIVE par conteneur/type)
- **Nouveau**: API REST complète (10 endpoints)
  - Mesures : liste, filtres, dernières mesures, par conteneur
  - Capteurs : liste, détails
  - Alertes : liste, filtres, mise à jour statut
  - Administration : simulation, vérification capteurs silencieux, statistiques
- **Nouveau**: Endpoint de simulation `POST /iot/simulate` pour tests sans MQTT
- **Nouveau**: Métriques Prometheus (mqtt_messages_total, alerts_created_total)
- **Nouveau**: Documentation Swagger sur `/api-docs`

#### MQTT Avancé (Évolutions récentes)
- Support TLS pour broker MQTT (variables: `MQTT_TLS_ENABLED`, `MQTT_TLS_KEY_PATH`, `MQTT_TLS_CERT_PATH`)
- Authentification MQTT par username/password (variables: `MQTT_AUTH_ENABLED`, `MQTT_USERNAME`, `MQTT_PASSWORD`)

#### Notifications Push
- Service de notifications automatique vers service-users
- Envoi des alertes (DEBORDEMENT, BATTERIE_FAIBLE, CAPTEUR_DEFAILLANT)
- Notifications de résolution d'alertes

#### Sécurité
- Validation `validateParamId` pour tous les `req.params.id`
- Rate limiting (`express-rate-limit`) sur les routes admin (10 req/min)

#### Intégration
- `docker-compose.yml` - Activation service-iot (ports 3013 + 1883)
- API Gateway - Route `/iot/*` activée

#### Documentation
- `SERVICE-IOT.md` - Guide complet du service IoT
- PHASE1.md - Réception des données (MQTT, TLS, Auth)
- PHASE2.md - Traitement et Stockage
- PHASE3.md - Alertes automatiques (seuils, notifications)

#### Tests
- tests unitaires complets (4 Suites, 42 tests)

---

### [2.1.0] 2026-02-27 - Service Analytics

#### Phase 1-3 - Agrégations, Dashboard, Rapports
- **Nouveau**: Service Analytics (port 3015)
- **Nouveau**: Vues matérialisées (analytics_daily_stats, analytics_zone_stats, analytics_type_stats)
- **Nouveau**: Endpoints agrégations avec filtres période
- **Nouveau**: Dashboard complet avec KPIs
- **Nouveau**: Heatmap GeoJSON
- **Nouveau**: Évolutions
- **Nouveau**: Génération PDF/Excel rapports
- **Nouveau**: Rapports environnementaux (économie carburant, CO2)
- **Nouveau**: Rapports performance tournées

#### Phase 4 - ML Predictions
- **Nouveau**: Prédiction remplissage (régression linéaire)
- **Nouveau**: Détection anomalies (Z-score)
- **Nouveau**: Capteurs défaillants detection
- **Nouveau**: Intégration météo (Open-Meteo API)
- **Nouveau**: Alertes automatiques depuis anomalies
- **Nouveau**: Table predictions en DB
- **Nouveau**: Seed données ML test

#### Phase 5 - Infrastructure
- **Nouveau**: Rate limiting (express-rate-limit)
  - General: 100 req/15min
  - Reports: 10 req/heure
  - ML: 50 req/15min
- **Nouveau**: Validation Joi middleware
- **Nouveau**: WebSocket temps réel (socket.io)
- **Nouveau**: Cache service (node-cache)
- **Nouveau**: Redis dans docker-compose
- **Fix**: logger.success → logger.info

#### Documentation
- `SERVICE-IOT.md` - Guide complet du service IoT
- PHASE1.md - Réception des données (MQTT, TLS, Auth)
- PHASE2.md - Traitement et Stockage
- PHASE3.md - Alertes automatiques (seuils, notifications)

#### Tests
- tests unitaires complets (4 Suites, aucune régression)

---

### [2.0.0] 2026-02-21 - Monitoring

#### Infrastructure
- **Nouveau**: Prometheus - Service de monitoring et collecte de métriques
  - Port: 9090
  - Configuration: `monitoring/prometheus/prometheus.yml`
  - Scrape interval: 15s
  
- **Nouveau**: Grafana - Interface de visualisation des métriques
  - Port: 3001
  - Login: admin/admin
  - Datasource Prometheus auto-configurée

#### Métriques Prometheus (tous services)
- **Nouveau**: Intégration `prom-client` dans :
  - API Gateway (port 3000)
  - Service Users (port 3010)
  - Service Containers (port 3011)
  - Service Gamifications (port 3014)
- **Nouveau**: Endpoint `/metrics` sur chaque service
- **Nouveau**: Métriques exposées :
  - `http_requests_total` (Counter) - Requêtes HTTP totales
  - `http_request_duration_seconds` (Histogram) - Latence des requêtes
  - `process_*` - Métriques Node.js (mémoire, CPU)

#### Outils Admin
- **Nouveau**: `monitoring/admin-dashboard.js` - Dashboard terminal
- **Nouveau**: `monitoring/admin-dashboard.sh` - Script bash
- **Nouveau**: `monitoring/grafana/dashboards/ecotrack-overview.json` - Dashboard Grafana

#### Documentation
- **Nouveau**: `docs/PROMETHEUS.md` - Guide complet Prometheus
- **Nouveau**: `docs/GRAFANA.md` - Guide Grafana

#### Services Disponibles
| Service | Port | Status |
|---------|------|--------|
| Frontend | 5173 | ✅ |
| API Gateway | 3000 | ✅ |
| Service Users | 3010 | ✅ |
| Service Containers | 3011 | ✅ |
| Service Gamifications | 3014 | ✅ |
| PostgreSQL | 5432 | ✅ |
| PgAdmin | 5050 | ✅ |
| Prometheus | 9090 | ✅ |
| Grafana | 3001 | ✅ |

---

### [1.5.0] 2026-02-19 - Authentification & Emails

#### Backend (service-users)
- **Nouveau**: Ajout du champ `nom` dans l'inscription (RegisterRequest)
- **Nouveau**: Endpoint `/auth/forgot-password` - Demander réinitialisation mot de passe
- **Nouveau**: Endpoint `/auth/reset-password` - Réinitialiser mot de passe avec token
- **Nouveau**: Service SMTP intégré avec nodemailer
- **Nouveau**: Envoi d'emails HTML stylisés (reset password, bienvenue)
- **Fix**: Validation du champ `nom` dans le registre

#### Frontend
- **Nouveau**: Page Inscription (`RegisterPage.jsx`) avec validation nom/prénom
- **Nouveau**: Page Mot de passe oublié (`ForgotPasswordPage.jsx`)
- **Nouveau**: Page Réinitialisation mot de passe (`ResetPasswordPage.jsx`)
- **Nouveau**: Page Conditions Générales (`TermsPage.jsx`)
- **Nouveau**: Page Politique de Confidentialité (`PrivacyPage.jsx`)
- **Nouveau**: Styles CSS globaux pour les pages d'auth

#### Base de données
- **Nouveau**: Table `password_reset_tokens` pour les tokens de reset

#### Swagger
- **Mise à jour**: Documentation avec champ `nom`
- **Mise à jour**: Documentation forgot-password et reset-password

#### Tests
- **Nouveau**: Vitest configuré pour le frontend
- **Nouveau**: Tests unitaires (`src/test/auth.test.js`)
- **Commandes**: `npm test`, `npm run test:run`, `npm run test:coverage`

### Rôles

| Rôle | Interface | Accès | Description |
|-------|-----------|-------|-------------|
| CITOYEN | Mobile | /dashboard | Utilisateur standard |
| AGENT | Mobile | /dashboard | Agent de collecte |
| GESTIONNAIRE | Desktop | /desktop | Superviseur |
| ADMIN | Desktop | /desktop | Administrateur |

## [1.4.0] - 2026-02-18

### RBAC - Roles et Permissions

**Permissions Matrix:**
- Mise a jour de la matrice des permissions selon spec:
  - CITOYEN: `signaler:create`, `signaler:read`
  - AGENT: `signaler:create`, `signaler:read`, `signaler:update`, `tournee:read`, `tournee:update`, `containers:update`
  - GESTIONNAIRE: Toutes les permissions AGENT + `tournee:create`, `zone:create`, `zone:read`, `zone:update`
  - ADMIN: `*` (toutes permissions)

**Interface Guard:**
- Ajout du middleware `interface-guard.js` pour proteger les routes mobile/desktop
- Separation des interfaces: Mobile (CITOYEN, AGENT) vs Desktop (GESTIONNAIRE, ADMIN)
- Nouvelles fonctions: `requireInterface()`, `requireDesktop()`, `requireMobile()`

**Permissions Service:**
- Refactoring vers pattern Repository: `permissionsRepository.js`
- Service CRUD: `permissionsService.js`
- API Admin: `admin-permissions.js`

**Base de donnees:**
- Migration `010_create_permissions_config` - Table de configuration des permissions
- Seed `014_permissions_default` - Permissions par defaut

**Guide:**
- Documentation `AUTH_PERMISSIONS_GUIDE.md` avec exemples d'utilisation

---

## [1.3.2] - 2026-02-13

### Logging

- Standardise le logging avec `pino` + `pino-pretty` et `morgan` dans les services.
- Remplace les `console.*` par le logger (API Gateway, users, containers, gamifications, scripts DB, healthchecks).
- Ajoute des loggers dedies par service avec format uniforme.

### Documentation

- Nettoie les emojis/icone dans la documentation et les commentaires.
- Met a jour README racine et [services/README.md](services/README.md).
- Supprime l'audit d'endpoints obsolete.

### Outils

- Ajoute un script `database/run-migrations.cjs` pour lancer les migrations manuellement.

## [1.3.1] - 2026-02-12

### Securite

**Fix Path Traversal - service-users**
- Correction vulnerabilite d'upload d'avatar (multer.js:22)
- Validation stricte des extensions de fichiers (.jpg, .jpeg, .png, .webp uniquement)
- Generation de noms de fichiers securises avec suffixe aleatoire
- Normalisation des extensions (.jpeg → .jpg)
- Prevention des attaques par traversée de répertoire

### API Gateway - Phase 3 : Sécurité et Monitoring (Complété)

**Sécurité centralisée :**
- Validation JWT sur toutes les routes protégées
- Rate limiting global configurable (100 req/min par défaut)
- Headers de sécurité Helmet (XSS, clickjacking, etc.)
- Middleware `jwtValidationMiddleware` avec vérification Bearer token
- Forward des headers `x-user-id` et `x-user-role` aux services

**Health checks avancés :**
- Endpoint `/health/detailed` avec vérification de tous les services
- Endpoint `/health/:service` pour vérifier un service spécifique
- Vérification périodique automatique (toutes les 30s)
- Mesure de la latence pour chaque service
- Détection des services down (3 échecs consécutifs)
- Status : healthy / degraded / unhealthy

**Logging centralisé :**
- Winston pour logs structurés JSON
- Morgan pour logs HTTP
- Logger de sécurité pour événements critiques
- Logs détaillés avec timing et user ID

**Nouvelles dépendances :**
- `jsonwebtoken` - Validation JWT
- `helmet` - Headers de sécurité
- `morgan` - Logging HTTP
- `winston` - Logging avancé
- `axios` - Health checks

### Documentation

**API Gateway**
- Documentation complete des phases de developpement
- Phase 1 : Structure de Base (Complété)
- Phase 2 : Gestion des Requêtes (En cours)
- Phase 3 : Sécurité et Monitoring (Complété)
- Roadmap avec versions 1.1.0 à 2.0.0
- Architecture et endpoints documentés

---

## [1.3.0] - 2026-02-12

### Ajoute
- Preparation pour l'integration frontend
- Migration 010 : Tables gamification_defi et gamification_participation_defi
- Mises a jour mineures et optimisations

### Mises a jour
- Seeds complets pour toutes les tables (maintenance, tournees, collectes, signalements, gamification, audit/alertes, refresh tokens)
- Alignement service-gamifications avec les migrations (verifie les tables au demarrage, schema auto optionnel)
- Healthcheck service-gamifications corrige (CommonJS)

---

## [1.2.0] - 2026-02-10

### Service Gamifications

#### Ajoute

**Service Gamifications (Port 3014)**
- Système de points avec attribution automatique
- Catalogue de badges avec seuils (Debutant: 100, Eco-Guerrier: 500, Super-Heros: 1000)
- Gestion des defis communautaires
- Classement des utilisateurs avec niveaux (Debutant, Eco-Warrior, Super-Heros, Legende Verte)
- Notifications de gamification
- Statistiques personnelles (jour/semaine/mois)
- Estimation impact CO2 (points * 0.02)
- Tests unitaires complets (services et controllers)
- Documentation des phases (PHASE1 a PHASE4)
- Integration API Gateway

**Endpoints**
- POST /actions - Enregistrer une action et attribuer des points
- GET /badges - Liste des badges disponibles
- GET /badges/utilisateurs/:idUtilisateur - Badges d'un utilisateur
- GET /defis - Liste des defis
- POST /defis - Creer un defi
- POST /defis/:idDefi/participations - Participer a un defi
- PATCH /defis/:idDefi/participations/:idUtilisateur - Mettre a jour progression
- GET /classement - Classement des utilisateurs
- GET /notifications - Liste des notifications
- POST /notifications - Creer une notification
- GET /utilisateurs/:idUtilisateur/stats - Statistiques utilisateur

**Base de donnees et Migrations**
- Migration 007 : Ajout tables historique_points et notification
- Migration 010 : Ajout tables gamification_defi et gamification_participation_defi
- Seeds des badges par defaut (DEBUTANT, ECO_GUERRIER, SUPER_HEROS)
- Scripts SQL dans services/service-gamifications/sql/gamification.sql
- Initialisation automatique pour tests unitaires

**Tables créees**
- gamification_defi (defis communautaires avec dates et objectifs)
- gamification_participation_defi (participations aux defis avec progression)
- historique_points (historique des gains de points - Migration 007)
- notification (notifications utilisateurs - Migration 007)

---

## [1.1.0] - 2026-02-05

### Service Containers & Integration

#### Ajoute

**Service Containers (Port 3004)**
- CRUD complet des conteneurs
- Géolocalisation des conteneurs (latitude/longitude)
- Gestion des niveaux de remplissage (vide, faible, moyen, eleve, plein)
- Historique des collectes
- Socket.IO pour temps reel
- Tests unitaires complets
- Docker support

**Integration**
- Integration service-containers dans API Gateway
- Integration service-gamifications dans API Gateway
- Configuration CI/CD amelioree (GitHub Actions)
- Renommage champ 'username' vers 'prenom' dans les modeles utilisateurs

**Documentation**
- README complet pour service-containers
- Documentation technique

**Base de donnees et Migrations**
- Migration 004 : Ajout tables conteneur, capteur et mesure
- Migration 005 : Ajout tables tournee et collecte
- Migration 006 : Ajout tables signalements
- Scripts SQL dans services/service-containers/sql/containers.sql

**Tables créees**
- conteneur (infos conteneurs avec geolocalisation)
- capteur (capteurs IoT associes aux conteneurs)
- mesure (donnees des capteurs - niveau de remplissage, batterie)
- tournee (planification des tournees de collecte)
- collecte (historique des collectes effectuees)

---

## [1.0.0] - 2026-01-13

### Version initiale - Services Users & API Gateway

#### Ajoute

**Service Users (Port 3010)**
- Authentification complète (JWT + Refresh Tokens)
- Inscription et connexion utilisateurs
- Système RBAC avec 4 roles (CITOYEN, AGENT, GESTIONNAIRE, ADMIN)
- Gestion des profils utilisateurs
- Notifications utilisateurs
- Upload et gestion d'avatars (Sharp + Multer)
- Sessions limitees (max 3 par utilisateur)
- Rate limiting (100 req/min global, 5 login/15min)
- Journal d'audit complet
- Swagger UI interactif
- Tests unitaires complets (93% de couverture)

**API Gateway (Port 3000)**
- Reverse proxy vers microservices
- Rate limiting global
- Health check unifie
- Agregation documentation Swagger
- CORS centralise
- Routage dynamique

**Technologies**
- Node.js 18+
- Express.js 5.2.1
- PostgreSQL 14+ (Neon Cloud)
- JWT + bcrypt
- Docker & Docker Compose
- Jest pour tests
- GitHub Actions CI/CD

**Securite**
- Hash bcrypt (10 rounds)
- JWT avec secret fort
- Protection SQL Injection
- Headers securises (Helmet)
- Validation des entrees (Zod)
- Audit logging

**Documentation**
- README complet
- Swagger pour tous les endpoints
- Guides de testing
- Documentation des phases de developpement
- Runbooks operationnels

**Base de donnees et Migrations**
- Migration 001 : Schema initial (tables de base, role, type_signalement)
- Migration 002 : Ajout zones et vehicules
- Migration 003 : Ajout table utilisateur complete avec user_role et user_badge
- Migration 008 : Ajout tables d'audit et alertes
- Migration 009 : Ajout table refresh_tokens
- Script SQL initial dans sql/EcoTrack.sql

**Tables créees**
- UTILISATEUR (gestion des comptes utilisateurs)
- ROLE (catalogue des roles)
- user_role (association utilisateurs-roles)
- badge (catalogue des badges)
- user_badge (association utilisateurs-badges)
- REFRESH_TOKEN (gestion des sessions)
- JOURNAL_AUDIT (journal d'audit securite)

---

## [0.9.0] - 2026-01-12

### Phase 7 : Documentation & Swagger

#### Ajoute
- Documentation Swagger complète
- Schemas OpenAPI 3.0
- Interface interactive sur `/api-docs`
- Exemples de requêtes/reponses
- Authentification Bearer token dans Swagger

#### Documentation
- README ameliore avec exemples
- SWAGGER_SETUP.md
- Gestion Avatars.md

---

## [0.8.0] - 2026-01-11

### Phase 6 : Gestion d'avatars

#### Ajoute
- Upload d'images (max 5 MB)
- Traitement avec Sharp (3 tailles: original, thumbnail, mini)
- Stockage dans `storage/avatars/`
- Endpoint `POST /users/avatar/upload`
- Endpoint `GET /users/avatar/:userId`
- Endpoint `DELETE /users/avatar`
- Suppression avec nettoyage des fichiers

#### Tests
- avatarController.test.js
- avatarService.test.js

---

## [0.7.0] - 2026-01-10

### Phase 5 : Notifications

#### Ajoute
- Système de notifications
- Endpoint `GET /notifications`
- Endpoint `GET /notifications/unread-count`
- Endpoint `PUT /notifications/:id/read`
- Endpoint `DELETE /notifications/:id`
- Table `NOTIFICATION` en DB

#### Tests
- notificationController.test.js
- notificationService.test.js

---

## [0.6.0] - 2026-01-09

### Phase 4 : Securite avancee

#### Ajoute
- Refresh tokens (stockes en DB)
- Sessions limitees (max 3 par utilisateur)
- Rate limiting differencie:
  - Global: 100 req/min
  - Login: 5 tentatives/15 min
  - Password reset: 3 tentatives/heure
- Journal d'audit (table JOURNAL_AUDIT)
- Logging des tentatives de connexion
- Endpoint `POST /auth/refresh`
- Endpoint `POST /auth/logout`
- Endpoint `POST /auth/logout-all`

#### Tests
- rateLimit.test.js
- sessionController.test.js
- auditService.test.js

#### Documentation
- PHASE4_NOTES.md

---

## [0.5.0] - 2026-01-08

### Phase 3 : RBAC (Roles & Permissions)

#### Ajoute
- Système RBAC complet
- 4 roles: CITOYEN, AGENT, GESTIONNAIRE, ADMIN
- Matrice de permissions granulaires
- Middleware `requirePermission(permission)`
- Middleware `requirePermissions([permissions])`
- Fonction `hasPermission(role, permission)`
- Wildcard ADMIN (`*`)
- Endpoints admin:
  - `GET /admin/roles/users/:id`
  - `POST /admin/roles/users/:id`
  - `DELETE /admin/roles/users/:id/:roleId`

#### Base de donnees
- Table `ROLE`
- Table `UTILISATEUR_ROLE`
- Table `PERMISSION`

#### Tests
- permissions.test.js (middleware)
- roleService.test.js
- permissions.test.js (utils)

#### Documentation
- PHASE3_NOTES.md

---

## [0.4.0] - 2026-01-07

### Phase 2 : Profil utilisateur

#### Ajoute
- Mise a jour du profil (`PUT /users/profile`)
- Changement de mot de passe (`POST /users/change-password`)
- Profil avec statistiques (`GET /profile-with-stats`)
- Middleware de gestion d'erreurs global
- Support des erreurs asynchrones

#### Tests
- authService.test.js
- userService.test.js
- authController.test.js
- errorHandler.test.js

#### Documentation
- PHASE2_NOTES.md

---

## [0.3.0] - 2026-01-06

### Phase 1 : Authentification de base

#### Ajoute
- Inscription utilisateur (`POST /auth/register`)
- Connexion (`POST /auth/login`)
- Recuperation profil (`GET /auth/profile`)
- Generation JWT (access token)
- Hash des mots de passe (bcryptjs)
- Middleware d'authentification `authenticateToken`
- Middleware d'autorisation `authorizeRole`

#### Base de donnees
- Table `UTILISATEUR`
- Champs: id, email, username, password_hash, role, date_creation

#### Tests
- crypto.test.js
- jwt.test.js
- auth.test.js (middleware)

#### Documentation
- PHASE1_NOTES.md

---

## [0.2.0] - 2026-01-05

### API Gateway initial

#### Ajoute
- Structure de base API Gateway
- Reverse proxy vers service-users
- Rate limiting global
- Health check endpoint
- Configuration des services
- Support CORS

#### Fichiers
- `services/api-gateway/src/index.js`
- `services/api-gateway/package.json`
- `services/api-gateway/README.md`

---

## [0.1.0] - 2026-01-04

### Configuration initiale du projet

#### Ajoute
- Structure de base du projet
- Configuration Git
- Configuration Docker
- Fichier `docker-compose.yml`
- `.gitignore`
- README.md principal
- Schema de base de donnees PostgreSQL

#### Base de donnees
- Script SQL initial (`sql/EcoTrack.sql`)
- Configuration PostgreSQL sur Neon Cloud
- Pool de connexions

#### Structure
```
ecotrack-sjma/
├── services/
│   ├── service-users/
│   └── api-gateway/
├── docs/
├── context/
└── docker-compose.yml
```

---

## Gestion des Migrations Base de Donnees

### Versionnement des Migrations

Le projet utilise un systeme de migrations sequentielles pour la base de donnees PostgreSQL.

**Numérotation des migrations existantes :**
- Migration 001 : Schema initial (role, badge, type_conteneur, type_signalement, maintenance)
- Migration 002 : Ajout zones et vehicules
- Migration 003 : Ajout utilisateur, user_role, user_badge
- Migration 004 : Service Containers (conteneur, capteur, mesure)
- Migration 005 : Ajout tournee et collecte
- Migration 006 : Ajout signalements
- Migration 007 : Service Gamifications (historique_points, notification)
- Migration 008 : Ajout audit et alertes
- Migration 009 : Ajout refresh_tokens
- Migration 010 : Service Gamifications (gamification_defi, gamification_participation_defi)

**Fichiers de migration :**
- `database/migrations/001_create_base_tables.cjs`
- `database/migrations/002_create_zones_vehicules.cjs`
- `database/migrations/003_create_utilisateur.cjs`
- `database/migrations/004_create_conteneurs.cjs`
- `database/migrations/005_create_tournees_collectes.cjs`
- `database/migrations/006_create_signalements.cjs`
- `database/migrations/007_create_gamification.cjs`
- `database/migrations/008_create_audit_alertes.cjs`
- `database/migrations/009_create_refresh_tokens.cjs`
- `database/migrations/010_create_gamification_defis.cjs`

**Commandes disponibles :**
```bash
# Executer toutes les migrations
npm run db:migrate

# Rollback derniere migration
npm run db:migrate:undo

# Reset complet (attention: perte de donnees)
npm run db:reset

# Seed donnees de test
npm run db:seed
```

**Schema version tracking :**
La table `pgmigrations` garde la trace des migrations executees :
- `id` : Numero de la migration
- `name` : Nom du fichier de migration
- `run_on` : Date d'execution

---


**Format de date** : AAAA-MM-JJ (ISO 8601)
**Derniere mise a jour** : 2026-02-27
**Maintenu par** : Equipe EcoTrack
