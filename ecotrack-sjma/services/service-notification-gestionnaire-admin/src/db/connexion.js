'use strict';

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const logger = require('../utils/logger');

const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT) || 5432,
  user:     process.env.PGUSER     || 'postgres',
  password: process.env.PGPASSWORD !== undefined ? String(process.env.PGPASSWORD) : '',
  database: process.env.PGDATABASE || 'ecotrack',
  max: 10,
  idleTimeoutMillis: 30000,
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
    logger.info({ time: res.rows[0].now }, 'PostgreSQL connecté');
    return true;
  } catch (err) {
    logger.error({ error: err }, 'Erreur de connexion PostgreSQL');
    return false;
  }
}

module.exports = { pool, query, testConnection };
