const PredictionRepository = require('../repositories/predictionRepository');
const StatsUtils = require('../utils/statsUtils');
const logger = require('../utils/logger');

class AnomalyService {
  /**
   * Détecter les anomalies (z-score)
   */
  static async detectAnomalies(containerId, threshold = 2) {
    try {
      const db = require('../config/database');
      
      const query = `
        SELECT 
          niveau_remplissage_pct as fill_level,
          batterie_pct as battery,
          date_heure_mesure as timestamp,
          temperature
        FROM MESURE
        WHERE id_conteneur = $1
          AND date_heure_mesure >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date_heure_mesure DESC;
      `;

      const result = await db.query(query, [containerId]);
      const data = result.rows.map(row => ({
        ...row,
        fill_level: parseFloat(row.fill_level),
        battery: parseFloat(row.battery),
        temperature: row.temperature != null ? parseFloat(row.temperature) : null
      }));

      if (data.length < 20) {
        return { 
          anomalies: [], 
          message: 'Not enough data for anomaly detection',
          dataPoints: data.length
        };
      }

      // Détecter anomalies de remplissage
      const fillLevels = data.map(d => d.fill_level);
      const meanFill = StatsUtils.calculateMean(fillLevels);
      const stdDevFill = StatsUtils.calculateStandardDeviation(fillLevels);

      // Détecter anomalies de batterie
      const batteries = data.map(d => d.battery);
      const meanBattery = StatsUtils.calculateMean(batteries);
      const stdDevBattery = StatsUtils.calculateStandardDeviation(batteries);

      const anomalies = data.filter(d => {
        const zScoreFill = Math.abs((d.fill_level - meanFill) / stdDevFill);
        const zScoreBattery = Math.abs((d.battery - meanBattery) / stdDevBattery);
        
        return zScoreFill > threshold || zScoreBattery > threshold;
      }).map(d => ({
        timestamp: d.timestamp,
        fillLevel: d.fill_level,
        battery: d.battery,
        temperature: d.temperature,
        fillDeviation: ((d.fill_level - meanFill) / stdDevFill).toFixed(2),
        batteryDeviation: ((d.battery - meanBattery) / stdDevBattery).toFixed(2),
        type: this._classifyAnomaly(d, meanFill, meanBattery)
      }));

      return {
        containerId,
        totalMeasurements: data.length,
        anomaliesCount: anomalies.length,
        anomaliesRate: ((anomalies.length / data.length) * 100).toFixed(2),
        anomalies: anomalies.slice(0, 10), // Top 10
        statistics: {
          meanFillLevel: meanFill.toFixed(2),
          stdDevFillLevel: stdDevFill.toFixed(2),
          meanBattery: meanBattery.toFixed(2),
          stdDevBattery: stdDevBattery.toFixed(2)
        },
        detectionDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Classifier le type d'anomalie
   */
  static _classifyAnomaly(data, meanFill, meanBattery) {
    const types = [];

    if (data.fill_level > meanFill + 30) types.push('sudden_fill');
    if (data.fill_level < meanFill - 30) types.push('sudden_empty');
    if (data.battery < 20) types.push('low_battery');
    if (data.temperature && (data.temperature < -10 || data.temperature > 50)) {
      types.push('temperature_extreme');
    }

    return types.length > 0 ? types : ['statistical_outlier'];
  }

  /**
   * Détecter capteurs défaillants
   */
  static async detectDefectiveSensors() {
    try {
      const db = require('../config/database');
      
      const query = `
        WITH sensor_stats AS (
          SELECT 
            c.id_conteneur,
            c.uid,
            COUNT(m.id_mesure) as measurement_count,
            MAX(m.date_heure_mesure) as last_measurement,
            AVG(m.batterie_pct) as avg_battery,
            COALESCE(STDDEV(m.niveau_remplissage_pct), 0) as stddev_fill
          FROM CONTENEUR c
          LEFT JOIN MESURE m ON m.id_conteneur = c.id_conteneur
            AND m.date_heure_mesure >= CURRENT_DATE - INTERVAL '7 days'
          WHERE c.statut = 'ACTIF'
          GROUP BY c.id_conteneur, c.uid
        )
        SELECT *
        FROM sensor_stats
        WHERE 
          (last_measurement < CURRENT_TIMESTAMP - INTERVAL '48 hours' OR last_measurement IS NULL)
          OR (avg_battery IS NOT NULL AND avg_battery < 10)
          OR (stddev_fill IS NOT NULL AND stddev_fill < 1)
        ORDER BY last_measurement ASC NULLS FIRST;
      `;

      const result = await db.query(query);
      
      const defectiveSensors = result.rows.map(sensor => ({
        containerId: sensor.id_conteneur,
        containerUid: sensor.uid,
        issues: this._identifyIssues(sensor),
        lastMeasurement: sensor.last_measurement,
        avgBattery: sensor.avg_battery != null ? Number(sensor.avg_battery).toFixed(2) : null,
        measurementCount: sensor.measurement_count
      }));

      return {
        total: defectiveSensors.length,
        sensors: defectiveSensors,
        detectionDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error detecting defective sensors:', error);
      throw error;
    }
  }

  /**
   * Identifier les problèmes spécifiques
   */
  static _identifyIssues(sensor) {
    const issues = [];
    
    if (!sensor.last_measurement) {
      issues.push('no_data');
    } else {
      const hoursSinceLastMeasure = 
        (Date.now() - new Date(sensor.last_measurement)) / (1000 * 60 * 60);
      
      if (hoursSinceLastMeasure > 48) {
        issues.push('no_recent_data');
      }
    }

    if (sensor.avg_battery != null && sensor.avg_battery < 10) {
      issues.push('critical_battery');
    } else if (sensor.avg_battery != null && sensor.avg_battery < 20) {
      issues.push('low_battery');
    }

    if (sensor.stddev_fill != null && sensor.stddev_fill < 1) {
      issues.push('sensor_stuck');
    }

    if (sensor.measurement_count != null && sensor.measurement_count < 10) {
      issues.push('insufficient_data');
    }

    return issues;
  }

  /**
   * Créer des alertes automatiques
   */
  static async createAlerts(anomalies) {
    try {
      const db = require('../config/database');
      
      for (const anomaly of anomalies.anomalies.slice(0, 10)) {
        const seuil = anomaly.fillLevel > 50 ? 90 : 20;
        const query = `
          INSERT INTO ALERTE_CAPTEUR (
            type_alerte,
            valeur_detectee,
            seuil,
            statut,
            date_creation,
            description,
            id_conteneur
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await db.query(query, [
          'CAPTEUR_DEFAILLANT',
          anomaly.fillLevel,
          seuil,
          'ACTIVE',
          new Date(),
          `Anomalie détectée: ${anomaly.type.join(', ')}`,
          anomalies.containerId
        ]);
      }

      logger.info(`Created ${anomalies.anomalies.length} automatic alerts`);
    } catch (error) {
      logger.error('Error creating alerts:', error);
      throw error;
    }
  }
}

module.exports = AnomalyService;