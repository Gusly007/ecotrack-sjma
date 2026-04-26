-- ============================================================================
-- Seed: 023_tournees_progression_demo
-- Description:
--   Données de démonstration pour tester la progression des tournées en cours
--   et les défis des agents.
--
--   Crée:
--   - 5 tournées EN_COURS avec progression partielle
--   - 4 tournées PLANIFIEE pour bientôt
--   - Étapes et collectes en progression pour chaque tournée
--   - Défis avec progression pour les agents
--   - Historique de points pour les agents
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Insertion des tournées EN_COURS avec progression
-- ---------------------------------------------------------------------------
WITH tournees_en_cours(code, date_tournee, heure_debut_prevue, statut,
                        distance_prevue_km, duree_prevue_min,
                        immatriculation, zone_code, agent_email) AS (
  VALUES
    -- Tournée 1: Bien avancée (70% complétée)
    ('T-PROGRESS-001', CURRENT_DATE,
     TIME '06:30', 'EN_COURS',
     25.0::numeric, 240,
     'AB-123-CD', 'Z24', 'agent1@ecotrack.local'),

    -- Tournée 2: En cours (40% complétée)
    ('T-PROGRESS-002', CURRENT_DATE,
     TIME '07:00', 'EN_COURS',
     20.5::numeric, 180,
     'EF-456-GH', 'Z24', 'agent2@ecotrack.local'),

    -- Tournée 3: Juste commencée (20% complétée)
    ('T-PROGRESS-003', CURRENT_DATE,
     TIME '08:00', 'EN_COURS',
     18.0::numeric, 150,
     'IJ-789-KL', 'Z24', 'agent1@ecotrack.local'),

    -- Tournée 4: Presque terminée (90% complétée)
    ('T-PROGRESS-004', CURRENT_DATE,
     TIME '05:00', 'EN_COURS',
     22.0::numeric, 200,
     'MN-012-OP', 'Z24', 'agent2@ecotrack.local'),

    -- Tournée 5: En pause (50% complétée)
    ('T-PROGRESS-005', CURRENT_DATE,
     TIME '07:30', 'EN_COURS',
     19.5::numeric, 170,
     'QR-345-ST', 'Z24', 'agent3@ecotrack.local')
)
INSERT INTO tournee (
  code, date_tournee, heure_debut_prevue, statut,
  distance_prevue_km, duree_prevue_min,
  id_vehicule, id_zone, id_agent
)
SELECT
  t.code,
  t.date_tournee,
  t.heure_debut_prevue,
  t.statut,
  t.distance_prevue_km,
  t.duree_prevue_min,
  v.id_vehicule,
  z.id_zone,
  u.id_utilisateur
FROM tournees_en_cours t
JOIN vehicule v ON v.numero_immatriculation = t.immatriculation
JOIN zone z ON z.code = t.zone_code
JOIN utilisateur u ON u.email = t.agent_email
WHERE NOT EXISTS (SELECT 1 FROM tournee WHERE code = t.code);

-- ---------------------------------------------------------------------------
-- 2. Insertion des tournées PLANIFIEE pour demain et surdemain
-- ---------------------------------------------------------------------------
WITH tournees_planifiees(code, date_tournee, heure_debut_prevue, statut,
                         distance_prevue_km, duree_prevue_min,
                         immatriculation, zone_code, agent_email) AS (
  VALUES
    ('T-PLANIF-001', CURRENT_DATE + INTERVAL '1 day',
     TIME '06:00', 'PLANIFIEE',
     24.0::numeric, 220,
     'AB-123-CD', 'Z24', 'agent1@ecotrack.local'),

    ('T-PLANIF-002', CURRENT_DATE + INTERVAL '1 day',
     TIME '07:00', 'PLANIFIEE',
     21.0::numeric, 190,
     'EF-456-GH', 'Z24', 'agent2@ecotrack.local'),

    ('T-PLANIF-003', CURRENT_DATE + INTERVAL '2 days',
     TIME '06:30', 'PLANIFIEE',
     26.5::numeric, 250,
     'IJ-789-KL', 'Z24', 'agent1@ecotrack.local'),

    ('T-PLANIF-004', CURRENT_DATE + INTERVAL '2 days',
     TIME '07:30', 'PLANIFIEE',
     20.0::numeric, 180,
     'MN-012-OP', 'Z24', 'agent2@ecotrack.local')
)
INSERT INTO tournee (
  code, date_tournee, heure_debut_prevue, statut,
  distance_prevue_km, duree_prevue_min,
  id_vehicule, id_zone, id_agent
)
SELECT
  t.code,
  t.date_tournee,
  t.heure_debut_prevue,
  t.statut,
  t.distance_prevue_km,
  t.duree_prevue_min,
  v.id_vehicule,
  z.id_zone,
  u.id_utilisateur
