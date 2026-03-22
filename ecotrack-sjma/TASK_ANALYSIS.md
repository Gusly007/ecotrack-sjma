# EcoTrack - Analyse des Tâches RNCP

> Date: 2026-03-16
> Projet: EcoTrack Microservices (ecotrack-sjma)

---

## Résumé Exécutif

| Statut | Nombre | Pourcentage |
|--------|--------|-------------|
| ✅ Implémentées | 13 | ~22% |
| ❌ Non implémentées | 46 | ~78% |
| **Total** | **59** | 100% |

---

## 📊 RÉSUMÉ

### Répartition par Catégorie

| Catégorie | ✅ Implémentées | ❌ Non implémentées | Total |
|-----------|-----------------|---------------------|-------|
| **Backend/Services** | 4 | 8 | 12 |
| **Mobile/Frontend** | 0 | 11 | 11 |
| **Kafka/Events** | 3 | 2 | 5 |
| **ML/Data** | 1 | 5 | 6 |
| **Infrastructure** | 2 | 7 | 9 |
| **Tests/Security** | 0 | 9 | 9 |
| **Observabilité** | 3 | 4 | 7 |
| **TOTAL** | **13** | **46** | **59** |

### Progression

```
Implémentation:  █████████████████████░░░░░░░░░░░░░░░░░░░░░░ 22%
Non implémenté:  ███████████████████████████████████████░░░ 78%
```

### Points Clés

- **Services existants**: 7 microservices opérationnels
- **Kafka implémenté**: Producer (IoT), 2 Consumers (Analytics, Users)
- **Infrastructure prête**: PostgreSQL, Redis, Kafka, Prometheus, Grafana
- **Prochaine étape suggérée**: Mobile App (M5.2)

---

## ✅ Tâches Implémentées (13)

| Tâche | Description | Preuve |
|-------|-------------|--------|
| **M5.6** | Authentification/Autorisation RBAC | `service-users` : 4 rôles (CITOYEN, AGENT, GESTIONNAIRE, ADMIN), matrice permissions, middleware `requirePermission()` |
| **M5.7** | Vue Carte Thermique (Heatmap) | `service-analytics` : endpoint `/analytics/heatmap` avec GeoJSON |
| **M5.9** | Création/Modification de Tournée | `service-routes` : CRUD complet tournées, changement statut, audit trail |
| **M7.4** | API d'Inférence ML | `service-analytics` : prédictions remplissage (régression linéaire), détection anomalies (Z-score) |
| **M8.2** | Producer IoT Ingestion Kafka | `services/service-iot/kafkaProducer.js` : envoi données capteurs |
| **M8.3** | Consumer Analytics Kafka | `services/service-analytics/kafkaConsumer.js` : consommation données |
| **M8.9** | Kafka Monitoring | Kafka-UI (port 8080), intégration docker-compose |
| **M9.4** | Docker Multi-Stage Builds | Dockerfiles optimisés dans chaque service |
| **M9.9** | Monitoring Prometheus + Grafana | Prometheus (9090), Grafana (3001), métriques dans tous les services |
| **M13.3** | Métriques Métiers Custom | `prom-client` intégré, métriques HTTP, processus |
| **M13.4** | Alerting Prometheus | Règles d'alertes configurées |
| M5.11 | Visualisation Données | `service-analytics` : graphiques avec Recharts |
| M13.5 | Health Checks | Endpoints `/health` dans tous les services |

---

## ❌ Tâches Non Implémentées (49)

### Mobile & Frontend (11 tâches)

| Tâche | Description | Bloc/Fichier à créer |
|-------|-------------|---------------------|
| **M5.2** | App Mobile Citoyen (React Native/Flutter) | `mobile-app/` |
| **M5.3** | State Management (Redux/Zustand) | `frontend/src/store/` |
| **M5.4** | Géolocalisation App Agent | `mobile-app/src/screens/TourneeScreen.js` |
| **M5.8** | Performance Front-End (Lighthouse) | Configuration Lighthouse CI |
| **M5.10** | Service Workers PWA | `frontend/public/sw.js` |
| **M5.12** | Tests E2E Cypress/Playwright | `tests/e2e/` |
| **M5.13** | Notification Push Mobile | Intégration FCM/APNS |
| **M5.14** | Sentry/LogRocket | `frontend/src/sentry.js` |
| **M5.15** | Design System | `design-system/` |
| **M11.5** | Lazy Loading/Code Splitting | Configuration Webpack |
| **M11.6** | PWA/Service Workers | `frontend/public/manifest.json` |

