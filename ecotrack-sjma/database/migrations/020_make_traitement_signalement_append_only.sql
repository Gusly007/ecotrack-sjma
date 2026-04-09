ALTER TABLE traitement_signalement
  ADD COLUMN IF NOT EXISTS type_action VARCHAR(20) NOT NULL DEFAULT 'NOTE';

ALTER TABLE traitement_signalement
  DROP CONSTRAINT IF EXISTS uk_traitement_signalement;

ALTER TABLE traitement_signalement
  ADD CONSTRAINT ck_traitement_signalement_type_action
  CHECK (type_action IN ('NOTE', 'INTERVENTION'));
