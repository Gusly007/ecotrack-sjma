// Rôle du fichier : accès PostgreSQL + création du schéma minimal de gamification.
import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL');
});

export const ensureGamificationTables = async () => {
  // Tables de base : utilisateurs + points pour le service de gamification.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS utilisateur (
      id_utilisateur SERIAL PRIMARY KEY,
      points INT NOT NULL DEFAULT 0
    )`
  );

  // Catalogue des badges disponibles.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS badge (
      id_badge SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      nom VARCHAR(100) NOT NULL,
      description TEXT
    )`
  );

  // Lien utilisateur <-> badge (historique d'obtention).
  await pool.query(
    `CREATE TABLE IF NOT EXISTS user_badge (
      id_utilisateur INT NOT NULL,
      id_badge INT NOT NULL,
      date_obtention TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_utilisateur, id_badge),
      CONSTRAINT fk_user_badge_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE,
      CONSTRAINT fk_user_badge_badge
        FOREIGN KEY (id_badge)
        REFERENCES badge(id_badge)
        ON DELETE CASCADE
    )`
  );

  // Historique des points pour les stats.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS historique_points (
      id_historique SERIAL PRIMARY KEY,
      id_utilisateur INT NOT NULL,
      delta_points INT NOT NULL,
      raison VARCHAR(100),
      date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_historique_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
    )`
  );

  // Notifications internes de gamification.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS notification (
      id_notification SERIAL PRIMARY KEY,
      id_utilisateur INT NOT NULL,
      type VARCHAR(30) NOT NULL,
      titre VARCHAR(150) NOT NULL,
      corps TEXT NOT NULL,
      date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notification_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
    )`
  );

  // Défis : structure minimale pour les routes /defis.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS gamification_defi (
      id_defi SERIAL PRIMARY KEY,
      titre VARCHAR(100) NOT NULL,
      description TEXT,
      objectif INT NOT NULL,
      recompense_points INT NOT NULL DEFAULT 0,
      date_debut DATE NOT NULL,
      date_fin DATE NOT NULL,
      type_defi VARCHAR(30) NOT NULL DEFAULT 'INDIVIDUEL',
      CONSTRAINT ck_gamification_defi_objectif CHECK (objectif > 0),
      CONSTRAINT ck_gamification_defi_dates CHECK (date_fin >= date_debut)
    )`
  );

  // Participation aux défis, avec suivi de progression.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS gamification_participation_defi (
      id_participation SERIAL PRIMARY KEY,
      id_defi INT NOT NULL,
      id_utilisateur INT NOT NULL,
      progression INT NOT NULL DEFAULT 0,
      statut VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
      derniere_maj TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_gamification_participation_defi
        FOREIGN KEY (id_defi)
        REFERENCES gamification_defi(id_defi)
        ON DELETE CASCADE,
      CONSTRAINT fk_gamification_participation_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE,
      CONSTRAINT ck_gamification_participation_progression CHECK (progression >= 0)
    )`
  );

  // Index pour accélérer la recherche sur les participations.
  await pool.query('CREATE INDEX IF NOT EXISTS idx_gamification_participation_defi ON gamification_participation_defi(id_defi, id_utilisateur)');

  // Seed minimal des badges de base.
  await pool.query(
    `INSERT INTO badge (code, nom, description)
     VALUES
      ('DEBUTANT', 'Débutant', 'Premier palier de points atteint'),
      ('ECO_GUERRIER', 'Éco-Guerrier', 'Engagement régulier dans la communauté'),
      ('SUPER_HEROS', 'Super-Héros', 'Champion des bonnes pratiques')
     ON CONFLICT (code) DO NOTHING`
  );
};

export const initGamificationDb = async () => {
  await ensureGamificationTables();
};

export default pool;
