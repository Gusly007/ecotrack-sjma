# Prometheus - Guide de Monitoring

## Accès

- **URL** : http://localhost:9090
- **Pas de login requis**

## Comment Afficher les Métriques

### Via l'interface Prometheus

1. Ouvrir http://localhost:9090
2. Cliquer sur **"Graph"** dans le menu
3. Entrer une requête (voir ci-dessous)
4. Cliquer sur **"Execute"**
5. Résultats en bas (tableau) ou graphique

---

##  Requêtes par Catégorie

### Infrastructure

```promql
# CPU Usage (%)
(1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100

# Memory Usage (%)
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk Usage (%)
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Network Received (Mbps)
rate(node_network_receive_bytes_total[1m]) * 8 / 1000000

# Network Transmitted (Mbps)
rate(node_network_transmit_bytes_total[1m]) * 8 / 1000000
```

### Services Health

```promql
# Tous les services
up{job=~"service-.*"}

# Service spécifique
up{job="service-users"}

# Uptime (secondes)
time() - process_start_time_seconds{job=~"service-.*"}

# Mémoire par service (bytes)
process_resident_memory_bytes{job=~"service-.*"}
```

### HTTP Metrics

```promql
# Requêtes par seconde (total)
sum(rate(http_requests_total[5m]))

# Requêtes par service
sum(rate(http_requests_total[5m])) by (job)

# Erreurs 5xx par service
sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)

# Erreurs 4xx par service
sum(rate(http_requests_total{status=~"4.."}[5m])) by (job)

# Latence P50 (médiane)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# Latence P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Latence P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Kafka

```promql
# Broker UP (1/0)
kafka_brokers

# Messages/minute
rate(kafka_server_brokertopicmessages_in_total[1m]) * 60

# Consumer Lag
kafka_consumer_group_lag

# Topics partitions
kafka_topic_partitions

# Replicas sous-répliquées
kafka_topic_partition_under_replicated_partition
```

### IoT (Capteurs & Conteneurs)

```promql
# Capteurs totaux
ecotrack_iot_sensors_total

# Capteurs inactifs >12h
ecotrack_iot_sensors_inactive_12h

# Capteurs batterie faible
ecotrack_iot_sensors_low_battery

# Age dernière mesure (secondes)
ecotrack_iot_last_measurement_age

# Conteneurs critiques (>90%)
ecotrack_containers_critical

# Conteneurs warning (75-90%)
ecotrack_containers_warning

# Niveau remplissage moyen
ecotrack_containers_avg_fill_level
```

### Tournées & Signalements

```promql
# Tournées en cours
ecotrack_tournees_en_cours

# Tournées terminées aujourd'hui
ecotrack_tournees_terminees_aujourdhui

# Signalements en attente
ecotrack_signalements_en_attente

# Signalements urgents non résolus
ecotrack_signalements_urgents
```

### Database (PostgreSQL)

```promql
# Connexions actives
ecotrack_db_connections

# Connexions max
ecotrack_db_max_connections

# Cache hit ratio (%)
rate(pg_stat_database_blks_hit[5m]) / 
(rate(pg_stat_database_blks_hit[5m]) + rate(pg_stat_database_blks_read[5m])) * 100

