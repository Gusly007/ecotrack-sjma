# Phase 2 : Traitement et Stockage

## Objectif
Valider, traiter et stocker les données capteurs en base PostgreSQL.

---

## 2.1 Validation des données

### Fichiers
- `src/mqtt/mqtt-handler.js` - Validation initiale
- `src/validators/iot.validator.js` - Schémas Joi

### Règles de validation

| Champ | Min | Max | Erreur si invalide |
|-------|-----|-----|-------------------|
| `fill_level` | 0 | 100 | Message ignoré |
| `battery` | 0 | 100 | Message ignoré |
| `temperature` | -50 | 100 | Message ignoré (si présent) |

### Détection des valeurs aberrantes

```javascript
// src/mqtt/mqtt-handler.js - _validateData()
if (typeof data.fill_level !== 'number' || data.fill_level < 0 || data.fill_level > 100) {
  errors.push('fill_level must be a number between 0 and 100');
}
```

### Données corrompues
- JSON invalide → Log error, ignoré
- Champs manquants → Log warning, ignoré
- Valeurs hors plage → Log warning, ignoré

---

## 2.2 Stockage en base

### Tables utilisées

#### Table `mesure`
```sql
CREATE TABLE mesure (
  id_mesure SERIAL PRIMARY KEY,
  id_capteur INTEGER REFERENCES CAPTEUR(id_capteur),
  id_conteneur INTEGER REFERENCES CONTENEUR(id_conteneur),
  niveau_remplissage_pct DECIMAL(5,2),
  batterie_pct DECIMAL(5,2),
  temperature DECIMAL(5,2),
  date_mesure TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `capteur` (mise à jour)
```sql
UPDATE CAPTEUR 
SET derniere_communication = CURRENT_TIMESTAMP,
    statut = 'actif'
WHERE uid_capteur = $1;
```

### Repository
`src/repositories/measurement-repository.js`

```javascript
async processMeasurement(uidCapteur, data) {
  // 1. Trouver le capteur par uid
  // 2. Insérer la mesure
  // 3. Mettre à jour le conteneur (fill_level)
  // 4. Mettre à jour last_communication du capteur
}
```

### Requêtes SQL clés

```sql
-- Insérer une mesure
INSERT INTO mesure (id_capteur, id_conteneur, niveau_remplissage_pct, ...)
VALUES ($1, $2, $3, ...);

-- Mettre à jour le niveau du conteneur
UPDATE conteneur 
SET niveau_remplissage = $1
WHERE id_conteneur = $2;

-- Mettre à jour dernière communication
UPDATE-capteur SET derniere_communication = NOW()
WHERE uid_capteur = $1;
```

---

## 2.3 Conservation pour analytics

### Historique des mesures

- **Retention** : 90 jours (configurable)
- **Index** : Sur `date_mesure`, `id_conteneur`

```sql
-- Vue pour analytics (créée par service-analytics)
CREATE MATERIALIZED VIEW analytics_daily_stats AS
SELECT 
  DATE(m.date_mesure) as date,
  COUNT(DISTINCT m.id_conteneur) as containers_measured,
  ROUND(AVG(m.niveau_remplissage_pct), 2) as avg_fill_level,
  COUNT(*) FILTER (WHERE m.niveau_remplissage_pct > 80) as critical_count
FROM mesure m
WHERE m.date_mesure >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(m.date_mesure);
```

### Données disponibles pour analytics
- Niveau remplissage moyen par jour
- Nombre de conteneurs critiques
- Évolution dans le temps

---

## 2.4 API de consultation

### Endpoints disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/iot/measurements` | Liste paginée |
| GET | `/iot/measurements/latest` | Dernière mesure par conteneur |
| GET | `/iot/measurements/container/:id` | Mesures d'un conteneur |
| GET | `/iot/stats` | Statistiques globales |

### Exemple de réponse
```json
{
  "success": true,
  "data": [
    {
      "id_mesure": 1,
      "id_capteur": 3,
      "id_conteneur": 10,
      "niveau_remplissage_pct": 75.5,
      "batterie_pct": 92.0,
      "temperature": 22.3,
      "date_mesure": "2026-03-09T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```