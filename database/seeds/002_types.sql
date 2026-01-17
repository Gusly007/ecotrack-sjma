-- Seed: 002_types
-- Description: Types de conteneurs et types de signalements

-- Types de conteneurs (code, nom)
INSERT INTO type_conteneur (code, nom) VALUES
  ('ORD', 'ORDURE'),
  ('REC', 'RECYCLAGE'),
  ('VER', 'VERRE'),
  ('COM', 'COMPOST')
ON CONFLICT (code) DO NOTHING;

-- Types de signalements (libelle, priorite, sla_heures)
INSERT INTO type_signalement (libelle, priorite, sla_heures) VALUES
  ('CONTENEUR_PLEIN', 'HAUTE', 4),
  ('CONTENEUR_ENDOMMAGE', 'NORMALE', 24),
  ('CONTENEUR_SALE', 'BASSE', 48),
  ('CONTENEUR_INACCESSIBLE', 'HAUTE', 8),
  ('DEPOT_SAUVAGE', 'URGENTE', 2),
  ('MAUVAISE_ODEUR', 'NORMALE', 24),
  ('CAPTEUR_DEFAILLANT', 'HAUTE', 12)
ON CONFLICT (libelle) DO NOTHING;
