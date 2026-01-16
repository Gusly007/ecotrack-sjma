-- Seed: 007_conteneurs_demo
-- Description: Conteneurs de démonstration

-- Conteneurs dans différentes zones
INSERT INTO conteneur (code_unique, capacite_litres, latitude, longitude, adresse, niveau_remplissage, statut, date_installation, id_type, id_zone)
SELECT
  'CNT-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  CASE ((ROW_NUMBER() OVER()) % 4)
    WHEN 0 THEN 1000
    WHEN 1 THEN 1500
    WHEN 2 THEN 2000
    ELSE 2500
  END,
  48.85 + (RANDOM() * 0.03),
  2.34 + (RANDOM() * 0.06),
  'Rue de démonstration ' || (ROW_NUMBER() OVER()),
  (RANDOM() * 100)::integer,
  CASE ((ROW_NUMBER() OVER()) % 10)
    WHEN 0 THEN 'MAINTENANCE'
    ELSE 'ACTIF'
  END,
  CURRENT_DATE - ((RANDOM() * 365)::integer),
  tc.id_type,
  z.id_zone
FROM zone z
CROSS JOIN type_conteneur tc
CROSS JOIN generate_series(1, 2) AS s
WHERE z.nom != 'Zone Industrielle'
ON CONFLICT (code_unique) DO NOTHING;

-- Quelques mesures IoT pour les conteneurs
INSERT INTO mesure_capteur (niveau_remplissage, temperature, batterie_pct, date_mesure, id_conteneur)
SELECT
  (RANDOM() * 100)::integer,
  (10 + RANDOM() * 20)::numeric(5,2),
  (50 + RANDOM() * 50)::integer,
  NOW() - (s * INTERVAL '1 hour'),
  c.id_conteneur
FROM conteneur c
CROSS JOIN generate_series(0, 23) AS s
WHERE c.id_conteneur <= 10;
