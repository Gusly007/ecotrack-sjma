-- =============================================================================
-- CONFIGURATIONS PAR DÉFAUT - EcoTrack
-- =============================================================================

INSERT INTO configurations (cle, valeur, type, description, categorie, est_modifiable, min_valeur, max_valeur) VALUES
-- JWT Configuration
('jwt.access_token_expiration', '24h', 'string', 'Durée expiration token d''accès JWT', 'jwt', true, NULL, NULL),
('jwt.refresh_token_expiration', '168h', 'string', 'Durée expiration refresh token (en heures, 168h = 7 jours)', 'jwt', true, 1, 8760),
('jwt.secret_min_length', '32', 'number', 'Longueur minimale du secret JWT', 'jwt', false, NULL, NULL),

-- Security
('security.bcrypt_rounds', '10', 'number', 'Nombre de rounds pour le hash bcrypt', 'security', true, 8, 14),
('security.max_login_attempts', '5', 'number', 'Nombre max de tentatives de connexion', 'security', true, 1, 20),
('security.lockout_duration_minutes', '15', 'number', 'Durée de blocage en minutes après echec', 'security', true, 1, 1440),

-- Sessions
('session.max_concurrent_sessions', '3', 'number', 'Nombre max de sessions simultanées par utilisateur', 'session', true, 1, 10),
('session.token_expiration_hours', '168', 'number', 'Expiration tokens en heures (doit correspondre à jwt.refresh_token_expiration)', 'session', true, 1, 8760),

-- Rate Limiting
('rate_limit.window_ms', '60000', 'number', 'Fenêtre de temps pour le rate limiting (en ms)', 'rate_limit', true, 1000, 600000),
('rate_limit.max_requests', '100', 'number', 'Nombre max de requêtes par fenêtre', 'rate_limit', true, 10, 10000),
('rate_limit.auth_window_ms', '900000', 'number', 'Fenêtre rate limiting authentification (15 min)', 'rate_limit', true, 60000, 3600000),
('rate_limit.auth_max_attempts', '5', 'number', 'Max tentatives login par fenêtre', 'rate_limit', true, 1, 20),

-- File Upload
('upload.max_file_size_mb', '5', 'number', 'Taille max des fichiers uploadés (en MB)', 'upload', true, 1, 50),
('upload.allowed_extensions', '["jpg","jpeg","png","webp"]', 'json', 'Extensions de fichiers autorisées', 'upload', true, NULL, NULL),
('upload.max_files_per_request', '5', 'number', 'Nombre max de fichiers par requête', 'upload', true, 1, 20),

-- Password Policy
('password.min_length', '8', 'number', 'Longueur minimale du mot de passe', 'password', true, 6, 128),
('password.require_uppercase', 'true', 'boolean', 'Exiger au moins une majuscule', 'password', true, NULL, NULL),
('password.require_lowercase', 'true', 'boolean', 'Exiger au moins une minuscule', 'password', true, NULL, NULL),
('password.require_number', 'true', 'boolean', 'Exiger au moins un chiffre', 'password', true, NULL, NULL),
('password.require_special', 'true', 'boolean', 'Exiger au moins un caractère spécial', 'password', true, NULL, NULL),

-- Notifications
('notifications.email_enabled', 'true', 'boolean', 'Activer les notifications par email', 'notifications', true, NULL, NULL),
('notifications.push_enabled', 'true', 'boolean', 'Activer les notifications push', 'notifications', true, NULL, NULL)
ON CONFLICT (cle) DO NOTHING;
