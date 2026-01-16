exports.up = (pgm) => {
  // Table des tournées
  pgm.sql(`
    CREATE TABLE tournee (
      id_tournee SERIAL PRIMARY KEY,
      code VARCHAR(20) NOT NULL,
      date_tournee DATE NOT NULL,
      statut VARCHAR(20) NOT NULL DEFAULT 'PLANIFIEE',
      distance_prevue_km NUMERIC(10,2),
      duree_prevue_min INTEGER,
      duree_reelle_min INTEGER,
      distance_reelle_km NUMERIC(10,2),
      id_vehicule INTEGER,
      id_zone INTEGER,
      id_agent INTEGER,
      CONSTRAINT uk_tournee_code UNIQUE (code),
      CONSTRAINT fk_tournee_vehicule FOREIGN KEY (id_vehicule) REFERENCES vehicule(id_vehicule) ON DELETE SET NULL,
      CONSTRAINT fk_tournee_zone FOREIGN KEY (id_zone) REFERENCES zone(id_zone) ON DELETE CASCADE,
      CONSTRAINT fk_tournee_agent FOREIGN KEY (id_agent) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
      CONSTRAINT ck_statut_tournee CHECK (statut IN ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'))
    );
    CREATE INDEX idx_tournee_date ON tournee(date_tournee DESC);
    CREATE INDEX idx_tournee_statut ON tournee(statut);
    CREATE INDEX idx_tournee_agent ON tournee(id_agent);
    CREATE INDEX idx_tournee_zone ON tournee(id_zone);
    CREATE INDEX idx_tournee_vehicule ON tournee(id_vehicule);
    CREATE INDEX idx_tournee_code ON tournee(code);
    CREATE INDEX idx_tournee_date_statut ON tournee(date_tournee, statut);
  `);

  // Table des étapes de tournée
  pgm.sql(`
    CREATE TABLE etape_tournee (
      id_etape SERIAL PRIMARY KEY,
      sequence INTEGER NOT NULL,
      heure_estimee TIME,
      collectee BOOLEAN NOT NULL DEFAULT FALSE,
      id_tournee INTEGER NOT NULL,
      id_conteneur INTEGER NOT NULL,
      CONSTRAINT fk_etape_tournee_tournee FOREIGN KEY (id_tournee) REFERENCES tournee(id_tournee) ON DELETE CASCADE,
      CONSTRAINT fk_etape_tournee_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
      CONSTRAINT ck_sequence_positive CHECK (sequence > 0),
      CONSTRAINT uk_etape_tournee UNIQUE (id_tournee, sequence)
    );
    CREATE INDEX idx_etape_tournee_tournee ON etape_tournee(id_tournee);
    CREATE INDEX idx_etape_tournee_conteneur ON etape_tournee(id_conteneur);
    CREATE INDEX idx_etape_tournee_sequence ON etape_tournee(sequence);
    CREATE INDEX idx_etape_tournee_collectee ON etape_tournee(collectee);
    CREATE INDEX idx_etape_tournee_ordre ON etape_tournee(id_tournee, sequence);
  `);

  // Table des collectes
  pgm.sql(`
    CREATE TABLE collecte (
      id_collecte SERIAL PRIMARY KEY,
      date_heure_collecte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      quantite_kg NUMERIC(10,2) NOT NULL,
      id_tournee INTEGER NOT NULL,
      id_conteneur INTEGER NOT NULL,
      CONSTRAINT fk_collecte_tournee FOREIGN KEY (id_tournee) REFERENCES tournee(id_tournee) ON DELETE CASCADE,
      CONSTRAINT fk_collecte_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
      CONSTRAINT ck_quantite_positive CHECK (quantite_kg > 0)
    );
    CREATE INDEX idx_collecte_date ON collecte(date_heure_collecte DESC);
    CREATE INDEX idx_collecte_tournee ON collecte(id_tournee);
    CREATE INDEX idx_collecte_conteneur ON collecte(id_conteneur);
    CREATE INDEX idx_collecte_quantite ON collecte(quantite_kg);
    CREATE INDEX idx_collecte_conteneur_date ON collecte(id_conteneur, date_heure_collecte DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS collecte CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS etape_tournee CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS tournee CASCADE`);
};
