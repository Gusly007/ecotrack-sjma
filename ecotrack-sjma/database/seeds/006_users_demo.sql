-- Seed: 006_users_demo
-- Description: Utilisateurs de démonstration
-- Note: Les mots de passe sont hashés avec bcrypt (10 rounds)
-- Mot de passe par défaut pour tous: "password123"

-- Hash bcrypt pour "password123" : $2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga

INSERT INTO utilisateur (email, password_hash, nom, prenom, role_par_defaut, points, est_active) VALUES
  -- Admin
  ('admin@ecotrack.local', '$2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga', 'Admin', 'Super', 'ADMIN', 0, true),

  -- Gestionnaires
  ('gestionnaire@ecotrack.local', '$2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga', 'Dupont', 'Marie', 'GESTIONNAIRE', 0, true),

  -- Agents de collecte
  ('agent1@ecotrack.local', '$2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga', 'Martin', 'Jean', 'AGENT', 0, true),
  ('agent2@ecotrack.local', '$2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga', 'Bernard', 'Pierre', 'AGENT', 0, true),

  -- Citoyens
  ('citoyen1@ecotrack.local', '$2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga', 'Petit', 'Sophie', 'CITOYEN', 150, true),
  ('citoyen2@ecotrack.local', '$2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga', 'Moreau', 'Lucas', 'CITOYEN', 320, true),
  ('citoyen3@ecotrack.local', '$2b$10$6rgIP.aqbqCOCXqaqQhyw.dcD2lCY9Tpo5fMQvjmjjmCT3v2On4Ga', 'Garcia', 'Emma', 'CITOYEN', 75, true)
ON CONFLICT (email) DO NOTHING;

-- Assigner les rôles aux utilisateurs (user_role)
INSERT INTO user_role (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM utilisateur u
CROSS JOIN role r
WHERE u.email = 'admin@ecotrack.local' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_role (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM utilisateur u
CROSS JOIN role r
WHERE u.email = 'gestionnaire@ecotrack.local' AND r.name = 'GESTIONNAIRE'
ON CONFLICT DO NOTHING;

INSERT INTO user_role (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM utilisateur u
CROSS JOIN role r
WHERE u.email LIKE 'agent%@ecotrack.local' AND r.name = 'AGENT'
ON CONFLICT DO NOTHING;

INSERT INTO user_role (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role
FROM utilisateur u
CROSS JOIN role r
WHERE u.email LIKE 'citoyen%@ecotrack.local' AND r.name = 'CITOYEN'
ON CONFLICT DO NOTHING;

-- Badges pour certains utilisateurs
INSERT INTO user_badge (id_utilisateur, id_badge)
SELECT u.id_utilisateur, b.id_badge
FROM utilisateur u
CROSS JOIN badge b
WHERE u.email = 'citoyen1@ecotrack.local' AND b.code IN ('FIRST_REPORT', 'ECO_STARTER')
ON CONFLICT DO NOTHING;

INSERT INTO user_badge (id_utilisateur, id_badge)
SELECT u.id_utilisateur, b.id_badge
FROM utilisateur u
CROSS JOIN badge b
WHERE u.email = 'citoyen2@ecotrack.local' AND b.code IN ('FIRST_REPORT', 'ECO_STARTER', 'REPORTER_BRONZE')
ON CONFLICT DO NOTHING;
