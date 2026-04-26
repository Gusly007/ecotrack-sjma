#  Déploiement - Service Routes

## Status : Production Ready 

### Checklist

- [x] API REST complète (22 endpoints)
- [x] Optimisation itinéraires (Nearest Neighbor + 2-opt)
- [x] Suivi collectes agent avec auto-clôture
- [x] Signalement anomalies
- [x] Tableau de bord et KPIs
- [x] Gestion parc véhicules
- [x] Health check Docker
- [x] Métriques Prometheus
- [x] Swagger UI
- [x] Logger Pino structuré
- [x] 141 tests unitaires passants
- [x] Gestion d'erreurs complète
- [x] Transactions atomiques (collecte, statut)

---

## Docker Compose

### Démarrage standard

```bash
# Depuis la racine du projet EcoTrack
docker compose up postgres migrations service-routes -d
```

### Logs

```bash
docker compose logs -f service-routes
```

### Health check

```bash
docker compose ps service-routes
# Doit afficher : healthy

curl http://localhost:3012/health
# {"status":"OK","service":"service-routes","database":"connected"}
```

### Arrêt

```bash
docker compose stop service-routes
docker compose down service-routes
```

---

## Configuration Docker Compose

```yaml
service-routes:
  build:
    context: ./services/service-routes
    dockerfile: Dockerfile
  container_name: ecotrack-service-routes
  environment:
    APP_PORT: 3012
    DATABASE_URL: postgresql://ecotrack_user:ecotrack_password@postgres:5432/ecotrack
    NODE_ENV: production
    LOG_LEVEL: info
  ports:
    - "3012:3012"
  depends_on:
    postgres:
      condition: service_healthy
    migrations:
      condition: service_completed_successfully
  healthcheck:
    test: ["CMD", "node", "healthcheck.cjs"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 15s
  restart: unless-stopped
```

---

## Variables d'environnement de production

| Variable | Valeur production | Notes |
|---|---|---|
| `APP_PORT` | `3012` | |
| `DATABASE_URL` | `postgresql://user:pass@postgres:5432/ecotrack` | Utiliser secrets Docker |
| `NODE_ENV` | `production` | Désactive pino-pretty |
| `LOG_LEVEL` | `info` ou `warn` | Éviter `debug` en prod |

---

## Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3012
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node healthcheck.cjs
CMD ["node", "index.js"]
```

---

## Monitoring

### Prometheus

Le service expose `GET /metrics` sur le port 3012.

Configuration Prometheus (`monitoring/prometheus/prometheus.yml`) :

```yaml
scrape_configs:
  - job_name: 'service-routes'
    static_configs:
      - targets: ['service-routes:3012']
    metrics_path: /metrics
```

### Grafana

Accès : http://localhost:3001 (admin / admin)

Métriques disponibles :
- `http_requests_total` — requêtes par méthode + route + statut
- `http_request_duration_seconds` — latences (histogramme)

### Logs (Pino JSON)

En production, les logs sont JSON structurés :

```json
{"level":30,"time":1741650000000,"service":"service-routes","method":"POST","url":"/api/routes/optimize","statusCode":201,"duration":245,"msg":"Request completed"}
```

Agrégation recommandée : Loki + Grafana ou ELK Stack.

---

## Intégration API Gateway

Le service-routes est enregistré dans l'API Gateway (port 3000) :

```javascript
// api-gateway/src/index.js
routes: {
  displayName: 'Routes & Planning Service',
  status: 'ready',
  port: 3012,
  baseUrl: 'http://service-routes:3012',
  routes: [{ mountPath: '/api/routes' }]
}
```

Toutes les requêtes `GET /api/routes/*` depuis le frontend passent par le Gateway → service-routes.

L'header `X-User-Id` est injecté par le Gateway sur toutes les requêtes authentifiées.

---

## Troubleshooting production

### Service ne démarre pas

```bash
docker compose logs service-routes | tail -20
```

Causes fréquentes :
- `DATABASE_URL` invalide → vérifier la connexion DB
- Migrations non exécutées → `docker compose up migrations`
- Port 3012 déjà utilisé → `docker compose ps`

### Health check failing

```bash
# Tester manuellement dans le container
docker exec ecotrack-service-routes node healthcheck.cjs
echo $?  # 0 = OK, 1 = KO

# Vérifier la DB
docker exec ecotrack-service-routes node -e "require('./src/db/connexion').testConnection()"
```

### Performances

Si le service est lent sur les requêtes d'optimisation avec beaucoup de conteneurs :
- Vérifier `LOG_LEVEL=info` (pas `debug`)
- Vérifier que l'index sur `conteneur.id_zone` existe
- Le 2-opt est O(n²×iter) — normal d'être plus lent pour n > 100
