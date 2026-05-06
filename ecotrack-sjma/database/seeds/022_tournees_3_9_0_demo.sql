-- ============================================================================
-- Seed: 022_tournees_3_9_0_demo
-- Description:
--   Données de démonstration pour valider la version 3.9.0 (gestion fine du
--   retard de tournée + transition automatique PLANIFIEE → EN_COURS).
--
--   Sept tournées sont créées pour couvrir tous les scénarios métier que la
--   nouvelle logique doit gérer correctement :
--
--     1. T-DEMO-RETARD-PLAN  : PLANIFIEE clairement en retard       → badge visible
--     2. T-DEMO-RETARD-COURS : EN_COURS en retard (heure dépassée)  → badge visible
--     3. T-DEMO-OK-PLAN      : PLANIFIEE prévue plus tard           → pas de badge
--     4. T-DEMO-OK-COURS     : EN_COURS pas encore en retard        → pas de badge
--     5. T-DEMO-TERMINEE     : TERMINEE (même si heure dépassée)    → pas de badge
--     6. T-DEMO-ANNULEE      : ANNULEE                              → pas de badge
--     7. T-DEMO-TRANSITION   : PLANIFIEE sans collecte             → permet de tester
--                              la bascule automatique en EN_COURS
--                              au premier scan agent
--
--   Toutes les insertions sont idempotentes (WHERE NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Insertion des sept tournées (idempotent)
-- ---------------------------------------------------------------------------
WITH demo_tournees(code, date_tournee, heure_debut_prevue, statut,
                   distance_prevue_km, duree_prevue_min,
                   duree_reelle_min, distance_reelle_km,
                   immatriculation, zone_code, agent_email) AS (
  VALUES
    -- 1) PLANIFIEE en retard (date passée + heure dépassée)
    ('T-DEMO-RETARD-PLAN',  CURRENT_DATE - INTERVAL '1 day',
     TIME '07:30', 'PLANIFIEE',
     12.5::numeric, 120, NULL::int, NULL::numeric,
     'AB-123-CD', 'Z01', 'agent1@ecotrack.local'),

    -- 2) EN_COURS en retard (aujourd'hui, mais heure_debut + duree < NOW)
    ('T-DEMO-RETARD-COURS', CURRENT_DATE,
     TIME '05:00', 'EN_COURS',
     14.2::numeric, 60,  NULL::int, NULL::numeric,
     'EF-456-GH', 'Z02', 'agent2@ecotrack.local'),

    -- 3) PLANIFIEE pas en retard (demain matin)
    ('T-DEMO-OK-PLAN',      CURRENT_DATE + INTERVAL '1 day',
     TIME '07:30', 'PLANIFIEE',
     16.0::numeric, 150, NULL::int, NULL::numeric,
     'IJ-789-KL', 'Z03', 'agent1@ecotrack.local'),

    -- 4) EN_COURS pas en retard (heure de fin prévue dans le futur)
    --    On choisit 23:00 + 60 min de durée → fin théorique à minuit, donc
    --    tant que NOW < aujourd'hui 23:00 + 60min, est_en_retard = FALSE.
    ('T-DEMO-OK-COURS',     CURRENT_DATE,
     TIME '23:00', 'EN_COURS',
     11.8::numeric, 60,  NULL::int, NULL::numeric,
     'MN-012-OP', 'Z04', 'agent2@ecotrack.local'),

    -- 5) TERMINEE (l'heure de fin théorique est dépassée mais le badge ne doit
    --    PAS s'afficher car le statut est clôturé)
    ('T-DEMO-TERMINEE',     CURRENT_DATE - INTERVAL '1 day',
     TIME '07:30', 'TERMINEE',
     18.4::numeric, 180, 175, 18.0::numeric,
     'QR-345-ST', 'Z05', 'agent1@ecotrack.local'),

    -- 6) ANNULEE (idem, jamais de badge)
    ('T-DEMO-ANNULEE',      CURRENT_DATE - INTERVAL '1 day',
     TIME '07:30', 'ANNULEE',
     10.0::numeric, 90,  NULL::int, NULL::numeric,
     'UV-678-WX', 'Z01', 'agent2@ecotrack.local'),

    -- 7) PLANIFIEE prévue dans le futur, sans aucune collecte → sert à
    --    tester la transition automatique PLANIFIEE → EN_COURS quand l'agent
    --    enregistrera son premier scan via l'app mobile/desktop agent.
    ('T-DEMO-TRANSITION',   CURRENT_DATE,
     TIME '23:30', 'PLANIFIEE',
     9.5::numeric, 75,  NULL::int, NULL::numeric,
     'AB-123-CD', 'Z02', 'agent1@ecotrack.local')
)
INSERT INTO tournee (
  code, date_tournee, heure_debut_prevue, statut,
  distance_prevue_km, duree_prevue_min,
  duree_reelle_min, distance_reelle_km,
  id_vehicule, id_zone, id_agent
)
SELECT
  d.code,
  d.date_tournee,
  d.heure_debut_prevue,
  d.statut,
  d.distance_prevue_km,
  d.duree_prevue_min,
  d.duree_reelle_min,
  d.distance_reelle_km,
  v.id_vehicule,
  z.id_zone,
  u.id_utilisateur
