# Déploiement Heroku — EcoTrack

> Runbook complet pour déployer la stack EcoTrack sur Heroku (Container Stack).
> Stratégie : 1 app Heroku par microservice + 1 app frontend + 1 addon Postgres.

---

## Pré-requis (à faire UNE fois)

### 1. Créer un compte Heroku

1. https://signup.heroku.com → créer un compte
2. Vérifier l'email
3. Ajouter un moyen de paiement → https://dashboard.heroku.com/account/billing
   *(Heroku n'a plus d'offre gratuite depuis nov. 2022. Eco dyno = 5 €/mois mutualisé sur 1000h.)*

### 2. Installer le Heroku CLI

**Windows** : https://devcenter.heroku.com/articles/heroku-cli#install-the-heroku-cli
- Télécharger l'installateur 64-bit
- Lancer `heroku --version` dans un nouveau PowerShell pour vérifier

**Linux/macOS** :
```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku --version
```

### 3. Login + Container login

```bash
heroku login                    # ouvre un navigateur, valide la session
heroku container:login          # login au Container Registry (Docker)
```

> Si tu as une erreur "Cannot connect to the Docker daemon", il faut lancer Docker Desktop d'abord.

---

## Phase 1 — Pilote api-gateway + Postgres

L'objectif est de valider la chaîne complète sur **une seule app**. Si ça marche, on duplique.

### 1.1 Créer l'app Heroku (Container Stack)

```bash
# Depuis n'importe quel dossier
heroku create ecotrack-gateway --stack=container --region=eu
```

> ⚠️ Le nom doit être unique sur Heroku. Si `ecotrack-gateway` est pris, choisir un suffixe (ex: `ecotrack-gateway-jng`).

### 1.2 Ajouter l'addon Postgres (PostgreSQL 16 + PostGIS)

```bash
heroku addons:create heroku-postgresql:essential-0 -a ecotrack-gateway
# Activation de PostGIS (extension nécessaire au projet)
heroku pg:psql -a ecotrack-gateway -c "CREATE EXTENSION IF NOT EXISTS postgis;"
heroku pg:psql -a ecotrack-gateway -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

> L'addon expose automatiquement la variable `DATABASE_URL` (format `postgres://user:pass@host:5432/db`). Tous les services qui parlent à Postgres doivent lire cette variable.

### 1.3 Configurer les variables d'environnement (config vars)

```bash
heroku config:set NODE_ENV=production -a ecotrack-gateway
heroku config:set JWT_SECRET="$(openssl rand -hex 32)" -a ecotrack-gateway
heroku config:set GATEWAY_RATE_BYPASS_LOCAL=false -a ecotrack-gateway

# URLs des autres services (à mettre à jour après leur déploiement)
heroku config:set USERS_SERVICE_URL=https://ecotrack-users.herokuapp.com -a ecotrack-gateway
heroku config:set CONTAINERS_SERVICE_URL=https://ecotrack-containers.herokuapp.com -a ecotrack-gateway
heroku config:set ROUTES_SERVICE_URL=https://ecotrack-routes.herokuapp.com -a ecotrack-gateway
heroku config:set GAMIFICATIONS_SERVICE_URL=https://ecotrack-gami.herokuapp.com -a ecotrack-gateway
heroku config:set ANALYTICS_SERVICE_URL=https://ecotrack-analytics.herokuapp.com -a ecotrack-gateway
heroku config:set IOT_SERVICE_URL=https://ecotrack-iot.herokuapp.com -a ecotrack-gateway
```

> Note : les config vars `USERS_SERVICE_URL` etc. peuvent rester vides au début — l'api-gateway dégradera gracieusement les services indisponibles.

### 1.4 Push depuis le sous-dossier api-gateway

Heroku exige un repo git à la racine de ce qu'on push. Comme api-gateway est un sous-dossier, on utilise `git subtree` pour pousser uniquement ce dossier vers Heroku.

```bash
# Depuis la racine du repo (ecotrack-sjma/ecotrack-sjma/)
git remote add heroku-gateway https://git.heroku.com/ecotrack-gateway.git

# Push du sous-dossier seulement (depuis main)
git subtree push --prefix services/api-gateway heroku-gateway main
```

> Si `git subtree push` refuse à cause de divergences, utiliser :
> ```bash
> git subtree split --prefix services/api-gateway -b deploy/api-gateway
> git push heroku-gateway deploy/api-gateway:main --force
> ```

### 1.5 Vérifier le déploiement

```bash
heroku logs --tail -a ecotrack-gateway
# Tu dois voir : "API Gateway ready" sur le port assigné par Heroku
heroku open -a ecotrack-gateway      # ouvre https://ecotrack-gateway.herokuapp.com
curl https://ecotrack-gateway.herokuapp.com/health
```

Réponse attendue : `{"status":"ok",...}`.