### Kafka & Event-Driven (5 tâches)

| Tâche | Description | Bloc/Fichier | Status |
|-------|-------------|--------------|--------|
| **M8.2** | Producer IoT Ingestion Kafka | `services/service-iot/kafkaProducer.js` | ✅ |
| **M8.3** | Consumer Analytics Kafka | `services/service-analytics/kafkaConsumer.js` | ✅ |
| **M8.6** | Kafka Streams | `services/service-kafka-streams/` (Java SpringBoot) | ❌ |
| **M8.7** | Kafka Connect | Configuration Debezium, Elasticsearch, S3 | ❌ |
| **M8.9** | Kafka Monitoring | Kafka-UI (port 8080) | ✅ |

### ML & Data (5 tâches)

| Tâche | Description | Bloc/Fichier à créer |
|-------|-------------|---------------------|
| **M7.2** | Feature Store (Feast) | `services/service-feature-store/` |
| **M7.7** | Explicabilité XAI (SHAP/LIME) | Intégration SHAP dans `service-analytics` |
| **M7.10** | DVC (Data Versioning) | `.dvc/` configuration |
| **M7.12** | Tests Adversarial | `services/service-analytics/tests/adversarial.test.js` |
| **M7.14** | Modèle Edge (TensorFlow Lite) | `sensors/firmware/` |

### Infrastructure & DevOps (7 tâches)

| Tâche | Description | Bloc/Fichier à créer |
|-------|-------------|---------------------|
| **M9.3** | Ansible Automation | `ansible/` playbooks |
| **M9.5** | Kubernetes Manifests | `k8s/` (Deployments, Services, HPA) |
| **M9.10** | ELK Stack Logging | `monitoring/elk/` |
| **M11.1** | Profiling Clinic.js | Scripts de profiling |
| **M11.3** | PostgreSQL Optimization | Migrations indexes, partitioning |
| **M11.4** | Compression Gzip/Brotli | Configuration Nginx |
| **M11.7** | PgBouncer | Configuration pooling |

### Tests & Security (9 tâches)

| Tâche | Description | Bloc/Fichier à créer |
|-------|-------------|---------------------|
| **M6.11** | Pentest Externe | Rapport dans `docs/security/` |
| **M6.12** | Pentest Interne | Scénarios attaque |
| **M6.13** | Fuzz Testing | Configuration libFuzzer |
| **M10.1** | Tests E2E Playwright | `tests/e2e/playwright.config.ts` |
| **M10.2** | Tests Charge K6 | `tests/load/k6-scenarios.js` |
| **M10.4** | Mutation Testing | Configuration Stryker |
| **M10.5** | Tests Visuels Percy | Configuration `.percy.yml` |
| **M10.6** | Accessibilité axe-core | `tests/a11y/` |
| **M10.8** | Lighthouse CI | `lighthouserc.json` |

### Observabilité (4 tâches)

| Tâche | Description | Bloc/Fichier à créer |
|-------|-------------|---------------------|
| **M13.1** | Distributed Tracing (Jaeger) | Configuration OpenTelemetry |
| **M13.2** | APM (New Relic/DataDog) | Configuration agents |
| **M13.6** | Synthetic Monitoring | Configuration Uptime Robot |
| **M13.7** | Sentry Error Tracking | `frontend/src/sentry.js` (existe mais pas complet) |

---

## État Actuel des Services

### Services Implémentés

| Service | Port | Technologies | Status |
|---------|------|--------------|--------|
| api-gateway | 3000 | Express.js, JWT, Helmet | ✅ |
| service-users | 3010 | Express.js, PostgreSQL, RBAC | ✅ |
| service-containers | 3011 | Express.js, Socket.IO | ✅ |
| service-routes | 3012 | Express.js, PDFKit, GeoJSON | ✅ |
| service-iot | 3013 | Aedes (MQTT), Express.js | ✅ |
| service-gamifications | 3014 | Express.js, Gamification | ✅ |
| service-analytics | 3015 | Express.js, ML, Predictions | ✅ |

### Services Manquants (selon tâches)

- `service-iot-producer` (Kafka Producer)
- `service-analytics-consumer` (Kafka Consumer)
- `service-kafka-streams` (Java)
- `service-feature-store` (Feast)
- `mobile-app` (React Native/Flutter)
- `design-system` (Storybook)

