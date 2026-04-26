-- Seed: 010_signalements
-- Description: Signalements et traitements

INSERT INTO signalement (description, url_photo, statut, id_type, id_conteneur, id_citoyen, date_creation)
SELECT v.description, v.url_photo, v.statut, ts.id_type, c.id_conteneur, u.id_utilisateur, v.date_creation
FROM (
  VALUES
    ('Conteneur plein pres du marche', NULL, 'OUVERT', 'CONTENEUR_PLEIN', 'CNT-00001', 'citoyen1@ecotrack.local', NOW() - INTERVAL '2 days'),
    ('Depot sauvage a l angle de la rue', NULL, 'EN_COURS', 'DEPOT_SAUVAGE', 'CNT-00002', 'citoyen2@ecotrack.local', NOW() - INTERVAL '1 day'),
    ('Conteneur endommage', NULL, 'RESOLU', 'CONTENEUR_ENDOMMAGE', 'CNT-00003', 'citoyen3@ecotrack.local', NOW() - INTERVAL '5 days'),
    ('Conteneur sale apres collecte', NULL, 'OUVERT', 'CONTENEUR_SALE', 'CNT-00004', 'citoyen1@ecotrack.local', NOW() - INTERVAL '3 days'),
    ('Mauvaise odeur persistante', NULL, 'FERME', 'MAUVAISE_ODEUR', 'CNT-00005', 'citoyen2@ecotrack.local', NOW() - INTERVAL '6 days'),
    ('Capteur hors service', NULL, 'EN_COURS', 'CAPTEUR_DEFAILLANT', 'CNT-00006', 'citoyen3@ecotrack.local', NOW() - INTERVAL '4 days'),
    ('Conteneur inaccessible pour collecte', NULL, 'OUVERT', 'CONTENEUR_INACCESSIBLE', 'CNT-00007', 'citoyen1@ecotrack.local', NOW() - INTERVAL '8 hours'),
    ('Signalement de depot sauvage au parc', NULL, 'RESOLU', 'DEPOT_SAUVAGE', 'CNT-00008', 'citoyen2@ecotrack.local', NOW() - INTERVAL '9 days'),
    ('Conteneur plein secteur nord', NULL, 'EN_COURS', 'CONTENEUR_PLEIN', 'CNT-00009', 'citoyen3@ecotrack.local', NOW() - INTERVAL '12 hours'),
    ('Conteneur malodorant proche ecole', NULL, 'OUVERT', 'MAUVAISE_ODEUR', 'CNT-00010', 'citoyen1@ecotrack.local', NOW() - INTERVAL '7 days'),
    ('Conteneur endommage apres choc', NULL, 'FERME', 'CONTENEUR_ENDOMMAGE', 'CNT-00011', 'citoyen2@ecotrack.local', NOW() - INTERVAL '11 days'),
    ('Conteneur sale et deborde', NULL, 'EN_COURS', 'CONTENEUR_SALE', 'CNT-00012', 'citoyen3@ecotrack.local', NOW() - INTERVAL '2 hours')
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

INSERT INTO traitement_signalement (commentaire, id_signalement, id_agent, type_action)
SELECT v.commentaire, s.id_signalement, a.id_utilisateur, 'NOTE'
FROM (
  VALUES
    ('Intervention planifiee pour demain', 'Depot sauvage a l angle de la rue', 'agent1@ecotrack.local'),
    ('Conteneur remplace', 'Conteneur endommage', 'agent2@ecotrack.local'),
    ('Equipe deposee sur site', 'Capteur hors service', 'agent1@ecotrack.local'),
    ('Acces balise et controle demande', 'Conteneur inaccessible pour collecte', 'agent2@ecotrack.local'),
    ('Nettoyage effectue', 'Signalement de depot sauvage au parc', 'agent1@ecotrack.local'),
    ('Collecte renforcee planifiee', 'Conteneur plein secteur nord', 'agent2@ecotrack.local'),
    ('Prelevement odeur effectue', 'Conteneur malodorant proche ecole', 'agent1@ecotrack.local')
) AS v(commentaire, signalement_desc, agent_email)
JOIN signalement s ON s.description = v.signalement_desc
JOIN utilisateur a ON a.email = v.agent_email
WHERE NOT EXISTS (
  SELECT 1
  FROM traitement_signalement t
  WHERE t.id_signalement = s.id_signalement
    AND t.id_agent = a.id_utilisateur
    AND COALESCE(t.commentaire, '') = COALESCE(v.commentaire, '')
    AND t.type_action = 'NOTE'
);
