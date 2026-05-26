# DB Optimization - Proposition

## Indexes à ajouter

### 1. Table `mesure` (capteurs IoT - forte volumétrie)

```sql
-- Index composite pour requêtes temps-réel par capteur
CREATE INDEX idx_mesure_capteur_date 
ON mesure(id_capteur, date_heure_mesure DESC);

-- Index BRIN pour partition temporelle (optimisé pour time-series)
CREATE INDEX idx_mesure_date_brin 
ON mesure USING BRIN(date_heure_mesure) 
WITH (pages_per_range = 128);
```

### 2. Table `notification` (time-series)

```sql
-- BRIN pour notifications récentes
CREATE INDEX idx_notification_date_brin 
ON notification USING BRIN(date_creation) 
WITH (pages_per_range = 32);
```

### 3. Table `collecte` (time-series)

```sql
-- BRIN pour requêtes par période
CREATE INDEX idx_collecte_date_brin 
ON collecte USING BRIN(date_heure_collecte) 
WITH (pages_per_range = 64);
```

### 4. Table `tournee`

```sql
-- Index pour requêtes agent + calendrier
CREATE INDEX idx_tournee_agent_date 
ON tournee(id_agent, date_tournee DESC);
```

### 5. Table `conteneur`

```sql
-- Index composite zone + statut
CREATE INDEX idx_conteneur_zone_statut 
ON conteneur(id_zone, statut);
```

### 6. Table `mesure` (par conteneur)

```sql
-- Index composite mesures récentes par conteneur
CREATE INDEX idx_mesure_conteneur_date_desc
ON mesure(id_conteneur, date_heure_mesure DESC);
```

## Partial Indexes (optionnel)

```sql
-- Conteneurs actifs seulement
CREATE INDEX idx_conteneur_actif 
ON conteneur(id_zone) 
WHERE statut = 'ACTIF';

-- Notifications non lues
CREATE INDEX idx_notification_non_lu 
ON notification(id_utilisateur, date_creation DESC) 
WHERE est_lu = FALSE;
```

## Étapes

1. [x] Créer migration `034_db_optimization_indexes.cjs`
2. [x] Tester sur données de dev avant production (seed 027 — 15k users, 9k mesures)
3. [x] Vérifier avec `EXPLAIN ANALYZE` les queries impactées (voir RAPPORT_BENCHMARK_PERFORMANCE.md §5.4)
4. [x] Monitorer taille des indexes (BRIN = 8 Ko vs 240 Ko B-tree, −97%)

## Requêtes à optimiser (à identifier)

```sql
-- Example: Trouver les dernières mesures d'un capteur
EXPLAIN ANALYZE 
SELECT * FROM mesure 
WHERE id_capteur = $1 
ORDER BY date_heure_mesure DESC 
LIMIT 10;
```
