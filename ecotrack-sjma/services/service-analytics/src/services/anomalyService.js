const AnomalyRepository = require('../repositories/anomalyRepository');
const StatsUtils = require('../utils/statsUtils');
const logger = require('../utils/logger');

class AnomalyService {
  /**
   * Détecter les anomalies (z-score)
   */
  static async detectAnomalies(containerId, threshold = 2) {
    try {
      const rows = await AnomalyRepository.getRecentContainerMeasurements(containerId);
      const data = rows.map(row => ({
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
      const rows = await AnomalyRepository.getDefectiveSensorStats();

      const defectiveSensors = rows.map(sensor => ({
        sensorId: sensor.id_capteur,
        sensorUid: sensor.uid_capteur,
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
      for (const anomaly of anomalies.anomalies.slice(0, 10)) {
        const seuil = anomaly.fillLevel > 50 ? 90 : 20;
        await AnomalyRepository.createSensorAlert({
          value: anomaly.fillLevel,
          threshold: seuil,
          status: 'ACTIVE',
          createdAt: new Date(),
          description: `Anomalie détectée: ${anomaly.type.join(', ')}`,
          containerId: anomalies.containerId
        });
      }

      logger.info(`Created ${anomalies.anomalies.length} automatic alerts`);
    } catch (error) {
      logger.error('Error creating alerts:', error);
      throw error;
    }
  }

  /**
   * Détection globale d'anomalies pour TOUS les conteneurs (auto-scan)
   * Retourne un résumé des conteneurs avec le plus d'anomalies
   */
  static async detectGlobalAnomalies(threshold = 2, limit = 20) {
    try {
      const containers = await AnomalyRepository.getContainersForGlobalAnomalyScan();
      
      const results = [];
      let totalAnomalies = 0;
      let totalMeasurements = 0;
      
      for (const container of containers) {
        try {
          const anomalyResult = await this.detectAnomalies(container.id_conteneur, threshold);
          
          if (anomalyResult.anomaliesCount > 0) {
            results.push({
              containerId: container.id_conteneur,
              containerUid: container.uid,
              sensorId: container.id_capteur,
              sensorUid: container.uid_capteur,
              anomaliesCount: anomalyResult.anomaliesCount,
              anomaliesRate: parseFloat(anomalyResult.anomaliesRate),
              totalMeasurements: anomalyResult.totalMeasurements,
              topAnomalies: anomalyResult.anomalies.slice(0, 3),
              statistics: anomalyResult.statistics
            });
          }
          
          totalAnomalies += anomalyResult.anomaliesCount;
          totalMeasurements += anomalyResult.totalMeasurements;
        } catch (err) {
          // Skip containers with errors
          logger.warn(`Skipping container ${container.id_conteneur}: ${err.message}`);
        }
      }
      
      // Sort by anomaly count descending
      results.sort((a, b) => b.anomaliesCount - a.anomaliesCount);
      
      return {
        summary: {
          containersScanned: containers.length,
          containersWithAnomalies: results.length,
          totalAnomalies,
          totalMeasurements,
          globalAnomalyRate: totalMeasurements > 0 
            ? ((totalAnomalies / totalMeasurements) * 100).toFixed(2) 
            : '0',
          threshold
        },
        containers: results.slice(0, limit),
        detectionDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error detecting global anomalies:', error);
      throw error;
    }
  }
}

module.exports = AnomalyService;