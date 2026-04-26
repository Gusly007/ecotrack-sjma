const db = require('../config/database');
const StatsUtils = require('../utils/statsUtils');
const logger = require('../utils/logger');

class PredictionRepository {
  /**
   * Récupérer l'historique pour prédiction
   */
  static async getHistoricalData(containerId, days = 30) {
    try {
      const query = `
        SELECT 
          EXTRACT(EPOCH FROM date_heure_mesure) as timestamp,
          niveau_remplissage_pct as fill_level,
          temperature,
          DATE_PART('hour', date_heure_mesure) as hour,
          DATE_PART('dow', date_heure_mesure) as day_of_week
        FROM MESURE
        WHERE id_conteneur = $1
          AND date_heure_mesure >= CURRENT_DATE - (($2 || ' days')::interval)
        ORDER BY date_heure_mesure ASC;
      `;

      const result = await db.query(query, [containerId, String(days)]);
      // Ensure numeric values are properly parsed
      return result.rows.map(row => ({
        ...row,
        timestamp: parseFloat(row.timestamp),
        fill_level: parseFloat(row.fill_level),
        temperature: row.temperature != null ? parseFloat(row.temperature) : null,
        hour: row.hour != null ? parseFloat(row.hour) : null,
        day_of_week: row.day_of_week != null ? parseFloat(row.day_of_week) : null
      }));
    } catch (error) {
      logger.error('Error fetching historical data:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder une prédiction
   */
  static async savePrediction(prediction) {
    try {
      const query = `
        INSERT INTO predictions (
          container_id, 
          predicted_fill_level, 
          prediction_date, 
          confidence,
          model_version
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;

      const result = await db.query(query, [
        prediction.containerId,
        prediction.predictedFillLevel,
        prediction.predictionDate,
        prediction.confidence,
        prediction.modelVersion || '1.0'
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error saving prediction:', error);
      throw error;
    }
  }

  /**
   * Récupérer les prédictions existantes
   */
  static async getPredictions(containerId) {
    try {
      const query = `
        SELECT * FROM predictions
        WHERE container_id = $1
          AND prediction_date >= CURRENT_DATE
        ORDER BY prediction_date;
      `;

      const result = await db.query(query, [containerId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching predictions:', error);
      throw error;
    }
  }
}

module.exports = PredictionRepository;
