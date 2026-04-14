import BaseRepository from './baseRepository.js';
import logger from '../middleware/logger.js';

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
        user_id INTEGER,
        request_id VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        duration_ms INTEGER,
        status_code INTEGER,
        error_details JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON centralized_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_logs_service ON centralized_logs(service);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON centralized_logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_action ON centralized_logs(action);
    `;
    
    try {
      await this.query(query);
      logger.info('Centralized logs table created/verified');
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to create logs table');
      throw err;
    }
  }

  async save(logData) {
    const {
      level, action, service, message, metadata,
      userId, requestId, ipAddress, userAgent,
      durationMs, statusCode, errorDetails
    } = logData;

    const query = `
      INSERT INTO centralized_logs 
      (level, action, service, message, metadata, user_id, request_id, ip_address, user_agent, duration_ms, status_code, error_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      level, action, service, message, metadata ? JSON.stringify(metadata) : null,
      userId, requestId, ipAddress, userAgent,
      durationMs, statusCode, errorDetails ? JSON.stringify(errorDetails) : null
    ];

    try {
      const result = await this.query(query, values);
      return result.rows[0];
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to save log');
      throw err;
    }
  }

  async getLogs(filters = {}) {
    const {
      service, level, action, startDate, endDate,
      search, userId,
      limit = 50, offset = 0
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (service && service !== 'all') {
      paramCount++;
      whereClause += ` AND service = $${paramCount}`;
      params.push(service);
    }

    if (level && level !== 'all') {
      paramCount++;
      whereClause += ` AND level = $${paramCount}`;
      params.push(level);
    }

    if (action && action !== 'all') {
      paramCount++;
      whereClause += ` AND action = $${paramCount}`;
      params.push(action);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (message ILIKE $${paramCount} OR action ILIKE $${paramCount} OR service ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (userId) {
      paramCount++;
      whereClause += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const query = `
      SELECT * FROM centralized_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    params.push(limit, offset);

    try {
      const result = await this.query(query, params);
      return result.rows;
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get logs');
      throw err;
    }
  }

  async getLogsCount(filters = {}) {
    const { service, level, action, startDate, endDate } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (service) {
      paramCount++;
      whereClause += ` AND service = $${paramCount}`;
      params.push(service);
    }

    if (level) {
      paramCount++;
      whereClause += ` AND level = $${paramCount}`;
      params.push(level);
    }

    if (action) {
      paramCount++;
      whereClause += ` AND action = $${paramCount}`;
      params.push(action);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    const query = `SELECT COUNT(*) FROM centralized_logs ${whereClause}`;

    try {
      const result = await this.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get logs count');
      throw err;
    }
  }

  async getStats(days = 7) {
    try {
      const [totalResult, todayResult, servicesResult] = await Promise.all([
        this.query(`SELECT COUNT(*) FROM centralized_logs WHERE timestamp >= NOW() - ($1::text || ' days')::interval`, [days]),
        this.query("SELECT COUNT(*) FROM centralized_logs WHERE timestamp >= NOW() - ($1 || ' days')::interval", [days]),
        this.query(`
          SELECT service, COUNT(*) as count 
          FROM centralized_logs 
          WHERE timestamp >= NOW() - ($1 || ' days')::interval
          GROUP BY service
          ORDER BY count DESC
        `, [days])
      ]);

      return {
        total: parseInt(totalResult.rows[0].count),
        last24h: parseInt(todayResult.rows[0].count),
        byService: servicesResult.rows
      };
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get log stats');
      throw err;
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
      WHERE timestamp >= NOW() - ($1 || ' days')::interval
    `;

    try {
      const result = await this.query(query, [days]);
      return result.rows[0];
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get logs summary');
      throw err;
    }
  }

  async deleteOldLogs(olderThanDays = 30) {
    const query = `
      DELETE FROM centralized_logs 
      WHERE timestamp < NOW() - ($1 || ' days')::interval
      RETURNING 1
    `;

    try {
      const result = await this.query(query, [olderThanDays]);
      const count = result.rowCount;
      logger.info(`Deleted ${count} old logs`);
      return count;
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to delete old logs');
      throw err;
    }
  }

  async getDistinctValues(column) {
    if (column === 'service') {
      const result = await this.query('SELECT DISTINCT service FROM centralized_logs ORDER BY service');
      return result.rows.map(row => row.service);
    }

    if (column === 'level') {
      const result = await this.query('SELECT DISTINCT level FROM centralized_logs ORDER BY level');
      return result.rows.map(row => row.level);
    }

    if (column === 'action') {
      const result = await this.query('SELECT DISTINCT action FROM centralized_logs ORDER BY action');
      return result.rows.map(row => row.action);
    }

    if (!['service', 'level', 'action'].includes(column)) {
      throw new Error(`Invalid column: ${column}`);
    }

    return [];
  }
}

export default new LogRepository();
