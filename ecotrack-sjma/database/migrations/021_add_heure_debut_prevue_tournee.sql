-- Migration: Ajout de heure_debut_prevue sur la table tournee
-- Description:
--   Stocke l'heure de départ prévue d'une tournée (ex: 07:30).
--   Utilisée pour calculer dynamiquement si la tournée est "en retard"
--   (NOW() > date_tournee + heure_debut_prevue + duree_prevue_min minutes).
--   Avant cette migration, l'heure de départ était codée en dur à 07:30 dans le
--   service backend, et le retard était grossièrement déduit de "date < CURRENT_DATE",
--   ce qui faisait passer en retard toute tournée non terminée dès le lendemain.
-- Compatibilité : valeur par défaut 07:30 → l'historique reste cohérent.

ALTER TABLE tournee
    ADD COLUMN IF NOT EXISTS heure_debut_prevue TIME NOT NULL DEFAULT '07:30:00';

-- Filet de sécurité pour les éventuelles lignes existantes laissées NULL avant la contrainte
UPDATE tournee SET heure_debut_prevue = '07:30:00' WHERE heure_debut_prevue IS NULL;

-- Garde-fou : pas d'heures absurdes (uniquement 00:00 → 23:59:59 — TIME le garantit déjà,
-- on ajoute un commentaire pour la lisibilité du schéma)
COMMENT ON COLUMN tournee.heure_debut_prevue IS
    'Heure prévue de départ de la tournée. Sert au calcul du retard : la tournée est en retard si NOW() > date_tournee + heure_debut_prevue + duree_prevue_min minutes.';
