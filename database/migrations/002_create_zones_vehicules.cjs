exports.up = (pgm) => {
  // Extension PostGIS
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS postgis;`);

  // Table des zones
  pgm.sql(`
    CREATE TABLE zone (
      id_zone INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      code VARCHAR(10) NOT NULL,
      nom VARCHAR(100) NOT NULL,
      population INT,
      superficie_km2 DECIMAL(10,2),
      geom geometry(Polygon, 4326) NOT NULL,
      CONSTRAINT uk_zone_code UNIQUE(code),
      CONSTRAINT ck_population_positive CHECK (population >= 0),
      CONSTRAINT ck_superficie_positive CHECK (superficie_km2 > 0)
    );
    CREATE INDEX idx_zone_geom ON zone USING gist(geom);
    CREATE INDEX idx_zone_code ON zone(code);
  `);

  // Table des véhicules
  pgm.sql(`
    CREATE TABLE vehicule (
      id_vehicule INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      numero_immatriculation VARCHAR(10) NOT NULL,
      modele VARCHAR(50) NOT NULL,
      capacite_kg INT NOT NULL,
      CONSTRAINT uk_vehicule_immatriculation UNIQUE(numero_immatriculation),
      CONSTRAINT ck_capacite_positive CHECK (capacite_kg > 0)
    );
    CREATE INDEX idx_vehicule_immatriculation ON vehicule(numero_immatriculation);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS vehicule CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS zone CASCADE`);
};
