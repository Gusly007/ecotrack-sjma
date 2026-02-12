-- Seed: 010_signalements
-- Description: Signalements et traitements

INSERT INTO signalement (description, url_photo, statut, id_type, id_conteneur, id_citoyen, date_creation)
SELECT v.description, v.url_photo, v.statut, ts.id_type, c.id_conteneur, u.id_utilisateur, v.date_creation
FROM (
  VALUES
    ('Conteneur plein pres du marche', NULL, 'OUVERT', 'CONTENEUR_PLEIN', 'CNT-0001', 'citoyen1@ecotrack.local', NOW() - INTERVAL '2 days'),
    ('Depot sauvage a l angle de la rue', NULL, 'EN_COURS', 'DEPOT_SAUVAGE', 'CNT-0002', 'citoyen2@ecotrack.local', NOW() - INTERVAL '1 day'),
    ('Conteneur endommage', NULL, 'RESOLU', 'CONTENEUR_ENDOMMAGE', 'CNT-0003', 'citoyen3@ecotrack.local', NOW() - INTERVAL '5 days'),
    ('Conteneur sale apres collecte', NULL, 'OUVERT', 'CONTENEUR_SALE', 'CNT-0004', 'citoyen1@ecotrack.local', NOW() - INTERVAL '3 days'),
    ('Mauvaise odeur persistante', NULL, 'FERME', 'MAUVAISE_ODEUR', 'CNT-0005', 'citoyen2@ecotrack.local', NOW() - INTERVAL '6 days')
) AS v(description, url_photo, statut, type_libelle, conteneur_uid, citoyen_email, date_creation)
JOIN type_signalement ts ON ts.libelle = v.type_libelle
JOIN conteneur c ON c.uid = v.conteneur_uid
JOIN utilisateur u ON u.email = v.citoyen_email
WHERE NOT EXISTS (
  SELECT 1 FROM signalement s
  WHERE s.description = v.description
    AND s.id_conteneur = c.id_conteneur
    AND s.id_citoyen = u.id_utilisateur
);

INSERT INTO traitement_signalement (commentaire, id_signalement, id_agent)
SELECT v.commentaire, s.id_signalement, a.id_utilisateur
FROM (
  VALUES
    ('Intervention planifiee pour demain', 'Depot sauvage a l angle de la rue', 'agent1@ecotrack.local'),
    ('Conteneur remplace', 'Conteneur endommage', 'agent2@ecotrack.local')
) AS v(commentaire, signalement_desc, agent_email)
JOIN signalement s ON s.description = v.signalement_desc
JOIN utilisateur a ON a.email = v.agent_email
ON CONFLICT (id_signalement) DO NOTHING;
