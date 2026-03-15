const { Pool } = require('pg');
const config = require('../config/config');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
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

module.exports = { query, pool, testConnection };
