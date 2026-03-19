# EcoTrack - Métriques Grafana & Prometheus

> Dashboard complet pour monitoring EcoTrack

---

## 1. Infrastructure - Métriques Système

### 1.1 CPU

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `node_cpu_seconds_total` | Counter | `rate(node_cpu_seconds_total{mode!="idle"}[5m]) * 100` | CPU usage % |
| `node_cpu_usage_percent` | Gauge | `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` | CPU global % |
| `container_cpu_usage_seconds_total` | Counter | `rate(container_cpu_usage_seconds_total[5m])` | CPU par conteneur |

**Alert**:
```yaml
alert: HighCPUUsage
expr: cpu_usage_percent > 80
for: 5m
labels:
  severity: warning
action: Scale service or restart pod
```

### 1.2 Mémoire RAM

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `node_memory_MemTotal_bytes` | Gauge | `node_memory_MemTotal_bytes` | RAM totale |
| `node_memory_MemAvailable_bytes` | Gauge | `node_memory_MemAvailable_bytes` | RAM disponible |
| `node_memory_Usage_percent` | Gauge | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100` | RAM utilisée % |
| `container_memory_usage_bytes` | Gauge | `container_memory_usage_bytes` | RAM par conteneur |

**Alert**:
```yaml
alert: HighMemoryUsage
expr: memory_usage_percent > 85
for: 5m
labels:
  severity: warning
action: OOM kill imminent
```

### 1.3 Réseau

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `node_network_receive_bytes_total` | Counter | `rate(node_network_receive_bytes_total[1m]) * 8 / 1000000` | Réseau IN (Mbps) |
| `node_network_transmit_bytes_total` | Counter | `rate(node_network_transmit_bytes_total[1m]) * 8 / 1000000` | Réseau OUT (Mbps) |
| `container_network_receive_bytes_total` | Counter | `rate(container_network_receive_bytes_total[1m])` | IN par conteneur |
| `container_network_transmit_bytes_total` | Counter | `rate(container_network_transmit_bytes_total[1m])` | OUT par conteneur |

### 1.4 Disque

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `node_filesystem_size_bytes` | Gauge | `node_filesystem_size_bytes{mountpoint="/"}` | Disque total |
| `node_filesystem_avail_bytes` | Gauge | `node_filesystem_avail_bytes{mountpoint="/"}` | Disque disponible |
| `disk_usage_percent` | Gauge | `(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100` | Utilisation % |

**Alert**:
```yaml
alert: DiskSpaceLow
expr: disk_usage_percent > 90
for: 10m
labels:
  severity: critical
action: Clean logs or expand storage
```

---

## 2. Services - Health & Performance

### 2.1 Health Status

| Service | Port | Endpoint | Status Query |
|---------|------|----------|--------------|
| API Gateway | 3000 | `/health` | `up{job="api-gateway"}` |
| service-users | 3010 | `/health` | `up{job="service-users"}` |
| service-containers | 3011 | `/health` | `up{job="service-containers"}` |
| service-routes | 3012 | `/health` | `up{job="service-routes"}` |
| service-iot | 3013 | `/health` | `up{job="service-iot"}` |
| service-gamifications | 3014 | `/health` | `up{job="service-gamifications"}` |
| service-analytics | 3015 | `/health` | `up{job="service-analytics"}` |
| PostgreSQL | 5432 | - | `pg_up` |
| Redis | 6379 | - | `redis_up` |
| Kafka | 9092 | - | `kafka_broker_up` |

**Panel Grafana**:
```
Services Health Status
Status: 1 (UP) = Vert
Status: 0 (DOWN) = Rouge
```

**Alert**:
```yaml
alert: ServiceDown
expr: up{job=~"service-.*"} == 0
for: 1m
labels:
  severity: critical
action: Restart service container
```

### 2.2 Latence (Response Time)

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `http_request_duration_seconds_avg` | Histogram | `rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])` | Latence moyenne (ms) |
| `http_request_duration_seconds_p50` | Histogram | `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))` | Latence P50 |
| `http_request_duration_seconds_p95` | Histogram | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | Latence P95 |
| `http_request_duration_seconds_p99` | Histogram | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` | Latence P99 |

**Panel Grafana**:
```
Response Time (ms)
├── AVG: {avg_value} ms
├── P50: {p50_value} ms
├── P95: {p95_value} ms
└── P99: {p99_value} ms
```

