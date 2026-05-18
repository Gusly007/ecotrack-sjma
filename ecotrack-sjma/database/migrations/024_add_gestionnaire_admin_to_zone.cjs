exports.up = (pgm) => {
  // Ajout des colonnes FK sur la table zone
  pgm.sql(`
    ALTER TABLE zone ADD COLUMN IF NOT EXISTS id_gestionnaire INTEGER;
    ALTER TABLE zone ADD COLUMN IF NOT EXISTS id_admin INTEGER;
  `);

  // Clé étrangère : id_gestionnaire -> utilisateur(id_utilisateur)
  pgm.sql(`ALTER TABLE zone DROP CONSTRAINT IF EXISTS fk_zone_gestionnaire;`);
  pgm.sql(`
    ALTER TABLE zone ADD CONSTRAINT fk_zone_gestionnaire
      FOREIGN KEY (id_gestionnaire)
      REFERENCES utilisateur(id_utilisateur)
      ON DELETE SET NULL;
  `);

  // Clé étrangère : id_admin -> utilisateur(id_utilisateur)
  pgm.sql(`ALTER TABLE zone DROP CONSTRAINT IF EXISTS fk_zone_admin;`);
  pgm.sql(`
    ALTER TABLE zone ADD CONSTRAINT fk_zone_admin
      FOREIGN KEY (id_admin)
      REFERENCES utilisateur(id_utilisateur)
      ON DELETE SET NULL;
  `);

  // Index pour les jointures
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_zone_id_gestionnaire ON zone(id_gestionnaire);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_zone_id_admin ON zone(id_admin);`);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_zone_id_admin;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_zone_id_gestionnaire;`);
  pgm.sql(`ALTER TABLE zone DROP CONSTRAINT IF EXISTS fk_zone_admin;`);
  pgm.sql(`ALTER TABLE zone DROP CONSTRAINT IF EXISTS fk_zone_gestionnaire;`);
  pgm.sql(`ALTER TABLE zone DROP COLUMN IF EXISTS id_admin;`);
  pgm.sql(`ALTER TABLE zone DROP COLUMN IF EXISTS id_gestionnaire;`);
};
