import pg from 'pg';
import logger from '../middleware/logger.js';

const { Pool } = pg;

class CentralizedLoggingService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    const dbHost = process.env.DB_HOST || 'localhost';
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
      logger.info('Centralized logging DB connected');
      this.isConnected = true;
      
      await this.createTable();
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to connect centralized logging DB');
      this.isConnected = false;
    }
  }

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
      await this.pool.query(query);
      logger.info('Centralized logs table created');
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to create logs table');
    }
  }

  async log(data) {
    if (!this.isConnected || !this.pool) return false;

    const { 
      level = 'info', 
      action = 'other',
      service, 
      message, 
      metadata = {}, 
      userId = null,
      ipAddress = null,
      userAgent = null,
      traceId = null 
    } = data;

    try {
      const query = `
        INSERT INTO centralized_logs (level, action, service, message, metadata, user_id, ip_address, user_agent, trace_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      await this.pool.query(query, [
        level, action, service, message, 
        JSON.stringify(metadata), userId, ipAddress, userAgent, traceId
      ]);
      return true;
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to insert log');
      return false;
    }
  }

  // Query logs with advanced filters
  async queryLogs(options = {}) {
    const { 
      service, 
      level, 
      action,
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0,
      search,
      userId
    } = options;

    let query = 'SELECT * FROM centralized_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (service && service !== 'all') {
      query += ` AND service = $${paramIndex++}`;
      params.push(service);
    }

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
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to query logs');
      return [];
    }
  }

  // Get log stats by level, action, service
  async getStats(days = 7) {
    const query = `
      SELECT 
        service,
        level,
        action,
        COUNT(*) as count,
        MIN(timestamp) as first_seen,
        MAX(timestamp) as last_seen
      FROM centralized_logs
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY service, level, action
      ORDER BY service, count DESC
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get log stats');
      return [];
    }
  }

  // Get summary counts
  async getSummary(days = 7) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT service) as services_count,
        COUNT(DISTINCT user_id) as users_count,
        COUNT(*) FILTER (WHERE level = 'error') as error_count,
        COUNT(*) FILTER (WHERE level = 'warning') as warning_count,
        COUNT(*) FILTER (WHERE level = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE level = 'info') as info_count
      FROM centralized_logs
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get summary');
      return {};
    }
  }

  // Get unique values for filters
  async getFilterValues() {
    try {
      const [services, actions, levels] = await Promise.all([
        this.pool.query('SELECT DISTINCT service FROM centralized_logs ORDER BY service'),
        this.pool.query('SELECT DISTINCT action FROM centralized_logs ORDER BY action'),
        this.pool.query('SELECT DISTINCT level FROM centralized_logs ORDER BY level')
      ]);

      return {
        services: services.rows.map(r => r.service),
        actions: actions.rows.map(r => r.action),
        levels: levels.rows.map(r => r.level)
      };
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get filter values');
      return { services: [], actions: [], levels: [] };
    }
  }

  // Export logs to CSV or JSON
  async exportLogs(options = {}) {
    const logs = await this.queryLogs({ ...options, limit: 10000 });
    
    if (options.format === 'csv') {
      const headers = ['timestamp', 'level', 'action', 'service', 'message', 'user_id', 'ip_address'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.timestamp,
          log.level,
          log.action,
          log.service,
          `"${log.message.replace(/"/g, '""')}"`,
          log.user_id || '',
          log.ip_address || ''
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return logs;
  }

  // Cleanup old logs
  async cleanup(retentionDays = 30) {
    const query = `DELETE FROM centralized_logs WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'`;
    try {
      const result = await this.pool.query(query);
      logger.info({ deleted: result.rowCount }, 'Cleaned up old logs');
      return result.rowCount;
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to cleanup logs');
      return 0;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
    }
  }
}

export default new CentralizedLoggingService();