**Alert**:
```yaml
alert: HighLatency
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
for: 5m
labels:
  severity: warning
action: Investigate slow endpoints
```

### 2.3 Débit (Requests/sec)

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `http_requests_total` | Counter | `rate(http_requests_total[1m])` | Requêtes/sec |
| `http_requests_by_service` | Counter | `sum by (job) (rate(http_requests_total[1m]))` | Par service |

### 2.4 Taux d'erreur

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `http_requests_5xx_total` | Counter | `rate(http_requests_total{status=~"5.."}[5m])` | Erreurs 5xx/sec |
| `error_rate_percent` | Gauge | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100` | Taux erreur % |

**Alert**:
```yaml
alert: HighErrorRate
expr: error_rate_percent > 1
for: 5m
labels:
  severity: critical
action: Investigate 5xx errors
```

---

## 3. IoT - Capteurs & Conteneurs

### 3.1 Capteurs Actifs/Inactifs

| Métrique | Type | Source | Description |
|----------|------|--------|-------------|
| `iot_sensors_total` | Gauge | DB query | Nombre total capteurs |
| `iot_sensors_active` | Gauge | DB query | Capteurs actifs (mesure < 1h) |
| `iot_sensors_inactive` | Gauge | DB query | Capteurs inactifs (dernière mesure > 12h) |
| `iot_sensors_low_battery` | Gauge | DB query | Batterie < 20% |

**Query SQL** (via postgres_exporter):
```sql
-- Capteurs inactifs > 12h
SELECT count(*) as sensors_inactive_12h 
FROM capteur 
WHERE last_measurement_at < NOW() - INTERVAL '12 hours';

-- Capteurs batterie faible
SELECT count(*) as sensors_low_battery 
FROM capteur 
WHERE batterie < 20;
```

**Panel Grafana**:
```
IoT Sensors Status
├── Total: {total}
├── Active: {active}  [VERT]
├── Inactive (>12h): {inactive}  [ROUGE]
└── Low Battery (<20%): {low_battery}  [ORANGE]
```

### 3.2 Messages Kafka IoT

| Métrique | Type | Source | Description |
|----------|------|--------|-------------|
| `kafka_messages_in_per_min` | Gauge | Kafka metrics | Messages/minute |
| `kafka_messages_out_per_min` | Gauge | Kafka metrics | Messages produits/min |
| `kafka_consumer_lag` | Gauge | Kafka metrics | Lag consumer |

**Query**:
```promql
# Messages par minute
rate(kafka_server_brokertopicmessages_total[1m]) * 60

# Consumer lag
kafka_consumer_group_lag{topic="ecotrack.sensor.data"}
```

### 3.3 Dernière Mesure

| Métrique | Type | Description |
|----------|------|-------------|
| `iot_last_measurement_age_seconds` | Gauge | Age de la dernière mesure (en secondes) |
| `iot_last_measurement_per_container` | Gauge | Age par conteneur |

**Panel**:
```
Last Measurement
├── Overall: {age}s ago
├── Oldest: {oldest}s ago
└── Containers without recent data: {count}
```

**Alert**:
```yaml
alert: NoRecentMeasurements
expr: iot_last_measurement_age_seconds > 3600
for: 30m
labels:
  severity: warning
action: Check IoT service connectivity
```

### 3.4 Conteneurs - Remplissage

| Métrique | Type | Source | Description |
|----------|------|--------|-------------|
| `container_fill_level_avg` | Gauge | DB query | Niveau moyen remplissage % |
| `containers_critical` | Gauge | DB query | Conteneurs > 90% |
| `containers_warning` | Gauge | DB query | Conteneurs > 75% |

**Query SQL**:
```sql
-- Conteneurs critiques (>90%)
SELECT count(*) FROM conteneur WHERE niveau_remplissage > 90;

-- Conteneurs en alerte (>75%)
SELECT count(*) FROM conteneur WHERE niveau_remplissage > 75;
```

**Alert**:
```yaml
alert: ContainerOverflowRisk
expr: containers_critical > 10
for: 15m
labels:
  severity: critical
