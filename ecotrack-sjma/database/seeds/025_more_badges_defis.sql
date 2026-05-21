-- 022_more_badges_defis.sql
--
-- Ajoute de la variété au catalogue gamification :
--   - 5 nouveaux badges (en plus des 16 existants)
--   - 9 nouveaux défis citoyens (tous basés sur type_action='signalement',
--     pour rester compatibles à 100 % avec le système actuel
--     d'auto-progression dans `progresserDefisActifs`).
--
-- 100 % idempotent : les INSERT utilisent ON CONFLICT DO NOTHING sur la
-- contrainte unique de chaque table (badge.code et gamification_defi a
-- pas de contrainte unique sur titre, donc on protège via WHERE NOT EXISTS).

-- ---------------------------------------------------------------------------
-- 1. Nouveaux badges (description visible côté UI)
-- ---------------------------------------------------------------------------
INSERT INTO badge (code, nom, description) VALUES
  ('REPORTER_PLATINUM', 'Reporter Platine',     'A déposé 250 signalements ou plus.'),
  ('URGENT_HERO',       'Héros de l''urgence',  'A signalé 5 problèmes en urgence Haute.'),
  ('PHOTO_REPORTER',    'Reporter photographe', 'A joint une photo à 5 signalements.'),
  ('NIGHT_OWL',         'Veilleur nocturne',    'A signalé un problème entre 22 h et 6 h.'),
  ('COMMUNITY_PILLAR',  'Pilier communautaire', 'A complété 3 défis citoyens.')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Mettre à jour la description des badges existants si elle est NULL
--    (les anciennes seeds inséraient parfois sans description).
-- ---------------------------------------------------------------------------
UPDATE badge SET description = COALESCE(description,
  CASE code
    WHEN 'FIRST_REPORT'    THEN 'Bravo pour votre tout premier signalement !'
    WHEN 'REPORTER_BRONZE' THEN '5 signalements déposés. Continuez !'
    WHEN 'REPORTER_SILVER' THEN '25 signalements à votre actif.'
    WHEN 'REPORTER_GOLD'   THEN '100 signalements — un pilier de la communauté.'
    WHEN 'ECO_STARTER'     THEN '100 points cumulés.'
    WHEN 'ECO_WARRIOR'     THEN '500 points cumulés.'
    WHEN 'ECO_HERO'        THEN '1 000 points cumulés.'
    WHEN 'ECO_LEGEND'      THEN '5 000 points cumulés — légendaire.'
    WHEN 'WEEK_STREAK'     THEN '7 jours d''affilée avec une action citoyenne.'
    WHEN 'MONTH_STREAK'    THEN '30 jours d''affilée avec une action.'
    WHEN 'EARLY_ADOPTER'   THEN 'Compte créé dès le lancement de la plateforme.'
    WHEN 'RECYCLING_PRO'   THEN 'Champion du tri sélectif.'
    WHEN 'CLEAN_CITY'      THEN '10 signalements résolus grâce à vos alertes.'
    ELSE NULL
  END
) WHERE code IN (
  'FIRST_REPORT','REPORTER_BRONZE','REPORTER_SILVER','REPORTER_GOLD',
  'ECO_STARTER','ECO_WARRIOR','ECO_HERO','ECO_LEGEND',
  'WEEK_STREAK','MONTH_STREAK','EARLY_ADOPTER','RECYCLING_PRO','CLEAN_CITY'
);

-- ---------------------------------------------------------------------------
-- 3. 9 nouveaux défis (tous type_action='signalement' pour rester
--    compatibles avec progresserDefisActifs() sans changement backend).
--    Variété : objectifs 1 → 100, durées 7 → 180 jours, récompenses 30 → 2500 pts.
-- ---------------------------------------------------------------------------
INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT v.titre, v.description, v.objectif, v.recompense, v.date_debut, v.date_fin, v.type_defi, 'signalement'
FROM (VALUES
  ('Premier pas',
   'Déposez votre tout premier signalement cette semaine.',
   1, 30, CURRENT_DATE, CURRENT_DATE + 7, 'INDIVIDUEL'),

  ('Citoyen actif',
   'Signalez 5 problèmes pour aider votre quartier ce mois-ci.',
   5, 75, CURRENT_DATE, CURRENT_DATE + 30, 'INDIVIDUEL'),

  ('Sprint citoyen',
   '10 signalements en 14 jours — boostez votre score.',
   10, 150, CURRENT_DATE, CURRENT_DATE + 14, 'INDIVIDUEL'),

  ('Gardien du quartier',
   'Atteignez 15 signalements ce trimestre.',
   15, 200, CURRENT_DATE, CURRENT_DATE + 90, 'INDIVIDUEL'),

  ('Champion mensuel',
   '25 signalements en un mois : devenez le citoyen du mois.',
   25, 400, CURRENT_DATE, CURRENT_DATE + 30, 'INDIVIDUEL'),

  ('Sentinelle saisonnière',
   '50 signalements sur 90 jours.',
   50, 1000, CURRENT_DATE, CURRENT_DATE + 90, 'INDIVIDUEL'),

  ('Eco-Marathon',
   '100 signalements en 6 mois — l''ultime défi citoyen.',
   100, 2500, CURRENT_DATE, CURRENT_DATE + 180, 'INDIVIDUEL'),

  ('Lundi vert',
   'Faites 2 signalements cette semaine — chaque geste compte.',
   2, 40, CURRENT_DATE, CURRENT_DATE + 7, 'INDIVIDUEL'),

  ('Réveil de printemps',
   '3 signalements en 7 jours pour ouvrir la saison du tri.',
   3, 60, CURRENT_DATE, CURRENT_DATE + 7, 'INDIVIDUEL')
) AS v(titre, description, objectif, recompense, date_debut, date_fin, type_defi)
WHERE NOT EXISTS (
  SELECT 1 FROM gamification_defi d
  WHERE d.titre = v.titre AND d.date_debut = v.date_debut
);

-- ---------------------------------------------------------------------------
-- 4. Récap visuel
-- ---------------------------------------------------------------------------
SELECT '=== Catalogue badges après seed ===' AS info;
SELECT COUNT(*)::int AS total_badges FROM badge;

SELECT '=== Défis actifs ===' AS info;
SELECT COUNT(*)::int AS defis_actifs
FROM gamification_defi
WHERE CURRENT_DATE BETWEEN date_debut AND date_fin;
