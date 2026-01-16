exports.up = (pgm) => {
  // Table des zones
  pgm.sql(`
    CREATE TABLE zone (
      id_zone SERIAL PRIMARY KEY,
      nom VARCHAR(100) NOT NULL,
      code_postal VARCHAR(10) NOT NULL,
      geometrie GEOMETRY(Polygon, 4326),
      CONSTRAINT uk_zone_nom UNIQUE (nom)
    );
    CREATE INDEX idx_zone_nom ON zone(nom);
    CREATE INDEX idx_zone_code_postal ON zone(code_postal);
    CREATE INDEX idx_zone_geometrie ON zone USING GIST(geometrie);
  `);

  // Table des véhicules
  pgm.sql(`
    CREATE TABLE vehicule (
      id_vehicule SERIAL PRIMARY KEY,
      immatriculation VARCHAR(15) NOT NULL,
      capacite_kg NUMERIC(10,2) NOT NULL,
      type_carburant VARCHAR(20) NOT NULL DEFAULT 'DIESEL',
      statut VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
      date_derniere_maintenance DATE,
      CONSTRAINT uk_vehicule_immat UNIQUE (immatriculation),
      CONSTRAINT ck_capacite_positive CHECK (capacite_kg > 0),
      CONSTRAINT ck_type_carburant CHECK (type_carburant IN ('DIESEL', 'ESSENCE', 'ELECTRIQUE', 'HYBRIDE')),
      CONSTRAINT ck_statut_vehicule CHECK (statut IN ('DISPONIBLE', 'EN_SERVICE', 'EN_MAINTENANCE', 'HORS_SERVICE'))
    );
    CREATE INDEX idx_vehicule_immat ON vehicule(immatriculation);
    CREATE INDEX idx_vehicule_statut ON vehicule(statut);
    CREATE INDEX idx_vehicule_type ON vehicule(type_carburant);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS vehicule CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS zone CASCADE`);
};
