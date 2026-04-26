-- Seed: 005_vehicules
-- Description: Véhicules de collecte

INSERT INTO vehicule (numero_immatriculation, modele, capacite_kg) VALUES
  ('AB-123-CD', 'Renault Master', 3500),
  ('EF-456-GH', 'Mercedes Atego', 5000),
  ('IJ-789-KL', 'Volvo FE Electric', 8000),
  ('MN-012-OP', 'DAF LF', 10000),
  ('QR-345-ST', 'Iveco Daily', 7500),
  ('UV-678-WX', 'MAN TGL', 12000)
ON CONFLICT (numero_immatriculation) DO NOTHING;
