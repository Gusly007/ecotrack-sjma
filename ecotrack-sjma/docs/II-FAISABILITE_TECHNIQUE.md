# II. Faisabilité Technique Applicative — EcoTrack

Critères RNCP Ce1.1.2 / A1.3 : Analyse des contraintes techniques et faisabilité

---

## A. Stack Backend

### Choix du framework : Node.js 20 + Express 5

**Décision retenue : Node.js 20 (LTS) avec Express 5.x**

| Critère | Node.js / Express | FastAPI (Python) |
|---------|-------------------|-----------------|
| Modèle I/O | Asynchrone non-bloquant (event loop) | Asynchrone (asyncio) |
| Performance I/O intensif | Excellent (adapté IoT, WebSocket) | Très bon |
| Ecosystème IoT / MQTT | Mature (kafkajs, mqtt, aedes) | Moins riche |
| Isomorphisme avec frontend | Oui (JS partout, modèles partagés) | Non (Python / JS) |
| Courbe d'apprentissage équipe | Faible (équipe JS) | Moyenne |
| Ecosystem npm | 2,5M packages | PyPI, complet mais différent |
| Support WebSocket natif | Oui (ws, socket.io) | Oui (websockets, starlette) |
| Microservices | Très adapté (léger, démarrage rapide) | Adapté |

**Justification** : Le flux dominant d'EcoTrack est I/O-intensif (2 000 capteurs MQTT, 15 000 citoyens connectés, Kafka consumer en temps réel). Node.js est architecturalement optimisé pour ce type de charge grâce à son event loop non-bloquant. L'uniformité du langage JavaScript sur l'ensemble de la pile (frontend React + 8 microservices Node.js) réduit le coût cognitif, facilite le partage de schémas de validation (Joi) et accélère le recrutement.

FastAPI aurait été pertinent pour un service ML intensif (analytique prédictive). Ce cas est isolé dans `service-analytics` — la régression linéaire et la détection d'anomalies Z-score ne nécessitent pas Python et restent performantes en JS pur.

### Architecture microservices

L'application est découpée en **8 microservices indépendants** :

| Service | Port | Responsabilité |
|---------|------|----------------|
| api-gateway | 3000 | Reverse proxy, JWT, rate limiting, Swagger unifié |
| service-users | 3010 | Authentification JWT, MFA TOTP, RBAC, RGPD |
| service-containers | 3011 | CRUD conteneurs, zones, Socket.IO temps réel |
| service-routes | 3012 | Tournées, optimisation NN+2-opt, signalements |
| service-iot | 3013 | Broker MQTT Aedes, mesures capteurs, alertes |
| service-gamifications | 3014 | Points, badges, défis, classement |
| service-analytics | 3015 | Agrégations, dashboard, ML predictions, rapports |
| service-notification | 3016 | Notifications gestionnaires/admins, consumer Kafka |

Chaque service expose `/health`, `/metrics` (Prometheus) et `/api-docs` (Swagger UI). Ils communiquent via HTTP (synchrone) ou Kafka (asynchrone).

### Base de données : PostgreSQL 16 + PostGIS 3

**Justification** :
- PostGIS permet des requêtes géospatiales natives (ST_DWithin, ST_Distance, ST_GeomFromGeoJSON) pour les zones de collecte et le positionnement GPS des conteneurs sans couche applicative supplémentaire.
- JSONB pour les données flexibles (historique_statut, backup_codes MFA, metadata capteurs).
- Pool de connexions via `pg-pool` (taille configurable par service).
- Vues matérialisées pour les agrégations analytics (rafraîchissement planifié par cron).

Tables principales : `utilisateur`, `conteneur`, `zone`, `capteur`, `mesure`, `alerte_capteur`, `tournee`, `etape_tournee`, `collecte`, `signalement`, `notification`, `badge`, `historique_points`, `gamification_defi`.

### Cache : Redis 7

**Usage par service** :

| Service | Usage Redis |
|---------|-------------|
| api-gateway | Cache réponses GET fréquentes, TTL 60s–300s |
| service-users | Sessions refresh token, blacklist JWT, rate limiting |
| service-notification | Cache compteur non-lus par utilisateur |
| service-analytics | Cache agrégations dashboard (TTL 5 min) |

Le service-notification fonctionne en mode dégradé sans Redis (fallback DB). Le cache est facultatif à l'exception des sessions utilisateur.

### Protocole IoT : MQTT (Aedes) + Kafka

**Double couche messaging** :

```
Capteurs IoT (2 000)
    |
    | MQTT (TCP :1883)
    v
service-iot (broker Aedes embarqué)
    |
    |-- INSERT PostgreSQL (mesure brute)
    |
    |-- Kafka Producer
          |-- ecotrack.sensor.data  --> service-analytics (ML, agrégations)
          |-- ecotrack.alerts       --> service-notification (alertes gestionnaire)
```

