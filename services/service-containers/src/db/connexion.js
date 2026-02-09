/**
 * Connexion PostgreSQL via pg.
 * Variables d'environnement dans .env (voir .env.example).
 */
const { Pool } = require('pg');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });

const password = process.env.PGPASSWORD !== undefined ? String(process.env.PGPASSWORD) : '';
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