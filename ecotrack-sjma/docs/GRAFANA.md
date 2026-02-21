# Grafana - Guide de Visualisation

## Accès

- **URL** : http://localhost:3001
- **Login** : admin
- **Mot de passe** : admin

## Dashboards

### Import Dashboard

1. Aller dans **Dashboards** → **Import**
2. Coller le JSON du dashboard (voir `monitoring/grafana/dashboards/ecotrack-overview.json`)
3. Choisir "Prometheus" comme source de données

### Métriques Clés

#### Santé des Services (Stat Panel)
- Vert : UP
- Rouge : DOWN

#### Uptime (Stat Panel)
- Temps depuis le dernier redémarrage

#### Requêtes HTTP (Graph)
- Requêtes par seconde
- Codes de réponse (2xx, 4xx, 5xx)

#### Latence (Graph)
- Latence moyenne (p50, p95, p99)

#### Utilisation Ressources (Gauge)
- CPU %
- Mémoire %

## Panels Personnalisés

### Statut Service
```promql
up{job=~"service-.*"}
```

### Requêtes Totales
```promql
sum(rate(http_requests_total[5m]))
```

### Erreurs
```promql
sum(rate(http_requests_total{status=~"5.*"}[5m]))
```

### Latence P95
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Commandes Utiles

```bash
# Redémarrer Grafana
docker restart ecotrack-grafana

# Voir les logs
docker logs ecotrack-grafana -f

# Reset mot de passe admin
docker exec -it ecotrack-grafana grafana-cli admin reset-admin-password nouveau_mot_de_passe
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
