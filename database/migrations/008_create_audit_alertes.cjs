exports.up = (pgm) => {
  // Table historique des statuts
  pgm.sql(`
    CREATE TABLE historique_statut (
      id_historique INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      type_entite VARCHAR(30) NOT NULL,
      ancien_statut VARCHAR(20),
      nouveau_statut VARCHAR(20) NOT NULL,
      date_changement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_entite INT NOT NULL,
      CONSTRAINT ck_type_entite_valide CHECK (type_entite IN ('CONTENEUR', 'TOURNEE', 'SIGNALEMENT'))
    );
    CREATE INDEX idx_historique_statut_entite ON historique_statut(type_entite, id_entite);
    CREATE INDEX idx_historique_statut_date ON historique_statut(date_changement DESC);
    CREATE INDEX idx_historique_statut_nouveau ON historique_statut(nouveau_statut);
  `);

  // Table journal d'audit
  pgm.sql(`
    CREATE TABLE journal_audit (
      id_audit INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      id_acteur INT,
      action VARCHAR(100) NOT NULL,
      type_entite VARCHAR(30) NOT NULL,
      id_entite INT,
      date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_journal_audit_acteur FOREIGN KEY(id_acteur)
        REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
    );
    CREATE INDEX idx_journal_audit_acteur ON journal_audit(id_acteur);
    CREATE INDEX idx_journal_audit_date ON journal_audit(date_creation DESC);
    CREATE INDEX idx_journal_audit_entite ON journal_audit(type_entite, id_entite);
    CREATE INDEX idx_journal_audit_action ON journal_audit(action);
    CREATE INDEX idx_journal_audit_acteur_date ON journal_audit(id_acteur, date_creation DESC);
  `);

  // Table des alertes capteur
  pgm.sql(`
    CREATE TABLE alerte_capteur (
      id_alerte INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      type_alerte VARCHAR(30) NOT NULL,
      valeur_detectee DECIMAL(8,2) NOT NULL,
      seuil DECIMAL(8,2) NOT NULL,
      statut VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      date_traitement TIMESTAMP,
      description VARCHAR(1000),
      id_conteneur INT NOT NULL,
      CONSTRAINT fk_alerte_capteur_conteneur FOREIGN KEY(id_conteneur)
        REFERENCES conteneur(id_conteneur) ON DELETE CASCADE,
      CONSTRAINT ck_type_alerte_valide CHECK (type_alerte IN ('DEBORDEMENT', 'BATTERIE_FAIBLE', 'CAPTEUR_DEFAILLANT')),
      CONSTRAINT ck_statut_alerte CHECK (statut IN ('ACTIVE', 'RESOLUE', 'IGNOREE')),
      CONSTRAINT ck_valeur_seuil CHECK (valeur_detectee >= seuil)
    );
    CREATE INDEX idx_alerte_capteur_statut ON alerte_capteur(statut);
    CREATE INDEX idx_alerte_capteur_date ON alerte_capteur(date_creation DESC);
    CREATE INDEX idx_alerte_capteur_conteneur ON alerte_capteur(id_conteneur);
    CREATE INDEX idx_alerte_capteur_type ON alerte_capteur(type_alerte);
    CREATE INDEX idx_alerte_capteur_statut_date ON alerte_capteur(statut, date_creation DESC);
    CREATE INDEX idx_alerte_capteur_conteneur_statut ON alerte_capteur(id_conteneur, statut, date_creation DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS alerte_capteur CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS journal_audit CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS historique_statut CASCADE`);
};
