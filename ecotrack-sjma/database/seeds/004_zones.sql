-- Seed: 004_zones
-- Description: Zones géographiques de test (exemple: ville fictive)

INSERT INTO zone (code, nom, population, superficie_km2, couleur, geom) VALUES
  ('Z01', 'Centre-Ville', 85000, 2.50, '#e74c3c', ST_GeomFromText('POLYGON((2.3400 48.8550, 2.3600 48.8550, 2.3600 48.8650, 2.3400 48.8650, 2.3400 48.8550))', 4326)),
  ('Z02', 'Quartier Nord', 45000, 3.20, '#3498db', ST_GeomFromText('POLYGON((2.3400 48.8650, 2.3600 48.8650, 2.3600 48.8750, 2.3400 48.8750, 2.3400 48.8650))', 4326)),
  ('Z03', 'Quartier Sud', 52000, 2.80, '#2ecc71', ST_GeomFromText('POLYGON((2.3400 48.8450, 2.3600 48.8450, 2.3600 48.8550, 2.3400 48.8550, 2.3400 48.8450))', 4326)),
  ('Z04', 'Quartier Est', 38000, 2.10, '#f39c12', ST_GeomFromText('POLYGON((2.3600 48.8550, 2.3800 48.8550, 2.3800 48.8650, 2.3600 48.8650, 2.3600 48.8550))', 4326)),
  ('Z05', 'Quartier Ouest', 62000, 4.50, '#9b59b6', ST_GeomFromText('POLYGON((2.3200 48.8550, 2.3400 48.8550, 2.3400 48.8650, 2.3200 48.8650, 2.3200 48.8550))', 4326)),
  ('Z06', 'Zone Industrielle', 15000, 5.80, '#95a5a6', ST_GeomFromText('POLYGON((2.3600 48.8450, 2.3900 48.8450, 2.3900 48.8550, 2.3600 48.8550, 2.3600 48.8450))', 4326))
ON CONFLICT (code) DO NOTHING;
