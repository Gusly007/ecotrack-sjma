-- ============================================================================
-- SEED FUTURE SCALE - 10 000 CONTENEURS
-- Test d'extensibilite pour valider la montee en charge future
-- ============================================================================

-- Zones complementaires (50 -> 100)
INSERT INTO ZONE (code, nom, population, superficie_km2, geom)
SELECT 
    'ZF' || LPAD(i::text, 2, '0'),
    'Zone Future ' || i || ' - ' || CASE (i % 5) WHEN 0 THEN 'Centre' WHEN 1 THEN 'Nord' WHEN 2 THEN 'Sud' WHEN 3 THEN 'Est' ELSE 'Ouest' END,
    (10000 + (random() * 90000))::int,
    (1.0 + random() * 5.0)::numeric(10,2),
    ST_Buffer(ST_SetSRID(ST_MakePoint(2.35 + (random()-0.5)*1.2, 48.86 + (random()-0.5)*1.2), 4326), 0.01)
FROM generate_series(51, 100) AS i
WHERE NOT EXISTS (SELECT 1 FROM ZONE WHERE code = 'ZF' || LPAD(i::text, 2, '0'));

-- 8000 nouveaux conteneurs (total: 10000)
INSERT INTO CONTENEUR (uid, capacite_l, statut, date_installation, position, id_zone, id_type)
SELECT 
    'CNT-FUTURE-' || LPAD(i::text, 5, '0'),
    CASE (i % 4) WHEN 0 THEN 120 WHEN 1 THEN 240 WHEN 2 THEN 360 ELSE 1000 END,
    CASE WHEN i <= 9800 THEN 'ACTIF' WHEN i <= 9900 THEN 'EN_MAINTENANCE' ELSE 'INACTIF' END,
    CURRENT_DATE - (random() * 365)::int,
    ST_SetSRID(ST_MakePoint(2.35 + (random()-0.5)*0.8, 48.86 + (random()-0.5)*0.8), 4326),
    (SELECT id_zone FROM ZONE ORDER BY random() LIMIT 1),
    (SELECT id_type FROM TYPE_CONTENEUR ORDER BY random() LIMIT 1)
FROM generate_series(2001, 10000) AS i;

-- Capteurs pour les nouveaux conteneurs
INSERT INTO CAPTEUR (uid_capteur, modele, version_firmware, derniere_communication, id_conteneur)
SELECT 
    'CAP-FUTURE-' || c.id_conteneur,
    CASE WHEN random() > 0.6 THEN 'UltraSonic-V3' WHEN random() > 0.3 THEN 'LaserSense-Pro-X' ELSE 'EcoSensor-5000' END,
    'v' || (1 + (random() * 4)::int) || '.' || (random() * 9)::int,
    NOW() - (random() * 6 || ' hours')::interval,
    c.id_conteneur
FROM CONTENEUR c WHERE c.id_conteneur > 2000 AND c.statut = 'ACTIF';

-- Mesures pour les nouveaux conteneurs (200 mesures chacun)
INSERT INTO MESURE (id_conteneur, id_capteur, niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure)
SELECT 
    c.id_conteneur,
    cap.id_capteur,
    (random() * 100)::numeric(5,2),
    (10 + random() * 90)::numeric(5,2),
    (5 + random() * 25)::numeric(5,2),
    NOW() - ((random() * 30)::int || ' days')::interval + ((random() * 24)::int || ' hours')::interval
FROM CONTENEUR c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(1, 200) AS n
WHERE c.statut = 'ACTIF' AND c.id_conteneur > 2000;

-- Alertes pour les nouveaux conteneurs
INSERT INTO ALERTE_CAPTEUR (type_alerte, valeur_detectee, seuil, statut, date_creation, description, id_conteneur)
SELECT 
    'DEBORDEMENT',
    90 + random() * 10,
    90,
    CASE WHEN random() > 0.6 THEN 'ACTIVE' ELSE 'RESOLUE' END,
    NOW() - ((random() * 15)::int || ' days')::interval,
    'Niveau critique detecte',
    c.id_conteneur
FROM CONTENEUR c 
WHERE c.statut = 'ACTIF' AND c.id_conteneur > 2000 AND random() < 0.05
LIMIT 400;

-- Predictions pour les nouveaux conteneurs
INSERT INTO PREDICTIONS (container_id, predicted_fill_level, prediction_date, confidence, model_version)
SELECT 
    c.id_conteneur,
    (50 + random() * 40)::numeric(5,2),
    NOW() + interval '1 day',
    (60 + random() * 30)::int,
    'v2.0-ensemble'
FROM CONTENEUR c 
WHERE c.statut = 'ACTIF' AND c.id_conteneur > 2000 AND random() < 0.3;

-- ============================================================================
-- STATISTIQUES
-- ============================================================================

SELECT '=== SEED FUTURE 10K CONTENEURS ===' AS info;

SELECT 
    (SELECT COUNT(*) FROM CONTENEUR) AS total_conteneurs,
    (SELECT COUNT(*) FROM CONTENEUR WHERE statut = 'ACTIF') AS actifs,
    (SELECT COUNT(*) FROM CAPTEUR) AS capteurs,
    (SELECT COUNT(*) FROM MESURE) AS mesures,
    (SELECT COUNT(*) FROM ZONE) AS zones;

SELECT '✅ Future scale ready: 10k containers seeded!' AS message;
