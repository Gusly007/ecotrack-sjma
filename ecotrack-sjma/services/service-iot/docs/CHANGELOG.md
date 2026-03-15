# Changelog - Service IoT

> Historique des versions du microservice IoT EcoTrack

---

### [3.1.0] 2026-03-15 - TLS, Auth & Notifications

#### MQTT Avancé
- **Nouveau**: Support TLS pour broker MQTT
  - Variables: `MQTT_TLS_ENABLED`, `MQTT_TLS_KEY_PATH`, `MQTT_TLS_CERT_PATH`
  - Mode production sécurisé
- **Nouveau**: Authentification MQTT
  - Variables: `MQTT_AUTH_ENABLED`, `MQTT_USERNAME`, `MQTT_PASSWORD`
  - Contrôle d'accès aux capteurs

#### Notifications
- **Nouveau**: Service de notifications push vers service-users
  - Fichier: `src/services/notification-service.js`
  - Envoi automatique des alertes DEBORDEMENT, BATTERIE_FAIBLE, CAPTEUR_DEFAILLANT
  - Priorités: haute (débordement), moyenne (batterie), basse (capteur)
- **Nouveau**: Notifications de résolution

#### Intégration API Gateway
- **Nouveau**: Documentation Swagger unifiée avec endpoints IoT
- **Nouveau**: Tags IoT (Mesures, Capteurs, Alertes) dans swagger-config.js
- **Nouveau**: 9 endpoints documentés dans l'API Gateway

#### Documentation
- **Nouveau**: `docs/PHASE1.md` - Réception des données (MQTT, TLS, Auth)
- **Nouveau**: `docs/PHASE2.md` - Traitement et Stockage
- **Nouveau**: `docs/PHASE3.md` - Alertes automatiques (seuils, notifications)

#### Corrections
- **Fix**: Middleware Prometheus déplacé **avant** les routes (les métriques HTTP étaient toujours à 0)
- **Fix**: Config DB centralisée dans `config.js` — `connexion.js` l'utilise désormais (élimine la duplication et l'incohérence `max: 20` vs `max: 10`)
- **Fix**: Import `ApiError` déplacé en haut de `alert-service.js` (était importé inline 2x dans `updateAlertStatus`)
- **Fix**: Ordre middleware corrigé : `helmet → cors → json → logger → metrics` (CORS appliqué avant le logger)
- **Fix**: Suppression de `measurementSchema` inutilisé dans `iot.validator.js`

#### Sécurité
- **Nouveau**: Validation `validateParamId` pour tous les `req.params.id` (rejette les id non-entiers avec 400)
- **Nouveau**: Rate limiting (`express-rate-limit`) sur les routes admin `/simulate` et `/check-silent` (10 req/min)

#### Tests
- 42/42 tests unitaires passent (4 suites, aucune régression)

---

### [3.0.0] 2026-03-09 - Service IoT

#### Nouveau Microservice : service-iot (port 3013)
- **Nouveau**: Broker MQTT embarqué (Aedes) sur port 1883
  - Réception temps réel des données capteurs (topic: `containers/{uid}/data`)
  - Parsing, validation et stockage automatique des mesures
- **Nouveau**: Alertes automatiques avec seuils configurables
  - `DEBORDEMENT` : remplissage ≥ 90%
  - `BATTERIE_FAIBLE` : batterie ≤ 20%
  - `CAPTEUR_DEFAILLANT` : température hors plage ou capteur silencieux > 24h
  - Déduplication (pas de doublon d'alerte ACTIVE par conteneur/type)
- **Nouveau**: API REST complète (10 endpoints)
  - Mesures : liste, filtres, dernières mesures, par conteneur
  - Capteurs : liste, détails
  - Alertes : liste, filtres, mise à jour statut
  - Administration : simulation, vérification capteurs silencieux, statistiques
- **Nouveau**: Endpoint de simulation `POST /iot/simulate` pour tests sans MQTT
- **Nouveau**: Métriques Prometheus (mqtt_messages_total, alerts_created_total)
- **Nouveau**: Documentation Swagger sur `/api-docs`
- **Nouveau**: 42 tests unitaires (4 suites)

#### Intégration
- **Modifié**: `docker-compose.yml` - Activation service-iot (ports 3013 + 1883)
- **Modifié**: `docker-compose.override.yml` - Configuration dev avec hot-reload
- **Modifié**: API Gateway - Route `/iot/*` activée (status: ready)

#### Documentation
- **Nouveau**: `docs/SERVICE-IOT.md` - Guide complet du service IoT