---

## Infrastructure Actuelle

### Conteneurs Docker

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | ✅ |
| Redis | 6379 | ✅ Cache implémenté |
| Prometheus | 9090 | ✅ |
| Grafana | 3001 | ✅ |
| PgAdmin | 5052 | ✅ |
| Zookeeper | 2181 | ✅ |
| Kafka | 9092 | ✅ |
| Kafka-UI | 8080 | ✅ |

---

## Architecture Kafka EcoTrack

### Flux de données

```
[Capteurs IoT] → [MQTT Broker] → [service-iot] → [Kafka]
                                                      ↓
                          ┌───────────────────────────┼───────────────────────────┐
                          ↓                           ↓                           ↓
              [service-analytics]        [service-users]            [service-routes]
              - ML Predictions          - Notifications             - Optimisation
              - Statistics             - Push/Email                - Statuts conteneurs
```

### Topics implémentés

| Topic | Producer | Consumers | Usage |
|-------|----------|-----------|-------|
| `ecotrack.sensor.data` | service-iot | service-analytics | Données temps réel |
| `ecotrack.alerts` | service-iot | service-users, service-analytics | Alertes conteneurs |
| `ecotrack.container.status` | service-iot | service-routes | Mise à jour statut |
| `ecotrack.notifications` | service-iot | service-users | Notifications |

### Commandes Kafka

```bash
# Lister topics
docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Voir messages
docker compose exec kafka kafka-console-consumer --topic ecotrack.alerts --from-beginning --bootstrap-server localhost:9092

# Interface web
open http://localhost:8080
```

### Topics Kafka

| Topic | Partitions | Description |
|-------|------------|-------------|
| `ecotrack.sensor.data` | 6 | Données capteurs |
| `ecotrack.alerts` | 3 | Alertes conteneurs |
| `ecotrack.container.status` | 3 | Statut conteneurs |
| `ecotrack.notifications` | 3 | Notifications |

### Manquant pour Kafka (M8.x)

- [ ] Kafka Streams (M8.6) - Java SpringBoot
- [ ] Kafka Connect (M8.7) - Debezium, S3

---

## Métriques du Projet

| Métrique | Valeur |
|----------|--------|
| Tests unitaires | 141+ |
| Services backend | 7 |
| Ports utilisés | 3000-3015 |
| Documentation | ~50 fichiers MD |
| Couverture RBAC | 100% (4 rôles) |

---

## Priorités Recommandées

### Phase 1 - Critique (Mobile)
1. **M5.2** - App Mobile Citoyen (React Native)
2. **M5.4** - Géolocalisation Agent
3. **M5.13** - Notification Push Mobile

### Phase 2 - Performance
4. **M11.2** - Caching Redis (compléter implémentation)
5. **M11.3** - PostgreSQL Optimization
6. **M11.7** - PgBouncer

### Phase 3 - ML Avancé
7. **M7.7** - Explicabilité XAI (SHAP/LIME)
8. **M7.10** - DVC (Data Versioning)

### Phase 4 - Tests & Qualité
9. **M10.2** - Tests Charge K6
10. **M10.1** - E2E Playwright

---

## Commandes Utiles

```bash
# Lancer les services
docker-compose up -d

# Tests unitaires
npm run test --workspace=service-routes

# Vérifier health
curl http://localhost:3000/health

# Prometheus metrics
curl http://localhost:3010/metrics
```

---

## Références

- Documentation: `docs/`
- Docker Compose: `docker-compose.yml`
- CI/CD: `.github/workflows/ci.yml`
- CHANGELOG: `docs/CHANGELOG.md`

---

# 📈 Prometheus Metrics & Monitoring

> Cette section détaille les métriques Prometheus à surveiller, leur statut d'implémentation, et comment les ajouter.

---

## 1. Métriques Implémentées (Actuelles)

### Métriques HTTP (Tous les services)

Chaque service expose ces métriques sur `/metrics` :

| Métrique | Type | Description | Status |
|----------|------|-------------|--------|
| `http_requests_total` | Counter | Requêtes HTTP totales | ✅ |
| `http_request_duration_seconds` | Histogram | Latence des requêtes | ✅ |

**Labels actuels** : `method`, `path`, `status`

