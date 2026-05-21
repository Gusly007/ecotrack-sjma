-- Long-track badges + défis : paliers supérieurs aux contenus existants
-- (REPORTER_PLATINUM 250 sig, ECO_LEGEND 5000 pts, MONTH_STREAK 30 j…).
-- Tout est idempotent : ON CONFLICT pour les badges (code unique),
-- WHERE NOT EXISTS pour les défis (pas de contrainte unique sur titre).

-- ----------------------------------------------------------------------------
-- Badges longue durée (12 nouveaux codes)
-- ----------------------------------------------------------------------------
INSERT INTO badge (code, nom, description) VALUES
  ('ECO_DIVINITE',       'Éco-Divinité',         'A atteint 10 000 points.'),
  ('ECO_TITAN',          'Éco-Titan',            'A atteint 25 000 points.'),
  ('REPORTER_DIAMOND',   'Reporter Diamant',     'A déposé 500 signalements.'),
  ('REPORTER_MYTHIC',    'Reporter Mythique',    'A déposé 1 000 signalements.'),
  ('SEASON_STREAK',      'Sentinelle saison',    'Actif 90 jours consécutifs.'),
  ('YEAR_STREAK',        'Veilleur de l''année', 'Actif 365 jours consécutifs.'),
  ('URGENT_GUARDIAN',    'Gardien d''urgence',   'A signalé 25 problèmes en urgence Haute.'),
  ('PHOTO_MASTER',       'Maître photographe',   'A joint une photo à 50 signalements.'),
  ('CARBON_SAVER',       'Sauveur de carbone',   'A évité 100 kg de CO₂ cumulés.'),
  ('WASTE_SAVER',        'Champion du tri',      'A trié 500 kg de déchets cumulés.'),
  ('DEFI_LEGEND',        'Légende des défis',    'A complété 25 défis.'),
  ('ZONE_EXPERT',        'Expert des quartiers', 'A signalé dans 10 zones différentes.')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Défis longue durée (7 nouveaux)
-- Tous en type_action='signalement' → progression auto via le service-routes
-- signalement-controller.create → gamificationClient.registerAction.
-- ----------------------------------------------------------------------------
INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT 'Sprint hivernal',
       'Réalise 40 signalements en 6 semaines pour décrocher cette récompense saisonnière.',
       40, 800, '2026-05-18', '2026-06-29', 'INDIVIDUEL', 'signalement'
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi WHERE titre = 'Sprint hivernal');

INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT 'Défi du quartier',
       'Sois actif dans ton quartier : 30 signalements en 2 mois.',
       30, 500, '2026-05-18', '2026-07-17', 'INDIVIDUEL', 'signalement'
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi WHERE titre = 'Défi du quartier');

INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT 'Citoyen exemplaire',
       'Quatre mois d''engagement continu : 60 signalements vérifiés.',
       60, 1200, '2026-05-18', '2026-09-15', 'INDIVIDUEL', 'signalement'
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi WHERE titre = 'Citoyen exemplaire');

INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT 'Champion semestriel',
       'Le défi des engagés : 120 signalements en six mois.',
       120, 3000, '2026-05-18', '2026-11-15', 'INDIVIDUEL', 'signalement'
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi WHERE titre = 'Champion semestriel');

INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT 'Grand défi de l''année',
       'Un an pour faire la différence : 200 signalements et 5 000 points en récompense.',
       200, 5000, '2026-05-18', '2027-05-17', 'INDIVIDUEL', 'signalement'
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi WHERE titre = 'Grand défi de l''année');

INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT 'Marathon environnemental',
       'Le défi ultime : 250 signalements sur 12 mois. Pour les vrais marathoniens du tri.',
       250, 8000, '2026-05-18', '2027-05-17', 'INDIVIDUEL', 'signalement'
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi WHERE titre = 'Marathon environnemental');

INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi, type_action)
SELECT 'Année verte',
       'Une année, 365 signalements, un quartier transformé. Réservé aux légendes.',
       365, 12000, '2026-05-18', '2027-05-17', 'INDIVIDUEL', 'signalement'
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi WHERE titre = 'Année verte');
