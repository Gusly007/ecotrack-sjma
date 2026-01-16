-- Seed: 005_vehicules
-- Description: Véhicules de collecte

INSERT INTO vehicule (immatriculation, capacite_kg, type_carburant, statut) VALUES
  ('AB-123-CD', 3500, 'DIESEL', 'DISPONIBLE'),
  ('EF-456-GH', 5000, 'DIESEL', 'DISPONIBLE'),
  ('IJ-789-KL', 8000, 'ELECTRIQUE', 'EN_SERVICE'),
  ('MN-012-OP', 10000, 'HYBRIDE', 'DISPONIBLE'),
  ('QR-345-ST', 7500, 'DIESEL', 'EN_MAINTENANCE'),
  ('UV-678-WX', 12000, 'DIESEL', 'DISPONIBLE')
ON CONFLICT (immatriculation) DO NOTHING;
