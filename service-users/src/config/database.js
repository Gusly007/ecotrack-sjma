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

export default pool;