**Exemple de requête** :
```promql
rate(http_requests_total[5m])
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Métriques Node.js (Default)

| Métrique | Type | Description | Status |
|----------|------|-------------|--------|
| `process_cpu_seconds_total` | Counter | Temps CPU | ✅ |
| `process_memory_usage_bytes` | Gauge | Mémoire utilisée | ✅ |
| `nodejs_eventloop_lag_seconds` | Histogram | Lag event loop | ✅ |
| `nodejs_heap_size_used_bytes` | Gauge | Heap utilisé | ✅ |
| `nodejs_active_handles` | Gauge | Handles actifs | ✅ |

---

## 2. Métriques à Implémenter (Recommandées)

### 2.1 Métriques Business (Métier)

| Métrique | Type | Labels | Service | Status |
|----------|------|--------|---------|--------|
| `signalements_created_total` | Counter | `zone`, `type`, `urgence` | service-users | ❌ |
| `tournees_created_total` | Counter | `zone`, `agent_id` | service-routes | ❌ |
| `tournees_completed_total` | Counter | `zone`, `duree` | service-routes | ❌ |
| `collectes_enregistrees_total` | Counter | `conteneur_id`, `quantite` | service-routes | ❌ |
| `containers_fill_level_percent` | Gauge | `conteneur_id`, `zone` | service-iot | ❌ |
| `gamification_points_awarded_total` | Counter | `user_id`, `action_type` | service-gamifications | ❌ |
| `alertes_generees_total` | Counter | `type`, `severite` | service-iot | ❌ |
| `mqtt_messages_received_total` | Counter | `sensor_id` | service-iot | ❌ |

### 2.2 Métriques Techniques Supplémentaires

| Métrique | Type | Labels | Service | Status |
|----------|------|--------|---------|--------|
| `database_connections_active` | Gauge | `service` |Tous | ❌ |
| `database_query_duration_seconds` | Histogram | `query_type`, `table` | Tous | ❌ |
| `redis_cache_hits_total` | Counter | `key_pattern` | Tous | ❌ |
| `redis_cache_misses_total` | Counter | `key_pattern` | Tous | ❌ |
| `kafka_messages_produced_total` | Counter | `topic`, `partition` | Producer | ❌ |
| `kafka_messages_consumed_total` | Counter | `topic`, `consumer_group` | Consumer | ❌ |
| `kafka_consumer_lag` | Gauge | `topic`, `partition` | Consumer | ❌ |

### 2.3 Métriques Infrastructure

| Métrique | Type | Source | Status |
|----------|------|--------|--------|
| `postgres_exporter_*` | Multi | postgres_exporter | ❌ |
| `redis_exporter_*` | Multi | redis_exporter | ❌ |
| `node_exporter_*` | Multi | node-exporter | ❌ |
| `kafka_broker_*` | Multi | kafka_exporter | ❌ |

---

## 3. Comment Ajouter des Métriques Custom

### 3.1 Exemple : Ajouter une métrique Counter

```javascript
//Dans votre service (ex: service-routes/index.js)
const client = require('prom-client');

// Définir la métrique
const tourneesCompleted = new client.Counter({
  name: 'tournees_completed_total',
  help: 'Nombre total de tournées terminées',
  labelNames: ['zone', 'agent_id'],
  registers: [register]
});

// L'utiliser dans votre code
app.patch('/tournees/:id/close', async (req, res) => {
  // ... logique de clôture
  const tournee = await tourneeService.cloturer(id);
  
  // Incrémenter la métrique
  tourneesCompleted.inc({ 
    zone: tournee.zone, 
    agent_id: tournee.agent_id 
  });
  
  res.json(tournee);
});
```

### 3.2 Exemple : Ajouter une métrique Histogram

```javascript
const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Durée des requêtes PostgreSQL',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

// Utilisation avec middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    databaseQueryDuration.observe({ 
      query_type: req.method, 
      table: 'unknown' 
    }, duration);
  });
  next();
});
```

### 3.3 Exemple : Ajouter une métrique Gauge

```javascript
const containerFillLevel = new client.Gauge({
  name: 'container_fill_level_percent',
  help: 'Niveau de remplissage actuel du conteneur',
  labelNames: ['conteneur_id', 'zone'],
  registers: [register]
});

