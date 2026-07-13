import pg from 'pg';
import logger from '../middleware/logger.js';

const { Pool } = pg;

class BaseRepository {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.pool) return;

    const connectionString = process.env.DATABASE_URL;

    const poolConfig = connectionString
      ? {
          connectionString,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          max: 10,
          idleTimeoutMillis: 30000
        }
      : {
          host: process.env.DB_HOST || 'ecotrack-postgres',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'ecotrack',
          user: process.env.DB_USER || 'ecotrack_user',
          password: process.env.DB_PASSWORD || 'ecotrack_password',
          max: 10,
          idleTimeoutMillis: 30000
        };

    this.pool = new Pool(poolConfig);

    try {
      await this.pool.query('SELECT 1');
      logger.info(`${this.constructor.name} DB connected`);
      this.isConnected = true;
    } catch (err) {
      logger.error({ err: err.message }, `Failed to connect ${this.constructor.name} DB`);
      this.isConnected = false;
      throw err;
    }
  }

  async query(sql, params) {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.pool.query(sql, params);
  }

  async getClient() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.pool.connect();
  }
}

export default BaseRepository;
