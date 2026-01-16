-- Seed: 002_types
-- Description: Types de conteneurs et types de signalements

-- Types de conteneurs
INSERT INTO type_conteneur (name, description) VALUES
  ('ORDURE', 'Déchets ménagers non recyclables'),
  ('RECYCLAGE', 'Déchets recyclables'),
  ('VERRE', 'Conteneur pour le verre'),
  ('COMPOST', 'Déchets organiques compostables')
ON CONFLICT (name) DO NOTHING;

-- Types de signalements
INSERT INTO type_signalement (name, description) VALUES
  ('CONTENEUR_PLEIN', 'Conteneur plein à collecter'),
  ('CONTENEUR_ENDOMMAGE', 'Conteneur endommagé nécessitant réparation'),
  ('CONTENEUR_SALE', 'Conteneur nécessitant nettoyage'),
  ('CONTENEUR_INACCESSIBLE', 'Conteneur bloqué ou inaccessible'),
  ('DEPOT_SAUVAGE', 'Dépôt illégal de déchets'),
  ('MAUVAISE_ODEUR', 'Problème de nuisances olfactives'),
  ('CAPTEUR_DEFAILLANT', 'Capteur IoT ne fonctionnant pas')
ON CONFLICT (name) DO NOTHING;
