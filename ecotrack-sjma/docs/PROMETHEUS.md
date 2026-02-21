# Prometheus - Guide de Monitoring

## Accès

- **URL** : http://localhost:9090
- **Pas de login requis**

## Comment Afficher les Métriques

### 1. Via l'interface Prometheus

1. Ouvrir http://localhost:9090
2. Cliquer sur **"Graph"** dans le menu
3. Dans la barre de recherche, entrer une requête (voir ci-dessous)
4. Cliquer sur **"Execute"**
5. Les résultats s'affichent en bas (tableau) ou en haut (graphique)

### 2. Métriques par Service

Chaque service expose :

| Métrique | Type | Description |
|----------|------|-------------|
| `http_requests_total` | Counter | Nombre total de requêtes HTTP |
| `http_request_duration_seconds` | Histogram | Durée des requêtes en secondes |
| `process_*` | Gauge | Métriques Node.js (CPU, mémoire, etc.) |

### Requêtes Utiles

#### Santé des Services (UP/DOWN)
```promql
up{job=~"service-.*"}
```
**Résultat** : 1 = UP, 0 = DOWN

#### Requêtes HTTP par seconde
```promql
sum(rate(http_requests_total[5m])) by (job)
```
**Résultat** : Graphique du nombre de requêtes par service

#### Requêtes par méthode et status
```promql
http_requests_total
```
**Résultat** : Toutes les requêtes avec labels (method, route, status)

#### Latence P95 (95ème percentile)
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```
**Résultat** : Latence à 95% en secondes

#### Latence P50 (médiane)
```promql
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
```
**Résultat** : Latence médiane en secondes

#### Erreurs HTTP (5xx)
```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
```
**Résultat** : Nombre d'erreurs server par service

#### Erreurs HTTP (4xx)
```promql
sum(rate(http_requests_total{status=~"4.."}[5m])) by (job)
```
**Résultat** : Nombre d'erreurs client par service

#### Mémoire Utilisée (bytes)
```promql
process_resident_memory_bytes{job=~"service-.*"}
```
**Résultat** : Mémoire RAM utilisée par chaque service

#### Uptime (secondes)
```promql
time() - process_start_time_seconds{job=~"service-.*"}
```
**Résultat** : Temps écoulé depuis le dernier démarrage

## Configuration

- Fichier de config : `monitoring/prometheus/prometheus.yml`
- Intervalle de scrape : 15s
- Rétention des données : 15j

## Commandes Utiles

```bash
# Voir les targets et leur statut
curl -s http://localhost:9090/api/v1/targets

# Métriques brutes d'un service
curl -s http://localhost:3010/metrics

# Recharger la config Prometheus
curl -X POST http://localhost:9090/-/reload

# Redémarrer Prometheus
docker restart ecotrack-prometheus
```

## Services Disponibles

| Service | Port | Status |
|---------|------|--------|
| API Gateway | 3000 | ✅ |
| Service Users | 3010 | ✅ |
| Service Containers | 3011 | ✅ |
| Service Gamifications | 3014 | ✅ |
| Service IoT | 3013 | ⏳ (à implémenter) |
| Service Analytics | 3015 | ⏳ (à implémenter) |
| Service Routes | 3012 | ⏳ (à implémenter) |

## Troubleshooting

### Service DOWN
1. Vérifier le statut : `docker ps`
2. Voir les logs : `docker logs <container-name>`
3. Vérifier le réseau : `docker network inspect ecotrack`

### Métriques Manquantes
1. Vérifier `/metrics` accessible : `curl http://localhost:3010/metrics`
2. Vérifier target dans Prometheus : Status → Targets
