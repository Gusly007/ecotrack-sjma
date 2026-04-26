-- Seed: 009_tournees_collectes
-- Description: Tournees, etapes, collectes

INSERT INTO tournee (code, date_tournee, statut, distance_prevue_km, duree_prevue_min, duree_reelle_min, distance_reelle_km, id_vehicule, id_zone, id_agent)
SELECT v.code, v.date_tournee, v.statut, v.distance_prevue_km, v.duree_prevue_min, v.duree_reelle_min, v.distance_reelle_km,
  (SELECT id_vehicule FROM vehicule WHERE numero_immatriculation = v.immatriculation),
  (SELECT id_zone FROM zone WHERE code = v.zone_code),
  (SELECT id_utilisateur FROM utilisateur WHERE email = v.agent_email)
FROM (
  VALUES
    ('T-2025-001', CURRENT_DATE, 'EN_COURS', 18.5, 180, NULL, NULL, 'AB-123-CD', 'Z01', 'agent1@ecotrack.local'),
    ('T-2025-002', CURRENT_DATE - INTERVAL '1 day', 'TERMINEE', 22.0, 210, 205, 21.4, 'EF-456-GH', 'Z02', 'agent2@ecotrack.local')
) AS v(code, date_tournee, statut, distance_prevue_km, duree_prevue_min, duree_reelle_min, distance_reelle_km, immatriculation, zone_code, agent_email)
WHERE NOT EXISTS (SELECT 1 FROM tournee t WHERE t.code = v.code);

-- Etapes pour T-2025-001
WITH tournee_ref AS (
  SELECT id_tournee FROM tournee WHERE code = 'T-2025-001'
),
conteneurs AS (
  SELECT id_conteneur, row_number() OVER () AS sequence
  FROM (
    SELECT c.id_conteneur
    FROM conteneur c
    JOIN zone z ON z.id_zone = c.id_zone
    WHERE z.code = 'Z01'
    ORDER BY c.id_conteneur
    LIMIT 3
  ) AS s
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.sequence,
  (TIME '07:30' + (c.sequence - 1) * INTERVAL '15 minutes')::time,
  (c.sequence <= 2),
  t.id_tournee,
  c.id_conteneur
FROM tournee_ref t
CROSS JOIN conteneurs c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- Etapes pour T-2025-002
WITH tournee_ref AS (
  SELECT id_tournee FROM tournee WHERE code = 'T-2025-002'
),
conteneurs AS (
  SELECT id_conteneur, row_number() OVER () AS sequence
  FROM (
    SELECT c.id_conteneur
    FROM conteneur c
    JOIN zone z ON z.id_zone = c.id_zone
    WHERE z.code = 'Z02'
    ORDER BY c.id_conteneur
    LIMIT 3
  ) AS s
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.sequence,
  (TIME '08:00' + (c.sequence - 1) * INTERVAL '12 minutes')::time,
  TRUE,
  t.id_tournee,
  c.id_conteneur
FROM tournee_ref t
CROSS JOIN conteneurs c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- Collectes pour T-2025-001
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT NOW() - INTERVAL '2 hours',
  120.5,
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code = 'T-2025-001'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
      AND c.date_heure_collecte = NOW() - INTERVAL '2 hours'
  );

-- Collectes pour T-2025-002
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT NOW() - INTERVAL '1 day' + INTERVAL '3 hours',
  140.0,
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code = 'T-2025-002'
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
      AND c.date_heure_collecte = NOW() - INTERVAL '1 day' + INTERVAL '3 hours'
  );

-- ============================================================================
-- Bulk demo data: 100 tournees + etapes + collectes
-- Objectif: fournir suffisamment de donnees visibles dans le dashboard et la
-- page de gestion des tournees.
-- ============================================================================

