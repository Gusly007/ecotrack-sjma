const db = require('../config/database');
const logger = require('../utils/logger');

class ConstantsRepository {
  static async getAgentPerformanceConstants() {
    try {
      const query = 'SELECT cle, valeur FROM agent_performance_constants';
      const result = await db.query(query);
      
      const constants = {};
      result.rows.forEach(row => {
        constants[row.cle] = parseFloat(row.valeur);
      });
      
      return constants;
    } catch (error) {
      logger.error('Error fetching agent performance constants:', error);
      throw error;
    }
  }

  static async getEnvironmentalConstants() {
    try {
      const query = 'SELECT cle, valeur FROM environmental_constants';
      const result = await db.query(query);
      
      const constants = {};
      result.rows.forEach(row => {
        constants[row.cle] = parseFloat(row.valeur);
      });
      
      return constants;
    } catch (error) {
      logger.error('Error fetching environmental constants:', error);
      throw error;
    }
  }

  static async updateAgentPerformanceConstant(cle, valeur) {
    try {
      const query = `
        UPDATE agent_performance_constants 
        SET valeur = $2, date_modification = CURRENT_TIMESTAMP
        WHERE cle = $1
        RETURNING *
      `;
      const result = await db.query(query, [cle, valeur]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating agent performance constant:', error);
      throw error;
    }
  }

  static async updateEnvironmentalConstant(cle, valeur) {
    try {
      const query = `
        UPDATE environmental_constants 
        SET valeur = $2, date_modification = CURRENT_TIMESTAMP
        WHERE cle = $1
        RETURNING *
      `;
      const result = await db.query(query, [cle, valeur]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating environmental constant:', error);
      throw error;
    }
  }
}

module.exports = ConstantsRepository;
