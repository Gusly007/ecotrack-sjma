-- ============================================================================
-- Seed 024 : simulation de progression — zone Z12 (seule zone avec conteneurs ACTIF)
--
-- Crée 8 tournées couvrant tous les cas d'affichage :
--   EN_COURS  0 %   → barre vide, statut "En cours"
--   EN_COURS  20 %  → barre courte
--   EN_COURS  50 %  → barre à mi-chemin
--   EN_COURS  70 %  → barre bien remplie
--   EN_COURS  90 %  → label "Bientôt fini"
--   EN_COURS retard → badge ⚠ EN RETARD  (heure_debut + duree_prevue dépassée)
--   PLANIFIEE demain
--   TERMINEE  hier  → 100 %, durée/distance réelles renseignées
--
-- NOTE : ROW_NUMBER() doit être appliqué APRÈS le LIMIT/OFFSET pour que seq
--        commence toujours à 1 dans chaque CTE (sinon seq = 11, 21…)
-- Idempotent : WHERE NOT EXISTS + ON CONFLICT DO NOTHING.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tournées
-- ---------------------------------------------------------------------------
INSERT INTO tournee (
  code, date_tournee, heure_debut_prevue, statut,
  duree_prevue_min, distance_prevue_km,
  duree_reelle_min, distance_reelle_km,
  id_vehicule, id_zone, id_agent
)
SELECT
  d.code,
  d.date_tournee,
  d.heure_debut_prevue,
  d.statut,
  d.duree_prevue_min,
  d.distance_prevue_km,
  d.duree_reelle_min,
  d.distance_reelle_km,
  v.id_vehicule,
  35,   -- Z12 : seule zone avec conteneurs ACTIF
  u.id_utilisateur
FROM (
  VALUES
    -- EN_COURS heure_debut tard (22 h + 2 h = 00 h) → fin > NOW → pas de retard
    ('T-SIM-000',    CURRENT_DATE,         '22:00'::time, 'EN_COURS',  120, 18.0::numeric, NULL::int, NULL::numeric, 'AB-123-CD', 'agent1@ecotrack.local'),
    ('T-SIM-020',    CURRENT_DATE,         '22:00'::time, 'EN_COURS',  120, 20.0::numeric, NULL::int, NULL::numeric, 'EF-456-GH', 'agent2@ecotrack.local'),
    ('T-SIM-050',    CURRENT_DATE,         '22:00'::time, 'EN_COURS',  120, 22.0::numeric, NULL::int, NULL::numeric, 'IJ-789-KL', 'agent3@ecotrack.local'),
    ('T-SIM-070',    CURRENT_DATE,         '22:00'::time, 'EN_COURS',  120, 24.0::numeric, NULL::int, NULL::numeric, 'MN-012-OP', 'agent4@ecotrack.local'),
    ('T-SIM-090',    CURRENT_DATE,         '22:00'::time, 'EN_COURS',  120, 25.0::numeric, NULL::int, NULL::numeric, 'QR-345-ST', 'agent5@ecotrack.local'),
    -- EN_COURS en retard : 05:00 + 60 min = 06:00 < NOW → est_en_retard = TRUE
    ('T-SIM-RETARD', CURRENT_DATE,         '05:00'::time, 'EN_COURS',   60, 12.0::numeric, NULL::int, NULL::numeric, 'UV-678-WX', 'agent6@ecotrack.local'),
    -- PLANIFIEE demain → pas de retard attendu
    ('T-SIM-PLANIF', CURRENT_DATE + 1,     '07:30'::time, 'PLANIFIEE', 150, 19.0::numeric, NULL::int, NULL::numeric, 'VH-029',    'agent7@ecotrack.local'),
    -- TERMINEE hier → durée/distance réelles
    ('T-SIM-TERM',   CURRENT_DATE - 1,     '07:00'::time, 'TERMINEE',  120, 16.0::numeric,   115,     15.8::numeric, 'VH-033',    'agent8@ecotrack.local')
) AS d(code, date_tournee, heure_debut_prevue, statut,
       duree_prevue_min, distance_prevue_km, duree_reelle_min, distance_reelle_km,
       immatriculation, agent_email)
JOIN vehicule    v ON v.numero_immatriculation = d.immatriculation
JOIN utilisateur u ON u.email                 = d.agent_email
WHERE NOT EXISTS (SELECT 1 FROM tournee t WHERE t.code = d.code);