FROM demo_tournees d
JOIN vehicule    v ON v.numero_immatriculation = d.immatriculation
JOIN zone        z ON z.code                  = d.zone_code
JOIN utilisateur u ON u.email                 = d.agent_email
WHERE NOT EXISTS (
  SELECT 1 FROM tournee t WHERE t.code = d.code
);

-- ---------------------------------------------------------------------------
-- 2. Étapes : 3 conteneurs par tournée, séquence 1..3
-- ---------------------------------------------------------------------------
WITH demo AS (
  SELECT t.id_tournee, t.id_zone, t.statut, t.code, t.heure_debut_prevue
  FROM tournee t
  WHERE t.code LIKE 'T-DEMO-%'
),
zone_conteneurs AS (
  SELECT
    c.id_zone,
    c.id_conteneur,
    ROW_NUMBER() OVER (PARTITION BY c.id_zone ORDER BY c.id_conteneur) AS rn
  FROM conteneur c
  WHERE c.statut = 'ACTIF'
),
sequences AS (
  SELECT generate_series(1, 3) AS sequence
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT
  s.sequence,
  -- L'heure estimée part de heure_debut_prevue + (sequence-1) × 15 min
  (d.heure_debut_prevue + (s.sequence - 1) * INTERVAL '15 minutes')::time,
  CASE
    -- Tournée terminée : toutes les étapes collectées
    WHEN d.statut = 'TERMINEE'                   THEN TRUE
    -- EN_COURS en retard : 1 étape sur 3 collectée
    WHEN d.code   = 'T-DEMO-RETARD-COURS'        THEN s.sequence = 1
    -- EN_COURS OK : 2 étapes sur 3 collectées
    WHEN d.code   = 'T-DEMO-OK-COURS'            THEN s.sequence <= 2
    -- Tout le reste : pas encore collecté
    ELSE FALSE
  END AS collectee,
  d.id_tournee,
  zc.id_conteneur
FROM demo d
JOIN sequences s ON TRUE
JOIN zone_conteneurs zc
  ON zc.id_zone = d.id_zone
 AND zc.rn      = s.sequence
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Collectes correspondant aux étapes marquées collectee = TRUE
--    (sauf pour la tournée TRANSITION : on veut zéro collecte pour pouvoir
--    déclencher la bascule auto via l'app agent)
-- ---------------------------------------------------------------------------
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT
  -- Heure de collecte = jour de la tournée + heure estimée + petite variation
  (t.date_tournee::timestamp
    + COALESCE(e.heure_estimee, TIME '08:00')
    + ((e.sequence % 3) * INTERVAL '5 minutes')),
  (75 + ((e.sequence * 9) % 60))::numeric(10,2),
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code LIKE 'T-DEMO-%'
  AND t.code <> 'T-DEMO-TRANSITION'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee   = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );

-- ============================================================================
-- 4. Simulation de progression (3.9.0)
--    Sept tournées EN_COURS supplémentaires couvrant tout le spectre de la
--    barre de progression : 0 %, 12 %, 25 %, 50 %, 75 %, 87 %, 95 %.
--
--    Toutes ont une heure de début prévue suffisamment tardive (23:00) pour
--    NE PAS apparaître en retard — l'objectif ici est purement visuel
--    (rendu de la barre de progression et des libellés "Bientôt fini" à 90 %+).
--
--    Volume des étapes choisi pour atteindre des pourcentages "ronds" :
--      8 étapes  → 0/8 = 0 %, 1/8 ≈ 12 %, 2/8 = 25 %, 4/8 = 50 %, 6/8 = 75 %, 7/8 ≈ 87 %
--      20 étapes → 19/20 = 95 %
-- ============================================================================

-- 4.1 Insertion des tournées de progression
WITH progression_tournees(code, total_etapes, etapes_collectees, zone_code, agent_email, immatriculation) AS (
  VALUES
    ('T-DEMO-PROG-000', 8,  0,  'Z01', 'agent1@ecotrack.local', 'AB-123-CD'),
    ('T-DEMO-PROG-012', 8,  1,  'Z02', 'agent2@ecotrack.local', 'EF-456-GH'),
    ('T-DEMO-PROG-025', 8,  2,  'Z03', 'agent1@ecotrack.local', 'IJ-789-KL'),
    ('T-DEMO-PROG-050', 8,  4,  'Z04', 'agent2@ecotrack.local', 'MN-012-OP'),
    ('T-DEMO-PROG-075', 8,  6,  'Z05', 'agent1@ecotrack.local', 'QR-345-ST'),
    ('T-DEMO-PROG-087', 8,  7,  'Z01', 'agent2@ecotrack.local', 'UV-678-WX'),
    ('T-DEMO-PROG-095', 20, 19, 'Z02', 'agent1@ecotrack.local', 'AB-123-CD')
)
INSERT INTO tournee (
  code, date_tournee, heure_debut_prevue, statut,
  distance_prevue_km, duree_prevue_min,
  duree_reelle_min, distance_reelle_km,
  id_vehicule, id_zone, id_agent
)
SELECT
  pt.code,
  CURRENT_DATE,
  TIME '23:00',                                -- pas en retard (fin théorique demain)
  'EN_COURS',
  (10 + (pt.total_etapes::numeric * 1.5))::numeric(10,2),
  (60 + pt.total_etapes * 8)::int,             -- ex : 8 étapes -> 124 min
  NULL,
  NULL,
  v.id_vehicule,
  z.id_zone,
  u.id_utilisateur
FROM progression_tournees pt
JOIN vehicule    v ON v.numero_immatriculation = pt.immatriculation
JOIN zone        z ON z.code                  = pt.zone_code
JOIN utilisateur u ON u.email                 = pt.agent_email
WHERE NOT EXISTS (
  SELECT 1 FROM tournee t WHERE t.code = pt.code
);

-- 4.2 Étapes : nombre paramétré par le code de la tournée
WITH demo AS (
  SELECT
    t.id_tournee,
    t.id_zone,
    t.code,
    t.heure_debut_prevue,
    -- Décodage : la 4e position du code est PROG-XXX, total tiré de la table
    CASE WHEN t.code = 'T-DEMO-PROG-095' THEN 20 ELSE 8 END AS total_etapes,
    CASE
      WHEN t.code = 'T-DEMO-PROG-000' THEN 0
      WHEN t.code = 'T-DEMO-PROG-012' THEN 1
      WHEN t.code = 'T-DEMO-PROG-025' THEN 2
      WHEN t.code = 'T-DEMO-PROG-050' THEN 4
      WHEN t.code = 'T-DEMO-PROG-075' THEN 6
      WHEN t.code = 'T-DEMO-PROG-087' THEN 7
      WHEN t.code = 'T-DEMO-PROG-095' THEN 19
      ELSE 0
    END AS etapes_collectees
  FROM tournee t
  WHERE t.code LIKE 'T-DEMO-PROG-%'
),
zone_conteneurs AS (
  SELECT
    c.id_zone,
    c.id_conteneur,
    ROW_NUMBER() OVER (PARTITION BY c.id_zone ORDER BY c.id_conteneur) AS rn
  FROM conteneur c
  WHERE c.statut = 'ACTIF'
),
zone_counts AS (
  SELECT id_zone, COUNT(*)::int AS cnt
  FROM zone_conteneurs
  GROUP BY id_zone
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT
  s.sequence,
  (d.heure_debut_prevue + (s.sequence - 1) * INTERVAL '8 minutes')::time,
  (s.sequence <= d.etapes_collectees) AS collectee,
  d.id_tournee,
  zc.id_conteneur
FROM demo d
JOIN zone_counts zcnt ON zcnt.id_zone = d.id_zone
JOIN LATERAL generate_series(1, d.total_etapes) AS s(sequence) ON TRUE
JOIN zone_conteneurs zc
  ON zc.id_zone = d.id_zone
  -- On boucle modulo le nombre de conteneurs disponibles dans la zone pour
  -- éviter "rn = sequence" qui casserait dès qu'une zone a < total_etapes conteneurs.
 AND zc.rn      = (((s.sequence - 1) % zcnt.cnt) + 1)
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- 4.3 Collectes pour chaque étape marquée collectee = TRUE
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT
  (t.date_tournee::timestamp
    + COALESCE(e.heure_estimee, TIME '08:00')
    + ((e.sequence % 5) * INTERVAL '4 minutes')),
  (60 + ((e.sequence * 13) % 80))::numeric(10,2),
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code LIKE 'T-DEMO-PROG-%'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee   = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );
