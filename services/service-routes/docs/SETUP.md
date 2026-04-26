#  Setup & Installation - Service Routes

**Durée** : 10 minutes | **Audience** : Développeurs

---

## Prérequis

- **Node.js** 20+ — `node --version`
- **PostgreSQL** 16 + PostGIS — migrations EcoTrack exécutées
- **npm** 9+

---

## Installation rapide

### 1. Installer les dépendances

```bash
cd services/service-routes
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Éditer `.env` :

```ini
# ========== SERVER ==========
APP_PORT=3012
NODE_ENV=development
LOG_LEVEL=info

# ========== DATABASE ==========
DATABASE_URL=postgresql://ecotrack_user:ecotrack_password@localhost:5432/ecotrack
```

### 3. Démarrer

```bash
npm run dev     # Développement (nodemon, auto-reload)
npm start       # Production
```

**Succès :**
```
[INFO] Service Routes démarré sur le port 3012
[INFO] Swagger UI : http://localhost:3012/api-docs
[INFO] DB connectée : ecotrack@localhost:5432
```

---

## Avec Docker Compose (recommandé)

```bash
# Depuis la racine du projet ecotrack
docker compose up postgres migrations service-routes -d

# Suivre les logs
docker compose logs -f service-routes

# Vérifier la santé
curl http://localhost:3012/health
```

---

## Variables d'environnement

| Variable | Défaut | Obligatoire | Description |
|---|---|---|---|
| `APP_PORT` | `3012` | Non | Port d'écoute |
| `DATABASE_URL` | — | **Oui** | URL PostgreSQL complète |
| `NODE_ENV` | `production` | Non | `development` active pino-pretty |
| `LOG_LEVEL` | `info` | Non | `debug` / `info` / `warn` / `error` |

---

## Vérification

### 1. Health check

```bash
curl http://localhost:3012/health
# {"status":"OK","service":"service-routes","database":"connected"}
```

### 2. API REST

```bash
curl http://localhost:3012/api/routes/stats/dashboard
# { "success": true, "data": { "tournees": { ... } } }
```

### 3. Tests unitaires

```bash
npm test
# Tests: 141 passed, 0 failed, 12 suites ✅
```

### 4. Swagger UI

Ouvrir : http://localhost:3012/api-docs

---

## Scripts disponibles

```bash
npm run dev      # nodemon (auto-reload)
npm start        # node index.js
npm test         # jest --runInBand
```

---

## Troubleshooting

### "Cannot connect to database"

```bash
# Vérifier que PostgreSQL tourne
docker compose ps postgres

# Vérifier la DATABASE_URL
psql $DATABASE_URL -c "SELECT 1;"
```

### "Port 3012 already in use"

```bash
lsof -i :3012 | grep -v PID | awk '{print $2}' | xargs kill -9
```

### "relation 'tournee' does not exist"

Les migrations n'ont pas été exécutées :

```bash
docker compose up migrations -d
docker compose logs migrations
```

### Tests échouent

```bash
# Vérifier les dépendances
npm install

# Relancer
npm test -- --verbose
```

---

## Checklist post-installation

- [ ] `npm install` complété sans erreur
- [ ] `.env` configuré avec `DATABASE_URL` valide
- [ ] `npm run dev` démarre sans erreur
- [ ] `curl http://localhost:3012/health` → `{"status":"OK"}`
- [ ] `npm test` → 141 tests passent
- [ ] http://localhost:3012/api-docs accessible
