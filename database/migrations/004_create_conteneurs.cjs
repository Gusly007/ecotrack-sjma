exports.up = (pgm) => {
  // Table des conteneurs
  pgm.sql(`
    CREATE TABLE conteneur (
      id_conteneur SERIAL PRIMARY KEY,
      code_unique VARCHAR(20) NOT NULL,
      capacite_litres INTEGER NOT NULL,
      latitude NUMERIC(10,8) NOT NULL,
      longitude NUMERIC(11,8) NOT NULL,
      adresse VARCHAR(255),
      niveau_remplissage INTEGER NOT NULL DEFAULT 0,
      statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
      date_installation DATE NOT NULL DEFAULT CURRENT_DATE,
      derniere_collecte TIMESTAMP,
      id_type INTEGER NOT NULL,
      id_zone INTEGER,
      CONSTRAINT uk_conteneur_code UNIQUE (code_unique),
      CONSTRAINT fk_conteneur_type FOREIGN KEY (id_type) REFERENCES type_conteneur(id_type) ON DELETE CASCADE,
      CONSTRAINT fk_conteneur_zone FOREIGN KEY (id_zone) REFERENCES zone(id_zone) ON DELETE SET NULL,
      CONSTRAINT ck_capacite_positive CHECK (capacite_litres > 0),
      CONSTRAINT ck_niveau_remplissage CHECK (niveau_remplissage >= 0 AND niveau_remplissage <= 100),
      CONSTRAINT ck_statut_conteneur CHECK (statut IN ('ACTIF', 'INACTIF', 'MAINTENANCE', 'HORS_SERVICE'))
    );
    CREATE INDEX idx_conteneur_code ON conteneur(code_unique);
    CREATE INDEX idx_conteneur_type ON conteneur(id_type);
    CREATE INDEX idx_conteneur_zone ON conteneur(id_zone);
    CREATE INDEX idx_conteneur_statut ON conteneur(statut);
    CREATE INDEX idx_conteneur_niveau ON conteneur(niveau_remplissage DESC);
    CREATE INDEX idx_conteneur_localisation ON conteneur(latitude, longitude);
  `);

  // Table des mesures IoT
  pgm.sql(`
    CREATE TABLE mesure_capteur (
      id_mesure SERIAL PRIMARY KEY,
      niveau_remplissage INTEGER NOT NULL,
      temperature NUMERIC(5,2),
      batterie_pct INTEGER,
      date_mesure TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_conteneur INTEGER NOT NULL,
      CONSTRAINT fk_mesure_capteur_conteneur FOREIGN KEY (id_conteneur) REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
      CONSTRAINT ck_niveau_mesure CHECK (niveau_remplissage >= 0 AND niveau_remplissage <= 100),
      CONSTRAINT ck_batterie_mesure CHECK (batterie_pct >= 0 AND batterie_pct <= 100)
    );
    CREATE INDEX idx_mesure_capteur_conteneur ON mesure_capteur(id_conteneur);
    CREATE INDEX idx_mesure_capteur_date ON mesure_capteur(date_mesure DESC);
    CREATE INDEX idx_mesure_capteur_niveau ON mesure_capteur(niveau_remplissage);
    CREATE INDEX idx_mesure_capteur_conteneur_date ON mesure_capteur(id_conteneur, date_mesure DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS mesure_capteur CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS conteneur CASCADE`);
};
