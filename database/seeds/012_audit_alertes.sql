-- Seed: 012_audit_alertes
-- Description: Historique statuts, journal audit, alertes capteur

INSERT INTO historique_statut (type_entite, ancien_statut, nouveau_statut, date_changement, id_entite)
SELECT v.type_entite, v.ancien_statut, v.nouveau_statut, v.date_changement, v.id_entite
FROM (
  SELECT 'CONTENEUR', 'ACTIF', 'EN_MAINTENANCE', NOW() - INTERVAL '2 days', c.id_conteneur
  FROM conteneur c WHERE c.uid = 'CNT-0001'
  UNION ALL
  SELECT 'TOURNEE', 'PLANIFIEE', 'EN_COURS', NOW() - INTERVAL '1 day', t.id_tournee
  FROM tournee t WHERE t.code = 'T-2025-001'
  UNION ALL
  SELECT 'SIGNALEMENT', 'OUVERT', 'EN_COURS', NOW() - INTERVAL '12 hours', s.id_signalement
  FROM signalement s WHERE s.description = 'Depot sauvage a l angle de la rue'
) AS v(type_entite, ancien_statut, nouveau_statut, date_changement, id_entite)
WHERE NOT EXISTS (
  SELECT 1 FROM historique_statut hs
  WHERE hs.type_entite = v.type_entite
    AND hs.id_entite = v.id_entite
    AND hs.nouveau_statut = v.nouveau_statut
    AND hs.date_changement = v.date_changement
);

INSERT INTO journal_audit (id_acteur, action, type_entite, id_entite, date_creation)
SELECT v.id_acteur, v.action, v.type_entite, v.id_entite, v.date_creation
FROM (
  SELECT u.id_utilisateur, 'CREATION_TOURNEE', 'TOURNEE', t.id_tournee, NOW() - INTERVAL '2 days'
  FROM utilisateur u
  JOIN tournee t ON t.code = 'T-2025-001'
  WHERE u.email = 'agent1@ecotrack.local'
  UNION ALL
  SELECT u.id_utilisateur, 'CLOTURE_SIGNALEMENT', 'SIGNALEMENT', s.id_signalement, NOW() - INTERVAL '1 day'
  FROM utilisateur u
  JOIN signalement s ON s.description = 'Conteneur endommage'
  WHERE u.email = 'agent2@ecotrack.local'
  UNION ALL
  SELECT u.id_utilisateur, 'AJOUT_BADGE', 'UTILISATEUR', u.id_utilisateur, NOW() - INTERVAL '3 days'
  FROM utilisateur u
  WHERE u.email = 'citoyen1@ecotrack.local'
) AS v(id_acteur, action, type_entite, id_entite, date_creation)
WHERE NOT EXISTS (
  SELECT 1 FROM journal_audit ja
  WHERE ja.action = v.action
    AND ja.type_entite = v.type_entite
    AND ja.id_entite = v.id_entite
    AND ja.date_creation = v.date_creation
);

INSERT INTO alerte_capteur (type_alerte, valeur_detectee, seuil, statut, date_creation, date_traitement, description, id_conteneur)
SELECT v.type_alerte, v.valeur_detectee, v.seuil, v.statut, v.date_creation, v.date_traitement, v.description, c.id_conteneur
FROM (
  VALUES
    ('DEBORDEMENT', 95.00, 90.00, 'ACTIVE', NOW() - INTERVAL '1 hour', NULL, 'Niveau critique detecte', 'CNT-0001'),
    ('BATTERIE_FAIBLE', 22.00, 20.00, 'RESOLUE', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'Batterie remplacee', 'CNT-0002')
) AS v(type_alerte, valeur_detectee, seuil, statut, date_creation, date_traitement, description, conteneur_uid)
JOIN conteneur c ON c.uid = v.conteneur_uid
WHERE NOT EXISTS (
  SELECT 1 FROM alerte_capteur a
  WHERE a.type_alerte = v.type_alerte
    AND a.id_conteneur = c.id_conteneur
    AND a.date_creation = v.date_creation
);