# Cache hit ratio (postgres_exporter)
ecotrack_db_cache_hit_ratio
```

---

##  Alertes (Prometheus)

### Service Down
```promql
# Alerte si un service est DOWN pendant 2min
up{job=~"service-.*"} == 0
```

### High CPU
```promql
# CPU > 80% pendant 5min
(1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100 > 80
```

### High Memory
```promql
# Memory > 85% pendant 5min
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
```

### Disk Space
```promql
# Disk > 90%
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
```

### High Error Rate
```promql
# Erreurs 5xx > 1% pendant 5min
sum(rate(http_requests_total{status=~"5.."}[5m])) 
/ sum(rate(http_requests_total[5m])) * 100 > 1
```

### Kafka Down
```promql
# Kafka broker DOWN
kafka_brokers == 0
```

### Consumer Lag
```promql
# Consumer lag > 1000 pendant 5min
kafka_consumer_group_lag > 1000
```

### Conteneurs Critiques
```promql
# Conteneurs > 90% remplissage
ecotrack_containers_critical > 0
```

### Batterie Faible
```promql
# Capteurs batterie < 20%
ecotrack_iot_sensors_low_battery > 0
```

### Capteurs Inactifs
```promql
# Capteurs inactifs > 12h
ecotrack_iot_sensors_inactive_12h > 10
```

### Signalements Urgents
```promql
# Signalements urgents non résolus
ecotrack_signalements_urgents > 0
```

---

## API Alertes Frontend (service-analytics:3015)

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/metrics/alerts` | Liste des alertes (filtrable) |
| `GET /api/metrics/alerts?severity=critical` | Filtrer par sévérité |
| `GET /api/metrics/alerts?service=service-iot` | Filtrer par service |
| `GET /api/metrics/alerts/counts` | Compteurs par sévérité |

### Paramètres de filtrage

| Param | Valeurs | Description |
|-------|---------|-------------|
| `severity` | `critical`, `warning`, `info` | Filtrer par sévérité |
| `service` | `service-iot`, `service-users`, etc. | Filtrer par service |
| `status` | `firing`, `pending` | Filtrer par état |

### Format de réponse

```json
{
  "alerts": [
    {
      "id": "HighCPU-service-analytics-1711000000000",
      "name": "HighCPU",
      "severity": "warning",
      "severityLevel": 2,
      "status": "firing",
      "service": "service-analytics",
      "instance": "service-analytics:3015",
      "summary": "CPU usage is high",
      "description": "CPU usage is 85% (threshold: 80%)",
      "action": "Check running processes",
      "category": "infrastructure",
      "activeSince": "2026-03-22T00:25:00.000Z",
      "timeAgo": "il y a 35min",
      "minutesAgo": 35,
      "hoursAgo": 0,
      "daysAgo": 0
    }
  ],
  "counts": {
    "critical": 1,
    "warning": 3,
    "info": 0,
    "pending": 1,
    "firing": 3
  },
  "total": 4
}
```

### Sevérités

| Level | Severity | Couleur Frontend |
|-------|----------|-----------------|
| 1 | critical | 🔴 Rouge |
| 2 | warning | 🟡 Jaune |
| 3 | medium | 🟠 Orange |
| 4 | info | 🔵 Bleu |

### Exemple Frontend

```javascript
// Récupérer toutes les alertes
const { alerts, counts, total } = await fetch('/api/metrics/alerts').then(r => r.json());

// Badge compteur (pour header/notification)
const { counts } = await fetch('/api/metrics/alerts/counts').then(r => r.json());
// counts = { critical: 1, warning: 3, info: 0 }

// Filtrer critiques seulement
const crit = await fetch('/api/metrics/alerts?severity=critical').then(r => r.json());
```

---

## Services Disponibles

| Service | Port | Metrics |
|---------|------|---------|
| API Gateway | 3000 | ✅ |
| Service Users | 3010 | ✅ |
| Service Containers | 3011 | ✅ |
| Service Gamifications | 3014 | ✅ |
| Service IoT | 3013 | ✅ |
| Service Analytics | 3015 | ✅ |
| Service Routes | 3012 | ✅ |
| Kafka | 9092 | ✅ |
| PostgreSQL | 5432 | ✅ |
| Redis | 6379 | ✅ |

## Configuration

- **Config** : `monitoring/prometheus/prometheus.yml`
- **Alert rules** : `monitoring/prometheus/alert_rules.yml`
- **PostgreSQL queries** : `monitoring/prometheus/postgres-queries.yml`
- **Intervalle scrape** : 15s
- **Rétention** : 15j

## Commandes Utiles

```bash
# Targets status
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Métriques brutes service
curl -s http://localhost:3010/metrics | head -50

# Alertes actives
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | {name: .labels.alertname, state: .state}'

# Recharger config
curl -X POST http://localhost:9090/-/reload

# Redémarrer
docker restart ecotrack-prometheus
```

## Troubleshooting

### Service DOWN
```bash
docker ps | grep <service>
docker logs <container>
```

### Métriques Manquantes
```bash
curl -s http://localhost:3010/metrics | grep http
# Vérifier Status > Targets dans Prometheus
```

### Alertes non déclenchées
```bash
# Vérifier que la condition est vraie
curl "http://localhost:9090/api/v1/query?query=<votre_requete>"
```
