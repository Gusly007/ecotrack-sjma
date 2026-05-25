-- 024_signalement_photo_urgence.sql
--
-- 1) La colonne signalement.url_photo était VARCHAR(255), trop petite pour
--    stocker une image encodée en base64. On passe à TEXT pour que l'app
--    citoyen puisse persister directement une vignette avec le signalement
--    (pas besoin d'un serveur de fichiers dédié pour la démo). Les lignes
--    existantes (souvent NULL) restent intactes.
--
-- 2) Ajoute une colonne urgence par signalement. Avant cette migration,
--    l'urgence affichée au citoyen était simplement une projection de
--    type_signalement.priorite — un citoyen qui choisissait "Basse" sur
--    un CONTENEUR_PLEIN (HAUTE par type) voyait quand même "Haute" sur
--    la fiche. Avec cette colonne, le choix du citoyen est conservé ;
--    l'API retombe sur le priorite du type quand urgence vaut NULL
--    (cas des anciennes lignes).

ALTER TABLE signalement
  ALTER COLUMN url_photo TYPE TEXT;

ALTER TABLE signalement
  ADD COLUMN IF NOT EXISTS urgence VARCHAR(20);

-- Contrainte facultative : on cantonne urgence aux trois libellés exposés
-- côté frontend. NULL est autorisé pour ne pas casser les lignes existantes.
ALTER TABLE signalement
  DROP CONSTRAINT IF EXISTS ck_signalement_urgence;

ALTER TABLE signalement
  ADD CONSTRAINT ck_signalement_urgence
  CHECK (urgence IS NULL OR urgence IN ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'));

CREATE INDEX IF NOT EXISTS idx_signalement_urgence ON signalement (urgence);
