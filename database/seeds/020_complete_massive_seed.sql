-- ============================================================================
-- SEED COMPLET - 2000 CONTENEURS + 1 MILLION DE MESURES
-- ============================================================================

TRUNCATE TABLE TOURNEE CASCADE;

-- ============================================================================
-- 1. DONNÉES DE BASE
-- ============================================================================

-- Types de conteneurs
INSERT INTO TYPE_CONTENEUR (code, nom) VALUES
    ('ORD', 'ORDURE'),
    ('REC', 'RECYCLAGE'),
    ('VER', 'VERRE'),
    ('COM', 'COMPOST')
ON CONFLICT (code) DO NOTHING;

-- Zones (50)
INSERT INTO ZONE (code, nom, population, superficie_km2, geom)
SELECT 
    'Z' || LPAD(i::text, 2, '0'),
    'Zone ' || i || ' - ' || CASE (i % 5) WHEN 0 THEN 'Centre' WHEN 1 THEN 'Nord' WHEN 2 THEN 'Sud' WHEN 3 THEN 'Est' ELSE 'Ouest' END,
    (10000 + (random() * 90000))::int,
    (1.0 + random() * 5.0)::numeric(10,2),
    ST_Buffer(ST_SetSRID(ST_MakePoint(2.35 + (random()-0.5)*0.8, 48.86 + (random()-0.5)*0.8), 4326), 0.01)
FROM generate_series(1, 50) AS i
WHERE NOT EXISTS (SELECT 1 FROM ZONE WHERE code = 'Z' || LPAD(i::text, 2, '0'));

-- Véhicules (50)
INSERT INTO VEHICULE (numero_immatriculation, modele, capacite_kg)
SELECT 
    'VH-' || LPAD(i::text, 3, '0'),
    CASE (i % 6) WHEN 0 THEN 'Renault Master' WHEN 1 THEN 'Mercedes Atego' WHEN 2 THEN 'Volvo FE' WHEN 3 THEN 'DAF LF' WHEN 4 THEN 'Iveco Daily' ELSE 'MAN TGL' END,
    (3000 + (i * 400))::int
FROM generate_series(1, 50) AS i
WHERE NOT EXISTS (SELECT 1 FROM VEHICULE WHERE numero_immatriculation = 'VH-' || LPAD(i::text, 3, '0'));

-- ============================================================================
-- 2. 2000 CONTENEURS + CAPTEURS
-- ============================================================================

TRUNCATE TABLE ALERTE_CAPTEUR CASCADE;

TRUNCATE TABLE CONTENEUR CASCADE;

INSERT INTO CONTENEUR (uid, capacite_l, statut, date_installation, position, id_zone, id_type)
SELECT 
    'CNT-' || LPAD(i::text, 5, '0'),
    CASE (i % 4) WHEN 0 THEN 120 WHEN 1 THEN 240 WHEN 2 THEN 360 ELSE 1000 END,
    CASE WHEN i <= 1950 THEN 'ACTIF' WHEN i <= 1980 THEN 'EN_MAINTENANCE' ELSE 'INACTIF' END,
    CURRENT_DATE - (random() * 730)::int,
    ST_SetSRID(ST_MakePoint(2.35 + (random()-0.5)*0.6, 48.86 + (random()-0.5)*0.6), 4326),
    (SELECT id_zone FROM ZONE ORDER BY random() LIMIT 1),
    (SELECT id_type FROM TYPE_CONTENEUR ORDER BY random() LIMIT 1)
FROM generate_series(1, 2000) AS i;

INSERT INTO CAPTEUR (uid_capteur, modele, version_firmware, derniere_communication, id_conteneur)
SELECT 
    'CAP-' || c.id_conteneur,
    CASE WHEN random() > 0.6 THEN 'UltraSonic-V2' WHEN random() > 0.3 THEN 'LaserSense-Pro' ELSE 'EcoSensor-3000' END,
    'v' || (1 + (random() * 4)::int) || '.' || (random() * 9)::int,
    NOW() - (random() * 6 || ' hours')::interval,
    c.id_conteneur
FROM CONTENEUR c WHERE c.statut = 'ACTIF';

-- ============================================================================
-- 3. 1 MILLION DE MESURES (500 par conteneur)
-- ============================================================================

TRUNCATE TABLE MESURE CASCADE;

INSERT INTO MESURE (id_conteneur, id_capteur, niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure)
SELECT 
    c.id_conteneur,
    cap.id_capteur,
    (random() * 100)::numeric(5,2),
    (10 + random() * 90)::numeric(5,2),
    (5 + random() * 25)::numeric(5,2),
    NOW() - ((random() * 90)::int || ' days')::interval + ((random() * 24)::int || ' hours')::interval