FROM tournees_planifiees t
JOIN vehicule v ON v.numero_immatriculation = t.immatriculation
JOIN zone z ON z.code = t.zone_code
JOIN utilisateur u ON u.email = t.agent_email
WHERE NOT EXISTS (SELECT 1 FROM tournee WHERE code = t.code);

-- ---------------------------------------------------------------------------
-- 3. Insertion des étapes pour T-PROGRESS-001 (70% complétée = 7/10 conteneurs)
-- ---------------------------------------------------------------------------
WITH tournee_ref AS (
  SELECT id_tournee FROM tournee WHERE code = 'T-PROGRESS-001'
),
conteneurs AS (
  SELECT id_conteneur, row_number() OVER (ORDER BY id_conteneur) AS sequence
  FROM (
    SELECT DISTINCT c.id_conteneur
    FROM conteneur c
    WHERE c.id_zone = (SELECT id_zone FROM zone WHERE code = 'Z24')
    ORDER BY c.id_conteneur
    LIMIT 10
  ) AS s
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.sequence,
  (TIME '06:30' + (c.sequence - 1) * INTERVAL '15 minutes')::time,
  (c.sequence <= 7),  -- 7 conteneurs collectés
  t.id_tournee,
  c.id_conteneur
FROM tournee_ref t
CROSS JOIN conteneurs c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Insertion des étapes pour T-PROGRESS-002 (40% complétée = 4/10 conteneurs)
-- ---------------------------------------------------------------------------
WITH tournee_ref AS (
  SELECT id_tournee FROM tournee WHERE code = 'T-PROGRESS-002'
),
conteneurs AS (
  SELECT id_conteneur, row_number() OVER (ORDER BY id_conteneur) AS sequence
  FROM (
    SELECT DISTINCT c.id_conteneur
    FROM conteneur c
    WHERE c.id_zone = (SELECT id_zone FROM zone WHERE code = 'Z24')
    ORDER BY c.id_conteneur
    OFFSET 10 LIMIT 10
  ) AS s
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.sequence,
  (TIME '07:00' + (c.sequence - 1) * INTERVAL '12 minutes')::time,
  (c.sequence <= 4),  -- 4 conteneurs collectés
  t.id_tournee,
  c.id_conteneur
FROM tournee_ref t
CROSS JOIN conteneurs c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Insertion des étapes pour T-PROGRESS-003 (20% complétée = 2/10 conteneurs)
-- ---------------------------------------------------------------------------
WITH tournee_ref AS (
  SELECT id_tournee FROM tournee WHERE code = 'T-PROGRESS-003'
),
conteneurs AS (
  SELECT id_conteneur, row_number() OVER (ORDER BY id_conteneur) AS sequence
  FROM (
    SELECT DISTINCT c.id_conteneur
    FROM conteneur c
    WHERE c.id_zone = (SELECT id_zone FROM zone WHERE code = 'Z24')
    ORDER BY c.id_conteneur
    OFFSET 20 LIMIT 10
  ) AS s
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.sequence,
  (TIME '08:00' + (c.sequence - 1) * INTERVAL '18 minutes')::time,
  (c.sequence <= 2),  -- 2 conteneurs collectés
  t.id_tournee,
  c.id_conteneur
FROM tournee_ref t
CROSS JOIN conteneurs c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Insertion des étapes pour T-PROGRESS-004 (90% complétée = 9/10 conteneurs)
-- ---------------------------------------------------------------------------
WITH tournee_ref AS (
  SELECT id_tournee FROM tournee WHERE code = 'T-PROGRESS-004'
),
conteneurs AS (
  SELECT id_conteneur, row_number() OVER (ORDER BY id_conteneur) AS sequence
  FROM (
    SELECT DISTINCT c.id_conteneur
    FROM conteneur c
    WHERE c.id_zone = (SELECT id_zone FROM zone WHERE code = 'Z24')
    ORDER BY c.id_conteneur
    OFFSET 30 LIMIT 10
  ) AS s
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.sequence,
  (TIME '05:00' + (c.sequence - 1) * INTERVAL '20 minutes')::time,
  (c.sequence <= 9),  -- 9 conteneurs collectés
  t.id_tournee,
  c.id_conteneur
FROM tournee_ref t
CROSS JOIN conteneurs c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Insertion des étapes pour T-PROGRESS-005 (50% complétée = 5/10 conteneurs)
-- ---------------------------------------------------------------------------
WITH tournee_ref AS (
  SELECT id_tournee FROM tournee WHERE code = 'T-PROGRESS-005'
),
conteneurs AS (
  SELECT id_conteneur, row_number() OVER (ORDER BY id_conteneur) AS sequence
  FROM (
    SELECT DISTINCT c.id_conteneur
    FROM conteneur c
    WHERE c.id_zone = (SELECT id_zone FROM zone WHERE code = 'Z24')
    ORDER BY c.id_conteneur
    OFFSET 40 LIMIT 10
  ) AS s
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT c.sequence,
  (TIME '07:30' + (c.sequence - 1) * INTERVAL '14 minutes')::time,
  (c.sequence <= 5),  -- 5 conteneurs collectés
  t.id_tournee,
  c.id_conteneur
FROM tournee_ref t
CROSS JOIN conteneurs c
ON CONFLICT (id_tournee, sequence) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Insertion des étapes pour les tournées PLANIFIEE
-- ---------------------------------------------------------------------------
WITH tournees_a_garnir AS (
  SELECT t.id_tournee, z.id_zone, z.code
  FROM tournee t
  JOIN zone z ON t.id_zone = z.id_zone
  WHERE t.code IN ('T-PLANIF-001', 'T-PLANIF-002', 'T-PLANIF-003', 'T-PLANIF-004')
)
INSERT INTO etape_tournee (sequence, heure_estimee, collectee, id_tournee, id_conteneur)
SELECT row_number() OVER (PARTITION BY t.id_tournee ORDER BY c.id_conteneur) AS sequence,
  NULL,
  FALSE,
  t.id_tournee,
  c.id_conteneur
FROM tournees_a_garnir t
JOIN conteneur c ON c.id_zone = t.id_zone
WHERE NOT EXISTS (
  SELECT 1 FROM etape_tournee e WHERE e.id_tournee = t.id_tournee
)
LIMIT 40;

-- ---------------------------------------------------------------------------
-- 9. Insertion des collectes pour T-PROGRESS-001 (7 collectes)
-- ---------------------------------------------------------------------------
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT NOW() - INTERVAL '2 hours' + (e.sequence - 1) * INTERVAL '15 minutes',
  (RANDOM() * 50 + 50)::numeric,
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code = 'T-PROGRESS-001'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );

-- ---------------------------------------------------------------------------
-- 10. Insertion des collectes pour T-PROGRESS-002 (4 collectes)
-- ---------------------------------------------------------------------------
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT NOW() - INTERVAL '4 hours' + (e.sequence - 1) * INTERVAL '12 minutes',
  (RANDOM() * 45 + 55)::numeric,
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code = 'T-PROGRESS-002'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );

-- ---------------------------------------------------------------------------
-- 11. Insertion des collectes pour T-PROGRESS-003 (2 collectes)
-- ---------------------------------------------------------------------------
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT NOW() - INTERVAL '1 hour' + (e.sequence - 1) * INTERVAL '18 minutes',
  (RANDOM() * 40 + 60)::numeric,
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code = 'T-PROGRESS-003'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );

-- ---------------------------------------------------------------------------
-- 12. Insertion des collectes pour T-PROGRESS-004 (9 collectes)
-- ---------------------------------------------------------------------------
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT NOW() - INTERVAL '6 hours' + (e.sequence - 1) * INTERVAL '20 minutes',
  (RANDOM() * 55 + 45)::numeric,
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code = 'T-PROGRESS-004'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );

-- ---------------------------------------------------------------------------
-- 13. Insertion des collectes pour T-PROGRESS-005 (5 collectes)
-- ---------------------------------------------------------------------------
INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
SELECT NOW() - INTERVAL '3 hours' + (e.sequence - 1) * INTERVAL '14 minutes',
  (RANDOM() * 48 + 52)::numeric,
  t.id_tournee,
  e.id_conteneur
FROM etape_tournee e
JOIN tournee t ON t.id_tournee = e.id_tournee
WHERE t.code = 'T-PROGRESS-005'
  AND e.collectee = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM collecte c
    WHERE c.id_tournee = t.id_tournee
      AND c.id_conteneur = e.id_conteneur
  );

