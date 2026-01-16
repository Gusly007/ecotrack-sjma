-- Seed: 004_zones
-- Description: Zones géographiques de test (exemple: ville fictive)

INSERT INTO zone (nom, code_postal, geometrie) VALUES
  ('Centre-Ville', '75001', ST_GeomFromText('POLYGON((2.3400 48.8550, 2.3600 48.8550, 2.3600 48.8650, 2.3400 48.8650, 2.3400 48.8550))', 4326)),
  ('Quartier Nord', '75018', ST_GeomFromText('POLYGON((2.3400 48.8650, 2.3600 48.8650, 2.3600 48.8750, 2.3400 48.8750, 2.3400 48.8650))', 4326)),
  ('Quartier Sud', '75014', ST_GeomFromText('POLYGON((2.3400 48.8450, 2.3600 48.8450, 2.3600 48.8550, 2.3400 48.8550, 2.3400 48.8450))', 4326)),
  ('Quartier Est', '75012', ST_GeomFromText('POLYGON((2.3600 48.8550, 2.3800 48.8550, 2.3800 48.8650, 2.3600 48.8650, 2.3600 48.8550))', 4326)),
  ('Quartier Ouest', '75016', ST_GeomFromText('POLYGON((2.3200 48.8550, 2.3400 48.8550, 2.3400 48.8650, 2.3200 48.8650, 2.3200 48.8550))', 4326)),
  ('Zone Industrielle', '93100', ST_GeomFromText('POLYGON((2.3600 48.8450, 2.3900 48.8450, 2.3900 48.8550, 2.3600 48.8550, 2.3600 48.8450))', 4326))
ON CONFLICT (nom) DO NOTHING;
