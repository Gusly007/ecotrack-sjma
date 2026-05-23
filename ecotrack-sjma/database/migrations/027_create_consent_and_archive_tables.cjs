exports.up = (pgm) => {
  // Migration 027: Create consent_logs and archived_logs tables (Art. 7, 25, 32)
  // Description: GDPR compliance tables for consent proof (13-month retention) and audit trail

  // Create archive schema first
  pgm.sql(`
    CREATE SCHEMA IF NOT EXISTS ecotrack_archive;
  `);

  // Table for consent tracking (Art. 7 - Proof of consent)
  // CNIL recommends 13-month maximum retention for consent proof
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS ecotrack_archive.consent_logs (
      id BIGSERIAL PRIMARY KEY,
      id_utilisateur INT REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL,
      session_id VARCHAR(255),
      type_consent VARCHAR(50) NOT NULL,
      action_consent VARCHAR(20) NOT NULL,
      version_document VARCHAR(10),
      intitule TEXT NOT NULL,
      ip_address INET NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '13 months')
    );
  `);

  // Indexes for cleanup jobs (Art. 25)
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON ecotrack_archive.consent_logs(id_utilisateur);
    CREATE INDEX IF NOT EXISTS idx_consent_logs_session_id ON ecotrack_archive.consent_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON ecotrack_archive.consent_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_consent_logs_expires_at ON ecotrack_archive.consent_logs(expires_at);
    CREATE INDEX IF NOT EXISTS idx_consent_logs_type ON ecotrack_archive.consent_logs(type_consent);
  `);

  // Table for archiving logs (Art. 25, 32 - 12-month retention)
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS ecotrack_archive.archived_logs (
      id BIGSERIAL PRIMARY KEY,
      id_utilisateur INT REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      description TEXT,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '12 months')
    );
  `);

  // Indexes for archived logs
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_archived_logs_user_id ON ecotrack_archive.archived_logs(id_utilisateur);
    CREATE INDEX IF NOT EXISTS idx_archived_logs_created_at ON ecotrack_archive.archived_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_archived_logs_archived_at ON ecotrack_archive.archived_logs(archived_at);
    CREATE INDEX IF NOT EXISTS idx_archived_logs_expires_at ON ecotrack_archive.archived_logs(expires_at);
    CREATE INDEX IF NOT EXISTS idx_archived_logs_action ON ecotrack_archive.archived_logs(action);
  `);

  // Grant permissions to application user if needed
  pgm.sql(`
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ecotrack_archive TO ${process.env.DB_USER || 'ecotrack_user'};
    GRANT USAGE, CREATE ON SCHEMA ecotrack_archive TO ${process.env.DB_USER || 'ecotrack_user'};
  `);
};

exports.down = (pgm) => {
  // Rollback: Drop schema and its tables
  pgm.sql(`
    DROP SCHEMA IF EXISTS ecotrack_archive CASCADE;
  `);
};
