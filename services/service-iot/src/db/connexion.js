/**
 * Connexion PostgreSQL via pg.
 * Utilise la configuration centralisée de config.js.
 */
const { Pool } = require('pg');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });
const logger = require('../utils/logger');
const config = require('../config/config');

const pool = new Pool({
  host: config.DB.host,
  port: config.DB.port,
  user: config.DB.user,
  password: config.DB.password !== undefined ? String(config.DB.password) : '',
  database: config.DB.database,
  max: config.DB.max,
  idleTimeoutMillis: config.DB.idleTimeoutMillis,
  connectionTimeoutMillis: config.DB.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  logger.error({ error: err }, 'Unexpected error on idle PostgreSQL client');
  process.exit(-1);
});

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