- **MQTT** : protocole léger (overhead ~2 bytes), adapté aux capteurs embarqués basse consommation. Aedes est intégré dans le processus Node.js, évitant un broker externe pour le développement.
- **Kafka** : découplage asynchrone inter-services, rétention configurable (7 jours sensor.data, 30 jours alerts), partition horizontale (6 partitions pour sensor.data).

Débit mesuré : 2 000 capteurs × 1 mesure/min = 33 msg/s en régime nominal. Pic estimé à 200 msg/s. Kafka absorbe ce pic sans back-pressure sur les consumers.

---

## B. Stack Frontend

### Choix du framework : React 18

**Décision retenue : React 18 + Vite 5 + Tailwind CSS 3**

| Critère | React 18 | Vue.js 3 |
|---------|----------|----------|
| Adoption marché | 80% des offres frontend | 15% (dominance Asie) |
| Ecosystème | React Router, React Query, Zustand | Vue Router, Pinia |
| Performance (Concurrent Mode) | Oui (Suspense, useTransition) | Non équivalent |
| TypeScript | Support natif excellent | Bon |
| Communauté / ressources | Très large | Large |
| Courbe apprentissage | Modérée | Douce |
| Mobile (React Native) | Oui (réutilisabilité partielle) | Non |

**Justification** : React 18 introduit le Concurrent Mode permettant un rendu prioritisé pour les composants temps réel (carte, compteur notifications, Socket.IO). L'interface est découpée en deux personas :
- **Desktop** (Admin, Gestionnaire) : tableau de bord complexe avec charts, tableaux paginés, gestion utilisateurs.
- **Mobile** (Citoyen, Agent) : 28 pages optimisées responsive, scan QR, carte Leaflet, flux gamification.

React.lazy() + Suspense est utilisé pour les composants lourds (CitoyenMap, CitoyenScanner) afin de ne pas impacter le bundle initial.

### Cartographie : Leaflet + OpenStreetMap

**Décision retenue : Leaflet 1.9 + react-leaflet 4.x + tuiles OpenStreetMap**

| Critère | Leaflet + OSM | Mapbox GL JS |
|---------|--------------|--------------|
| Licence | Open source (BSD) | Payant au-delà 50k tiles/mois |
| Tuiles | Gratuites (OSM) | 0,50$/1000 tiles |
| GeoJSON | Natif | Natif |
| 3D / tilt | Non | Oui |
| Bundle | ~150 KB | ~950 KB |
| PostGIS intégration | Directe (GeoJSON) | Directe |

**Justification** : Le budget de la collectivité ne justifie pas Mapbox GL. Les besoins cartographiques (affichage conteneurs, zones, itinéraires GeoJSON) sont pleinement couverts par Leaflet + OSM. L'export GeoJSON des tournées (service-routes `/tournees/:id/map`) se connecte nativement à une `L.GeoJSON` layer.

### Temps réel : Socket.IO + WebSocket

**Double mécanisme** :
- `service-containers` expose Socket.IO sur le port 3011 pour les changements de statut conteneurs (événement `container:status-changed` par zone).
- L'API Gateway proxy le WebSocket `/ws` vers service-notification pour les notifications push en temps réel (gestionnaire/admin).

### Charts : Recharts

Recharts 2.x est retenu pour son intégration native React (composants déclaratifs), sa légèreté (~300 KB) et son support des types de graphiques requis : LineChart (évolutions), BarChart (collectes par zone), RadarChart (KPIs agents).

---

## C. Algorithme d'Optimisation des Tournées

### Décision retenue : Nearest Neighbor (NN) + 2-opt

**Problème** : Tournée de collecte = variante du TSP (Travelling Salesman Problem) avec contraintes : capacité véhicule, seuil de remplissage minimal, ordre chronologique recommandé.

| Algorithme | Complexité | Qualité solution | Temps calcul (50 cont.) | Implémentation |
|-----------|-----------|-----------------|------------------------|----------------|
| Force brute | O(n!) | Optimale | Infaisable (>10^64) | Triviale |
| Algorithme génétique | O(g×n²) | Quasi-optimale | 5-30s selon G | Complexe |
| Nearest Neighbor | O(n²) | Bonne (-20% vs optimal) | <100ms | Simple |
| NN + 2-opt | O(n³) | Très bonne (-40% vs NN) | <500ms | Moderate |

