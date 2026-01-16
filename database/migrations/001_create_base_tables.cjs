exports.up = (pgm) => {
  // Table des rôles
  pgm.sql(`
    CREATE TABLE role (
      id_role SERIAL PRIMARY KEY,
      name VARCHAR(20) NOT NULL,
      description VARCHAR(100),
      CONSTRAINT uk_role_name UNIQUE (name)
    );
    CREATE INDEX idx_role_name ON role(name);
  `);

  // Table des types de conteneur
  pgm.sql(`
    CREATE TABLE type_conteneur (
      id_type SERIAL PRIMARY KEY,
      name VARCHAR(30) NOT NULL,
      description VARCHAR(255),
      CONSTRAINT uk_type_conteneur_name UNIQUE (name)
    );
    CREATE INDEX idx_type_conteneur_name ON type_conteneur(name);
  `);

  // Table des types de signalement
  pgm.sql(`
    CREATE TABLE type_signalement (
      id_type SERIAL PRIMARY KEY,
      name VARCHAR(30) NOT NULL,
      description VARCHAR(255),
      CONSTRAINT uk_type_signalement_name UNIQUE (name)
    );
    CREATE INDEX idx_type_signalement_name ON type_signalement(name);
  `);

  // Table des badges
  pgm.sql(`
    CREATE TABLE badge (
      id_badge SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      seuil_points INTEGER NOT NULL DEFAULT 0,
      icon_url VARCHAR(255),
      CONSTRAINT uk_badge_name UNIQUE (name),
      CONSTRAINT ck_seuil_non_negatif CHECK (seuil_points >= 0)
    );
    CREATE INDEX idx_badge_name ON badge(name);
    CREATE INDEX idx_badge_seuil ON badge(seuil_points);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS badge CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS type_signalement CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS type_conteneur CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS role CASCADE`);
};
