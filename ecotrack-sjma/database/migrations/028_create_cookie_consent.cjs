exports.up = (pgm) => {
  pgm.sql(`
    -- Create cookie_consent table to track user GDPR compliance
    CREATE TABLE IF NOT EXISTS cookie_consent (
      id_cookie_consent UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_utilisateur INT,
      session_id VARCHAR(255),
      ip_address INET NOT NULL,
      consent_status VARCHAR(20) NOT NULL CHECK (consent_status IN ('ACCEPTED', 'REJECTED', 'PENDING')),
      cookies_accepted JSONB DEFAULT '{"analytics": false, "marketing": false, "functional": true}',
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
      CONSTRAINT valid_session_or_user CHECK (session_id IS NOT NULL OR id_utilisateur IS NOT NULL)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_cookie_consent_user ON cookie_consent(id_utilisateur);
    CREATE INDEX IF NOT EXISTS idx_cookie_consent_session ON cookie_consent(session_id);
    CREATE INDEX IF NOT EXISTS idx_cookie_consent_created ON cookie_consent(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cookie_consent_status ON cookie_consent(consent_status);
    CREATE INDEX IF NOT EXISTS idx_cookie_consent_ip ON cookie_consent(ip_address);

    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_cookie_consent_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_cookie_consent_timestamp
    BEFORE UPDATE ON cookie_consent
    FOR EACH ROW
    EXECUTE FUNCTION update_cookie_consent_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS trigger_cookie_consent_timestamp ON cookie_consent;
    DROP FUNCTION IF EXISTS update_cookie_consent_timestamp();
    DROP INDEX IF EXISTS idx_cookie_consent_ip;
    DROP INDEX IF EXISTS idx_cookie_consent_status;
    DROP INDEX IF EXISTS idx_cookie_consent_created;
    DROP INDEX IF EXISTS idx_cookie_consent_session;
    DROP INDEX IF EXISTS idx_cookie_consent_user;
    DROP TABLE IF EXISTS cookie_consent;
  `);
};
