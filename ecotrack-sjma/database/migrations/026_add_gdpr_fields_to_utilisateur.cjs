exports.up = (pgm) => {
  // Migration 026: Add GDPR soft-delete and anonymization fields (Art. 17)
  // Description: Enable soft-delete with 30-day grace period and auto-anonymization

  pgm.sql(`
    ALTER TABLE public.utilisateur
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT FALSE;
  `);

  // Index for soft-delete and grace period queries (cleanup jobs)
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_utilisateur_deleted_at 
      ON public.utilisateur(deleted_at) 
      WHERE deleted_at IS NOT NULL;
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_utilisateur_anonymized 
      ON public.utilisateur(anonymized) 
      WHERE anonymized = TRUE;
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_utilisateur_deletion_requested 
      ON public.utilisateur(deletion_requested_at) 
      WHERE deletion_requested_at IS NOT NULL;
  `);
};

exports.down = (pgm) => {
  // Rollback: Remove indexes and columns
  pgm.sql(`
    DROP INDEX IF EXISTS idx_utilisateur_deleted_at;
    DROP INDEX IF EXISTS idx_utilisateur_anonymized;
    DROP INDEX IF EXISTS idx_utilisateur_deletion_requested;
  `);

  pgm.sql(`
    ALTER TABLE public.utilisateur
      DROP COLUMN IF EXISTS deleted_at,
      DROP COLUMN IF EXISTS deletion_requested_at,
      DROP COLUMN IF EXISTS anonymized;
  `);
};
