/**
 * service-containers/dbconnexion.js
 * Connexion à PostgreSQL via `pg`.
 * Configurez vos variables d'environnement dans `service-containers/.env` (voir `.env.example`).
 */
// Importer le module pg pour PostgreSQL ce qui inclut Pool per la gestion des connexions
const { Pool } = require('pg');
// Charger les variables d'environnement depuis le fichier .env (au dossier parent)
const path = require('path');
// Load .env from repository root (two levels above src/db)
const envPath = path.resolve(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });
console.log('Loaded env from', envPath);

const password = process.env.PGPASSWORD !== undefined ? String(process.env.PGPASSWORD) : '';
// Debug: show type and presence (do not print the raw password in logs in production)
console.log('PGPASSWORD raw type:', typeof process.env.PGPASSWORD, 'coerced type:', typeof password, 'present:', password.length > 0);
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password,
  database: process.env.PGDATABASE || 'ecotrack',
  max: 10,
  idleTimeoutMillis: 30000,
});
// Gérer les erreurs inattendues sur les clients inactifs
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Fonction pour exécuter des requêtes SQL
async function query(text, params) {
  return pool.query(text, params);
}

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as now');
    console.log('Postgres connected:', res.rows[0].now);
    return true;
  } catch (err) {
    console.error('Postgres connection error:', err);
    return false;
  }
}

module.exports = {
  query,
  pool,
  testConnection,
};
module.exports.default = module.exports;