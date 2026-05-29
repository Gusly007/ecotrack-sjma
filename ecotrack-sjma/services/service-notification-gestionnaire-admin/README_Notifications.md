# service-notification-gestionnaire-admin

Microservice EcoTrack responsable de la **gestion des notifications** destinées aux gestionnaires de zones et aux administrateurs.

---

## Sommaire

- [Rôle](#rôle)
- [Architecture interne](#architecture-interne)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Démarrage](#démarrage)
- [API REST](#api-rest)
- [Matrice type / rôle](#matrice-type--rôle)
- [RBAC](#rbac)
- [Flux Kafka automatique](#flux-kafka-automatique)
- [Schéma de base de données](#schéma-de-base-de-données)
- [Structure des fichiers](#structure-des-fichiers)
- [Monitoring](#monitoring)

---

## Rôle

Ce service gère le cycle de vie complet des notifications pour les profils **GESTIONNAIRE** et **ADMIN** :

| Action | Déclencheur |
|--------|-------------|
| Création manuelle | ADMIN via `POST /api/V1/notifications` |
| Création en masse | ADMIN via `POST /api/V1/notifications/bulk` |
| Création automatique | Kafka — alerte zone saturée (`ecotrack.alerts`) |
| Création automatique | Kafka — nouveau signalement (`ecotrack.signalements.nouveau`) |
| Lecture / marquage lu | Propriétaire de la notification |
| Suppression | Propriétaire de la notification |

---

## Architecture interne

```
index.js
│
├── Middleware Express
│   ├── Helmet          → sécurité des headers HTTP
│   ├── CORS            → origines autorisées (env ALLOWED_ORIGINS)
│   ├── express.json    → parsing du body (limite 1 mb)
│   ├── RequestLogger   → Morgan en prod / console en test
│   └── Prometheus      → métriques par route
│
├── /api/V1/notifications  → notification.route.js
│   ├── auth.js         → vérification JWT Bearer
│   ├── rbac.js         → contrôle d'accès par rôle
│   ├── validation.js   → validation des payloads entrants
│   └── notification.controller.js
│          └── notification.service.js
│                 └── notification.repository.js  → PostgreSQL
│
├── kafkaConsumer.js    → écoute ecotrack.alerts + ecotrack.signalements.nouveau
│       └── zone.repository.js  → résolution conteneur → zone → responsables
│
├── /health             → statut DB
├── /metrics            → Prometheus
└── /api-docs           → Swagger UI
```

---

## Prérequis

| Dépendance | Version |
|-----------|---------|
| Node.js   | >= 18   |
| PostgreSQL | 14+    |
| Redis     | 6+      |
| Kafka     | 3+      |

Les services Docker EcoTrack doivent être démarrés (`docker compose up`).

---

## Installation

```bash
cd services/service-notification-gestionnaire-admin
cp .env.example .env
npm install
```

---

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `APP_PORT` | `3016` | Port HTTP du service |
| `NODE_ENV` | `development` | Environnement (`development` / `production` / `test`) |
| `PGHOST` | `localhost` | Hôte PostgreSQL |
| `PGPORT` | `5435` | Port PostgreSQL (5435 en local Docker, 5432 interne) |
| `PGUSER` | `ecotrack_user` | Utilisateur PostgreSQL |
| `PGPASSWORD` | `ecotrack_password` | Mot de passe PostgreSQL |
| `PGDATABASE` | `ecotrack` | Base de données |
| `REDIS_HOST` | `localhost` | Hôte Redis |
| `REDIS_PORT` | `6379` | Port Redis |
| `REDIS_PASSWORD` | _(vide)_ | Mot de passe Redis (optionnel) |
| `JWT_SECRET` | voir `.env.example` | Clé de signature JWT (doit correspondre à service-users) |
| `LOG_LEVEL` | `debug` | Niveau de log pino (`trace` / `debug` / `info` / `warn` / `error`) |
| `KAFKA_BROKERS` | `localhost:9092` | Adresse(s) du broker Kafka |
| `ALLOWED_ORIGINS` | _(vide)_ | Origines CORS autorisées en prod, séparées par des virgules |
| `KAFKAJS_NO_PARTITIONER_WARNING` | `1` | Silence l'avertissement KafkaJS v2 |

---

## Démarrage

```bash
# Développement (rechargement automatique)
npm run dev

# Production
npm start
```

Le service démarre sur `http://localhost:3016` et :
1. Teste la connexion PostgreSQL
2. Connecte Redis (cache — dégradé sans Redis)
3. Connecte le consumer Kafka (notifications automatiques — dégradé sans Kafka)

---

## API REST

> Toutes les routes nécessitent un header `Authorization: Bearer <token>`.

### Récapitulatif des endpoints

#### Notifications utilisateurs (`/api/V1/notifications`)

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| `GET` | `/api/V1/notifications/list` | Tous | Lister mes notifications (paginé, filtrable) |
| `GET` | `/api/V1/notifications/unread-count` | Tous | Compter les non-lues |
| `POST` | `/api/V1/notifications` | ADMIN | Créer une notification |
| `POST` | `/api/V1/notifications/bulk` | ADMIN | Créer en masse (transaction atomique) |
| `PATCH` | `/api/V1/notifications/read-all` | Tous | Marquer toutes comme lues |
| `PATCH` | `/api/V1/notifications/:id/read` | Propriétaire / ADMIN | Marquer une notification comme lue |
| `DELETE` | `/api/V1/notifications/:id` | Propriétaire / ADMIN | Supprimer une notification |

#### Notifications admin (`/api/V1/admin/notifications`)

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| `GET` | `/api/V1/admin/notifications` | ADMIN / GESTIONNAIRE | Lister les notifications admin (paginé, filtrable) |
| `GET` | `/api/V1/admin/notifications/stats` | ADMIN / GESTIONNAIRE | Statistiques (total, lues, non-lues) |
| `GET` | `/api/V1/admin/notifications/types` | ADMIN / GESTIONNAIRE | Types disponibles |
| `GET` | `/api/V1/admin/notifications/priorities` | ADMIN / GESTIONNAIRE | Niveaux de priorité |
| `POST` | `/api/V1/admin/notifications` | ADMIN | Créer une notification admin |
| `POST` | `/api/V1/admin/notifications/bulk` | ADMIN | Créer en masse |
| `PATCH` | `/api/V1/admin/notifications/read-all` | Propriétaire | Tout marquer lu |
| `PATCH` | `/api/V1/admin/notifications/:id/read` | Propriétaire | Marquer une notification lue |
| `DELETE` | `/api/V1/admin/notifications/:id` | Propriétaire | Supprimer |

---

### GET `/api/V1/notifications/list`

Liste les notifications de l'utilisateur authentifié.

**Query params :** `page`, `limit`, `est_lu` (boolean)

**Réponse** `200`
```json
{
  "data": [ { "id_notification": 1, "type": "ALERTE", "titre": "...", "est_lu": false, "date_creation": "..." } ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/V1/notifications/unread-count`

**Réponse** `200`
```json
{ "count": 3 }
```

---

### POST `/api/V1/notifications`

Crée une notification pour un utilisateur cible. Réservé aux **ADMIN**.

**Body**
```json
{
  "id_utilisateur": 2,
  "type": "ALERTE",
  "titre": "Zone saturée",
  "corps": "Le conteneur CNT-00044 dépasse 90 % de remplissage."
}
```

**Réponse** `201`
```json
{
  "id_notification": 12,
  "type": "ALERTE",
  "titre": "Zone saturée",
  "corps": "Le conteneur CNT-00044 dépasse 90 % de remplissage.",
  "est_lu": false,
  "date_creation": "2026-05-07T10:40:38.702Z",
  "id_utilisateur": 2
}
```

| Code | Cas |
|------|-----|
| `201` | Notification créée |
| `400` | Champ manquant ou type invalide |
| `401` | Token absent ou expiré |
| `403` | Rôle insuffisant (non ADMIN) |
| `404` | Utilisateur destinataire introuvable |
| `422` | Rôle du destinataire incompatible avec le type |

---

### POST `/api/V1/notifications/bulk`

Crée plusieurs notifications en une seule transaction atomique. Réservé aux **ADMIN**.

**Body**
```json
[
  { "id_utilisateur": 2, "type": "ALERTE", "titre": "Zone Nord saturée", "corps": "..." },
  { "id_utilisateur": 1, "type": "ALERTE", "titre": "Zone Nord saturée", "corps": "..." }
]
```

**Réponse** `201`
```json
{
  "count": 2,
  "data": [ { ... }, { ... } ]
}
```

---

### PATCH `/api/V1/notifications/read-all`

Marque **toutes** les notifications non lues de l'utilisateur authentifié comme lues.

**Réponse** `200`
```json
{ "updated": 5 }
```

---

### PATCH `/api/V1/notifications/:id/read`

Marque une notification spécifique comme lue. Seul le propriétaire peut effectuer cette action (sauf ADMIN pour les notifications `SYSTEME`).

**Réponse** `200` — objet notification mis à jour

| Code | Cas |
|------|-----|
| `200` | Notification mise à jour |
| `403` | Non propriétaire |
| `404` | Notification introuvable |

---

### DELETE `/api/V1/notifications/:id`

Supprime une notification. Seul le propriétaire peut supprimer (sauf ADMIN pour `SYSTEME`).

**Réponse** `204` — No Content

---

## Matrice type / rôle

La compatibilité entre le type de notification et le rôle du destinataire est vérifiée en base via une CTE.

| Type | GESTIONNAIRE | ADMIN | CITOYEN | AGENT |
|------|:---:|:---:|:---:|:---:|
| `ALERTE` | Oui | Oui | Non | Non |
| `TOURNEE` | Oui | Oui | Non | Non |
| `BADGE` | Non | Non | Oui | Oui |
| `SYSTEME` | Oui | Oui | Oui | Oui |

---

## RBAC

| Permission | GESTIONNAIRE | ADMIN |
|-----------|:---:|:---:|
| `notifications:create` — créer une notification | Non | Oui |
| `notifications:bulk` — créer en masse | Non | Oui |
| `notifications:own` — lire / marquer / supprimer ses notifs | Oui | Oui |

---

## Flux Kafka automatique

Le service consomme deux topics Kafka pour créer des notifications **sans intervention humaine**.

### Topic `ecotrack.alerts`

Produit par **service-iot** quand un capteur franchit un seuil critique (remplissage > 90 %, batterie faible, capteur défaillant).

**Format du message**
```json
{
  "timestamp": "2026-05-07T10:00:00.000Z",
  "alert": {
    "id_alerte": 42,
    "type_alerte": "DEBORDEMENT",
    "description": "Niveau de remplissage critique : 93%",
    "valeur_detectee": 93,
    "seuil": 90,
    "id_conteneur": 44
  }
}
```

### Topic `ecotrack.signalements.nouveau`

Produit par **service-routes** quand un citoyen dépose un nouveau signalement.

**Format du message**
```json
{
  "timestamp": "2026-05-07T10:00:00.000Z",
  "signalement": {
    "id_signalement": 7,
    "description": "Conteneur renversé, déchets éparpillés.",
    "id_conteneur": 44,
    "id_citoyen": 5,
    "id_type": 2,
    "statut": "OUVERT"
  }
}
```

### Résolution automatique

Pour chaque message reçu :

```
id_conteneur
    └─ JOIN conteneur → zone
            └─ zone.id_gestionnaire  →  notification ALERTE gestionnaire
            └─ zone.id_admin         →  notification ALERTE admin
```

Le consumer utilise le **group id** `notification-gestionnaire-group`.  
Si Kafka est indisponible au démarrage, le service HTTP continue de fonctionner normalement (dégradé).

---

## Schéma de base de données

Tables utilisées (lecture / écriture) :

| Table | Opérations |
|-------|-----------|
| `notification` | INSERT, UPDATE, DELETE, SELECT |
| `utilisateur` | SELECT (vérification rôle destinataire) |
| `zone` | SELECT (résolution gestionnaire / admin) |
| `conteneur` | SELECT (résolution zone depuis id_conteneur) |

**Table `notification`**
```
id_notification  SERIAL PRIMARY KEY
type             VARCHAR  -- ALERTE | TOURNEE | BADGE | SYSTEME
titre            VARCHAR
corps            TEXT
est_lu           BOOLEAN  DEFAULT false
date_creation    TIMESTAMP DEFAULT NOW()
id_utilisateur   INTEGER  FK → utilisateur
```

---

## Structure des fichiers

```
service-notification-gestionnaire-admin/
├── index.js                        ← Point d'entrée Express + Kafka
├── kafkaConsumer.js                ← Consumer KafkaJS (alertes + signalements)
├── .env.example                    ← Template des variables d'environnement
├── package.json
└── src/
    ├── controllers/
    │   └── notification.controller.js
    ├── db/
    │   └── connexion.js            ← Pool PostgreSQL
    ├── middleware/
    │   ├── auth.js                 ← Vérification JWT
    │   ├── cors.js                 ← Configuration CORS
    │   ├── error-handler.js        ← Gestion centralisée des erreurs
    │   ├── rbac.js                 ← Contrôle d'accès par rôle
    │   ├── request-logger.js       ← Logger HTTP (Morgan)
    │   └── validation.js           ← Validation des payloads
    ├── repositories/
    │   ├── notification.repository.js  ← CRUD notifications + vérif type/rôle
    │   └── zone.repository.js          ← Résolution conteneur → responsables
    ├── routes/
    │   └── notification.route.js   ← Définition des endpoints + Swagger
    ├── services/
    │   └── notification.service.js ← Logique métier + logging + cache
    └── utils/
        ├── api-error.js            ← Classe ApiError(statusCode, message)
        ├── api-response.js         ← Formatage standardisé des réponses
        └── logger.js               ← Instance pino (prod) / console (test)
```

---

## Monitoring

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Statut du service et de la connexion PostgreSQL |
| `GET /metrics` | Métriques Prometheus (requêtes, durées) |
| `GET /api-docs` | Documentation Swagger UI interactive |

**Health check**
```json
{
  "status": "OK",
  "timestamp": "2026-05-07T10:40:00.000Z",
  "uptime": 120.4,
  "environment": "development",
  "services": {
    "api": "healthy",
    "database": "healthy"
  }
}
```
