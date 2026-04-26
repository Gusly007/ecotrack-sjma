-- Constantes environnementales par défaut
INSERT INTO environmental_constants (cle, valeur, type, unite, description, est_modifiable, min_valeur, max_valeur) VALUES
('CO2_PER_KM', '0.85', 'number', 'kg/km', 'Émissions CO2 par km (camion benne à ordures)', true, 0.1, 5),
('FUEL_CONSUMPTION_PER_100KM', '35', 'number', 'L/100km', 'Consommation carburant camion benne', true, 10, 100),
('FUEL_PRICE_PER_LITER', '1.65', 'number', '€/L', 'Prix du carburant au litre', true, 1, 5),
('LABOR_COST_PER_HOUR', '50', 'number', '€/h', 'Coût main d''œuvre horaire', true, 20, 200),
('MAINTENANCE_COST_PER_KM', '0.15', 'number', '€/km', 'Coût maintenance par km', true, 0.01, 1),
('CO2_PER_TREE_PER_YEAR', '20', 'number', 'kg/an', 'CO2 absorbé par arbre planté par an', true, 10, 50),
('CO2_PER_KM_CAR', '0.12', 'number', 'kg/km', 'CO2 émis par km (voiture moyenne)', true, 0.05, 0.5)
ON CONFLICT (cle) DO NOTHING;
