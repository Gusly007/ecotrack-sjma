exports.up = (pgm) => {
  // ===========================================================================
  // OPTIMISATION DES INDEX POUR PERFORMANCE
  // Cible: table mesure (time-series), notification, collecte, tournee, conteneur
  // ===========================================================================

  // 1. Index composite pour requetes temps-reel par capteur sur mesure
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_mesure_capteur_date
    ON mesure(id_capteur, date_heure_mesure DESC);
  `);

  // 2. Index BRIN pour partition temporelle sur mesure (optimise time-series)
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_mesure_date_brin
    ON mesure USING BRIN(date_heure_mesure)
    WITH (pages_per_range = 128);
  `);

  // 3. Index BRIN sur notification
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_notification_date_brin
    ON notification USING BRIN(date_creation)
    WITH (pages_per_range = 32);
  `);

  // 4. Index BRIN sur collecte
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_collecte_date_brin
    ON collecte USING BRIN(date_heure_collecte)
    WITH (pages_per_range = 64);
  `);

  // 5. Index composite agent + date pour tournee
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_tournee_agent_date
    ON tournee(id_agent, date_tournee DESC);
  `);

  // 6. Index composite zone + statut pour conteneur
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_conteneur_zone_statut
    ON conteneur(id_zone, statut);
  `);

  // 7. Index partiel: conteneurs actifs seulement
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_conteneur_actif
    ON conteneur(id_zone)
    WHERE statut = 'ACTIF';
  `);

  // 8. Index partiel: notifications non lues
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_notification_non_lu
    ON notification(id_utilisateur, date_creation DESC)
    WHERE est_lu = FALSE;
  `);

  // 9. Index composite pour mesures recentes par conteneur (descente)
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_mesure_conteneur_date_desc
    ON mesure(id_conteneur, date_heure_mesure DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_mesure_capteur_date`);
  pgm.sql(`DROP INDEX IF EXISTS idx_mesure_date_brin`);
  pgm.sql(`DROP INDEX IF EXISTS idx_notification_date_brin`);
  pgm.sql(`DROP INDEX IF EXISTS idx_collecte_date_brin`);
  pgm.sql(`DROP INDEX IF EXISTS idx_tournee_agent_date`);
  pgm.sql(`DROP INDEX IF EXISTS idx_conteneur_zone_statut`);
  pgm.sql(`DROP INDEX IF EXISTS idx_conteneur_actif`);
  pgm.sql(`DROP INDEX IF EXISTS idx_notification_non_lu`);
  pgm.sql(`DROP INDEX IF EXISTS idx_mesure_conteneur_date_desc`);
};
