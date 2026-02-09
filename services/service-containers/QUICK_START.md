# Guide de Démarrage Rapide

## Prérequis

- Node.js 20+
- PostgreSQL 14+ avec PostGIS
- Base de données `ecotrack` créée

## Configuration Base de Données

### 1. Créer la base de données

```bash
psql -U postgres
```

```sql
CREATE DATABASE ecotrack;
\c ecotrack
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Initialiser le schéma

```bash
psql -U postgres -d ecotrack -f src/db/init-db-pg.sql
```

## Configuration Variables d'Environnement

Créez un fichier `.env` à la racine du service:

```env
# Serveur
APP_PORT=3011
NODE_ENV=development

# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=votre_mot_de_passe
PGDATABASE=ecotrack
```

## Installation

```bash
npm install
```

## Démarrage du Serveur

### Mode Développement (avec auto-reload)

```bash
npm run dev
```

### Mode Production

```bash
npm start
```

Le serveur démarre sur **http://localhost:3011**

## Accès à Swagger (Documentation Interactive)

Une fois le serveur démarré, ouvrez votre navigateur:

```
http://localhost:3011/api-docs
```

### Fonctionnalités Swagger

- 📖 **Documentation complète** de tous les endpoints
- 🧪 **Tester les API** directement depuis l'interface
- 📝 **Schémas JSON** des requêtes/réponses
- 🔍 **Exemples** pour chaque endpoint

### Endpoints Disponibles dans Swagger

#### Conteneurs
- `GET /api/containers` - Liste paginée
- `POST /api/containers` - Créer un conteneur
- `GET /api/containers/:id` - Détails
- `PATCH /api/containers/:id` - Modifier
- `PATCH /api/containers/:id/status` - Changer statut
- `DELETE /api/containers/:id` - Supprimer

#### Statistiques
- `GET /api/stats/dashboard` - Tableau de bord
- `GET /api/stats` - Stats globales
- `GET /api/stats/fill-levels` - Niveaux de remplissage
- `GET /api/stats/by-zone` - Par zone
- `GET /api/stats/by-type` - Par type
- `GET /api/stats/critical` - Conteneurs critiques

#### Zones et Types
- `GET /api/zones` - Liste des zones
- `GET /api/typecontainers` - Types de conteneurs

## Vérifier la Santé du Service

```bash
curl http://localhost:3011/health
```

Réponse attendue:
```json
{
  "status": "OK",
  "timestamp": "2026-02-09T...",
  "uptime": 123
}
```

## Tester les Endpoints (sans Swagger)

### Exemple 1: Liste des conteneurs

```bash
curl http://localhost:3011/api/containers
```

### Exemple 2: Créer un conteneur

```bash
curl -X POST http://localhost:3011/api/containers \
  -H "Content-Type: application/json" \
  -d '{
    "numero_serie": "CNT-001",
    "id_type": 1,
    "capacite": 1000,
    "niveau_remplissage": 0,
    "id_zone": 1,
    "gps_latitude": 48.8566,
    "gps_longitude": 2.3522
  }'
```

### Exemple 3: Statistiques dashboard

```bash
curl http://localhost:3011/api/stats/dashboard
```

## Tester Socket.IO (Temps Réel)

### Client Interactif

```bash
npm run test:socket:interactive
```

Menu disponible:
1. S'abonner à une zone
2. Se désabonner d'une zone
3. Afficher les zones actives
4. Simuler un changement de statut
5. Afficher l'aide
6. Quitter

### Test avec curl + Socket.IO client

1. Dans un terminal, lancez le client Socket.IO:
```bash
npm run test:socket:client
```

2. Dans un autre terminal, changez un statut:
```bash
curl -X PATCH http://localhost:3011/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'
```

3. Le client Socket.IO reçoit la notification en temps réel!

## Exécuter les Tests

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests Socket.IO
npm run test:socket
npm run test:socket:integration
```

## Problèmes Courants

### Erreur: "Cannot connect to database"

**Solution**: Vérifiez que PostgreSQL est démarré et que les credentials dans `.env` sont corrects.

```bash
# Vérifier si PostgreSQL est actif
psql -U postgres -c "SELECT version();"
```

### Erreur: "Port 3011 already in use"

**Solution**: Changez le port dans `.env` ou arrêtez l'autre processus.

```bash
# Windows - Trouver le processus
netstat -ano | findstr :3011

# Arrêter le processus (remplacez PID)
taskkill /PID <PID> /F
```

### Swagger ne s'affiche pas

**Solution**: Vérifiez que le serveur est bien démarré et accessible:

```bash
curl http://localhost:3011/health
```

Si la réponse est OK, Swagger devrait être accessible à `/api-docs`.

### Erreur PostGIS: "type "geometry" does not exist"

**Solution**: Activez l'extension PostGIS:

```bash
psql -U postgres -d ecotrack -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## Documentation Complète

- **[README.md](./README.md)** - Documentation complète du service
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Architecture technique
- **[docs/SOCKET_IO.md](./docs/SOCKET_IO.md)** - Guide Socket.IO
- **[docs/TESTING.md](./docs/TESTING.md)** - Guide des tests
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Guide de déploiement
- **[docs/CHANGELOG.md](./docs/CHANGELOG.md)** - Historique des versions

## Support

Pour plus d'aide, consultez la section **Troubleshooting** du [README.md](./README.md).
