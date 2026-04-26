import BaseRepository from './baseRepository.js';
import logger from '../utils/logger.js';

class LogRepository extends BaseRepository {
  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS centralized_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        level VARCHAR(20) NOT NULL,
        action VARCHAR(50) NOT NULL,
        service VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        user_id VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        trace_id VARCHAR(50)
      );
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON centralized_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_logs_service ON centralized_logs(service);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON centralized_logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_action ON centralized_logs(action);
      CREATE INDEX IF NOT EXISTS idx_logs_metadata ON centralized_logs USING GIN(metadata);
      CREATE INDEX IF NOT EXISTS idx_logs_user_id ON centralized_logs(user_id);
    `;
    try {
      await this.query(query);
      logger.info('Centralized logs table created');
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to create logs table');
    }
  }

  async save(data) {
    const {
      level = 'info',
      action = 'other',
      service = 'service-gamifications',
      message,
      metadata = {},
      userId = null,
      ipAddress = null,
      userAgent = null,
      traceId = null
    } = data;

    const query = `
      INSERT INTO centralized_logs (level, action, service, message, metadata, user_id, ip_address, user_agent, trace_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [level, action, service, message, JSON.stringify(metadata), userId, ipAddress, userAgent, traceId];
    const result = await this.query(query, values);
    return result.rows[0];
  }
}

export default new LogRepository();
