const PredictionService = require('../services/predictionService');
const AnomalyService = require('../services/anomalyService');
const logger = require('../utils/logger');

class MLController {
  /**
   * POST /api/analytics/ml/predict
   */
  static async predictFillLevel(req, res) {
    try {
      const { containerId, daysAhead = 1, includeWeather = false } = req.body;

      if (!containerId) {
        return res.status(400).json({
          success: false,
          error: 'containerId is required'
        });
      }

      let prediction;
      if (includeWeather) {
        prediction = await PredictionService.predictWithWeather(containerId, daysAhead);
      } else {
        prediction = await PredictionService.predictFillLevel(containerId, daysAhead);
      }

      if (!prediction) {
        return res.status(404).json({
          success: false,
          error: 'Insufficient data for prediction'
        });
      }

      res.json({
        success: true,
        data: prediction
      });
    } catch (error) {
      logger.error('Error in predictFillLevel:', error);
      res.status(500).json({
        success: false,
        error: 'Prediction failed',
        message: error.message
      });
    }
  }

  /**
   * GET /api/analytics/ml/predict-critical
   */
  static async predictCritical(req, res) {
    try {
      const { daysAhead = 1, threshold = 90 } = req.query;

      logger.info(`Predicting critical containers for ${daysAhead} days ahead`);

      const predictions = await PredictionService.predictCriticalContainers(
        parseInt(daysAhead),
        parseInt(threshold)
      );

      res.json({
        success: true,
        data: {
          count: predictions.length,
          daysAhead: parseInt(daysAhead),
          threshold: parseInt(threshold),
          predictions
        }
      });
    } catch (error) {
      logger.error('Error in predictCritical:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to predict critical containers'
      });
    }
  }

  /**
   * GET /api/analytics/ml/anomalies/:containerId
   */
  static async detectAnomalies(req, res) {
    try {
      const { containerId } = req.params;
      const { threshold = 2 } = req.query;

      const anomalies = await AnomalyService.detectAnomalies(
        containerId,
        parseFloat(threshold)
      );

      res.json({
        success: true,
        data: anomalies
      });
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      res.status(500).json({
        success: false,
        error: 'Anomaly detection failed'
      });
    }
  }

  /**
   * GET /api/analytics/ml/defective-sensors
   */
  static async getDefectiveSensors(req, res) {
    try {
      const sensors = await AnomalyService.detectDefectiveSensors();

      res.json({
        success: true,
        data: sensors
      });
    } catch (error) {
      logger.error('Error getting defective sensors:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect defective sensors'
      });
    }
  }

  /**
   * POST /api/analytics/ml/anomalies/:containerId/alerts
   * Detect anomalies and create alerts automatically
   */
  static async detectAnomaliesAndCreateAlerts(req, res) {
    try {
      const { containerId } = req.params;
      const { threshold = 2, autoCreate = true } = req.query;

      const anomalies = await AnomalyService.detectAnomalies(
        containerId,
        parseFloat(threshold)
      );

      let alertsCreated = 0;
      if (autoCreate && anomalies.anomaliesCount > 0) {
        await AnomalyService.createAlerts(anomalies);
        alertsCreated = Math.min(anomalies.anomaliesCount, 10);
      }

      res.json({
        success: true,
        data: {
          ...anomalies,
          alertsCreated,
          message: alertsCreated > 0 ? `${alertsCreated} alert(s) created` : 'No alerts created'
        }
      });
    } catch (error) {
      logger.error('Error detecting anomalies and creating alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect anomalies and create alerts'
      });
    }
  }
}

module.exports = MLController;