**Justification** : L'algorithme génétique produit des solutions légèrement meilleures (+5% vs 2-opt) au prix d'une implémentation complexe, d'une convergence non déterministe et d'un temps de calcul variable. Pour 50 conteneurs, NN+2-opt atteint une solution à -15% à -45% de distance par rapport au NN seul en moins de 500ms (benchmark mesuré sur le service).

**Implémentation** (service-routes) :
1. Filtrage par seuil de remplissage (configurable, défaut 70%).
2. Calcul Haversine pour distances GPS précises.
3. NN : sélection du conteneur le plus proche non visité à chaque étape.
4. 2-opt : inversions d'arêtes jusqu'à convergence (amélioration garantie ou arrêt).
5. Calcul des heures estimées par étape (heure_debut_prevue + durée cumulative).

**Contraintes satisfaites** :
- Capacité véhicule : filtrage par `quantite_collectee` cumulée.
- Zones prioritaires : pondération du seuil de remplissage.
- Performance : calcul < 500ms pour 50 conteneurs (bien en dessous de l'objectif 30s).

---

## D. Scalabilité et Performance

### Architecture et découplage

L'architecture microservices garantit l'isolation des pannes : une indisponibilité de service-gamifications n'affecte pas la collecte IoT. Chaque service est stateless (état partagé via PostgreSQL/Redis) et peut être scalé horizontalement.

### Containerisation : Docker + Docker Compose

Tous les services sont containerisés avec des images Node.js 20 Alpine (~200 MB vs ~900 MB pour les images Debian). Le fichier `docker-compose.yml` orchestre 12 containers (8 services + PostgreSQL + Redis + Kafka + Zookeeper).

```
Réseau interne Docker : ecotrack_network (bridge)
Communication inter-services : http://service-name:port (DNS Docker)
Kafka broker interne : kafka:29092
Exposition externe : uniquement via api-gateway:3000
```

### Reverse proxy et routing

L'API Gateway (`http-proxy-middleware`) remplace Nginx pour le routing applicatif. Cette décision simplifie la configuration (un seul point de configuration JS vs Nginx + Node.js) et permet une logique de routing dynamique (transformation headers JWT, logging Pino structuré).

Pour un déploiement production à forte charge, Nginx ou un ALB (Application Load Balancer) AWS resterait pertinent devant l'API Gateway pour la terminaison TLS et le load balancing multi-instances.

### Métriques et objectifs de performance

| Métrique | Objectif | Mesuré (benchmark local) |
|----------|----------|--------------------------|
| Temps réponse GET /containers (cache chaud) | < 50ms | ~12ms |
| Temps réponse POST /auth/login | < 200ms | ~85ms |
| Calcul tournée 50 conteneurs (2-opt) | < 30s | < 500ms |
| Débit MQTT (pic) | 200 msg/s | Testé à 250 msg/s |
| Débit API Gateway | 10 000 req/min | Non testé en prod |
| Connexions WebSocket simultanées | 1 000 | Socket.IO testé à 500 |

### Sécurité

| Mécanisme | Implémentation |
|-----------|---------------|
| Authentification | JWT (access 15min + refresh 7j) |
| 2FA / MFA | TOTP RFC 6238 (speakeasy + qrcode) + 10 codes secours |
| Protection brute-force | express-rate-limit (5 tentatives/15min sur /auth/login) |
| Headers HTTP | Helmet (CSP, HSTS, X-Frame-Options) |
| Injection SQL | Requêtes paramétrées (pg driver), Joi validation |
| CORS | Origines whitelistées via ALLOWED_ORIGINS |
| RGPD | Export données, suppression, consentement cookies, cron purge |
| Audit | Log toutes les tentatives de connexion (table audit_log) |

### Contraintes identifiées et mitigations

| Contrainte | Impact | Mitigation |
|-----------|--------|------------|
| PostgreSQL single-node | SPOF en production | Réplication streaming (primary + 1 replica) |
| Kafka sans ZooKeeper KRaft | Config complexe | Migration KRaft en Kafka 3.3+ |
| MQTT broker embarqué | Non scalable >5000 capteurs | Externaliser vers EMQX ou HiveMQ si croissance |
| Redis single-node | SPOF sessions | Redis Sentinel ou Redis Cluster |
| Pas de Kubernetes | Scaling manuel | Docker Swarm ou k3s pour étape suivante |

---

## Conclusion technique

La stack EcoTrack (Node.js 20 + PostgreSQL/PostGIS + Redis + Kafka + React 18 + Leaflet) est cohérente, éprouvée en production pour des architectures similaires et adaptée aux contraintes du domaine. Les choix privilégient la maturité technologique et la productivité de l'équipe sur la sophistication algorithmique.

Le principal point de vigilance pour une mise en production est la haute disponibilité de PostgreSQL (réplication) et l'externalisation du broker MQTT au-delà de 5 000 capteurs.
