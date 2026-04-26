import BaseRepository from './baseRepository.js';
import logger from '../middleware/logger.js';

class DatabaseRepository extends BaseRepository {
  async getDatabaseSize() {
    try {
      const result = await this.query(`
        SELECT 
          pg_database_size(current_database()) as used_bytes,
          pg_size_pretty(pg_database_size(current_database())) as used_pretty
      `);
      
      const usedBytes = parseInt(result.rows[0].used_bytes);
      const usedPretty = result.rows[0].used_pretty;
      
      const totalBytes = 50 * 1024 * 1024 * 1024;
      const percentage = Math.max(0.1, Math.round((usedBytes / totalBytes) * 100 * 10) / 10);
      
      return {
        usedBytes,
        usedPretty,
        totalBytes,
        percentage
      };
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get database size');
      return {
        usedBytes: 0,
        usedPretty: '0 MB',
        totalBytes: 50 * 1024 * 1024 * 1024,
        percentage: 0
      };
    }
  }

  async getTableSizes() {
    try {
      const result = await this.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);
      return result.rows;
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get table sizes');
      return [];
    }
  }

  async getConnectionStats() {
    try {
      const result = await this.query(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      return {
        activeConnections: parseInt(result.rows[0].active_connections)
      };
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get connection stats');
      return { activeConnections: 0 };
    }
  }
}

export default new DatabaseRepository();
