# Déploiement EcoTrack sur VPS DigitalOcean

## Vue d'ensemble

EcoTrack est une application microservices déployée sur un VPS DigitalOcean via Docker Compose.  
Un seul `docker compose up` démarre l'ensemble de la stack (base de données, cache, message broker, 7 microservices, frontend).

**URL de production :** http://64.226.80.166  
**Branche de déploiement :** `deploy`

---

## Architecture déployée

```
┌─────────────────────────────────────────────────────┐
│                   VPS DigitalOcean                  │
│                  Ubuntu 22.04 + Docker              │
│                                                     │
│  ┌──────────┐    ┌─────────────────────────────┐    │
│  │ Frontend │    │        API Gateway          │    │
│  │  :80     │───▶│          :3000              │    │
│  └──────────┘    └──────────────┬──────────────┘    │
│                                 │                   │
│         ┌───────────────────────┼──────────────┐    │
│         ▼           ▼           ▼         ▼    ▼    │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────┐ ...  │
│  │ service │ │ service  │ │service │ │serv. │      │
│  │  users  │ │containers│ │ routes │ │ iot  │      │
│  │  :3010  │ │  :3011   │ │ :3012  │ │:3013 │      │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └──┬───┘      │
│       │           │           │         │           │
│  ┌────▼───────────▼───────────▼─────────▼────────┐  │
│  │          PostgreSQL 16 + PostGIS (:5432)       │  │
│  └────────────────────────────────────────────────┘  │
│  ┌─────────────┐   ┌──────────────────────────────┐  │
│  │ Redis :6379 │   │  Kafka + Zookeeper           │  │
│  └─────────────┘   └──────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Services inclus

| Service | Port | Rôle |
|---|---|---|
| frontend | 80 | Interface React servie par nginx |
| api-gateway | 3000 | Point d'entrée unique, routing |
| service-users | 3010 | Authentification, JWT |
| service-containers | 3011 | Gestion conteneurs et zones |
| service-routes | 3012 | Tournées et collectes |
| service-iot | 3013 | Capteurs IoT, MQTT (:1883) |
| service-gamifications | 3014 | Système de points |
| service-analytics | 3015 | Rapports et statistiques |
| postgres | 5432 | Base de données principale |
| redis | 6379 | Cache et sessions |
| kafka | 29092 | Message broker interne |
| zookeeper | 2181 | Coordination Kafka |

---

## Prérequis

- Compte **DigitalOcean** avec les **$200 de crédits** GitHub Student Pack activés
- Accès SSH au serveur
- Git installé en local

---

## Étape 1 — Création du Droplet

1. Se connecter sur [digitalocean.com](https://digitalocean.com)
2. **Create → Droplets**
3. Configuration choisie :
   - **Image :** Marketplace → Docker 26 on Ubuntu 22.04
   - **Taille :** Basic Regular — **4 Go RAM / 2 vCPU** (~$24/mois)
   - **Région :** Frankfurt (FRA1)
   - **Authentication :** Password
   - **Hostname :** `ecotrack-prod`
4. Copier l'**IP publique** affichée après création

> Docker est pré-installé sur cette image — aucune installation supplémentaire nécessaire.

---

## Étape 2 — Connexion SSH

```bash
ssh root@<IP_DROPLET>
```

---

## Étape 3 — Cloner le dépôt sur la bonne branche

```bash
git clone https://github.com/Gusly007/ecotrack-sjma
cd ecotrack-sjma/ecotrack-sjma

# Vérifier les branches disponibles
git branch -a

# Basculer sur la branche de déploiement
git checkout deploy
```

---

## Étape 4 — Configurer les variables d'environnement

```bash
cp .env.production .env
nano .env
```

### Valeurs à renseigner obligatoirement

```env
# IP publique du droplet
FRONTEND_URL=http://<IP_DROPLET>
FRONTEND_API_URL=http://<IP_DROPLET>:3000
VITE_API_URL=http://<IP_DROPLET>:3000

# Mot de passe base de données
DB_PASSWORD=<MOT_DE_PASSE_FORT>
DATABASE_URL=postgresql://ecotrack_user:<MOT_DE_PASSE_FORT>@postgres:5432/ecotrack
PGPASSWORD=<MOT_DE_PASSE_FORT>

# Clés JWT (générer avec la commande ci-dessous)
JWT_SECRET=<CLE_64_CHARS>
JWT_REFRESH_SECRET=<CLE_64_CHARS>
```

### Générer les clés JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Lancer deux fois — une clé pour JWT_SECRET, une pour JWT_REFRESH_SECRET
```

Sauvegarder : **Ctrl+O** → Entrée → **Ctrl+X**

---

## Étape 5 — Démarrer tous les services

```bash
docker compose -f docker-compose.prod.yml up -d
```

Le premier démarrage prend **5 à 10 minutes** (build de toutes les images).

### Vérifier que tout tourne

```bash
docker compose -f docker-compose.prod.yml ps
```

Tous les services doivent être en état `running` ou `healthy`.

### Consulter les logs

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Un service spécifique
docker logs ecotrack-service-users --tail 50
```

---

## Étape 6 — Initialiser les données (seeds)

Les seeds contiennent les utilisateurs de démo. À lancer une seule fois :

```bash
docker compose -f docker-compose.prod.yml run --rm -e RUN_SEEDS=true migrations
```

---

## Comptes de démo

| Email | Mot de passe | Rôle |
|---|---|---|
| admin@ecotrack.local | password123 | Admin |
| gestionnaire@ecotrack.local | password123 | Gestionnaire |
| agent1@ecotrack.local | password123 | Agent |
| citoyen1@ecotrack.local | password123 | Citoyen |

---

## Commandes utiles sur le serveur

```bash
# Arrêter tous les services
docker compose -f docker-compose.prod.yml down

# Redémarrer un service spécifique
docker compose -f docker-compose.prod.yml restart service-users

# Mettre à jour après un git push
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Rebuilder uniquement le frontend
docker compose -f docker-compose.prod.yml up -d --build frontend

# Accéder à la base de données
docker exec -it ecotrack-postgres psql -U ecotrack_user -d ecotrack

# Voir l'utilisation RAM/CPU
docker stats
```

---

## Problèmes rencontrés et solutions

### CORS — `http://localhost:3000` dans le bundle frontend
**Cause :** Vite bake les variables d'environnement au moment du build, pas au runtime.  
**Solution :** Passer `VITE_API_URL` comme `ARG` dans le Dockerfile frontend et comme `build.args` dans `docker-compose.prod.yml`.

### Login 401 — `Invalid credentials`
**Cause :** Le hash bcrypt du seed SQL était incorrect (ne correspondait pas à `password123`).  
**Solution :** Générer un hash valide dans le container puis mettre à jour la base :
```bash
# Générer un hash valide
docker exec ecotrack-service-users node --input-type=module \
  -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('password123', 10));"

# Mettre à jour tous les utilisateurs
docker exec -it ecotrack-postgres psql -U ecotrack_user -d ecotrack \
  -c "UPDATE utilisateur SET password_hash = '<HASH_GENERE>';"
```

---

## Prochaine étape — HTTPS

Pour activer le HTTPS il faut un nom de domaine (Let's Encrypt ne fonctionne pas sur IP brute).

Options disponibles :
- **GitHub Student Pack** → domaine `.me` gratuit 1 an via Namecheap
- **DuckDNS** → sous-domaine gratuit (ex: `ecotrack-sjma.duckdns.org`)

Une fois le domaine obtenu, configurer nginx + certbot pour le SSL automatique.
