-- ============================================================================
-- SEED PRODUCTION SCALE - 15 000 USERS + MASSIVE MEASURES
-- Target: 2000 conteneurs, 15 000 users, 5 agents, 20 gestionnaires, 10 admins
-- ============================================================================

-- ============================================================================
-- 1. 15 000 UTILISATEURS
-- ============================================================================

-- Admins (10)
INSERT INTO UTILISATEUR (email, password_hash, nom, prenom, role_par_defaut, est_active, points)
SELECT 
    'admin' || i || '@ecotrack.local',
    '$2b$10$' || encode(gen_random_bytes(30), 'base64'),
    'Admin' || i,
    'Système',
    'ADMIN',
    true,
    (random() * 1000)::int
FROM generate_series(1, 10) AS i
WHERE NOT EXISTS (SELECT 1 FROM UTILISATEUR WHERE email = 'admin' || i || '@ecotrack.local');

INSERT INTO USER_ROLE (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM UTILISATEUR u
CROSS JOIN ROLE r
WHERE u.role_par_defaut = 'ADMIN' AND r.name = 'ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM USER_ROLE ur
    WHERE ur.id_utilisateur = u.id_utilisateur AND ur.id_role = r.id_role
);

-- Gestionnaires (20)
INSERT INTO UTILISATEUR (email, password_hash, nom, prenom, role_par_defaut, est_active, points)
SELECT 
    'gestionnaire' || i || '@ecotrack.local',
    '$2b$10$' || encode(gen_random_bytes(30), 'base64'),
    'Gestionnaire' || i,
    'Territoire',
    'GESTIONNAIRE',
    true,
    (random() * 2000)::int
FROM generate_series(1, 20) AS i
WHERE NOT EXISTS (SELECT 1 FROM UTILISATEUR WHERE email = 'gestionnaire' || i || '@ecotrack.local');

