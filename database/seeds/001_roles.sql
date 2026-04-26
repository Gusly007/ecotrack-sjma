-- Seed: 001_roles
-- Description: Rôles par défaut du système

INSERT INTO role (name, description) VALUES
  ('CITOYEN', 'Utilisateur standard - peut signaler des problèmes et consulter'),
  ('AGENT', 'Agent de collecte - peut gérer les tournées et collectes'),
  ('GESTIONNAIRE', 'Gestionnaire de zone - peut administrer une zone'),
  ('ADMIN', 'Administrateur - accès complet au système')
ON CONFLICT (name) DO NOTHING;
