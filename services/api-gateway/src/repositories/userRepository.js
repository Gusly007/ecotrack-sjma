import BaseRepository from './baseRepository.js';
import logger from '../middleware/logger.js';

class UserRepository extends BaseRepository {
  async getActiveUsers() {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count 
        FROM utilisateur 
        WHERE est_active = true
      `);
      return parseInt(result.rows[0].count);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get active users');
      return 0;
    }
  }

  async getTotalUsers() {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count FROM utilisateur
      `);
      return parseInt(result.rows[0].count);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get total users');
      return 0;
    }
  }

  async getUsersByRole(role) {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count 
        FROM utilisateur 
        WHERE role_par_defaut = $1
      `, [role]);
      return parseInt(result.rows[0].count);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get users by role');
      return 0;
    }
  }

  async getRecentUsers(days = 7) {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count 
        FROM utilisateur 
        WHERE date_creation > NOW() - INTERVAL '${days} days'
      `);
      return parseInt(result.rows[0].count);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get recent users');
      return 0;
    }
  }
}

export default new UserRepository();
