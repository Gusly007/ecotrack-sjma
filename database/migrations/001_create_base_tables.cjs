exports.up = (pgm) => {
  // Table des rôles
  pgm.sql(`
    CREATE TABLE role (
      id_role INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name VARCHAR(20) NOT NULL,
      description VARCHAR(255),
      CONSTRAINT uk_role_name UNIQUE(name),
      CONSTRAINT ck_role_name_length CHECK (char_length(name) >= 2)
    );
    CREATE INDEX idx_role_name ON role(name);
  `);

  // Table des types de signalement
  pgm.sql(`
    CREATE TABLE type_signalement (
      id_type INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      libelle VARCHAR(30) NOT NULL,
      priorite VARCHAR(10) NOT NULL,
      sla_heures INT NOT NULL,
      CONSTRAINT uk_type_signalement_libelle UNIQUE(libelle),
      CONSTRAINT ck_priorite_values CHECK (priorite IN ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE'))
    );
    CREATE INDEX idx_type_signalement_priorite ON type_signalement(priorite);
  `);

  // Table maintenance
  pgm.sql(`
    CREATE TABLE maintenance (
      id_maintenance INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      type_maintenance VARCHAR(30) NOT NULL,
      statut VARCHAR(20) NOT NULL,
      date_planifiee TIMESTAMP NOT NULL,
      date_realisation TIMESTAMP,
      CONSTRAINT ck_maintenance_statut CHECK (statut IN ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'))
    );
    CREATE INDEX idx_maintenance_date_statut ON maintenance(date_planifiee, statut);
  `);

  // Table des badges
  pgm.sql(`
    CREATE TABLE badge (
      id_badge INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      code VARCHAR(20) NOT NULL,
      nom VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      CONSTRAINT uk_badge_code UNIQUE(code),
      CONSTRAINT ck_code_length CHECK (char_length(code) >= 3)
    );
  `);

  // Table des types de conteneur
  pgm.sql(`
    CREATE TABLE type_conteneur (
      id_type INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      code VARCHAR(10) NOT NULL,
      nom VARCHAR(30) NOT NULL,
      CONSTRAINT uk_type_conteneur_code UNIQUE(code),
      CONSTRAINT ck_type_conteneur_nom CHECK (nom IN ('ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'))
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS type_conteneur CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS badge CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS maintenance CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS type_signalement CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS role CASCADE`);
};
