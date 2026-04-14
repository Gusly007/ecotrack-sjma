/**
 * Configuration pour node-pg-migrate
 *
 * Documentation: https://salsita.github.io/node-pg-migrate
 */

const path = require('path');

// Charger dotenv si le fichier existe, sinon utiliser les variables d'environnement
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch (e) {
  console.log('ℹ️  .env file not found, using environment variables instead');
}

// Vérifier que DATABASE_URL est disponible
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  WARNING: DATABASE_URL not set, using default credentials');
}

module.exports = {
  // Connexion à la base de données
  databaseUrl: process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'ecotrack_user'}:${process.env.DB_PASSWORD || 'ecotrack_password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'ecotrack'}`,

  // Dossier contenant les migrations
  dir: path.resolve(__dirname, 'migrations'),

  // Table pour suivre les migrations appliquées
  migrationsTable: 'pgmigrations',

  // Schema de la table de migrations
  migrationsSchema: 'public',

  // Schema pour les nouvelles tables
  schema: 'public',

  // Direction par défaut (up)
  direction: 'up',

  // Nombre de migrations à exécuter (0 = toutes)
  count: 0,

  // Afficher les requêtes SQL
  verbose: true,

  // Déclencher une erreur si une migration échoue
  singleTransaction: true,

  // Vérifier l'ordre des migrations (DÉSACTIVÉ pour .sql files)
  checkOrder: false,

  // Extension des fichiers de migration
  'migration-file-language': 'cjs',
};