-- ---------------------------------------------------------------------------
-- 14. Insertion des défis en cours pour les agents
-- ---------------------------------------------------------------------------
INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi)
SELECT v.titre, v.description, v.objectif, v.recompense_points, v.date_debut, v.date_fin, v.type_defi
FROM (
  VALUES
    ('Compléter 5 tournées', 'Terminez 5 tournées cette semaine', 5, 100, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', 'INDIVIDUEL'),
    ('Collecte efficace', 'Collectez plus de 500 kg cette semaine', 500, 150, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'INDIVIDUEL'),
    ('Tournées sans retard', 'Finissez 3 tournées sans dépasser le temps prévu', 3, 120, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '6 days', 'INDIVIDUEL'),
    ('Champion des collectes', 'Collectez 1000 kg en équipe cette semaine', 1000, 300, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'COLLECTIF')
) AS v(titre, description, objectif, recompense_points, date_debut, date_fin, type_defi)
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi d WHERE d.titre = v.titre);

-- ---------------------------------------------------------------------------
-- 15. Insertion des participations aux défis avec progression
-- ---------------------------------------------------------------------------
INSERT INTO gamification_participation_defi (id_defi, id_utilisateur, progression, statut, derniere_maj)
SELECT d.id_defi, u.id_utilisateur, v.progression, v.statut, NOW() - INTERVAL '30 minutes'
FROM (
  VALUES
    ('Compléter 5 tournées', 'agent1@ecotrack.local', 3, 'EN_COURS'),
    ('Compléter 5 tournées', 'agent2@ecotrack.local', 2, 'EN_COURS'),
    ('Compléter 5 tournées', 'agent3@ecotrack.local', 1, 'EN_COURS'),
    ('Collecte efficace', 'agent1@ecotrack.local', 380, 'EN_COURS'),
    ('Collecte efficace', 'agent2@ecotrack.local', 220, 'EN_COURS'),
    ('Tournées sans retard', 'agent1@ecotrack.local', 2, 'EN_COURS'),
    ('Tournées sans retard', 'agent2@ecotrack.local', 1, 'EN_COURS'),
    ('Champion des collectes', 'agent1@ecotrack.local', 650, 'EN_COURS'),
    ('Champion des collectes', 'agent2@ecotrack.local', 420, 'EN_COURS')
) AS v(defi_titre, user_email, progression, statut)
JOIN gamification_defi d ON d.titre = v.defi_titre
JOIN utilisateur u ON u.email = v.user_email
WHERE NOT EXISTS (
  SELECT 1 FROM gamification_participation_defi p
  WHERE p.id_defi = d.id_defi
    AND p.id_utilisateur = u.id_utilisateur
);

