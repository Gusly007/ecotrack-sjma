exports.up = (pgm) => {
  // Table des conteneurs
  pgm.sql(`
    CREATE TABLE conteneur (
      id_conteneur INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      uid VARCHAR(20) NOT NULL,
      capacite_l INT NOT NULL,
      statut VARCHAR(20) NOT NULL,
      date_installation DATE NOT NULL,
      position geometry(Point, 4326) NOT NULL,
      id_zone INT,
      id_type INT,
      CONSTRAINT uk_conteneur_uid UNIQUE(uid),
      CONSTRAINT fk_conteneur_zone FOREIGN KEY(id_zone)
        REFERENCES zone(id_zone) ON DELETE SET NULL,
      CONSTRAINT fk_conteneur_type FOREIGN KEY(id_type)
        REFERENCES type_conteneur(id_type) ON DELETE SET NULL,
      CONSTRAINT ck_capacite_range CHECK (capacite_l BETWEEN 100 AND 5000),
      CONSTRAINT ck_statut_valide CHECK (statut IN ('ACTIF', 'INACTIF', 'EN_MAINTENANCE'))
    );
    CREATE INDEX idx_conteneur_position ON conteneur USING gist(position);
    CREATE INDEX idx_conteneur_zone ON conteneur(id_zone);
    CREATE INDEX idx_conteneur_type ON conteneur(id_type);
    CREATE INDEX idx_conteneur_statut ON conteneur(statut);
    CREATE INDEX idx_conteneur_date_installation ON conteneur(date_installation DESC);
    CREATE INDEX idx_conteneur_uid ON conteneur(uid);
  `);

  // Table des capteurs
  pgm.sql(`
    CREATE TABLE capteur (
      id_capteur INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      uid_capteur VARCHAR(30) NOT NULL,
      modele VARCHAR(30) NOT NULL,
      version_firmware VARCHAR(20),
      derniere_communication TIMESTAMP,
      id_conteneur INT NOT NULL,
      CONSTRAINT uk_capteur_uid UNIQUE(uid_capteur),
      CONSTRAINT uk_capteur_conteneur UNIQUE(id_conteneur),
      CONSTRAINT fk_capteur_conteneur FOREIGN KEY(id_conteneur)
        REFERENCES conteneur(id_conteneur) ON DELETE CASCADE
    );
    CREATE INDEX idx_capteur_conteneur ON capteur(id_conteneur);
    CREATE INDEX idx_capteur_derniere_com ON capteur(derniere_communication DESC);
    CREATE INDEX idx_capteur_uid ON capteur(uid_capteur);
  `);

  // Table des mesures
  pgm.sql(`
    CREATE TABLE mesure (
      id_mesure INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      niveau_remplissage_pct DECIMAL(5,2) NOT NULL,
      batterie_pct DECIMAL(5,2) NOT NULL,
      temperature DECIMAL(5,2),
      date_heure_mesure TIMESTAMP NOT NULL,
      id_capteur INT NOT NULL,
      id_conteneur INT NOT NULL,
      CONSTRAINT fk_mesure_capteur FOREIGN KEY(id_capteur)
        REFERENCES capteur(id_capteur) ON DELETE CASCADE,
      CONSTRAINT fk_mesure_conteneur FOREIGN KEY(id_conteneur)
        REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
      CONSTRAINT ck_remplissage_range CHECK (niveau_remplissage_pct BETWEEN 0 AND 100),
      CONSTRAINT ck_batterie_range CHECK (batterie_pct BETWEEN 0 AND 100)
    );
    CREATE INDEX idx_mesure_date ON mesure(date_heure_mesure DESC);
    CREATE INDEX idx_mesure_capteur ON mesure(id_capteur);
    CREATE INDEX idx_mesure_conteneur ON mesure(id_conteneur);
    CREATE INDEX idx_mesure_remplissage ON mesure(niveau_remplissage_pct);
    CREATE INDEX idx_mesure_conteneur_date ON mesure(id_conteneur, date_heure_mesure DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS mesure CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS capteur CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS conteneur CASCADE`);
};
