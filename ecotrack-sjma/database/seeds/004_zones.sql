-- Seed: 004_zones
-- Description: Zones géographiques de test (exemple: ville fictive)

INSERT INTO zone (code, nom, population, superficie_km2, geom) VALUES
  ('Z01', 'Centre-Ville', 85000, 2.50, ST_GeomFromText('POLYGON((2.3400 48.8550, 2.3600 48.8550, 2.3600 48.8650, 2.3400 48.8650, 2.3400 48.8550))', 4326)),
  ('Z02', 'Quartier Nord', 45000, 3.20, ST_GeomFromText('POLYGON((2.3400 48.8650, 2.3600 48.8650, 2.3600 48.8750, 2.3400 48.8750, 2.3400 48.8650))', 4326)),
  ('Z03', 'Quartier Sud', 52000, 2.80, ST_GeomFromText('POLYGON((2.3400 48.8450, 2.3600 48.8450, 2.3600 48.8550, 2.3400 48.8550, 2.3400 48.8450))', 4326)),
  ('Z04', 'Quartier Est', 38000, 2.10, ST_GeomFromText('POLYGON((2.3600 48.8550, 2.3800 48.8550, 2.3800 48.8650, 2.3600 48.8650, 2.3600 48.8550))', 4326)),
  ('Z05', 'Quartier Ouest', 62000, 4.50, ST_GeomFromText('POLYGON((2.3200 48.8550, 2.3400 48.8550, 2.3400 48.8650, 2.3200 48.8650, 2.3200 48.8550))', 4326)),
  ('Z06', 'Zone Industrielle', 15000, 5.80, ST_GeomFromText('POLYGON((2.3600 48.8450, 2.3900 48.8450, 2.3900 48.8550, 2.3600 48.8550, 2.3600 48.8450))', 4326))
ON CONFLICT (code) DO NOTHING;