action: Schedule emergency collection
```

---

## 4. Kafka - Message Broker

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `kafka_broker_up` | Gauge | `kafka_broker_up` | Broker status (1=UP) |
| `kafka_messages_in_total` | Counter | `rate(kafka_server_brokertopicmessages_in_total[5m])` | Messages/sec IN |
| `kafka_messages_out_total` | Counter | `rate(kafka_server_brokertopicmessages_out_total[5m])` | Messages/sec OUT |
| `kafka_consumer_lag` | Gauge | `kafka_consumergroup_lag` | Consumer lag |
| `kafka_partitions_under_replicated` | Gauge | `kafka_server_replicamanager_underreplicatedpartitions_value` | Partitions sous-répliquées |

**Alert**:
```yaml
alert: KafkaConsumerLagHigh
expr: kafka_consumer_lag > 1000
for: 10m
labels:
  severity: warning
action: Scale consumers

alert: KafkaBrokerDown
expr: kafka_broker_up == 0
for: 1m
labels:
  severity: critical
action: Restart Kafka broker
```

---

## 5. Database - PostgreSQL

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `pg_stat_database_numbackends` | Gauge | `pg_stat_database_numbackends` | Connexions actives |
| `pg_stat_database_tup_returned` | Counter | `rate(pg_stat_database_tup_returned[5m])` | Rows retournées/sec |
| `pg_stat_database_tup_fetched` | Counter | `rate(pg_stat_database_tup_fetched[5m])` | Rows fetchées/sec |
| `pg_stat_database_blks_hit` | Counter | `rate(pg_stat_database_blks_hit[5m])` / `rate(pg_stat_database_blks_read[5m])` | Cache hit ratio |

**Panel**:
```
PostgreSQL
├── Connections: {active}/{max}
├── Cache Hit Ratio: {ratio}%
├── Queries/sec: {qps}
└── Dead Tuples: {dead}
```

---

## 6. Redis - Cache

| Métrique | Type | Query PromQL | Description |
|----------|------|--------------|-------------|
| `redis_connected_clients` | Gauge | `redis_connected_clients` | Clients connectés |
| `redis_keyspace_hits_total` | Counter | `rate(redis_keyspace_hits_total[5m])` | Cache hits/sec |
| `redis_keyspace_misses_total` | Counter | `rate(redis_keyspace_misses_total[5m])` | Cache misses/sec |
| `redis_hit_rate` | Gauge | `redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100` | Hit rate % |

---

## 7. Alertes - Configuration Complete

### 7.1 Règles d'Alertes

```yaml
# prometheus-rules.yml
groups:
  - name: ecotrack-infrastructure
    rules:
      # CPU
      - alert: HighCPU
        expr: cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
          category: infrastructure
        annotations:
          summary: "CPU élevé sur {{ $labels.instance }}"
          description: "CPU: {{ $value | humanize }}%"
          current_value: "{{ $value }}"
          threshold: "80%"
          action: "Vérifier processus consommateur CPU"

      - alert: CriticalCPU
        expr: cpu_usage_percent > 95
        for: 2m
        labels:
          severity: critical
          category: infrastructure
        annotations:
          summary: "CPU critique sur {{ $labels.instance }}"
          action: "Restart service immédiatement"

      # Memory
      - alert: HighMemory
        expr: memory_usage_percent > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Mémoire élevée"
          action: "OOM kill imminent - scale service"

      # Disk
      - alert: DiskSpaceLow
        expr: disk_usage_percent > 85
        for: 10m
        labels:
          severity: warning
        action: "Nettoyer logs"

      - alert: DiskSpaceCritical
        expr: disk_usage_percent > 95
        for: 5m
        labels:
          severity: critical
        action: "Expansion stockage urgente"

  - name: ecotrack-services
    rules:
      # Service Down
      - alert: ServiceDown
        expr: up{job=~"service-.*"} == 0
        for: 1m
        labels:
          severity: critical
          category: availability
        annotations:
          summary: "{{ $labels.job }} est DOWN"
          service: "{{ $labels.job }}"
          port: "{{ $labels.port }}"
          action: "docker compose restart {{ $labels.job }}"

      # Latency
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
          category: performance
        annotations:
          summary: "Latence P95 élevée"
          current_value: "{{ $value | humanizeDuration }}"
          threshold: "500ms"
          action: "Investiguer endpoints lents"

      - alert: CriticalLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 2m
        labels:
          severity: critical
        action: "Scale service immédiatement"

      # Error Rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Taux d'erreur > 1%"
          error_rate: "{{ $value | humanizePercentage }}"
          action: "Vérifier logs erreurs 5xx"

      - alert: CriticalErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        action: "Incident majeur - rollback si nécessaire"

  - name: ecotrack-iot
    rules:
      - alert: SensorsInactive
        expr: iot_sensors_inactive > 10
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "{{ $value }} capteurs inactifs > 12h"
          action: "Vérifier capteurs ou connectivité"

      - alert: SensorsLowBattery
        expr: iot_sensors_low_battery > 5
        for: 1h
        labels:
          severity: warning
        action: "Planifier remplacement batteries"

      - alert: NoRecentMeasurements
        expr: iot_last_measurement_age_seconds > 3600
        for: 30m
        labels:
          severity: warning
        action: "Vérifier service IoT"

      - alert: ContainerOverflowRisk
        expr: containers_critical > 5
        for: 15m
        labels:
          severity: critical
        action: "Planifier collecte urgente"

  - name: ecotrack-kafka
    rules:
      - alert: KafkaConsumerLag
        expr: kafka_consumer_lag > 1000
        for: 10m
        labels:
          severity: warning
        action: "Scale consumers"

      - alert: KafkaBrokerDown
        expr: kafka_broker_up == 0
        for: 1m
        labels:
          severity: critical
        action: "Restart Kafka broker"