WITH bulk_tournees AS (
  SELECT
    gs AS seq,
    'T-2026-B' || LPAD(gs::text, 3, '0') AS code,
    CURRENT_DATE - ((gs - 1) % 30) AS date_tournee,
    CASE
      WHEN gs % 10 = 0 THEN 'ANNULEE'
      WHEN gs % 4 = 0 THEN 'PLANIFIEE'
      WHEN gs % 3 = 0 THEN 'TERMINEE'
      ELSE 'EN_COURS'
    END AS statut,
    (14 + ((gs * 3) % 18))::numeric(10,2) AS distance_prevue_km,
    (120 + ((gs * 11) % 140))::int AS duree_prevue_min,
    CASE
      WHEN gs % 3 = 0 THEN (110 + ((gs * 7) % 130))::int
      ELSE NULL
    END AS duree_reelle_min,
    CASE
      WHEN gs % 3 = 0 THEN (13 + ((gs * 5) % 17))::numeric(10,2)
      ELSE NULL
    END AS distance_reelle_km,
    CASE (gs % 6)
      WHEN 0 THEN 'AB-123-CD'
      WHEN 1 THEN 'EF-456-GH'
      WHEN 2 THEN 'IJ-789-KL'
      WHEN 3 THEN 'MN-012-OP'
      WHEN 4 THEN 'QR-345-ST'
      ELSE 'UV-678-WX'
    END AS immatriculation,
    CASE (gs % 5)
      WHEN 0 THEN 'Z01'
      WHEN 1 THEN 'Z02'
      WHEN 2 THEN 'Z03'
      WHEN 3 THEN 'Z04'
      ELSE 'Z05'
    END AS zone_code,
    CASE (gs % 2)
      WHEN 0 THEN 'agent1@ecotrack.local'
      ELSE 'agent2@ecotrack.local'
    END AS agent_email
  FROM generate_series(1, 100) AS gs
)
INSERT INTO tournee (code, date_tournee, statut, distance_prevue_km, duree_prevue_min, duree_reelle_min, distance_reelle_km, id_vehicule, id_zone, id_agent)
SELECT
  bt.code,
  bt.date_tournee,
  bt.statut,
  bt.distance_prevue_km,
  bt.duree_prevue_min,
  bt.duree_reelle_min,
  bt.distance_reelle_km,
  v.id_vehicule,
  z.id_zone,
  u.id_utilisateur
FROM bulk_tournees bt
JOIN vehicule v ON v.numero_immatriculation = bt.immatriculation
JOIN zone z ON z.code = bt.zone_code
JOIN utilisateur u ON u.email = bt.agent_email
WHERE NOT EXISTS (
  SELECT 1 FROM tournee t WHERE t.code = bt.code
);

WITH tournees_bulk AS (
  SELECT t.id_tournee, t.id_zone, t.statut
  FROM tournee t
  WHERE t.code LIKE 'T-2026-B%'
),
zone_counts AS (
  SELECT c.id_zone, COUNT(*)::int AS cnt
  FROM conteneur c
  WHERE c.statut = 'ACTIF'
  GROUP BY c.id_zone
),
conteneurs_rank AS (
  SELECT
    c.id_zone,
    c.id_conteneur,
    ROW_NUMBER() OVER (PARTITION BY c.id_zone ORDER BY c.id_conteneur) AS rn
  FROM conteneur c
  WHERE c.statut = 'ACTIF'
),
etapes AS (
  SELECT generate_series(1, 4) AS sequence
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT
  e.sequence,
  (TIME '06:30' + (e.sequence - 1) * INTERVAL '20 minutes')::time,
  CASE
    WHEN tb.statut = 'TERMINEE' THEN TRUE
    WHEN tb.statut = 'EN_COURS' THEN e.sequence <= ((tb.id_tournee % 4) + 1)
    ELSE FALSE
  END,
  tb.id_tournee,
  cr.id_conteneur
FROM tournees_bulk tb
JOIN zone_counts zc ON zc.id_zone = tb.id_zone
JOIN etapes e ON TRUE
JOIN conteneurs_rank cr
  ON cr.id_zone = tb.id_zone
 AND cr.rn = (((tb.id_tournee + e.sequence - 1) % zc.cnt) + 1)
ON CONFLICT (id_tournee, sequence) DO NOTHING;

INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT
  (
    t.date_tournee::timestamp
    + COALESCE(e.heure_estimee, TIME '08:00')
    + ((e.sequence % 3) * INTERVAL '7 minutes')
  ),
  (65 + ((t.id_tournee + e.sequence) % 90))::numeric(10,2),
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code LIKE 'T-2026-B%'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );
