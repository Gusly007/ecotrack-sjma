-- Seed des permissions par défaut selon matrice RBAC

-- CITOYEN permissions
INSERT INTO permissions_config (role, permission, is_active) VALUES ('CITOYEN', 'signaler:create', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('CITOYEN', 'signaler:read', true) ON CONFLICT (role, permission) DO NOTHING;

-- AGENT permissions
INSERT INTO permissions_config (role, permission, is_active) VALUES ('AGENT', 'signaler:create', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('AGENT', 'signaler:read', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('AGENT', 'signaler:update', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('AGENT', 'tournee:read', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('AGENT', 'tournee:update', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('AGENT', 'containers:update', true) ON CONFLICT (role, permission) DO NOTHING;

-- GESTIONNAIRE permissions
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'signaler:create', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'signaler:read', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'signaler:update', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'tournee:create', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'tournee:read', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'tournee:update', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'containers:update', true) ON CONFLICT (role, permission) DO NOTHING;
-- user:read supprimé pour GESTIONNAIRE (réservé ADMIN)
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'zone:read', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'zone:create', true) ON CONFLICT (role, permission) DO NOTHING;
INSERT INTO permissions_config (role, permission, is_active) VALUES ('GESTIONNAIRE', 'zone:update', true) ON CONFLICT (role, permission) DO NOTHING;

-- ADMIN permissions (wildcard)
INSERT INTO permissions_config (role, permission, is_active) VALUES ('ADMIN', '*', true) ON CONFLICT (role, permission) DO NOTHING;