// Mise à jour depuis les données IoT
function updateFillLevels(mesures) {
  mesures.forEach(m => {
    containerFillLevel.set(
      { conteneur_id: m.conteneur_id, zone: m.zone },
      m.fill_level
    );
  });
}
```

---

## 4. Configuration Alertmanager

### 4.1 Fichier alertmanager.yml (à créer)

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    - match:
        severity: warning
      receiver: 'slack-warning'

receivers:
  - name: 'default'
    email_configs:
      - to: 'devops@ecotrack.com'
        send_resolved: true

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        severity: critical

  - name: 'slack-warning'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK'
        channel: '#alerts-prod'
        send_resolved: true
```

### 4.2 Règles d'Alertes (prometheus-rules.yml)

```yaml
groups:
  - name: ecotrack-alerts
    rules:
      # Alertes HTTP
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Taux d'erreur élevé sur {{ $labels.service }}"
          description: "Le service {{ $labels.service }} a un taux d'erreur de {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latence élevée - {{ $labels.service }}"
          description: "Latence P95: {{ $value | humanizeDuration }}"

      # Alertes Infrastructure
      - alert: HighMemoryUsage
        expr: process_memory_usage_bytes / 536870912 > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Mémoire élevée - {{ $labels.job }}"
          description: "Utilisation mémoire: {{ $value | humanizeMemory }}"

      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "CPU élevé - {{ $labels.job }}"
          description: "Utilisation CPU: {{ $value | humanizePercentage }}"

      # Alertes Business
      - alert: ContainerFillLevelCritical
        expr: container_fill_level_percent > 90
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Conteneur {{ $labels.conteneur_id }} presque plein"
          description: "Niveau de remplissage: {{ $value }}%"

      - alert: HighAlertRate
        expr: rate(alertes_generees_total[15m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Taux d'alertes anormalement élevé"
          description: "{{ $value }} alertes générées par minute"

      # Alertes Kafka (futur)
      - alert: KafkaConsumerLagHigh
        expr: kafka_consumer_lag > 10000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Lag de consommation Kafka élevé"
          description: "Lag: {{ $value }} messages pour {{ $labels.consumer_group }}"

      - alert: KafkaBrokerDown
        expr: kafka_broker_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Kafka broker hors ligne"
          description: "Broker {{ $labels.instance }} est indisponible"
```

---

## 5. Intégration Grafana

### 5.1 DataSource Configuration

```yaml
# grafana/provisioning/datasources/datasources.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

### 5.2 Dashboards Recommandés

| Dashboard | Source | Métriques clés |
|-----------|--------|----------------|
| **API Overview** | Custom | http_requests_total, http_request_duration |
| **Service Health** | Custom | up, process_* |
| **Business KPIs** | Custom | tournees_*, signalements_*, containers_* |
| **PostgreSQL** | Import | pg_stat_database, pg_stat_activity |
| **Redis** | Import | redis_*, keyspace_* |
| **Kafka** | Import | kafka_*, consumer_lag |

### 5.3 Requêtes PromQL Utiles

```promql
# Débit de requêtes par service
sum by (job) (rate(http_requests_total[5m]))

# Latence P95 par endpoint
histogram_quantile(0.95, sum by (le, path) (rate(http_request_duration_seconds_bucket[5m])))

# Taux d'erreur par service
sum by (job, status) (rate(http_requests_total{status=~"5.."}[5m]))

# Métriques business - Tournées terminées
sum by (zone) (rate(tournees_completed_total[1h]))

# Métriques business - Conteneurs critiques
container_fill_level_percent > 80

# Cache Redis hit rate
(redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)) * 100
```

---

## 6. Ajouter postgres_exporter

### 6.1 docker-compose.yml

```yaml
postgres-exporter:
  image: prometheuscommunity/postgres-exporter:v0.15.0
  environment:
    DATA_SOURCE_NAME: "postgresql://postgres:password@postgres:5432/ecotrack?sslmode=disable"
  ports:
    - "9187:9187"
  volumes:
    - ./monitoring/prometheus/postgres-queries.yml:/etc/postgres-exporter/postgres-exporter.conf
```

### 6.2 postgres-queries.yml (queries custom)

```yaml
ecotrack:
  query: "SELECT count(*) as containers_count FROM conteneur WHERE niveau_remplissage > 80"
  metrics:
    - containers_count:
        usage: "GAUGE"
        description: "Nombre de conteneurs à plus de 80%"

  query: "SELECT count(*) as tournees_en_cours FROM tournee WHERE statut = 'EN_COURS'"
  metrics:
    - tournees_en_cours:
        usage: "GAUGE"
