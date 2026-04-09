ALTER TABLE traitement_signalement
  ADD COLUMN IF NOT EXISTS type_intervention VARCHAR(50),
  ADD COLUMN IF NOT EXISTS date_intervention DATE,
  ADD COLUMN IF NOT EXISTS priorite_intervention VARCHAR(10),
  ADD COLUMN IF NOT EXISTS notes_intervention VARCHAR(500);
