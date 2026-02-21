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