```

---

## 7. Commandes de Vérification

```bash
# Vérifier les métriques d'un service
curl http://localhost:3010/metrics | grep http_requests

# Vérifier Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Tester une requête PromQL
curl 'http://localhost:9090/api/v1/query?query=up' | jq

# Voir les alerts actives
curl http://localhost:9090/api/v1/alerts | jq
```

---

## 8. Checklist d'Implémentation

- [ ] Métriques HTTP existantes (✅)
- [ ] Métriques Node.js défaut (✅)
- [ ] postgres_exporter ajouté
- [ ] redis_exporter ajouté
- [ ] Métriques business ajoutées
- [ ] Alertmanager configuré
- [ ] Règles d'alertes créées
- [ ] Dashboards Grafana créés
- [ ] Kafka exporter ajouté (futur)

---

# 🗄️ Redis Caching - Services Existants

> Redis est disponible dans docker-compose (port 6379) mais **non utilisé** par les services.

## Infrastructure Redis

```yaml
# docker-compose.yml - Already configured
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"  # Host accessible
  networks:
    - ecotrack
```

**Configuration recommandée** : `redis://ecotrack-redis:6379` (inter-container)

---

## Services & Stratégies de Cache

### 1. service-users (port 3010)

| Donnée à cacher | Stratégie | TTL | Priorité |
|-----------------|-----------|-----|----------|
| Profils utilisateurs | Cache-Aside | 5 min | Haute |
| Liste rôles/permissions | TTL fixe | 30 min | Moyenne |
| Sessions utilisateurs | Write-through | 24h | Critique |
| Métadonnées zones | Cache-Aside | 15 min | Moyenne |

**Clés recommandées** :
```
user:{id}:profile      - Profil utilisateur
user:{id}:session     - Données session
roles:list            - Liste des rôles
permissions:{role}    - Permissions par rôle
zone:list             - Liste des zones
```

### 2. service-containers (port 3011)

| Donnée à cacher | Stratégie | TTL | Priorité |
|-----------------|-----------|-----|----------|
| Liste conteneurs | Cache-Aside | 2 min | **Haute** |
| Détails conteneur | Cache-Aside | 5 min | Haute |
| Historique collectes | Cache-Aside | 10 min | Moyenne |
| Zones géographiques | TTL fixe | 1h | Moyenne |

**Clés recommandées** :
```
container:list:{page}     - Liste paginée
container:{id}           - Détails conteneur
container:zone:{zoneId}   - Conteneurs par zone
container:geo            - Tous les conteneurs (géo)
collection:history:{id}  - Historique collecte
```

### 3. service-routes (port 3012)

| Donnée à cacher | Stratégie | TTL | Priorité |
|-----------------|-----------|-----|----------|
| Tournées actives | Cache-Aside | 1 min | **Haute** |
| Détails tournée | Cache-Aside | 2 min | Haute |
| Liste zones | TTL fixe | 30 min | Moyenne |
| Véhicules disponibles | TTL fixe | 1h | Basse |
| Itinéraire optimisé | Refresh-ahead | 10 min | Haute |

**Clés recommandées** :
```
tournee:active          - Tournées actives
tournee:{id}           - Détails tournée
tournee:agent:{id}     - Tournées par agent
zone:list              - Liste zones
vehicule:available     - Véhicules dispo
route:optimized:{id}   - Itinéraire calculé
```

### 4. service-iot (port 3013)

| Donnée à cacher | Stratégie | TTL | Priorité |
|-----------------|-----------|-----|----------|
| Dernières mesures | Write-behind | 30s | **Haute** |
| Capteurs actifs | TTL fixe | 5 min | Haute |
| Statistiques conteneur | Cache-Aside | 5 min | Moyenne |
| Alertes actives | TTL fixe | 1 min | Haute |

**Clés recommandées** :
```
iot:measure:latest:{containerId}  - Dernière mesure
iot:sensor:active                 - Capteurs actifs
iot:stats:{containerId}          - Stats conteneur
iot:alerts:active                - Alertes actives
```

### 5. service-gamifications (port 3014)

| Donnée à cacher | Stratégie | TTL | Priorité |
|-----------------|-----------|-----|----------|
| Classement users | Cache-Aside | 5 min | **Haute** |
| Badges disponibles | TTL fixe | 1h | Basse |
| Points utilisateur | Write-through | 10 min | Haute |
| Défis actifs | Cache-Aside | 5 min | Moyenne |

