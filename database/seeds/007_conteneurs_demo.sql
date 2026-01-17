-- Seed: 007_conteneurs_demo
-- Description: Conteneurs, capteurs et mesures de démonstration

-- Conteneurs dans différentes zones
INSERT INTO conteneur (uid, capacite_l, statut, date_installation, position, id_type, id_zone)
SELECT
  'CNT-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  CASE ((ROW_NUMBER() OVER()) % 4)
    WHEN 0 THEN 1000
    WHEN 1 THEN 1500
    WHEN 2 THEN 2000
    ELSE 2500
  END,
  CASE ((ROW_NUMBER() OVER()) % 10)
    WHEN 0 THEN 'EN_MAINTENANCE'
    ELSE 'ACTIF'
  END,
  CURRENT_DATE - ((RANDOM() * 365)::integer),
  ST_SetSRID(ST_MakePoint(2.34 + (RANDOM() * 0.06), 48.85 + (RANDOM() * 0.03)), 4326),
  tc.id_type,
  z.id_zone
FROM zone z
CROSS JOIN type_conteneur tc
CROSS JOIN generate_series(1, 2) AS s
WHERE z.nom != 'Zone Industrielle'
ON CONFLICT (uid) DO NOTHING;

-- Capteurs pour les conteneurs
INSERT INTO capteur (uid_capteur, modele, version_firmware, derniere_communication, id_conteneur)
SELECT
  'CAP-' || LPAD(c.id_conteneur::text, 4, '0'),
  CASE (c.id_conteneur % 3)
    WHEN 0 THEN 'UltraSonic-V1'
    WHEN 1 THEN 'UltraSonic-V2'
    ELSE 'LaserSense-Pro'
  END,
  CASE (c.id_conteneur % 2)
    WHEN 0 THEN '1.0.0'
    ELSE '2.0.1'
  END,
  NOW() - ((RANDOM() * 60) * INTERVAL '1 minute'),
  c.id_conteneur
FROM conteneur c
ON CONFLICT (uid_capteur) DO NOTHING;

-- Mesures IoT pour les capteurs
INSERT INTO mesure (niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure, id_capteur, id_conteneur)
SELECT
  (RANDOM() * 100)::numeric(5,2),
  (50 + RANDOM() * 50)::numeric(5,2),
  (10 + RANDOM() * 20)::numeric(5,2),
  NOW() - (s * INTERVAL '1 hour'),
  cap.id_capteur,
  cap.id_conteneur
FROM capteur cap
CROSS JOIN generate_series(0, 23) AS s
WHERE cap.id_capteur <= 10;
