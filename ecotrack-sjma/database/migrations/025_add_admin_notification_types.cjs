exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE notification
      DROP CONSTRAINT IF EXISTS ck_type_notification,
      ADD CONSTRAINT ck_type_notification CHECK (type IN (
        'ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME',
        'ADMIN_ALERTE', 'ADMIN_SERVICE', 'ADMIN_SEUIL',
        'ADMIN_ML', 'ADMIN_SECURITE', 'ADMIN_PERFORMANCE', 'ADMIN_IOT'
      ));

    ALTER TABLE notification
      ADD COLUMN IF NOT EXISTS priorite INT DEFAULT 3,
      ADD COLUMN IF NOT EXISTS categorie VARCHAR(30);

    CREATE INDEX IF NOT EXISTS idx_notification_categorie ON notification(categorie);
    CREATE INDEX IF NOT EXISTS idx_notification_priorite ON notification(priorite);
    CREATE INDEX IF NOT EXISTS idx_notification_admin_unread
      ON notification(id_utilisateur, est_lu, priorite, date_creation DESC)
      WHERE type LIKE 'ADMIN_%';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_notification_admin_unread;
    DROP INDEX IF EXISTS idx_notification_priorite;
    DROP INDEX IF EXISTS idx_notification_categorie;

    ALTER TABLE notification
      DROP COLUMN IF EXISTS priorite,
      DROP COLUMN IF EXISTS categorie;

    ALTER TABLE notification
      DROP CONSTRAINT IF EXISTS ck_type_notification,
      ADD CONSTRAINT ck_type_notification CHECK (type IN (
        'ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME'
      ));
  `);
};
