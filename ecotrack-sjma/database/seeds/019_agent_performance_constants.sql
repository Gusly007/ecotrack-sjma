-- Pondérations pour calcul du score global des agents
INSERT INTO agent_performance_constants (cle, valeur, type, unite, description, est_modifiable, min_valeur, max_valeur) VALUES
('COLLECTION_RATE_WEIGHT', '0.4', 'number', '%', 'Poids pour le taux de collecte (score global = collection_rate * 0.4)', true, 0.1, 1),
('COMPLETION_RATE_WEIGHT', '0.3', 'number', '%', 'Poids pour le taux de completion (score global += completion_rate * 0.3)', true, 0.1, 1),
('TIME_EFFICIENCY_WEIGHT', '0.15', 'number', '%', 'Poids pour le respect du temps (score global += time_efficiency * 0.15)', true, 0.05, 1),
('DISTANCE_EFFICIENCY_WEIGHT', '0.15', 'number', '%', 'Poids pour le respect de la distance (score global += distance_efficiency * 0.15)', true, 0.05, 1)
ON CONFLICT (cle) DO NOTHING;
