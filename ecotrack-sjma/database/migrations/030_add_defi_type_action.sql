-- 021_add_defi_type_action.sql
-- Add a type_action discriminator to gamification_defi so the gamification
-- service can know which user action (e.g., 'signalement', 'collecte') should
-- bump each defi's progression. Existing defis are backfilled to 'signalement'
-- since the two seeded defis ("quartier propre", "tri dechets") both count
-- signalements.

ALTER TABLE gamification_defi
  ADD COLUMN IF NOT EXISTS type_action VARCHAR(30);

UPDATE gamification_defi
SET type_action = 'signalement'
WHERE type_action IS NULL;

CREATE INDEX IF NOT EXISTS idx_gamification_defi_type_action
  ON gamification_defi (type_action);
