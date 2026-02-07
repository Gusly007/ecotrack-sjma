exports.up = (pgm) => {
  // Table historique des points
  pgm.sql(`
    CREATE TABLE historique_points (
      id_historique INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      delta_points INT NOT NULL,
      raison VARCHAR(100) NOT NULL,
      date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_utilisateur INT NOT NULL,
      CONSTRAINT fk_historique_points_utilisateur FOREIGN KEY(id_utilisateur)
        REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      CONSTRAINT ck_delta_points_non_nul CHECK (delta_points <> 0)
    );
    CREATE INDEX idx_historique_points_utilisateur ON historique_points(id_utilisateur);
    CREATE INDEX idx_historique_points_date ON historique_points(date_creation DESC);
    CREATE INDEX idx_historique_points_delta ON historique_points(delta_points DESC);
    CREATE INDEX idx_historique_points_user_date ON historique_points(id_utilisateur, date_creation DESC);
  `);

  // Table des notifications
  pgm.sql(`
    CREATE TABLE notification (
      id_notification INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      type VARCHAR(30) NOT NULL,
      titre VARCHAR(100) NOT NULL,
      corps TEXT NOT NULL,
      est_lu BOOLEAN NOT NULL DEFAULT FALSE,
      date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_utilisateur INT NOT NULL,
      CONSTRAINT fk_notification_utilisateur FOREIGN KEY(id_utilisateur)
        REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      CONSTRAINT ck_type_notification CHECK (type IN ('ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME'))
    );
    CREATE INDEX idx_notification_utilisateur ON notification(id_utilisateur);
    CREATE INDEX idx_notification_lu ON notification(est_lu);
    CREATE INDEX idx_notification_date ON notification(date_creation DESC);
    CREATE INDEX idx_notification_type ON notification(type);
    CREATE INDEX idx_notification_user_lu_date ON notification(id_utilisateur, est_lu, date_creation DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS notification CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS historique_points CASCADE`);
};
