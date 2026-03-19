-- Constantes de performance des agents
INSERT INTO agent_performance_constants (cle, valeur, type, unite, description, est_modifiable, min_valeur, max_valeur) VALUES
-- Collectes
('COLLECTES_QUOTIDIENNES_CIBLE', '10', 'number', 'collectes', 'Nombre cible de collectes par jour', true, 1, 50),
('COLLECTES_HEBDO_CIBLE', '45', 'number', 'collectes', 'Nombre cible de collectes par semaine', true, 5, 200),
('TEMPS_MOYEN_COLLECTE', '15', 'number', 'minutes', 'Temps moyen par collecte', true, 5, 60),
('TAUX_COMPLETION_CIBLE', '95', 'number', '%', 'Taux de completion des tournées cible', true, 50, 100),

-- Signalements
('SIGNALEMENTS_QUOTIDIENS_CIBLE', '5', 'number', 'signalements', 'Signalements traités par jour', true, 1, 50),
('SIGNALEMENTS_QUOTIDIENS_MAX', '20', 'number', 'signalements', 'Maximum signalements par jour', true, 5, 100),
('TEMPS_MOYEN_TRAITEMENT', '48', 'number', 'heures', 'Temps moyen traitement signalement', true, 1, 168),
('TAUX_VALIDATION_CIBLE', '80', 'number', '%', 'Taux de validation signalements', true, 50, 100),

-- Zones
('ZONES_COUVERTES_CIBLE', '5', 'number', 'zones', 'Nombre de zones à couvrir par jour', true, 1, 20),
('CONTENEURS_PAR_ZONE_CIBLE', '20', 'number', 'conteneurs', 'Conteneurs à vider par zone', true, 5, 100),
('RAYON_INTERVENTION_KM', '10', 'number', 'km', 'Rayon max intervention', true, 1, 50),

-- Performance
('EFFICACITE_CIBLE', '85', 'number', '%', 'Score efficacité cible', true, 50, 100),
('PONCTUALITE_CIBLE', '90', 'number', '%', 'Taux ponctualité cible', true, 50, 100),
('DISPONIBILITE_CIBLE', '80', 'number', '%', 'Taux disponibilité cible', true, 50, 100),
('SATISFACTION_CIBLE', '4.5', 'number', '/5', 'Note satisfaction minimale', true, 1, 5),

-- Temps
('HEURES_TRAVAIL_QUOTIDIEN', '8', 'number', 'heures', 'Heures de travail par jour', true, 4, 12),
('PAUSE_MOYENNE_MINUTES', '30', 'number', 'minutes', 'Pause moyenne quotidienne', true, 15, 60),
('TEMPS_REPONSE_URGENT', '30', 'number', 'minutes', 'Temps réponse intervention urgente', true, 10, 120),

-- Maintenance
('VEHICULES_ENTRETIENT_QUOTIDIEN', '1', 'number', 'vehicules', 'Véhicules à entretenir par jour', true, 0, 10),
('KILOMETRES_ENTRE_MAX', '300', 'number', 'km', 'Kilomètres max entre entretiens', true, 100, 1000)
ON CONFLICT (cle) DO NOTHING;
