# Grafana - Guide de Visualisation

## Accès

- **URL** : http://localhost:3001
- **Login** : admin
- **Mot de passe** : admin

## Dashboards

### Dashboard EcoTrack Overview

Voir `monitoring/grafana/dashboards/ecotrack-overview.json`

1. Aller dans **Dashboards** → **Import**
2. Coller le JSON du dashboard
3. Choisir "Prometheus" comme source de données

### Panels Principaux

| Panel | Type | Source |
|-------|------|--------|
| **Services Health** | Stat | `up{job=~"service-.*"}` |
| **CPU Usage** | Gauge | `node_cpu_usage` |
| **Memory Usage** | Gauge | `node_memory_usage` |
| **Disk Usage** | Gauge | `node_disk_usage` |
| **HTTP Requests/s** | Graph | `rate(http_requests_total[5m])` |
| **Error Rate 5xx** | Graph | `rate(http_requests_total{status=~"5.."}[5m])` |
| **Latency P95** | Graph | `histogram_quantile(0.95, ...)` |
| **Kafka Messages/min** | Graph | `kafka_server_brokertopicmessages_in_total` |
| **Consumer Lag** | Graph | `kafka_consumer_group_lag` |
| **DB Connections** | Stat | `ecotrack_db_connections` |
| **Cache Hit Ratio** | Gauge | `pg_stat_database_blks_hit` |

## IoT Metrics (PostgreSQL Exporter)

| Requête PromQL | Description |
|----------------|-------------|
| `ecotrack_iot_sensors_total` | Nombre total de capteurs |
| `ecotrack_iot_sensors_inactive_12h` | Capteurs inactifs >12h |
| `ecotrack_iot_sensors_low_battery` | Capteurs batterie faible |
| `ecotrack_containers_critical` | Conteneurs critiques |
| `ecotrack_containers_warning` | Conteneurs en warning |
| `ecotrack_iot_last_measurement_age` | Age dernière mesure (sec) |

## Kafka Metrics

| Requête PromQL | Description |
|----------------|-------------|
| `kafka_broker_up` | Broker Kafka UP (1/0) |
| `kafka_server_brokertopicmessages_in_total` | Messages traités |
| `kafka_consumer_group_lag` | Lag des consumers |
| `rate(kafka_server_brokertopicmessages_in_total[1m]) * 60` | Messages/minute |

## Alerts Grafana

| Alert | Condition | Severity |
|-------|-----------|----------|
| **ServiceDown** | `up == 0` pendant 2min | critical |
| **HighCPU** | `cpu > 80%` pendant 5min | warning |
| **HighMemory** | `memory > 85%` pendant 5min | warning |
| **DiskSpace** | `disk > 90%` | critical |
| **KafkaDown** | `kafka_broker_up == 0` | critical |
| **ConsumerLag** | `lag > 1000` pendant 5min | warning |

## Commandes Utiles

```bash
# Redémarrer Grafana
docker restart ecotrack-grafana

# Voir les logs
docker logs ecotrack-grafana -f

# Reset mot de passe admin
docker exec -it ecotrack-grafana grafana-cli admin reset-admin-password nouveau_mot_de_passe

# Import dashboard via API
curl -X POST http://localhost:3001/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana/dashboards/ecotrack-overview.json
```

## Troubleshooting

### Pas de données

1. Vérifier Prometheus est UP
2. Vérifier datasource configurée (Configuration → Data Sources)
3. Vérifier les queries dans "Inspect" → "Stats"

### Dashboard vide

1. Vérifier le range de temps (coin haut droit)
2. Refresher la page
3. Vérifier les métriques avec Prometheus directement

## Variables Grafana

| Variable | Query | Usage |
|----------|-------|-------|
| `$job` | `label_values(up, job)` | Filtrer par service |
| `$instance` | `label_values(up{job="$job"}, instance)` | Filtrer par instance |
| `$alert_severity` | `critical,warning` | Filtrer alertes |