FROM CONTENEUR c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(1, 500) AS n
WHERE c.statut = 'ACTIF';

-- ============================================================================
-- 4. TOURNEES ET COLLECTES
-- ============================================================================

INSERT INTO UTILISATEUR (email, password_hash, nom, prenom, role_par_defaut, est_active)
SELECT 'agent' || i || '@ecotrack.local', '$2b$10$example', 'Agent' || i, 'Nom' || i, 'AGENT', true
FROM generate_series(1, 20) AS i
WHERE NOT EXISTS (SELECT 1 FROM UTILISATEUR WHERE email = 'agent' || i || '@ecotrack.local');

INSERT INTO TOURNEE (code, date_tournee, statut, distance_prevue_km, duree_prevue_min, id_vehicule, id_zone, id_agent)
SELECT 
    'TOUR-' || TO_CHAR(CURRENT_DATE - (i % 90), 'YYYYMMDD') || '-' || i,
    CURRENT_DATE - (i % 90),
    CASE WHEN i <= 40 THEN 'EN_COURS' WHEN i <= 120 THEN 'TERMINEE' ELSE 'PLANIFIEE' END,
    20 + (random() * 30),
    150 + (random() * 100)::int,
    (SELECT id_vehicule FROM VEHICULE ORDER BY random() LIMIT 1),
    (SELECT id_zone FROM ZONE ORDER BY random() LIMIT 1),
    (SELECT id_utilisateur FROM UTILISATEUR WHERE role_par_defaut = 'AGENT' ORDER BY random() LIMIT 1)
FROM generate_series(1, 200) AS i;

-- ============================================================================
-- 5. ALERTES
-- ============================================================================

INSERT INTO ALERTE_CAPTEUR (type_alerte, valeur_detectee, seuil, statut, date_creation, description, id_conteneur)
SELECT 
    'DEBORDEMENT',
    90 + random() * 10,
    90,
    CASE WHEN random() > 0.6 THEN 'ACTIVE' ELSE 'RESOLUE' END,
    NOW() - ((random() * 30)::int || ' days')::interval,
    'Niveau critique détecté',
    c.id_conteneur
FROM CONTENEUR c WHERE c.statut = 'ACTIF' AND random() < 0.05 LIMIT 100;

INSERT INTO ALERTE_CAPTEUR (type_alerte, valeur_detectee, seuil, statut, date_creation, description, id_conteneur)
SELECT 
    'BATTERIE_FAIBLE',
    20 + random() * 20,
    20,
    CASE WHEN random() > 0.5 THEN 'ACTIVE' ELSE 'RESOLUE' END,
    NOW() - ((random() * 30)::int || ' days')::interval,
    'Batterie faible détectée',
    c.id_conteneur
FROM CONTENEUR c WHERE c.statut = 'ACTIF' AND random() < 0.03 LIMIT 60;

-- ============================================================================
-- 6. PRÉDICTIONS ML
-- ============================================================================

TRUNCATE TABLE PREDICTIONS CASCADE;

INSERT INTO PREDICTIONS (container_id, predicted_fill_level, prediction_date, confidence, model_version)
SELECT 
    c.id_conteneur,
    (50 + random() * 40)::numeric(5,2),
    NOW() + interval '1 day',
    (60 + random() * 30)::int,
    'v1.0-linear'
FROM CONTENEUR c WHERE c.statut = 'ACTIF' AND random() < 0.3;

-- ============================================================================
-- STATISTIQUES
-- ============================================================================

SELECT '=== SEED COMPLET ===' AS info;
SELECT 
    (SELECT COUNT(*) FROM CONTENEUR) AS conteneurs,
    (SELECT COUNT(*) FROM CONTENEUR WHERE statut = 'ACTIF') AS conteneurs_actifs,
    (SELECT COUNT(*) FROM CAPTEUR) AS capteurs,
    (SELECT COUNT(*) FROM MESURE) AS mesures,
    (SELECT COUNT(*) FROM TOURNEE) AS tournees,
    (SELECT COUNT(*) FROM ALERTE_CAPTEUR) AS alertes,
    (SELECT COUNT(*) FROM PREDICTIONS) AS predictions;

SELECT 
    'Remplissage moyen: ' || ROUND(AVG(niveau_remplissage_pct), 2) || '%' FROM MESURE;
SELECT 
    'Période: ' || MIN(date_heure_mesure)::date || ' - ' || MAX(date_heure_mesure)::date FROM MESURE;
SELECT '✅ 2K conteneurs + 1M mesures!' AS message;
