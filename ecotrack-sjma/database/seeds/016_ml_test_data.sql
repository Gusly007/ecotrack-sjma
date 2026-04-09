-- Seed: 016_ml_test_data
-- Description: Données de test pour ML predictions et anomalies

-- ==============================================================================
-- CONTENEURS DE TEST
-- ==============================================================================

-- Créer des conteneurs de test spécifiques pour ML
INSERT INTO conteneur (uid, capacite_l, statut, date_installation, position, id_type, id_zone)
SELECT *
FROM (
  VALUES 
    ('CNT-ML-001', 1000, 'ACTIF', CURRENT_DATE - 90, ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)),
    ('CNT-ML-002', 1500, 'ACTIF', CURRENT_DATE - 90, ST_SetSRID(ST_MakePoint(2.3530, 48.8570), 4326)),
    ('CNT-ML-003', 2000, 'ACTIF', CURRENT_DATE - 90, ST_SetSRID(ST_MakePoint(2.3540, 48.8580), 4326))
) AS v(uid, capacite_l, statut, date_installation, position)
CROSS JOIN LATERAL (
  SELECT 
    (SELECT id_type FROM type_conteneur WHERE code = 'ORD' LIMIT 1) AS id_type,
    (SELECT id_zone FROM zone WHERE code = 'Z01' LIMIT 1) AS id_zone
) refs
ON CONFLICT (uid) DO NOTHING;

-- ==============================================================================
-- CAPTEURS POUR CONTENEURS ML
-- ==============================================================================

INSERT INTO CAPTEUR (uid_capteur, modele, version_firmware, derniere_communication, id_conteneur)
SELECT 
  'CAP-ML-' || c.id_conteneur,
  'UltraSonic-V2',
  '2.0.1',
  NOW() - INTERVAL '1 hour',
  c.id_conteneur
FROM conteneur c
WHERE c.uid LIKE 'CNT-ML-%'
ON CONFLICT (uid_capteur) DO NOTHING;

-- ==============================================================================
-- MESURES HISTORIQUES (30 jours) - Données avec tendance pour prédiction
-- ==============================================================================

-- Conteneur ML-001: Tendance à la hausse (se remplit progressivement)
INSERT INTO mesure (niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure, id_capteur, id_conteneur)
SELECT 
  20 + (gs.n * 2.5)::numeric(5,2),  -- De 20% à 95% sur 30 jours
  80 + (RANDOM() * 15)::numeric(5,2),
  15 + (RANDOM() * 10)::numeric(5,2),
  CURRENT_DATE - (30 - gs.n) * INTERVAL '1 day',
  cap.id_capteur,
  c.id_conteneur
FROM conteneur c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(0, 29) AS gs(n)
WHERE c.uid = 'CNT-ML-001';

-- Conteneur ML-002: Variation normale (oscille entre 40-70%)
INSERT INTO mesure (niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure, id_capteur, id_conteneur)
SELECT 
  50 + (SIN(gs.n * 0.5) * 15 + RANDOM() * 10)::numeric(5,2),
  70 + (RANDOM() * 20)::numeric(5,2),
  10 + (RANDOM() * 15)::numeric(5,2),
  CURRENT_DATE - (30 - gs.n) * INTERVAL '1 day',
  cap.id_capteur,
  c.id_conteneur
FROM conteneur c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(0, 29) AS gs(n)
WHERE c.uid = 'CNT-ML-002';

-- Conteneur ML-003: Avec anomalies (sauts anormaux)
INSERT INTO mesure (niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure, id_capteur, id_conteneur)
SELECT 
  CASE 
    WHEN gs.n = 10 THEN 95  -- Spike soudain
    WHEN gs.n = 20 THEN 5   -- Vidange soudaine
    ELSE 40 + (RANDOM() * 20)::numeric(5,2)
  END,
  CASE 
    WHEN gs.n = 15 THEN 5   -- Batterie critique
    ELSE 70 + (RANDOM() * 20)::numeric(5,2)
  END,
  CASE
    WHEN gs.n = 25 THEN -15  -- Température extrême froid
    WHEN gs.n = 26 THEN 55   -- Température extrême chaud
    ELSE 10 + (RANDOM() * 15)::numeric(5,2)
  END,
  CURRENT_DATE - (30 - gs.n) * INTERVAL '1 day',
  cap.id_capteur,
  c.id_conteneur
FROM conteneur c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(0, 29) AS gs(n)
WHERE c.uid = 'CNT-ML-003';

-- ==============================================================================
-- MESURES RÉCENTES (dernières 24 heures) - Pour éviter "no_recent_data"
-- ==============================================================================

INSERT INTO mesure (niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure, id_capteur, id_conteneur)
SELECT 
  60 + (RANDOM() * 30)::numeric(5,2),
  70 + (RANDOM() * 25)::numeric(5,2),
  12 + (RANDOM() * 8)::numeric(5,2),
  NOW() - (gs.n * INTERVAL '1 hour'),
  cap.id_capteur,
  c.id_conteneur
FROM conteneur c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(0, 23) AS gs(n)
WHERE c.uid LIKE 'CNT-ML-%';

-- ==============================================================================
-- MESURES POUR CONTENEURS EXISTANTS (ajouter de l'historique récent)
-- ==============================================================================

-- Ajouter des mesures récentes aux conteneurs actifs existants
INSERT INTO mesure (niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure, id_capteur, id_conteneur)
SELECT 
  (RANDOM() * 100)::numeric(5,2),
  (50 + RANDOM() * 50)::numeric(5,2),
  (10 + RANDOM() * 20)::numeric(5,2),
  NOW() - (RANDOM() * 168) * INTERVAL '1 hour',  -- Dernière semaine
  cap.id_capteur,
  c.id_conteneur
FROM conteneur c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
WHERE c.statut = 'ACTIF'
  AND c.uid NOT LIKE 'CNT-ML-%'
  AND NOT EXISTS (
    SELECT 1 FROM mesure m WHERE m.id_conteneur = c.id_conteneur
    AND m.date_heure_mesure > NOW() - INTERVAL '24 hours'
  )
LIMIT 100;

-- ==============================================================================
-- ALERTES DE TEST
-- ==============================================================================

INSERT INTO ALERTE_CAPTEUR (type_alerte, valeur_detectee, seuil, statut, date_creation, description, id_conteneur)
SELECT 
  CASE (c.id_conteneur % 3)
    WHEN 0 THEN 'DEBORDEMENT'
    WHEN 1 THEN 'BATTERIE_FAIBLE'
    ELSE 'CAPTEUR_DEFAILLANT'
  END,
  CASE (c.id_conteneur % 3)
    WHEN 0 THEN 95
    WHEN 1 THEN 25
    ELSE 15
  END,
  CASE (c.id_conteneur % 3)
    WHEN 0 THEN 90
    WHEN 1 THEN 20
    ELSE 10
  END,
  'ACTIVE',
  NOW() - (RANDOM() * 7) * INTERVAL '1 day',
  CASE (c.id_conteneur % 3)
    WHEN 0 THEN 'Niveau de remplissage critique'
    WHEN 1 THEN 'Batterie faible détectée'
    ELSE 'Capteur défaillant détecté'
  END,
  c.id_conteneur
FROM conteneur c
WHERE c.statut = 'ACTIF'
  AND c.uid LIKE 'CNT-ML-%'
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- MISES À JOUR DES CAPTEURS ( dates de communication récentes)
-- ==============================================================================

UPDATE CAPTEUR SET derniere_communication = NOW() - INTERVAL '2 hours'
WHERE uid_capteur LIKE 'CAP-ML-%';
