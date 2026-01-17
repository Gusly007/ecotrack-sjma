exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE refresh_tokens (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id INT NOT NULL,
      token TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
    );
    CREATE INDEX idx_refresh_tokens_user_token ON refresh_tokens(user_id, token);
    CREATE INDEX idx_refresh_tokens_user_created_at ON refresh_tokens(user_id, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);
};
