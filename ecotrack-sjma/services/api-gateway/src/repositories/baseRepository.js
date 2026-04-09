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

    const dbHost = process.env.DB_HOST || 'ecotrack-postgres';
    const dbPort = process.env.DB_PORT || 5432;
    const dbName = process.env.DB_NAME || 'ecotrack';
    const dbUser = process.env.DB_USER || 'ecotrack_user';
    const dbPassword = process.env.DB_PASSWORD || 'ecotrack_password';

    this.pool = new Pool({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      max: 10,
      idleTimeoutMillis: 30000
    });

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
