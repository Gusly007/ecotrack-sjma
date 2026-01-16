exports.up = (pgm) => {
  // Table des utilisateurs
  pgm.sql(`
    CREATE TABLE utilisateur (
      id_utilisateur SERIAL PRIMARY KEY,
      email VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nom VARCHAR(50) NOT NULL DEFAULT '',
      prenom VARCHAR(50) NOT NULL,
      role_par_defaut VARCHAR(20) DEFAULT 'CITOYEN',
      points INTEGER NOT NULL DEFAULT 0,
      est_active BOOLEAN NOT NULL DEFAULT TRUE,
      date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      avatar_url VARCHAR(255),
      avatar_thumbnail VARCHAR(255),
      avatar_mini VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uk_utilisateur_email UNIQUE (email),
      CONSTRAINT ck_email_format CHECK (email LIKE '%@%'),
      CONSTRAINT ck_points_non_negatifs CHECK (points >= 0),
      CONSTRAINT ck_role_valide CHECK (role_par_defaut IN ('CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'))
    );
    CREATE INDEX idx_utilisateur_email ON utilisateur(email);
    CREATE INDEX idx_utilisateur_role ON utilisateur(role_par_defaut);
    CREATE INDEX idx_utilisateur_actif ON utilisateur(est_active);
    CREATE INDEX idx_utilisateur_points ON utilisateur(points DESC);
    CREATE INDEX idx_utilisateur_avatar ON utilisateur(avatar_url);
  `);

  // Table de jonction utilisateur-rôle
  pgm.sql(`
    CREATE TABLE user_role (
      id_utilisateur INTEGER NOT NULL,
      id_role INTEGER NOT NULL,
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT pk_user_role PRIMARY KEY (id_utilisateur, id_role),
      CONSTRAINT fk_user_role_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      CONSTRAINT fk_user_role_role FOREIGN KEY (id_role) REFERENCES role(id_role) ON DELETE CASCADE
    );
    CREATE INDEX idx_user_role_utilisateur ON user_role(id_utilisateur);
    CREATE INDEX idx_user_role_role ON user_role(id_role);
  `);

  // Table de jonction utilisateur-badge
  pgm.sql(`
    CREATE TABLE user_badge (
      id_utilisateur INTEGER NOT NULL,
      id_badge INTEGER NOT NULL,
      date_obtention TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT pk_user_badge PRIMARY KEY (id_utilisateur, id_badge),
      CONSTRAINT fk_user_badge_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      CONSTRAINT fk_user_badge_badge FOREIGN KEY (id_badge) REFERENCES badge(id_badge) ON DELETE CASCADE
    );
    CREATE INDEX idx_user_badge_utilisateur ON user_badge(id_utilisateur);
    CREATE INDEX idx_user_badge_badge ON user_badge(id_badge);
    CREATE INDEX idx_user_badge_date ON user_badge(date_obtention DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS user_badge CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS user_role CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS utilisateur CASCADE`);
};
