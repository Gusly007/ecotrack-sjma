-- Seed: 008_maintenance
-- Description: Maintenance demo records

INSERT INTO maintenance (type_maintenance, statut, date_planifiee, date_realisation)
SELECT v.type_maintenance, v.statut, v.date_planifiee, v.date_realisation
FROM (
  VALUES
    ('NETTOYAGE', 'PLANIFIEE', NOW() + INTERVAL '2 days', NULL),
    ('REPARATION', 'EN_COURS', NOW() - INTERVAL '1 day', NULL),
    ('INSPECTION', 'TERMINEE', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
    ('REMPLACEMENT', 'ANNULEE', NOW() - INTERVAL '3 days', NULL),
    ('CALIBRATION', 'TERMINEE', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days')
) AS v(type_maintenance, statut, date_planifiee, date_realisation)
WHERE NOT EXISTS (
  SELECT 1
  FROM maintenance m
  WHERE m.type_maintenance = v.type_maintenance
    AND m.date_planifiee = v.date_planifiee
);