```

### 7.2 Tableau Récapitulatif des Alertes

| Alert | Condition | Seuil | Status | Action |
|-------|-----------|-------|--------|--------|
| HighCPU | cpu > 80% | 5min | `{{ cpu_status }}` | Scale/Restart |
| CriticalCPU | cpu > 95% | 2min | `{{ cpu_status }}` | Restart urgent |
| HighMemory | mem > 85% | 5min | `{{ mem_status }}` | Scale service |
| DiskSpaceLow | disk > 85% | 10min | `{{ disk_status }}` | Clean logs |
| ServiceDown | up == 0 | 1min | `{{ service_status }}` | Restart |
| HighLatency | P95 > 500ms | 5min | `{{ latency_ms }}ms` | Investigate |
| HighErrorRate | errors > 1% | 5min | `{{ error_rate }}%` | Check logs |
| SensorsInactive | inactive > 10 | 1h | `{{ count }}` | Check sensors |
| SensorsLowBattery | low_battery > 5 | 1h | `{{ count }}` | Replace batteries |
| KafkaLag | lag > 1000 | 10min | `{{ lag }}` | Scale consumers |

---

## 8. Dashboard Grafana - Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EcoTrack - Monitoring Dashboard                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Filters: [Service ▼] [Time Range ▼] [Zone ▼]                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ Services Health  │ │ CPU Usage       │ │ Memory Usage    │            │
│  │ ●●●●●●○ 6/7 UP  │ │ ████████░░ 78% │ │ ██████░░░░ 62% │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ Network IN/OUT   │ │ Disk Usage       │ │ Response Time    │            │
│  │ ▼ 125 Mbps / 89  │ │ ████░░░░░ 42%  │ │ AVG: 45ms       │            │
│  └──────────────────┘ └──────────────────┘ │ P95: 120ms      │            │
│                                          │ P99: 250ms      │            │
│                                          └──────────────────┘            │
├─────────────────────────────────────────────────────────────────────────────┤
│  IoT Sensors                          │ Kafka Messages                     │
│  ┌────────────────────────────────┐  │ ┌────────────────────────────────┐  │
│  │ Total: 2000                    │  │ │ Messages/min: 42              │  │
│  │ Active: 1977 ✓                │  │ │ Topics: 4                     │  │
│  │ Inactive (>12h): 23 ⚠         │  │ │ Lag: 12                       │  │
│  │ Low Battery: 8 ⚠               │  │ └────────────────────────────────┘  │
│  └────────────────────────────────┘  │                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Containers Fill Level                 │ Database Connections              │
│  ┌────────────────────────────────┐  │ ┌────────────────────────────────┐  │
│  │ Average: 62%                  │  │ │ Active: 24/100                │  │
│  │ Critical (>90%): 12 ⚠          │  │ │ Cache Hit: 94%                │  │
│  │ Warning (>75%): 45             │  │ └────────────────────────────────┘  │
│  └────────────────────────────────┘  │                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Active Alerts (3)                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ ⚠ HighCPU - service-analytics - CPU: 82% - 5m ago    [Acknowledge]  │ │
│  │ ⚠ SensorsInactive - 23 capteurs - last 14h           [Investigate]   │ │
│  │ 🔴 ServiceDown - service-iot - DOWN - 2m ago          [Restart]       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Variables Grafana

```javascript
// Variables à configurer dans Grafana

