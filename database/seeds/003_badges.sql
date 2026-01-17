-- Seed: 003_badges
-- Description: Badges de gamification

INSERT INTO badge (code, nom, description) VALUES
  ('FIRST_REPORT', 'Premier signalement', 'A effectué son premier signalement'),
  ('ECO_STARTER', 'Eco Starter', 'A atteint 100 points'),
  ('ECO_WARRIOR', 'Eco Warrior', 'A atteint 500 points'),
  ('ECO_HERO', 'Eco Héros', 'A atteint 1000 points'),
  ('ECO_LEGEND', 'Eco Légende', 'A atteint 5000 points'),
  ('REPORTER_BRONZE', 'Reporter Bronze', 'A effectué 10 signalements'),
  ('REPORTER_SILVER', 'Reporter Argent', 'A effectué 50 signalements'),
  ('REPORTER_GOLD', 'Reporter Or', 'A effectué 100 signalements'),
  ('WEEK_STREAK', 'Semaine Active', 'Connecté 7 jours consécutifs'),
  ('MONTH_STREAK', 'Mois Actif', 'Connecté 30 jours consécutifs'),
  ('EARLY_ADOPTER', 'Pionnier', 'Parmi les 100 premiers utilisateurs'),
  ('RECYCLING_PRO', 'Pro du Recyclage', 'A signalé 20 problèmes de recyclage'),
  ('CLEAN_CITY', 'Ville Propre', 'A contribué au nettoyage de 5 zones')
ON CONFLICT (code) DO NOTHING;
