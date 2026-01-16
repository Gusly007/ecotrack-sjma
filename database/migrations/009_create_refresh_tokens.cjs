exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      token TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES UTILISATEUR(id_utilisateur)
        ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_token ON refresh_tokens(user_id, token);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_created_at ON refresh_tokens(user_id, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);
};