**Clés recommandées** :
```
gamification:leaderboard     - Classement global
gamification:user:{id}:points  - Points utilisateur
gamification:badges         - Liste badges
gamification:defis:active   - Défis actifs
```

### 6. service-analytics (port 3015)

| Donnée à cacher | Stratégie | TTL | Priorité |
|-----------------|-----------|-----|----------|
| KPIs dashboard | Cache-Aside | 1 min | **Haute** |
| Agrégations zones | Cache-Aside | 5 min | Haute |
| Données heatmap | Refresh-ahead | 15 min | Moyenne |
| Rapports générés | Cache-Aside | 30 min | Basse |

**Clés recommandées** :
```
analytics:kpi:dashboard    - KPIs dashboard
analytics:zone:{id}       - Stats zone
analytics:heatmap         - Données heatmap
analytics:report:{id}     - Rapport généré
```

---

## Comment Implémenter Redis

### Installation

```bash
# Dans chaque service
npm install redis@4 ioredis@5
```

### Configuration .env

```env
# Redis (共用)
REDIS_HOST=ecotrack-redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Exemple d'implémentation

```javascript
// src/services/cacheService.js
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      database: process.env.REDIS_DB || 0
    });
    
    this.client.on('error', (err) => console.error('Redis Error:', err));
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  // Cache-Aside pattern
  async getOrSet(key, fn, ttl = 300) {
    const cached = await this.client.get(key);
    if (cached) return JSON.parse(cached);
    
    const data = await fn();
    await this.client.setEx(key, ttl, JSON.stringify(data));
    return data;
  }

  // Invalidation
  async invalidate(pattern) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

module.exports = new CacheService();
```

### Utilisation dans un contrôleur

```javascript
// service-users/src/controllers/userController.js
const cacheService = require('../services/cacheService');

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `user:${id}:profile`;
  
  const user = await cacheService.getOrSet(
    cacheKey,
    () => userService.getById(id),
    300 // 5 min TTL
  );
  
  res.json(user);
});