### 1.6 Migrer la base de données

Les migrations sont dans `database/migrations/`. Pour les appliquer sur la DB Heroku :

```bash
# Récupérer DATABASE_URL
heroku config:get DATABASE_URL -a ecotrack-gateway

# Lancer les migrations en local en pointant sur la DB Heroku
DATABASE_URL=$(heroku config:get DATABASE_URL -a ecotrack-gateway) \
  cd database && \
  npm run migrate
```

### 1.7 Charger les seeds

```bash
# Idem, en pointant sur Heroku
DATABASE_URL=$(heroku config:get DATABASE_URL -a ecotrack-gateway) \
  cd database && \
  npm run seed
```

---

## Phase 2 — Déployer les 6 autres services backend

Pour chaque service (users, containers, routes, gamifications, analytics, iot), répéter le même pattern.

### Pré-requis : adapter chaque service

Avant le push, chaque service doit :
1. Lire `process.env.PORT` en priorité (Heroku) avec fallback local — voir `services/api-gateway/src/index.js:74`
2. Avoir un `heroku.yml` à sa racine — voir `services/api-gateway/heroku.yml`
3. Avoir un `.dockerignore` — voir `services/api-gateway/.dockerignore`
4. Adapter son `healthcheck.cjs` pour utiliser `process.env.PORT` — voir `services/api-gateway/healthcheck.cjs`

### Boucle de déploiement par service

```bash
# Variables à adapter
SERVICE=service-routes              # nom du sous-dossier
APP=ecotrack-routes                 # nom de l'app Heroku

# Création
heroku create $APP --stack=container --region=eu

# Connexion à la DB partagée (attache le même Postgres que gateway)
heroku addons:attach ecotrack-gateway::DATABASE -a $APP

# Config
heroku config:set NODE_ENV=production -a $APP
heroku config:set JWT_SECRET="$(heroku config:get JWT_SECRET -a ecotrack-gateway)" -a $APP

# Push
git remote add heroku-$SERVICE https://git.heroku.com/$APP.git
git subtree push --prefix services/$SERVICE heroku-$SERVICE main

# Mettre à jour le gateway pour pointer vers cette URL
heroku config:set ROUTES_SERVICE_URL=https://$APP.herokuapp.com -a ecotrack-gateway
```

> Reproduire pour `service-users`, `service-containers`, `service-gamifications`, `service-analytics`, `service-iot`.

---

## Phase 3 — Déployer le frontend

Le frontend doit être adapté pour Heroku (port dynamique + URL absolue vers le gateway).

### 3.1 Créer une variable d'environnement build-time

Dans le code source frontend, remplacer toutes les références hardcodées à `http://localhost:3000` par `import.meta.env.VITE_API_BASE_URL`.

Vérifier `frontend/src/services/api.js` : la baseURL doit être `import.meta.env.VITE_API_BASE_URL`.

### 3.2 Adapter le Dockerfile frontend

Voir `frontend/Dockerfile` — il doit :
- Servir nginx sur `$PORT` (template envsubst)
- Ne plus avoir de `proxy_pass http://api-gateway:3000` (impossible sur Heroku)

### 3.3 Push

```bash
heroku create ecotrack-front --stack=container --region=eu
heroku config:set VITE_API_BASE_URL=https://ecotrack-gateway.herokuapp.com -a ecotrack-front
git remote add heroku-front https://git.heroku.com/ecotrack-front.git
git subtree push --prefix frontend heroku-front main
```

### 3.4 Configurer CORS sur le gateway

```bash
heroku config:set CORS_ORIGIN=https://ecotrack-front.herokuapp.com -a ecotrack-gateway
```

---

## Annexe — Coûts estimés

| Ressource | Plan | Coût |
|-----------|------|------|
| 7 dynos Eco (services backend) | Eco | 5 €/mois mutualisé sur 1000h pour TOUS les Eco dynos |
| 1 dyno Eco (frontend) | Eco | inclus |
| Postgres essential-0 | Essential-0 | 5 €/mois |
| **Total** | | **~10 €/mois** |

> ⚠️ Les Eco dynos s'endorment après 30 min d'inactivité. Premier hit après inactivité = 10–30s de cold start. Pas idéal pour une démo en direct, mais acceptable si tu "réveilles" les apps 5 min avant.

---

## Annexe — Debug

### Voir les logs en temps réel
```bash
heroku logs --tail -a ecotrack-gateway
```

### Redémarrer une app
```bash
heroku restart -a ecotrack-gateway
```

### Se connecter à la DB
```bash
heroku pg:psql -a ecotrack-gateway
```

### Lister tous les services et leur état
```bash
heroku apps -A
heroku ps -a ecotrack-gateway
```

### Détruire une app (cleanup post-démo)
```bash
heroku apps:destroy ecotrack-gateway --confirm ecotrack-gateway
```