$environment = [production, staging, development]
$service = [api-gateway, service-users, service-containers, service-routes, service-iot, service-gamifications, service-analytics]
$zone = [Zone-Nord, Zone-Sud, Zone-Est, Zone-Ouest, Zone-Centre]
$alert_severity = [critical, warning, info]
```

---

## 10. Panels Frontend - Préparation

### API Endpoints pour Frontend

```javascript
// GET /api/metrics/overview
{
  infrastructure: {
    cpu: { current: 78, avg_1h: 65, max: 95 },
    memory: { current: 62, avg_1h: 58, max: 85 },
    disk: { current: 42, avg_1h: 40, max: 55 },
    network: { in_mbps: 125, out_mbps: 89 }
  },
  services: {
    healthy: 6,
    total: 7,
    details: [
      { name: 'api-gateway', status: 'up', latency_ms: 45 },
      { name: 'service-users', status: 'up', latency_ms: 38 },
      { name: 'service-iot', status: 'down', latency_ms: null }
    ]
  },
  iot: {
    sensors: { total: 2000, active: 1977, inactive_12h: 23, low_battery: 8 },
    last_measurement_age_seconds: 2,
    messages_per_min: 42
  },
  containers: {
    avg_fill_level: 62,
    critical: 12,
    warning: 45
  },
  kafka: {
    messages_per_sec: 0.7,
    consumer_lag: 12,
    broker_status: 'up'
  },
  database: {
    connections: { active: 24, max: 100 },
    cache_hit_ratio: 94
  },
  alerts: {
    critical: 1,
    warning: 2,
    total: 3
  }
}

// GET /api/metrics/history?metric=cpu&period=24h
{
  metric: 'cpu',
  period: '24h',
  data: [
    { timestamp: '2026-03-19T10:00:00Z', value: 65 },
    { timestamp: '2026-03-19T11:00:00Z', value: 72 },
    // ...
  ]
}

// GET /api/alerts
{
  alerts: [
    {
      id: 'alert-001',
      name: 'HighCPU',
      severity: 'warning',
      service: 'service-analytics',
      value: 82,
      threshold: 80,
      started_at: '2026-03-19T18:00:00Z',
      status: 'firing'
    }
  ]
}
```

---

## 11. Exporters Nécessaires

```yaml
# docker-compose.yml - Exporters à ajouter

node-exporter:
  image: prom/node-exporter:latest
  ports:
    - "9100:9100"
  command:
    - '--path.procfs=/host/proc'
    - '--path.sysfs=/host/sys'
    - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
    - /:/rootfs:ro

postgres-exporter:
  image: prometheuscommunity/postgres-exporter:v0.15.0
  environment:
    DATA_SOURCE_NAME: "postgresql://ecotrack_user:ecotrack_password@postgres:5432/ecotrack?sslmode=disable"
  ports:
    - "9187:9187"
  volumes:
    - ./monitoring/prometheus/postgres-queries.yml:/etc/postgres-exporter/queries.yml

redis-exporter:
  image: oliver006/redis_exporter:latest
  environment:
    REDIS_ADDR: "redis://redis:6379"
  ports:
    - "9121:9121"

kafka-exporter:
  image: danielqsj/kafka-exporter:latest
  environment:
    KAFKA_BROKERS: "kafka:29092"
  ports:
    - "9308:9308"
```

---

## 12. Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Node Exporter (System)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # Services
  - job_name: 'ecotrack-services'
    static_configs:
      - targets:
          - 'api-gateway:3000'
          - 'service-users:3010'
          - 'service-containers:3011'
          - 'service-routes:3012'
          - 'service-iot:3013'
          - 'service-gamifications:3014'
          - 'service-analytics:3015'
    metrics_path: '/metrics'

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Kafka
  - job_name: 'kafka'
    static_configs:
      - targets: ['kafka-exporter:9308']
```

---

## 13. Commandes Utiles

```bash
# Vérifier métriques
curl http://localhost:9090/api/v1/query?query=up

# Tester alerte
curl http://localhost:9090/api/v1/alerts

# Voir targets
curl http://localhost:9090/api/v1/targets | jq

# Logs service
docker compose logs -f service-iot

# Restart service
docker compose restart service-iot

# Metrics service
curl http://localhost:3013/metrics | grep http_request
```
