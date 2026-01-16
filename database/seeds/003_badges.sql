-- Seed: 003_badges
-- Description: Badges de gamification

INSERT INTO badge (name, description, seuil_points) VALUES
  ('FIRST_REPORT', 'A effectué son premier signalement', 0),
  ('ECO_STARTER', 'A atteint 100 points', 100),
  ('ECO_WARRIOR', 'A atteint 500 points', 500),
  ('ECO_HERO', 'A atteint 1000 points', 1000),
  ('ECO_LEGEND', 'A atteint 5000 points', 5000),
  ('REPORTER_BRONZE', 'A effectué 10 signalements', 50),
  ('REPORTER_SILVER', 'A effectué 50 signalements', 250),
  ('REPORTER_GOLD', 'A effectué 100 signalements', 500),
  ('WEEK_STREAK', 'Connecté 7 jours consécutifs', 70),
  ('MONTH_STREAK', 'Connecté 30 jours consécutifs', 300),
  ('EARLY_ADOPTER', 'Parmi les 100 premiers utilisateurs', 0),
  ('RECYCLING_PRO', 'A signalé 20 problèmes de recyclage', 200),
  ('CLEAN_CITY', 'A contribué au nettoyage de 5 zones', 150)
ON CONFLICT (name) DO NOTHING;
