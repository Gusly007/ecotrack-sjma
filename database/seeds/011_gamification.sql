-- Seed: 011_gamification
-- Description: Historique points, notifications, defis, participations

INSERT INTO historique_points (delta_points, raison, date_creation, id_utilisateur)
SELECT v.delta_points, v.raison, v.date_creation, u.id_utilisateur
FROM (
  VALUES
    (20, 'Signalement valide', NOW() - INTERVAL '2 days', 'citoyen1@ecotrack.local'),
    (15, 'Participation defi tri', NOW() - INTERVAL '1 day', 'citoyen2@ecotrack.local'),
    (-5, 'Signalement invalide', NOW() - INTERVAL '3 days', 'citoyen3@ecotrack.local')
) AS v(delta_points, raison, date_creation, user_email)
JOIN utilisateur u ON u.email = v.user_email
WHERE NOT EXISTS (
  SELECT 1 FROM historique_points h
  WHERE h.id_utilisateur = u.id_utilisateur
    AND h.raison = v.raison
    AND h.date_creation = v.date_creation
);

INSERT INTO notification (type, titre, corps, est_lu, date_creation, id_utilisateur)
SELECT v.type, v.titre, v.corps, v.est_lu, v.date_creation, u.id_utilisateur
FROM (
  VALUES
    ('ALERTE', 'Alerte conteneur', 'Un conteneur signale un depassement de seuil.', FALSE, NOW() - INTERVAL '4 hours', 'citoyen1@ecotrack.local'),
    ('BADGE', 'Nouveau badge', 'Vous avez gagne le badge ECO_STARTER.', TRUE, NOW() - INTERVAL '1 day', 'citoyen2@ecotrack.local'),
    ('SYSTEME', 'Maintenance planifiee', 'Une maintenance est prevue demain.', FALSE, NOW() - INTERVAL '2 days', 'citoyen3@ecotrack.local')
) AS v(type, titre, corps, est_lu, date_creation, user_email)
JOIN utilisateur u ON u.email = v.user_email
WHERE NOT EXISTS (
  SELECT 1 FROM notification n
  WHERE n.id_utilisateur = u.id_utilisateur
    AND n.titre = v.titre
    AND n.date_creation = v.date_creation
);

INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi)
SELECT v.titre, v.description, v.objectif, v.recompense_points, v.date_debut, v.date_fin, v.type_defi
FROM (
  VALUES
    ('Defi tri dechets', 'Signaler 3 problemes de tri cette semaine', 3, 50, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'INDIVIDUEL'),
    ('Defi quartier propre', 'Atteindre 10 signalements dans le quartier', 10, 120, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '10 days', 'COLLECTIF')
) AS v(titre, description, objectif, recompense_points, date_debut, date_fin, type_defi)
WHERE NOT EXISTS (SELECT 1 FROM gamification_defi d WHERE d.titre = v.titre);

INSERT INTO gamification_participation_defi (id_defi, id_utilisateur, progression, statut, derniere_maj)
SELECT d.id_defi, u.id_utilisateur, v.progression, v.statut, NOW() - INTERVAL '1 hour'
FROM (
  VALUES
    ('Defi tri dechets', 'citoyen1@ecotrack.local', 2, 'EN_COURS'),
    ('Defi tri dechets', 'citoyen2@ecotrack.local', 3, 'TERMINE'),
    ('Defi quartier propre', 'citoyen3@ecotrack.local', 4, 'EN_COURS')
) AS v(defi_titre, user_email, progression, statut)
JOIN gamification_defi d ON d.titre = v.defi_titre
JOIN utilisateur u ON u.email = v.user_email
WHERE NOT EXISTS (
  SELECT 1 FROM gamification_participation_defi p
  WHERE p.id_defi = d.id_defi
    AND p.id_utilisateur = u.id_utilisateur
);
