# Seeds Database EcoTrack

## Ordre d'exécution

Exécuter les seeds dans cet ordre:

### 1. Seeds de base (déjà exécutés normalement)
- `001_roles.sql` - Rôles utilisateurs
- `002_types.sql` - Types de conteneurs
- `003_badges.sql` - Badges gamification
- `004_zones.sql` - Zones géographiques
- `005_vehicules.sql` - Véhicules
- `006_users_demo.sql` - Utilisateurs de démo
- `007_conteneurs_demo.sql` - Conteneurs de démo
- `008_maintenance.sql` - Maintenance
- `009_tournees_collectes.sql` - Tournées et collectes
- `010_signalements.sql` - Signalements
- `011_gamification.sql` - Gamification
- `012_audit_alertes.sql` - Audit et alertes
- `013_refresh_tokens.sql` - Tokens
- `014_permissions_default.sql` - Permissions
- `015_password_reset_tokens.sql` - Reset tokens
- `016_ml_test_data.sql` - Données ML de test
- `017_configurations_default.sql` - Configurations
- `018_environmental_constants.sql` - Constantes environnementales
- `019_agent_performance_constants.sql` - Constantes agents
- `020_complete_massive_seed.sql` - Seed massif (1 989 conteneurs)
- `021_signalements.sql` - Signalements de démo
- `022_tournees_3_9_0_demo.sql` - **(3.9.0)** Tournées de démo pour valider la gestion fine du retard et la simulation de progression (7 scénarios métier + 7 paliers de progression 0 % → 95 %). Idempotent, ré-exécutable. Codes : `T-DEMO-*` et `T-DEMO-PROG-*`.

### 2. Seed massif de mesures (dernier à exécuter)
**⚠️ ATTENTION: À exécuter SEULEMENT si vous voulez beaucoup de données**

- `023_100k_measurements.sql` - **99 450+ mesures pour 1 989 conteneurs**

Ce seed va:
- Créer 50 mesures par conteneur actif
- Total: ~100 000 mesures
- Couvrir une période de 60 jours
- Permettre les prédictions ML et analyses

## Commande pour exécuter le seed massif

```bash
docker exec -i ecotrack-postgres psql -U ecotrack_user -d ecotrack < ecotrack-sjma/database/seeds/023_100k_measurements.sql
```

## Vérification

Après exécution, vérifier les données:

```sql
-- Nombre total de mesures
SELECT COUNT(*) FROM MESURE;

-- Moyenne de remplissage
SELECT ROUND(AVG(niveau_remplissage_pct), 2) FROM MESURE;

-- Conteneurs avec des mesures
SELECT COUNT(DISTINCT id_conteneur) FROM MESURE;

-- Période couverte
SELECT MIN(date_heure_mesure), MAX(date_heure_mesure) FROM MESURE;
```

## Supprimer les mesures (si besoin)

```sql
TRUNCATE TABLE MESURE CASCADE;
```
