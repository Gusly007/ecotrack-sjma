const BaseRepository = require('./baseRepository');
const logger = require('../utils/logger');

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
      logger.info('Centralized logs table created for IoT');
    } catch (err) {
      logger.error('Failed to create logs table:', err.message);
    }
  }

  async save(data) {
    const {
      level = 'info',
      action = 'other',
      service = 'service-iot',
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

    try {
      const result = await this.query(query, values);
      return result.rows[0];
    } catch (err) {
      logger.error('Failed to save log:', err.message);
      throw err;
    }
  }

  async queryLogs(options = {}) {
    const { level, action, startDate, endDate, limit = 100, offset = 0, search, userId } = options;

    let query = 'SELECT * FROM centralized_logs WHERE service = $1';
    const params = ['service-iot'];
    let paramIndex = 2;

    if (level && level !== 'all') {
      query += ` AND level = $${paramIndex++}`;
      params.push(level);
    }

    if (action && action !== 'all') {
      query += ` AND action = $${paramIndex++}`;
      params.push(action);
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (search) {
      query += ` AND message ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    try {
      const result = await this.query(query, params);
      return result.rows;
    } catch (err) {
      logger.error('Failed to query logs:', err.message);
      return [];
    }
  }

  async getStats(days = 7) {
    const query = `
      SELECT level, action, COUNT(*) as count, MIN(timestamp) as first_seen, MAX(timestamp) as last_seen
      FROM centralized_logs
      WHERE service = 'service-iot' AND timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY level, action
      ORDER BY count DESC
    `;

    try {
      const result = await this.query(query);
      return result.rows;
    } catch (err) {
      logger.error('Failed to get log stats:', err.message);
      return [];
    }
  }

  async getSummary(days = 7) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE level = 'error') as error_count,
        COUNT(*) FILTER (WHERE level = 'warning') as warning_count,
        COUNT(*) FILTER (WHERE level = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE level = 'info') as info_count
      FROM centralized_logs
      WHERE service = 'service-iot' AND timestamp >= NOW() - INTERVAL '${days} days'
    `;

    try {
      const result = await this.query(query);
      return result.rows[0];
    } catch (err) {
      logger.error('Failed to get summary:', err.message);
      return {};
    }
  }

  async cleanup(retentionDays = 30) {
    const query = `DELETE FROM centralized_logs WHERE service = 'service-iot' AND timestamp < NOW() - INTERVAL '${retentionDays} days'`;
    try {
      const result = await this.query(query);
      logger.info(`Cleaned up ${result.rowCount} old logs`);
      return result.rowCount;
    } catch (err) {
      logger.error('Failed to cleanup logs:', err.message);
      return 0;
    }
  }
}

module.exports = new LogRepository();