INSERT INTO USER_ROLE (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM UTILISATEUR u
CROSS JOIN ROLE r
WHERE u.role_par_defaut = 'GESTIONNAIRE' AND r.name = 'GESTIONNAIRE'
AND NOT EXISTS (
    SELECT 1 FROM USER_ROLE ur
    WHERE ur.id_utilisateur = u.id_utilisateur AND ur.id_role = r.id_role
);

-- Agents (5)
INSERT INTO UTILISATEUR (email, password_hash, nom, prenom, role_par_defaut, est_active, points)
SELECT 
    'agent' || (20 + i) || '@ecotrack.local',
    '$2b$10$' || encode(gen_random_bytes(30), 'base64'),
    'Agent' || (20 + i),
    'Terrain',
    'AGENT',
    true,
    (random() * 5000)::int
FROM generate_series(1, 5) AS i
WHERE NOT EXISTS (SELECT 1 FROM UTILISATEUR WHERE email = 'agent' || (20 + i) || '@ecotrack.local');

INSERT INTO USER_ROLE (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM UTILISATEUR u
CROSS JOIN ROLE r
WHERE u.role_par_defaut = 'AGENT' AND r.name = 'AGENT'
AND NOT EXISTS (
    SELECT 1 FROM USER_ROLE ur
    WHERE ur.id_utilisateur = u.id_utilisateur AND ur.id_role = r.id_role
);

-- Citoyens (14 965)
INSERT INTO UTILISATEUR (email, password_hash, nom, prenom, role_par_defaut, est_active, points)
SELECT 
    'citoyen' || i || '@ecotrack.local',
    '$2b$10$' || encode(gen_random_bytes(30), 'base64'),
    'Citoyen' || i,
    'Utilisateur',
    'CITOYEN',
    CASE WHEN random() < 0.9 THEN true ELSE false END,
    (random() * 10000)::int
FROM generate_series(1, 14965) AS i
WHERE NOT EXISTS (SELECT 1 FROM UTILISATEUR WHERE email = 'citoyen' || i || '@ecotrack.local');

INSERT INTO USER_ROLE (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM UTILISATEUR u
CROSS JOIN ROLE r
WHERE u.role_par_defaut = 'CITOYEN' AND r.name = 'CITOYEN'
AND NOT EXISTS (
    SELECT 1 FROM USER_ROLE ur
    WHERE ur.id_utilisateur = u.id_utilisateur AND ur.id_role = r.id_role
);

-- ============================================================================
-- 2. MESURES SUPPLEMENTAIRES POUR ATTEINDRE 400 msg/min SUR 5 min
--    = 2000 mesures recentes
--    Chaque conteneur actif (~1950) reçoit des mesures recentes
-- ============================================================================

INSERT INTO MESURE (id_conteneur, id_capteur, niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure)
SELECT 
    c.id_conteneur,
    cap.id_capteur,
    (random() * 100)::numeric(5,2),
    (10 + random() * 90)::numeric(5,2),
    (5 + random() * 25)::numeric(5,2),
    NOW() - ((random() * 0.5)::int || ' hours')::interval  -- dernieres 30 min
FROM CONTENEUR c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(1, 3) AS n
WHERE c.statut = 'ACTIF';

-- Mesures horaires pour les dernieres 24h (simulation flux regulier)
INSERT INTO MESURE (id_conteneur, id_capteur, niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure)
SELECT 
    c.id_conteneur,
    cap.id_capteur,
    (random() * 100)::numeric(5,2),
    (10 + random() * 90)::numeric(5,2),
    (5 + random() * 25)::numeric(5,2),
    NOW() - (h || ' hours')::interval
FROM CONTENEUR c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
CROSS JOIN generate_series(1, 24) AS h
WHERE c.statut = 'ACTIF';

-- ============================================================================
-- 3. SIGNALEMENTS DE CITOYENS
-- ============================================================================

INSERT INTO SIGNALEMENT (description, url_photo, statut, date_creation, id_type, id_conteneur, id_citoyen)
SELECT 
    'Signalement ' || i || ': ' || CASE (i % 5)
        WHEN 0 THEN 'Conteneur plein'
        WHEN 1 THEN 'Odeur anormale'
        WHEN 2 THEN 'Fuite detectee'
        WHEN 3 THEN 'Porte bloquee'
        ELSE 'Debordement'
    END,
    CASE WHEN random() < 0.3 THEN 'https://images.ecotrack.local/signalements/' || i || '.jpg' ELSE NULL END,
    CASE 
        WHEN random() < 0.4 THEN 'OUVERT'
        WHEN random() < 0.7 THEN 'EN_COURS'
        WHEN random() < 0.9 THEN 'RESOLU'
        ELSE 'FERME'
    END,
    NOW() - ((random() * 30)::int || ' days')::interval,
    (SELECT id_type FROM TYPE_SIGNALEMENT ORDER BY random() LIMIT 1),
    (SELECT id_conteneur FROM CONTENEUR WHERE statut = 'ACTIF' ORDER BY random() LIMIT 1),
    (SELECT id_utilisateur FROM UTILISATEUR WHERE role_par_defaut = 'CITOYEN' ORDER BY random() LIMIT 1)
FROM generate_series(1, 500) AS i;

-- ============================================================================
-- 4. NOTIFICATIONS POUR TOUS LES UTILISATEURS
-- ============================================================================

INSERT INTO NOTIFICATION (type, titre, corps, est_lu, date_creation, id_utilisateur)
SELECT 
    CASE (random() * 3)::int
        WHEN 0 THEN 'ALERTE'
        WHEN 1 THEN 'TOURNEE'
        WHEN 2 THEN 'BADGE'
        ELSE 'SYSTEME'
    END,
    CASE (random() * 3)::int
        WHEN 0 THEN 'Nouvelle alerte capteur'
        WHEN 1 THEN 'Tournee planifiee'
        WHEN 2 THEN 'Badge debloque'
        ELSE 'Mise a jour systeme'
    END,
    'Notification automatique pour test de performance',
    random() < 0.7,
    NOW() - ((random() * 14)::int || ' days')::interval,
    u.id_utilisateur
FROM UTILISATEUR u
CROSS JOIN generate_series(1, 3) AS n
WHERE u.est_active = true;

-- ============================================================================
-- 5. HISTORIQUE STATUT POUR CONTENEURS
-- ============================================================================

INSERT INTO HISTORIQUE_STATUT (id_entite, type_entite, ancien_statut, nouveau_statut, date_changement)
SELECT 
    c.id_conteneur,
    'CONTENEUR',
    CASE (random() * 2)::int WHEN 0 THEN 'ACTIF' WHEN 1 THEN 'INACTIF' ELSE 'EN_MAINTENANCE' END,
    c.statut,
    NOW() - ((random() * 365)::int || ' days')::interval
FROM CONTENEUR c
CROSS JOIN generate_series(1, 5) AS n;

-- ============================================================================
-- STATISTIQUES DE VERIFICATION
-- ============================================================================

SELECT '=== SEED PRODUCTION SCALE ===' AS info;

SELECT 
    (SELECT COUNT(*) FROM UTILISATEUR) AS total_utilisateurs,
    (SELECT COUNT(*) FROM UTILISATEUR WHERE role_par_defaut = 'ADMIN') AS admins,
    (SELECT COUNT(*) FROM UTILISATEUR WHERE role_par_defaut = 'GESTIONNAIRE') AS gestionnaires,
    (SELECT COUNT(*) FROM UTILISATEUR WHERE role_par_defaut = 'AGENT') AS agents,
    (SELECT COUNT(*) FROM UTILISATEUR WHERE role_par_defaut = 'CITOYEN') AS citoyens;

SELECT 
    (SELECT COUNT(*) FROM MESURE) AS total_mesures,
    (SELECT COUNT(*) FROM CONTENEUR) AS conteneurs,
    (SELECT COUNT(*) FROM NOTIFICATION) AS notifications,
    (SELECT COUNT(*) FROM SIGNALEMENT) AS signalements;

SELECT '✅ Seed production scale complete: 15k users, massive mesures, ready for benchmark!' AS message;
