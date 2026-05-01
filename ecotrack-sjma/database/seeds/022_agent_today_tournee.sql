-- ============================================================================
-- Seed 022 - Tournée du jour pour chaque agent (démo mobile)
-- Garantit qu'au moins une tournée PLANIFIEE existe aujourd'hui pour chaque
-- agent + utilisateur connecté en démo, avec étapes (3 conteneurs).
-- Idempotent : ne recrée pas si l'agent a déjà une tournée aujourd'hui.
-- ============================================================================

-- 1. Créer/garantir un agent "MOUSSA" (compte démo)
INSERT INTO UTILISATEUR (email, password_hash, nom, prenom, role_par_defaut, est_active)
VALUES (
  'moussa@ecotrack.local',
  '$2b$10$0vPzD5z8a9JqGkH1kV8cuOxQp4q5Y3rZk9LJZ7L6RmW1cLpQ5ZiE2',  -- bcrypt('Moussa2026!')
  'GHAZALY', 'MOUSSA', 'AGENT', true
)
ON CONFLICT (email) DO UPDATE SET prenom = EXCLUDED.prenom, est_active = true;

-- 2. Pour chaque agent sans tournée aujourd'hui, en créer une PLANIFIEE
WITH missing_agents AS (
  SELECT u.id_utilisateur AS id_agent
  FROM UTILISATEUR u
  WHERE u.role_par_defaut = 'AGENT'
    AND u.est_active = true
    AND NOT EXISTS (
      SELECT 1 FROM TOURNEE t
      WHERE t.id_agent = u.id_utilisateur AND t.date_tournee = CURRENT_DATE
    )
),
zones_avail AS (
  -- Choisir une zone qui contient au moins 3 conteneurs ACTIF
  SELECT z.id_zone
  FROM ZONE z
  JOIN CONTENEUR c ON c.id_zone = z.id_zone AND c.statut = 'ACTIF'
  GROUP BY z.id_zone
  HAVING COUNT(c.id_conteneur) >= 3
  ORDER BY z.id_zone
  LIMIT 1
),
vehicules_avail AS (
  SELECT id_vehicule FROM VEHICULE ORDER BY id_vehicule LIMIT 1
)
INSERT INTO TOURNEE (code, date_tournee, statut, distance_prevue_km, duree_prevue_min, id_vehicule, id_zone, id_agent)
SELECT
  'TD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || ma.id_agent,
  CURRENT_DATE,
  'PLANIFIEE',
  12.5,
  120,
  (SELECT id_vehicule FROM vehicules_avail),
  (SELECT id_zone FROM zones_avail),
  ma.id_agent
FROM missing_agents ma
WHERE EXISTS (SELECT 1 FROM zones_avail) AND EXISTS (SELECT 1 FROM vehicules_avail);

-- 3. Ajouter 3 étapes par tournée démo si pas déjà fait
WITH demo_tournees AS (
  SELECT t.id_tournee, t.id_zone
  FROM TOURNEE t
  WHERE t.date_tournee = CURRENT_DATE
    AND t.code LIKE 'TD-%'
    AND NOT EXISTS (SELECT 1 FROM ETAPE_TOURNEE e WHERE e.id_tournee = t.id_tournee)
),
zone_containers AS (
  SELECT
    dt.id_tournee,
    c.id_conteneur,
    ROW_NUMBER() OVER (PARTITION BY dt.id_tournee ORDER BY c.id_conteneur) AS seq
  FROM demo_tournees dt
  JOIN CONTENEUR c ON c.id_zone = dt.id_zone
  WHERE c.statut = 'ACTIF'
)
INSERT INTO ETAPE_TOURNEE (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT
  zc.seq,
  ('08:' || LPAD((10 + zc.seq * 15)::text, 2, '0'))::time,
  FALSE,
  zc.id_tournee,
  zc.id_conteneur
FROM zone_containers zc
WHERE zc.seq <= 3
ON CONFLICT (id_tournee, sequence) DO NOTHING;
