const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'ecotrack_user'}:${process.env.DB_PASSWORD || 'ecotrack_password'}@${process.env.DB_HOST || 'postgres'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ecotrack'}`,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error');
});

pool.on('connect', () => {
  logger.info('Database connected');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
