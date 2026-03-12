# Service IoT - Documentation

> Microservice de réception, traitement et supervision des données capteurs IoT pour EcoTrack.

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Protocole MQTT](#protocole-mqtt)
5. [API REST](#api-rest)
6. [Alertes automatiques](#alertes-automatiques)
7. [Base de données](#base-de-données)
8. [Métriques Prometheus](#métriques-prometheus)
9. [Tests](#tests)
10. [Docker](#docker)
11. [Simulation de capteurs](#simulation-de-capteurs)
12. [Sécurité](#sécurité)
13. [Dépannage](#dépannage)

---

## Vue d'ensemble

Le **service-iot** est le microservice n°6 du projet EcoTrack. Il gère la communication avec les **2000 capteurs** embarqués dans les conteneurs de collecte des déchets.

### Responsabilités

| Fonction | Description |
|----------|-------------|
| **Réception MQTT** | Broker MQTT embarqué (Aedes) recevant les données capteurs en temps réel |
| **Validation** | Vérification des plages de données (0-100%, détection d'outliers) |
| **Stockage** | Enregistrement des mesures en base PostgreSQL (table `mesure`) |
| **Alertes** | Création automatique d'alertes selon les seuils configurés |
| **API REST** | Exposition des mesures, capteurs et alertes via endpoints HTTP |
| **Monitoring** | Métriques Prometheus pour Grafana |

### Informations techniques

| Propriété | Valeur |
|-----------|--------|
| **Port HTTP** | 3013 |
| **Port MQTT** | 1883 |
| **Runtime** | Node.js 20 (Alpine) |
| **Framework** | Express 5.2 |
| **MQTT Broker** | Aedes (embarqué) |
| **Base de données** | PostgreSQL 16 + PostGIS |
| **Swagger** | http://localhost:3013/api-docs |

---

## Architecture

### Structure des fichiers

```
services/service-iot/
├── index.js                          # Point d'entrée (Express + MQTT)
├── package.json
├── Dockerfile / Dockerfile.dev
├── healthcheck.cjs
├── .env.example
└── src/
    ├── config/
    │   └── config.js                 # Configuration centralisée
    ├── container-di.js               # Injection de dépendances
    ├── db/
    │   └── connexion.js              # Pool de connexions PostgreSQL
    ├── mqtt/
    │   ├── mqtt-broker.js            # Broker Aedes (TCP)
    │   └── mqtt-handler.js           # Parsing, validation, dispatch
    ├── repositories/
    │   ├── measurement-repository.js # CRUD table mesure
    │   ├── sensor-repository.js      # CRUD table capteur
    │   └── alert-repository.js       # CRUD table alerte_capteur
    ├── services/
    │   ├── measurement-service.js    # Logique métier mesures
    │   ├── sensor-service.js         # Logique métier capteurs
    │   └── alert-service.js          # Logique métier alertes
    ├── controllers/
    │   └── iot-controller.js         # Handlers HTTP (10 endpoints)
    ├── routes/
    │   └── iot.route.js              # Routes Express + Swagger docs
    ├── validators/
    │   └── iot.validator.js          # Schémas Joi
    ├── middleware/
    │   ├── error-handler.js          # Gestion centralisée des erreurs
    │   └── request-logger.js         # Logging des requêtes HTTP
    └── utils/
        ├── logger.js                 # Pino logger
        ├── api-response.js           # Réponses standardisées
        └── api-error.js              # Erreurs métier
```

### Pattern d'architecture

Le service suit le pattern **Controller → Service → Repository → Pool**, identique à `service-containers` :

```
Capteur IoT
    │
    ▼ MQTT (topic: containers/{uid}/data)
┌────────────────┐
│  MQTT Broker   │   ← Aedes (TCP port 1883)
│  (mqtt-broker) │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  MQTT Handler  │   ← Parse topic, valide JSON, dispatch
│ (mqtt-handler) │
└───────┬────────┘
        │
        ▼
┌────────────────┐     ┌────────────────┐
│  Measurement   │────▶│  Alert Service │   ← Vérifie seuils
│    Service     │     │                │
└───────┬────────┘     └───────┬────────┘
        │                      │
        ▼                      ▼
┌────────────────┐     ┌────────────────┐
│  Measurement   │     │    Alert       │
│  Repository    │     │  Repository    │
└───────┬────────┘     └───────┬────────┘
        │                      │
        ▼                      ▼
   ┌──────────────────────────────┐
   │   PostgreSQL (pool pg)       │
   │   Tables: mesure, capteur,   │
   │   alerte_capteur, conteneur  │
   └──────────────────────────────┘
```

### Injection de dépendances

Le fichier `container-di.js` câble toutes les dépendances :

```
pool → repositories (measurement, sensor, alert)
     → services (measurement, sensor, alert)
     → mqttHandler (measurement, alert services)
     → mqttBroker (mqttHandler)
     → controller (all services, mqttHandler)
```

---

## Configuration

Toutes les options sont configurables via variables d'environnement.

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `APP_PORT` | `3013` | Port du serveur HTTP |
| `NODE_ENV` | `development` | Environnement |
| `PGHOST` | `localhost` | Hôte PostgreSQL |
| `PGPORT` | `5432` | Port PostgreSQL |
| `PGUSER` | `postgres` | Utilisateur PostgreSQL |
| `PGPASSWORD` | *(vide)* | Mot de passe PostgreSQL |
| `PGDATABASE` | `ecotrack` | Nom de la base |
| `MQTT_PORT` | `1883` | Port du broker MQTT |
| `MQTT_HOST` | `0.0.0.0` | Adresse d'écoute MQTT |
| `ALERT_FILL_LEVEL_CRITICAL` | `90` | Seuil alerte remplissage (%) |
| `ALERT_FILL_LEVEL_WARNING` | `75` | Seuil avertissement remplissage (%) |
| `ALERT_BATTERY_LOW` | `20` | Seuil batterie faible (%) |
| `ALERT_TEMPERATURE_MIN` | `-10` | Température minimale (°C) |
| `ALERT_TEMPERATURE_MAX` | `60` | Température maximale (°C) |
| `ALERT_SENSOR_TIMEOUT_HOURS` | `24` | Timeout capteur silencieux (h) |

### Pool de connexions PostgreSQL

| Paramètre | Valeur |
|-----------|--------|
| Max connexions | 20 |
| Idle timeout | 30 000 ms |
| Connection timeout | 2 000 ms |

---

## Protocole MQTT

### Broker embarqué

Le service intègre un broker MQTT **Aedes** qui écoute sur le port TCP **1883**. Aucun broker externe (Mosquitto, etc.) n'est nécessaire.

### Topics

| Topic | Direction | Description |
|-------|-----------|-------------|
| `containers/{uid_capteur}/data` | Capteur → Broker | Données de mesure |
| `containers/{uid_capteur}/status` | Capteur → Broker | Statut du capteur *(réservé)* |

### Format du payload

Les capteurs publient un message JSON sur le topic `containers/{uid_capteur}/data` :

```json
{
  "fill_level": 75.5,
  "battery": 92.0,
  "temperature": 22.3
}
```

| Champ | Type | Obligatoire | Plage | Description |
|-------|------|:-----------:|-------|-------------|
| `fill_level` | number | ✅ | 0 – 100 | Niveau de remplissage (%) |
| `battery` | number | ✅ | 0 – 100 | Niveau de batterie (%) |
| `temperature` | number | ❌ | -50 – 100 | Température (°C) |

### Validation

Le handler MQTT effectue les vérifications suivantes :

1. **Format du topic** : doit correspondre à `containers/{uid}/data`
2. **JSON valide** : le payload doit être du JSON parsable
3. **Champs requis** : `fill_level` et `battery` sont obligatoires
4. **Plages de valeurs** :
   - `fill_level` : nombre entre 0 et 100
   - `battery` : nombre entre 0 et 100
   - `temperature` : nombre entre -50 et 100 (si présent)

Les messages invalides sont loggés et ignorés (aucune erreur propagée au capteur).

### Connexion d'un capteur

Exemple avec un client MQTT (Node.js) :

```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  // Publier les données du capteur CAP-001
  client.publish('containers/CAP-001/data', JSON.stringify({
    fill_level: 75.5,
    battery: 92.0,
    temperature: 22.3
  }));
});
```

Exemple avec `mosquitto_pub` (CLI) :

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "containers/CAP-001/data" \
  -m '{"fill_level": 85.0, "battery": 45.0, "temperature": 18.5}'
```

---

## API REST

Base URL : `http://localhost:3013/api`
Documentation Swagger : `http://localhost:3013/api-docs`

### Endpoints

#### Mesures

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/iot/measurements` | Liste des mesures (paginée, filtrable) |
| `GET` | `/iot/measurements/latest` | Dernière mesure par conteneur |
| `GET` | `/iot/measurements/container/:id` | Mesures d'un conteneur spécifique |

#### Capteurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/iot/sensors` | Liste des capteurs (paginée) |
| `GET` | `/iot/sensors/:id` | Détails d'un capteur |

#### Alertes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/iot/alerts` | Liste des alertes (paginée, filtrable) |
| `PATCH` | `/iot/alerts/:id` | Mettre à jour le statut d'une alerte |

#### Administration

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/iot/simulate` | Simuler l'envoi de données capteur |
| `POST` | `/iot/check-silent` | Vérifier les capteurs silencieux |
| `GET` | `/iot/stats` | Statistiques globales du service |

#### Système

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/health` | Vérification de santé du service |
| `GET` | `/metrics` | Métriques Prometheus |
| `GET` | `/api-docs` | Documentation Swagger |

---

### Détail des endpoints

#### `GET /iot/measurements`

Liste les mesures avec pagination et filtres optionnels.

**Paramètres query :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 50 | Nombre par page (max 1000) |
| `id_conteneur` | integer | — | Filtrer par conteneur |
| `id_capteur` | integer | — | Filtrer par capteur |
| `date_debut` | datetime | — | Date de début (ISO 8601) |
| `date_fin` | datetime | — | Date de fin (ISO 8601) |

**Exemple de réponse :**

```json
{
  "success": true,
  "data": [
    {
      "id_mesure": 1,
      "id_capteur": 3,
      "id_conteneur": 10,
      "niveau_remplissage_pct": 75.5,
      "batterie_pct": 92.0,
      "temperature": 22.3,
      "date_mesure": "2026-03-09T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

---

#### `GET /iot/measurements/latest`

Retourne la dernière mesure de chaque conteneur (utile pour les tableaux de bord).

---

#### `GET /iot/measurements/container/:id`

Retourne les mesures d'un conteneur spécifique (100 dernières par défaut).

**Paramètres :**

| Paramètre | In | Type | Description |
|-----------|-----|------|-------------|
| `id` | path | integer | ID du conteneur (obligatoire) |
| `limit` | query | integer | Nombre de résultats (défaut: 100) |

---

#### `GET /iot/sensors`

Liste tous les capteurs avec leur dernière mesure. Pagination via `page` et `limit`.

---

#### `GET /iot/sensors/:id`

Retourne les détails d'un capteur (modèle, type, statut, conteneur associé).

---

#### `GET /iot/alerts`

Liste les alertes avec filtres.

**Paramètres query :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | integer | Numéro de page |
| `limit` | integer | Nombre par page |
| `statut` | string | `ACTIVE`, `RESOLUE` ou `IGNOREE` |
| `type_alerte` | string | `DEBORDEMENT`, `BATTERIE_FAIBLE` ou `CAPTEUR_DEFAILLANT` |
| `id_conteneur` | integer | Filtrer par conteneur |

---

#### `PATCH /iot/alerts/:id`

Met à jour le statut d'une alerte (résoudre ou ignorer).

**Corps de la requête :**

```json
{
  "statut": "RESOLUE"
}
```

Valeurs possibles : `RESOLUE`, `IGNOREE`.

**Réponses :**

| Code | Description |
|------|-------------|
| 200 | Alerte mise à jour |
| 400 | Alerte déjà traitée |
| 404 | Alerte non trouvée |

---

#### `POST /iot/simulate`

Simule l'envoi de données capteur via l'API REST (pour les tests sans client MQTT).

**Corps de la requête :**

```json
{
  "uid_capteur": "CAP-001",
  "fill_level": 85.5,
  "battery": 92.0,
  "temperature": 22.3
}
```

---

#### `POST /iot/check-silent`

Déclenche manuellement la vérification des capteurs silencieux (normalement exécutée automatiquement toutes les heures).

---

#### `GET /iot/stats`

Retourne les statistiques globales :

```json
{
  "success": true,
  "data": {
    "measurements": {
      "avg_fill_level": 62.3,
      "max_fill_level": 98.0,
      "min_fill_level": 5.0,
      "avg_battery": 75.4,
      "critical_count": 12,
      "total_24h": 4800
    },
    "alerts": {
      "total": 45,
      "active": 8,
      "resolved": 30,
      "ignored": 7,
      "by_type": {
        "DEBORDEMENT": 20,
        "BATTERIE_FAIBLE": 15,
        "CAPTEUR_DEFAILLANT": 10
      }
    },
    "mqtt": {
      "processedMessages": 15420,
      "errors": 3
    }
  }
}
```

---

## Alertes automatiques

### Types d'alertes

Le service crée automatiquement des alertes dans la table `alerte_capteur` selon 3 scénarios :

| Type | Condition | Seuil par défaut | Description |
|------|-----------|:-----------------:|-------------|
| `DEBORDEMENT` | `fill_level >= seuil` | **90%** | Le conteneur est presque plein, collecte urgente nécessaire |
| `BATTERIE_FAIBLE` | `battery <= seuil` | **20%** | La batterie du capteur est faible, remplacement à prévoir |
| `CAPTEUR_DEFAILLANT` | Température hors plage OU silence > 24h | **-10°C / 60°C / 24h** | Capteur en panne ou défaillant |

### Flux d'alertes

```
Mesure reçue
    │
    ├── fill_level >= 90% ?  ──▶  Créer alerte DEBORDEMENT
    │
    ├── battery <= 20% ?     ──▶  Créer alerte BATTERIE_FAIBLE
    │
    └── temperature hors      ──▶  Créer alerte CAPTEUR_DEFAILLANT
        [-10°C, 60°C] ?

Vérification périodique (toutes les heures) :
    │
    └── Pas de données        ──▶  Créer alerte CAPTEUR_DEFAILLANT
        depuis 24h ?
```

### Déduplication

Le service **ne crée pas de doublon** : avant chaque création, il vérifie s'il existe déjà une alerte `ACTIVE` pour le même conteneur et le même type. Si oui, l'alerte existante est conservée.

### Cycle de vie d'une alerte

```
ACTIVE ──▶ RESOLUE   (problème corrigé)
       ──▶ IGNOREE   (faux positif ou non prioritaire)
```

Les alertes résolues ou ignorées ne bloquent plus la création de nouvelles alertes du même type.

### Vérification des capteurs silencieux

Un `setInterval` exécute automatiquement `checkSilentSensors()` **toutes les heures**. Cette vérification :

1. Recherche les capteurs dont la dernière communication dépasse `ALERT_SENSOR_TIMEOUT_HOURS` (défaut : 24h)
2. Filtre uniquement les conteneurs avec statut `ACTIF`
3. Crée une alerte `CAPTEUR_DEFAILLANT` pour chaque capteur silencieux détecté

---

## Base de données

### Tables utilisées

Le service interagit avec 4 tables principales :

#### Table `mesure`

Stocke les données brutes des capteurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id_mesure` | SERIAL PK | Identifiant unique |
| `id_capteur` | FK → capteur | Capteur source |
| `id_conteneur` | FK → conteneur | Conteneur associé |
| `niveau_remplissage_pct` | DECIMAL | Niveau de remplissage (%) |
| `batterie_pct` | DECIMAL | Niveau de batterie (%) |
| `temperature` | DECIMAL | Température (°C, nullable) |
| `date_mesure` | TIMESTAMP | Date/heure de la mesure |

#### Table `capteur`

Référentiel des capteurs installés.

| Colonne | Type | Description |
|---------|------|-------------|
| `id_capteur` | SERIAL PK | Identifiant unique |
| `uid_capteur` | VARCHAR UNIQUE | Identifiant physique (ex: CAP-001) |
| `id_conteneur` | FK → conteneur | Conteneur associé |
| `modele` | VARCHAR | Modèle du capteur |
| `type_mesure` | VARCHAR | Type de mesure |
| `statut` | ENUM | actif / defaillant |
| `derniere_communication` | TIMESTAMP | Dernière communication |

#### Table `alerte_capteur`

Alertes générées automatiquement.

| Colonne | Type | Description |
|---------|------|-------------|
| `id_alerte` | SERIAL PK | Identifiant unique |
| `type_alerte` | VARCHAR | DEBORDEMENT / BATTERIE_FAIBLE / CAPTEUR_DEFAILLANT |
| `valeur_detectee` | DECIMAL | Valeur ayant déclenché l'alerte |
| `seuil` | DECIMAL | Seuil configuré |
| `description` | TEXT | Message descriptif |
| `statut` | VARCHAR | ACTIVE / RESOLUE / IGNOREE |
| `id_conteneur` | FK → conteneur | Conteneur concerné |
| `date_creation` | TIMESTAMP | Date de création |
| `date_traitement` | TIMESTAMP | Date de résolution/ignorance |

#### Table `conteneur`

Le service lit le référentiel conteneurs pour résoudre les `uid_capteur`.

---

## Métriques Prometheus

Le service expose des métriques sur `GET /metrics` :

| Métrique | Type | Labels | Description |
|----------|------|--------|-------------|
| `http_requests_total` | Counter | method, route, status | Requêtes HTTP totales |
| `http_request_duration_seconds` | Histogram | method, route | Latence des requêtes |
| `mqtt_messages_total` | Counter | status (success/error) | Messages MQTT traités |
| `alerts_created_total` | Counter | type | Alertes créées par type |
| `process_*` | (défaut) | — | Métriques Node.js (CPU, mémoire) |

### Requêtes PromQL utiles

```promql
# Messages MQTT par seconde
rate(mqtt_messages_total[5m])

# Taux d'erreur MQTT
rate(mqtt_messages_total{status="error"}[5m]) / rate(mqtt_messages_total[5m])

# Alertes créées dans la dernière heure
increase(alerts_created_total[1h])

# Alertes de débordement
alerts_created_total{type="DEBORDEMENT"}

# Latence P95 des endpoints IoT
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="service-iot"}[5m]))
```

---

## Tests

### Lancer les tests

```bash
cd services/service-iot

# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Avec couverture
npx jest --coverage
```

### Suites de tests

| Fichier | Tests | Description |
|---------|:-----:|-------------|
| `mqtt-handler.test.js` | ~10 | Parsing topics, validation payload, dispatch |
| `alert-service.test.js` | ~10 | Seuils, déduplication, capteurs silencieux |
| `measurement-service.test.js` | ~8 | Traitement mesures, requêtes paginées |
| `iot-controller.test.js` | ~8 | Endpoints HTTP, réponses, erreurs |
| **Total** | **42** | **Tous passent ✅** |

### Structure des tests

```
services/service-iot/
└── test/
    └── unit/
        ├── mqtt-handler.test.js
        ├── alert-service.test.js
        ├── measurement-service.test.js
        └── iot-controller.test.js
```

---

## Docker

### Docker Compose

Le service est intégré dans `docker-compose.yml` :

```yaml
service-iot:
  build:
    context: ./services/service-iot
  ports:
    - "3013:3013"       # HTTP
    - "1883:1883"       # MQTT
  environment:
    - PGHOST=postgres
    - PGPORT=5432
    - PGUSER=postgres
    - PGPASSWORD=postgres
    - PGDATABASE=ecotrack
    - MQTT_PORT=1883
    - ALERT_FILL_LEVEL_CRITICAL=90
    - ALERT_BATTERY_LOW=20
    - ALERT_TEMPERATURE_MIN=-10
    - ALERT_TEMPERATURE_MAX=60
    - ALERT_SENSOR_TIMEOUT_HOURS=24
  depends_on:
    postgres:
      condition: service_healthy
    migrations:
      condition: service_completed_successfully
```

### Commandes Docker

```bash
# Démarrer le service (avec tout le stack)
docker compose up service-iot

# Démarrer en mode développement (hot-reload)
docker compose -f docker-compose.yml -f docker-compose.override.yml up service-iot

# Rebuild après modification du Dockerfile
docker compose build service-iot

# Voir les logs
docker compose logs -f service-iot

# Healthcheck
curl http://localhost:3013/health
```

### Mode développement

Le `docker-compose.override.yml` utilise `Dockerfile.dev` avec :
- **nodemon** pour le hot-reload
- Volumes montés (`./src`, `./package.json`)
- Les deux ports exposés (3013 HTTP, 1883 MQTT)

---

## Simulation de capteurs

Un script de simulation permet de publier des mesures réalistes via MQTT, qui sont ensuite réceptionnées, traitées et insérées en base automatiquement par le service.

### Prérequis

- Le service-iot doit tourner (Docker ou local) pour que le broker MQTT écoute sur le port 1883
- Les capteurs doivent exister en base (seed `007_conteneurs_demo.sql` appliqué)

### Lancer la simulation

```bash
cd services/service-iot

# Mode normal (5 capteurs, 10 cycles, intervalle 5s)
node scripts/simulate-sensors.js

# Scénario critique → déclenche des alertes DEBORDEMENT (fill >= 90%)
node scripts/simulate-sensors.js --scenario critical

# Scénario batterie faible → déclenche des alertes BATTERIE_FAIBLE (battery <= 20%)
node scripts/simulate-sensors.js --scenario low-battery

# Scénario mixte (mélange normal + critical + low-battery)
node scripts/simulate-sensors.js --scenario mixed --sensors-count 8 --count 20

# Capteurs spécifiques, 5 cycles, intervalle 2s
node scripts/simulate-sensors.js --sensors CAP-0001,CAP-0003 --count 5 --interval 2000

# Mode continu (Ctrl+C pour arrêter)
node scripts/simulate-sensors.js --count 0 --interval 10000
```

### Options CLI

| Option | Défaut | Description |
|--------|--------|-------------|
| `--broker <url>` | `mqtt://localhost:1883` | URL du broker MQTT |
| `--interval <ms>` | `5000` | Intervalle entre les cycles (ms) |
| `--count <n>` | `10` | Nombre de cycles (0 = infini) |
| `--sensors-count <n>` | `5` | Nombre de capteurs à simuler |
| `--sensors <list>` | — | Liste spécifique (ex: `CAP-0001,CAP-0003`) |
| `--scenario <name>` | `normal` | `normal`, `critical`, `low-battery`, `mixed` |
| `--quiet` | — | Mode silencieux |

### Scénarios

| Scénario | Remplissage | Batterie | Effet |
|----------|-------------|----------|-------|
| `normal` | Augmente de 5-35% lentement | Diminue lentement depuis 70-95% | Aucune alerte |
| `critical` | Démarre à 80-90%, monte vite | Normal | Alerte **DEBORDEMENT** après quelques cycles |
| `low-battery` | Normal | Démarre à 15-30%, descend vite | Alerte **BATTERIE_FAIBLE** après quelques cycles |
| `mixed` | Mélange par capteur | Mélange par capteur | Les deux types d'alertes |

### Flux des données

```
simulate-sensors.js publie sur MQTT
  → mqtt-broker.js reçoit le message
    → mqtt-handler.js parse et valide
      → mesure INSERT dans table mesure
      → capteur UPDATE derniere_communication
      → alert-service vérifie les seuils
        → alerte_capteur INSERT si seuil dépassé
```

### Vérifier les résultats

Via l'API REST :
```bash
# Dernières mesures
curl http://localhost:3013/iot/measurements?limit=10

# Alertes actives
curl http://localhost:3013/iot/alerts?statut=ACTIVE

# Statistiques globales
curl http://localhost:3013/iot/stats
```

---

## Dépannage

### Le service ne démarre pas

1. **Vérifier que PostgreSQL est accessible** :
   ```bash
   docker compose ps postgres
   ```
2. **Vérifier les migrations** :
   ```bash
   docker compose logs migrations
   ```
3. **Vérifier les logs du service** :
   ```bash
   docker compose logs service-iot
   ```

### Les capteurs ne se connectent pas en MQTT

1. **Vérifier que le port 1883 est exposé** :
   ```bash
   docker compose port service-iot 1883
   ```
2. **Tester avec mosquitto_pub** :
   ```bash
   mosquitto_pub -h localhost -p 1883 -t "containers/CAP-001/data" \
     -m '{"fill_level": 50, "battery": 80}'
   ```
3. **Utiliser l'endpoint de simulation** :
   ```bash
   curl -X POST http://localhost:3013/iot/simulate \
     -H "Content-Type: application/json" \
     -d '{"uid_capteur":"CAP-001","fill_level":50,"battery":80}'
   ```

### Aucune alerte n'est créée

1. **Vérifier les seuils** : Les valeurs par défaut sont `fill_level >= 90%`, `battery <= 20%`, `temperature` hors `[-10°C, 60°C]`
2. **Vérifier la déduplication** : Une alerte `ACTIVE` existante pour le même conteneur/type empêche la création d'un doublon
3. **Vérifier que le capteur existe en base** : L'UID du capteur doit correspondre à un enregistrement dans la table `capteur`

### Les mesures ne sont pas stockées

1. **Vérifier que le capteur existe** : Le `uid_capteur` dans le topic MQTT doit correspondre à un capteur avec `statut = 'actif'` dans la base
2. **Regarder les logs** : Les messages invalides sont loggés avec le motif de rejet
3. **Vérifier les stats** :
   ```bash
   curl http://localhost:3013/iot/stats
   ```
   Le champ `mqtt.errors` indique le nombre de messages rejetés.

---

## Intégration avec les autres services

| Service | Interaction |
|---------|-------------|
| **API Gateway** (port 3000) | Proxy les requêtes `/iot/*` vers le service IoT |
| **Service Containers** (port 3011) | Partage les tables `conteneur` et `capteur` |
| **PostgreSQL** (port 5432) | Base de données partagée `ecotrack` |
| **Prometheus** (port 9090) | Scrape les métriques sur `/metrics` |
| **Grafana** (port 3001) | Visualisation des métriques IoT |

---

## Sécurité

### Middleware

| Middleware | Position | Description |
|-----------|----------|-------------|
| **Helmet** | 1er | Headers HTTP sécurisés (CSP désactivé pour Swagger) |
| **CORS** | 2e | Cross-Origin configuré |
| **express.json** | 3e | Parse le body JSON (limite 10 Mo) |
| **requestLogger** | 4e | Log des requêtes (Morgan/Pino) |
| **Prometheus metrics** | 5e | Compteurs HTTP avant les routes |

### Validation des entrées

| Cible | Validateur | Description |
|-------|-----------|-------------|
| `req.query` | `validateQuery(paginationSchema)` | Pagination, filtres (page, limit, dates, statut) |
| `req.body` | `validate(simulateSchema)` | Données de simulation (uid, fill_level, battery) |
| `req.body` | `validate(alertUpdateSchema)` | Mise à jour alerte (statut: RESOLUE/IGNOREE) |
| `req.params.id` | `validateParamId` | Entier positif obligatoire (rejette NaN, négatifs, strings) |

### Rate Limiting

Les routes d'administration sont protégées par `express-rate-limit` :

| Route | Limite | Fenêtre |
|-------|--------|---------|
| `POST /iot/simulate` | 10 requêtes | 1 minute |
| `POST /iot/check-silent` | 10 requêtes | 1 minute |

Réponse en cas de dépassement (HTTP 429) :
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Trop de requêtes, réessayez dans 1 minute"
}
```