-- ---------------------------------------------------------------------------
-- 2. Étapes — correctif : ROW_NUMBER après LIMIT/OFFSET pour seq toujours = 1..N
--    Chaque tournée prend 10 conteneurs distincts (OFFSET 0, 10, 20...)
-- ---------------------------------------------------------------------------

-- T-SIM-000 : 10 étapes, 0 collectées (0 %) — OFFSET 0
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-000'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 10 OFFSET 0) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('22:00'::time + (c.seq - 1) * INTERVAL '10 minutes')::time,
       FALSE,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- T-SIM-020 : 10 étapes, 2 collectées (20 %) — OFFSET 10
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-020'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 10 OFFSET 10) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('22:00'::time + (c.seq - 1) * INTERVAL '10 minutes')::time,
       c.seq <= 2,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- T-SIM-050 : 10 étapes, 5 collectées (50 %) — OFFSET 20
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-050'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 10 OFFSET 20) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('22:00'::time + (c.seq - 1) * INTERVAL '10 minutes')::time,
       c.seq <= 5,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- T-SIM-070 : 10 étapes, 7 collectées (70 %) — OFFSET 30
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-070'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 10 OFFSET 30) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('22:00'::time + (c.seq - 1) * INTERVAL '10 minutes')::time,
       c.seq <= 7,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- T-SIM-090 : 10 étapes, 9 collectées (90 % → "Bientôt fini") — OFFSET 40
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-090'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 10 OFFSET 40) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('22:00'::time + (c.seq - 1) * INTERVAL '10 minutes')::time,
       c.seq <= 9,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- T-SIM-RETARD : 6 étapes, 2 collectées (33 %, badge EN RETARD) — OFFSET 50
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-RETARD'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 6 OFFSET 50) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('05:00'::time + (c.seq - 1) * INTERVAL '12 minutes')::time,
       c.seq <= 2,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- T-SIM-PLANIF : 10 étapes, toutes non collectées — OFFSET 56
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-PLANIF'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 10 OFFSET 56) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('07:30'::time + (c.seq - 1) * INTERVAL '12 minutes')::time,
       FALSE,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- T-SIM-TERM : 10 étapes, toutes collectées (100 %) — OFFSET 66
WITH t AS (SELECT id_tournee FROM tournee WHERE code = 'T-SIM-TERM'),
     c AS (
       SELECT id_conteneur,
              ROW_NUMBER() OVER (ORDER BY id_conteneur) AS seq
       FROM (SELECT id_conteneur FROM conteneur
             WHERE id_zone = 35 AND statut = 'ACTIF'
             ORDER BY id_conteneur LIMIT 10 OFFSET 66) AS sub
     )
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.seq,
       ('07:00'::time + (c.seq - 1) * INTERVAL '11 minutes')::time,
       TRUE,
       t.id_tournee,
       c.id_conteneur
FROM t CROSS JOIN c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Collectes pour toutes les étapes marquées collectee = TRUE
-- ---------------------------------------------------------------------------
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT
  (t.date_tournee::timestamp
    + COALESCE(e.heure_estimee, TIME '08:00')
    + (e.sequence % 4) * INTERVAL '3 minutes'),
  (55 + (e.sequence * 11) % 65)::numeric(10,2),
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code LIKE 'T-SIM-%'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee   = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );

-- ---------------------------------------------------------------------------
-- 4. Résumé
-- ---------------------------------------------------------------------------
SELECT
  t.code,
  t.statut,
  COUNT(e.id_etape)                                                       AS total_etapes,
  SUM(CASE WHEN e.collectee THEN 1 ELSE 0 END)                            AS collectees,
  ROUND(SUM(CASE WHEN e.collectee THEN 1 ELSE 0 END)::numeric
        / NULLIF(COUNT(e.id_etape), 0) * 100)                             AS pct,
  (SELECT COUNT(*) FROM collecte c WHERE c.id_tournee = t.id_tournee)     AS nb_collectes,
  CASE WHEN (t.statut IN ('PLANIFIEE','EN_COURS')
             AND (t.date_tournee::timestamp + t.heure_debut_prevue
                  + (COALESCE(t.duree_prevue_min,0) || ' minutes')::interval) < NOW())
       THEN 'OUI' ELSE 'non' END                                          AS est_en_retard
FROM tournee t
LEFT JOIN etape_tournee e ON e.id_tournee = t.id_tournee
WHERE t.code LIKE 'T-SIM-%'
GROUP BY t.id_tournee, t.code, t.statut, t.date_tournee, t.heure_debut_prevue, t.duree_prevue_min
ORDER BY t.code;
