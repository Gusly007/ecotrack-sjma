exports.up = (pgm) => {
  // Table des defis de gamification
  pgm.sql(`
    CREATE TABLE gamification_defi (
      id_defi INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      titre VARCHAR(100) NOT NULL,
      description TEXT,
      objectif INT NOT NULL,
      recompense_points INT NOT NULL DEFAULT 0,
      date_debut DATE NOT NULL,
      date_fin DATE NOT NULL,
      type_defi VARCHAR(30) NOT NULL DEFAULT 'INDIVIDUEL',
      CONSTRAINT ck_gamification_defi_objectif CHECK (objectif > 0),
      CONSTRAINT ck_gamification_defi_dates CHECK (date_fin >= date_debut)
    );
    CREATE INDEX idx_gamification_defi_dates ON gamification_defi(date_debut, date_fin);
    CREATE INDEX idx_gamification_defi_type ON gamification_defi(type_defi);
  `);

  // Table des participations aux defis
  pgm.sql(`
    CREATE TABLE gamification_participation_defi (
      id_participation INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      id_defi INT NOT NULL,
      id_utilisateur INT NOT NULL,
      progression INT NOT NULL DEFAULT 0,
      statut VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
      derniere_maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_gamification_participation_defi
        FOREIGN KEY (id_defi)
        REFERENCES gamification_defi(id_defi)
        ON DELETE CASCADE,
      CONSTRAINT fk_gamification_participation_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE,
      CONSTRAINT ck_gamification_participation_progression CHECK (progression >= 0)
    );
    CREATE INDEX idx_gamification_participation_defi ON gamification_participation_defi(id_defi, id_utilisateur);
    CREATE INDEX idx_gamification_participation_utilisateur ON gamification_participation_defi(id_utilisateur);
    CREATE INDEX idx_gamification_participation_statut ON gamification_participation_defi(statut);
  `);

  // Insertion des badges par defaut
  pgm.sql(`
    INSERT INTO badge (code, nom, description)
    VALUES
      ('DEBUTANT', 'Debutant', 'Premier palier de points atteint'),
      ('ECO_GUERRIER', 'Eco-Guerrier', 'Engagement regulier dans la communaute'),
      ('SUPER_HEROS', 'Super-Heros', 'Champion des bonnes pratiques')
    ON CONFLICT (code) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS gamification_participation_defi CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS gamification_defi CASCADE`);
};
