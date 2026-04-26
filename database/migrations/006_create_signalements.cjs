exports.up = (pgm) => {
  // Table des signalements
  pgm.sql(`
    CREATE TABLE signalement (
      id_signalement INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      description VARCHAR(1000) NOT NULL,
      url_photo VARCHAR(255),
      statut VARCHAR(20) NOT NULL DEFAULT 'OUVERT',
      date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_type INT NOT NULL,
      id_conteneur INT NOT NULL,
      id_citoyen INT NOT NULL,
      CONSTRAINT fk_signalement_type FOREIGN KEY(id_type)
        REFERENCES type_signalement(id_type) ON DELETE CASCADE,
      CONSTRAINT fk_signalement_conteneur FOREIGN KEY(id_conteneur)
        REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
      CONSTRAINT fk_signalement_citoyen FOREIGN KEY(id_citoyen)
        REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      CONSTRAINT ck_statut_signalement CHECK (statut IN ('OUVERT', 'EN_COURS', 'RESOLU', 'FERME'))
    );
    CREATE INDEX idx_signalement_statut ON signalement(statut);
    CREATE INDEX idx_signalement_date ON signalement(date_creation DESC);
    CREATE INDEX idx_signalement_conteneur ON signalement(id_conteneur);
    CREATE INDEX idx_signalement_citoyen ON signalement(id_citoyen);
    CREATE INDEX idx_signalement_type ON signalement(id_type);
    CREATE INDEX idx_signalement_statut_date ON signalement(statut, date_creation DESC);
  `);

  // Table des traitements de signalement
  pgm.sql(`
    CREATE TABLE traitement_signalement (
      id_traitement INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      date_traitement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      commentaire VARCHAR(500),
      id_signalement INT NOT NULL,
      id_agent INT NOT NULL,
      CONSTRAINT fk_traitement_signalement_signalement FOREIGN KEY(id_signalement)
        REFERENCES signalement(id_signalement) ON DELETE CASCADE,
      CONSTRAINT fk_traitement_signalement_agent FOREIGN KEY(id_agent)
        REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      CONSTRAINT uk_traitement_signalement UNIQUE(id_signalement)
    );
    CREATE INDEX idx_traitement_signalement_date ON traitement_signalement(date_traitement DESC);
    CREATE INDEX idx_traitement_signalement_agent ON traitement_signalement(id_agent);
    CREATE INDEX idx_traitement_signalement_signalement ON traitement_signalement(id_signalement);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS traitement_signalement CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS signalement CASCADE`);
};