-- ---------------------------------------------------------------------------
-- 16. Insertion des points de progression pour les agents
-- ---------------------------------------------------------------------------
INSERT INTO historique_points (delta_points, raison, date_creation, id_utilisateur)
SELECT v.delta_points, v.raison, v.date_creation, u.id_utilisateur
FROM (
  VALUES
    (50, 'Tournée T-PROGRESS-001 en cours (70% complétée)', NOW() - INTERVAL '2 hours', 'agent1@ecotrack.local'),
    (40, 'Tournée T-PROGRESS-002 en cours (40% complétée)', NOW() - INTERVAL '4 hours', 'agent2@ecotrack.local'),
    (20, 'Tournée T-PROGRESS-003 en cours (20% complétée)', NOW() - INTERVAL '1 hour', 'agent1@ecotrack.local'),
    (80, 'Tournée T-PROGRESS-004 en cours (90% complétée)', NOW() - INTERVAL '6 hours', 'agent2@ecotrack.local'),
    (45, 'Tournée T-PROGRESS-005 en cours (50% complétée)', NOW() - INTERVAL '3 hours', 'agent3@ecotrack.local'),
    (30, 'Défi: Collecte efficace progression', NOW() - INTERVAL '30 minutes', 'agent1@ecotrack.local'),
    (25, 'Défi: Collecte efficace progression', NOW() - INTERVAL '45 minutes', 'agent2@ecotrack.local'),
    (35, 'Défi collectif: Champion des collectes progression', NOW() - INTERVAL '1 hour', 'agent1@ecotrack.local')
) AS v(delta_points, raison, date_creation, user_email)
JOIN utilisateur u ON u.email = v.user_email
WHERE NOT EXISTS (
  SELECT 1 FROM historique_points h
  WHERE h.id_utilisateur = u.id_utilisateur
    AND h.raison = v.raison
    AND ABS(EXTRACT(EPOCH FROM (h.date_creation - v.date_creation))) < 60
);

-- Afficher un résumé
SELECT 'Seed 023: Tournées et progression inserées avec succès' AS status,
  (SELECT COUNT(*) FROM tournee WHERE code LIKE 'T-PROGRESS-%' OR code LIKE 'T-PLANIF-%') AS tournees_creees,
  (SELECT COUNT(*) FROM etape_tournee) AS etapes_totales,
  (SELECT COUNT(*) FROM collecte) AS collectes_inserees,
  (SELECT COUNT(*) FROM gamification_participation_defi) AS participations_defis;
