/**
 * Connexion PostgreSQL via pg.
 * Variables d'environnement dans .env (voir .env.example).
 */
const { Pool } = require('pg');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });
const logger = require('../utils/logger');

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
  logger.error({ error: err }, 'Unexpected error on idle PostgreSQL client');
  process.exit(-1);
});

// Fonction pour exécuter des requêtes SQL
async function query(text, params) {
  return pool.query(text, params);
}

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as now');
    logger.info({ time: res.rows[0].now }, 'Postgres connected');
    return true;
  } catch (err) {
    logger.error({ error: err }, 'Postgres connection error');
    return false;
  }
}

module.exports = {
  query,
  pool,
  testConnection,
};
module.exports.default = module.exports;