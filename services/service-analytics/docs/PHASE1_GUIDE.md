# Phase 1 - Données Aggrégées

##  Objectifs
- Mettre en place le Data Warehouse avec vues matérialisées
- Agréger les données quotidiennes
- Calculer les statistiques par zone et par type
- Suivre les performances des agents

##  Installation

```bash
# 1. Installer les dépendances supplémentaires
npm install node-cron

# 2. Créer les dossiers nécessaires
mkdir -p sql scripts

# 3. Créer les vues matérialisées
node -e "require('./src/services/aggregationService').initialize()"
```

##  Vues Matérialisées Créées

1. **analytics_daily_stats** - Statistiques quotidiennes
2. **analytics_zone_stats** - Statistiques par zone
3. **analytics_type_stats** - Statistiques par type de conteneur

##  Rafraîchissement

```bash
# Manuel
node scripts/refresh-aggregations.js

# Automatique (via cron)
# Toutes les heures à H:00
```

##  Endpoints Disponibles

### GET /api/analytics/aggregations
Récupère toutes les agrégations

**Query params:**
- `period`: day | week | month (default: month)

**Response:**
```json
{
  "success": true,
  "data": {
    "global": {...},
    "daily": [...],
    "zones": [...],
    "types": [...],
    "agents": [...]
  }
}
```

### GET /api/analytics/aggregations/zones
Statistiques par zone

### GET /api/analytics/aggregations/agents
Performances des agents

**Query params:**
- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)