// Invalidation lors de la mise à jour
router.put('/users/:id', async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  await cacheService.invalidate(`user:${req.params.id}:*`);
  res.json(user);
});
```

---

# 📋 Exigences Non-Fonctionnelles (NFR)

## VII. EXIGENCES NON FONCTIONNELLES

### 7.1 Performance

| Exigence | Cible | Status | Service responsable |
|----------|-------|--------|-------------------|
| Temps réponse API | < 500ms (P95) | ⚠️ À optimiser | Tous |
| Requêtes SQL | < 200ms (90%) | ⚠️ À optimiser | PostgreSQL |
| Chargement page | < 3s (Lighthouse) | ❌ Non implémenté | Frontend |
| Concurrent users | 500 utilisateurs | ⚠️ Test à faire | API Gateway |
| IoT throughput | 2000 mesures/5min | ✅ Avec Kafka | service-iot |
| Cache hit ratio | > 80% | ⚠️ À mesurer | Redis |

### 7.2 Capacité (Scale)

| Ressource | Cible | Status |
|-----------|-------|--------|
| Conteneurs IoT | 2000 | ✅ Structure OK |
| Utilisateurs | 15000 | ✅ Structure OK |
| Capteurs | 2000 | ✅ Structure OK |
| Tournées/jour | ~100 | ✅ Structure OK |

### 7.3 Disponibilité

| Exigence | Cible | Status |
|----------|-------|--------|
| Uptime | 99.9% | ⚠️ Sans K8s |
| Recovery Time | < 1h | ❌ Non défini |
| Backup | Quotidien | ⚠️ À implémenter |

### 7.4 Sécurité

| Exigence | Status |
|----------|--------|
| JWT Auth | ✅ |
| RBAC | ✅ |
| Rate Limiting | ✅ |
| HTTPS | ⚠️ À configurer |
| Chiffrement BDD | ❌ Non |

### 7.5 Monitoring

| Métrique | Cible | Status |
|----------|-------|--------|
| Latence P95 | < 500ms | ⚠️ À mesurer |
| Error rate | < 1% | ⚠️ À mesurer |
| Cache hit rate | > 80% | ❌ Non implémenté |

---

## Tableau de Bord NFR

| NFR | Métrique | Actuel | Cible | Action |
|-----|----------|--------|-------|--------|
| Latence API | P95 latency | ? ms | < 500ms | Tester avec K6 |
| Requêtes DB | P90 query time | ? ms | < 200ms | Ajouter indexes |
| Cache | Hit ratio | ~60% | > 80% | Compléter Redis |
| IoT | Throughput | ✅ 400+/min | 400+/min | Kafka OK |
| Page Load | Lighthouse | ? | < 3s | Lazy loading |
| Users | Concurrent | ? | 500 | Load testing |

---

## Actions Prioritaires pour NFR

1. **Haute** : Tests de charge K6 (valider 500 users)
2. **Haute** : Mobile App (M5.2)
3. **Moyenne** : Lazy loading frontend (Lighthouse)
4. **Moyenne** : Ajouter indexes PostgreSQL
5. **Basse** : XAI/SHAP pour ML

---

# 📊 État des Services Backend (2026-03-19)

## Vue d'ensemble par Service

| Aspect | users | routes | iot | analytics | gamif | gateway |
|--------|:-----:|:------:|:---:|:---------:|:-----:|:-------:|
| **Input Validation** | Zod ✅ | Joi ✅ | Joi ✅ | Joi ✅ | Zod ✅ | Delegated ✅ |
| **Error Handling** | Centralisé ✅ | Centralisé ✅ | ✅ | ❌ Ad-hoc | ❌ | ✅ |
| **Logging (Pino)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Caching (Redis)** | ✅ | ✅ | ⚠️ Partial | ⚠️ Partial | ✅ | ❌ |
| **Rate Limiting** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Authentication** | JWT ✅ | ❌* | ❌* | JWT ✅ | ❌ | JWT ✅ |
| **Authorization (RBAC)** | ✅ | ❌* | ❌* | ❌ | ❌ | Role ✅ |
| **Pagination** | ✅ | ✅ | ✅ | ⚠️ Partial | ⚠️ Limited | Delegated ✅ |
| **DB Optimization** | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | N/A |
| **Unit Tests** | ✅ | ✅ | ✅ | ⚠️ Integration | ✅ | ⚠️ Partial |

*\*Relies on API Gateway*

## Lacunes Identifiées (Backend)

### 🔴 Priorité Haute

| Service | Problème | Solution |
|---------|----------|----------|
| **service-routes** | Pas de rate limiting | Ajouter `express-rate-limit` |
| **service-analytics** | Error handling ad-hoc | Centraliser avec middleware |
| **service-gamifications** | Pas d'auth JWT | Ajouter middleware auth |
| **service-analytics** | Pas de pagination complète | Uniformiser avec page/limit |

### 🟡 Priorité Moyenne

| Service | Problème | Solution |
|---------|----------|----------|
| **service-iot** | Cache Redis sous-utilisé | Implémenter `CacheService` |
| **service-analytics** | Cache Redis partiel | Compléter avec pattern |
| **Tous** | DB query optimization | Ajouter indexes, EXPLAIN |
| **service-gamifications** | Pagination limitée | Ajouter `page` param |

### 🟢 Priorité Basse (Post-Dev)

| Service | Problème | Solution |
|---------|----------|----------|
| **API Gateway** | Pas de cache global | Ajouter Redis layer |
| **API Gateway** | Pas de rate limiting | Ajouter à l'entrée |
| **service-analytics** | Tests unitaires manquants | Ajouter Jest/Supertest |

## Étapes Backend Suggérées (après Monitoring)

### 1. Standardisation Error Handling
```
service-analytics/      → Ajouter errorHandler middleware
service-gamifications/  → Ajouter errorHandler middleware
```

### 2. Ajouter Rate Limiting
```
service-routes/         → 100 req/min pour endpoints publics
API Gateway/            → 500 req/min global
```

### 3. Authentification Uniforme
```
service-routes/         → JWT middleware
service-iot/            → JWT middleware  
service-gamifications/  → JWT middleware
```

### 4. Cache Redis Complet
```
service-iot/            → CacheService pattern
service-analytics/      → Compléter getOrSet
```

### 5. Tests & Optimisation
```
service-analytics/      → Unit tests
DB/                     → Indexes sur tables fréquentes
```

## Checklist Backend Avant Prod

- [ ] Error handling centralisé (tous services)
- [ ] Rate limiting (tous services)
- [ ] Auth JWT (service-routes, service-iot, service-gamifications)
- [ ] Pagination uniforme
- [ ] Cache Redis complet
- [ ] Unit tests service-analytics
- [ ] Indexes PostgreSQL
- [ ] Tests charge K6

