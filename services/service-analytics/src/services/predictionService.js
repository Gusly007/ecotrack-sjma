const PredictionRepository = require('../repositories/predictionRepository');
const StatsUtils = require('../utils/statsUtils');
const logger = require('../utils/logger');

class PredictionService {
  /**
   * Prédire le remplissage futur (régression linéaire simple)
   */
  static async predictFillLevel(containerId, daysAhead = 1) {
    try {
      // Récupérer l'historique
      const data = await PredictionRepository.getHistoricalData(containerId, 30);

      if (data.length < 10) {
        logger.warn(`Not enough data for prediction (container ${containerId})`);
        return null;
      }

      // Régression linéaire simple
      const n = data.length;
      
      // Normaliser les timestamps pour éviter les problèmes de précision
      const minTimestamp = Math.min(...data.map(d => d.timestamp));
      const normalizedData = data.map(d => ({
        ...d,
        normalizedTimestamp: d.timestamp - minTimestamp
      }));
      
      const sumX = normalizedData.reduce((sum, d) => sum + d.normalizedTimestamp, 0);
      const sumY = normalizedData.reduce((sum, d) => sum + d.fill_level, 0);
      const sumXY = normalizedData.reduce((sum, d) => sum + (d.normalizedTimestamp * d.fill_level), 0);
      const sumX2 = normalizedData.reduce((sum, d) => sum + (d.normalizedTimestamp * d.normalizedTimestamp), 0);

      // Calcul de la pente et l'ordonnée à l'origine
      const denominator = (n * sumX2 - sumX * sumX);
      
      if (Math.abs(denominator) < 0.0001) {
        logger.warn(`Insufficient variance in data for prediction (container ${containerId})`);
        const avgFill = sumY / n;
        return {
          containerId,
          currentFillLevel: data[data.length - 1].fill_level,
          predictedFillLevel: avgFill,
          daysAhead,
          confidence: 50,
          dataPoints: n,
          predictionDate: new Date().toISOString(),
          modelVersion: '1.0-linear-fallback'
        };
      }
      
      const slope = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / n;

      // Prédiction (en temps normalisé)
      const lastTimestamp = data[data.length - 1].timestamp;
      const futureTimestamp = lastTimestamp + (daysAhead * 24 * 60 * 60);
      const predictedFillLevel = slope * (futureTimestamp - minTimestamp) + intercept;

      // Limiter entre 0 et 100
      const prediction = Math.max(0, Math.min(100, predictedFillLevel));

      // Calculer la confiance (basée sur les résidus normalisés)
      const residuals = normalizedData.map(d => {
        const predicted = slope * d.normalizedTimestamp + intercept;
        return Math.abs(d.fill_level - predicted);
      });
      const meanResidual = StatsUtils.calculateMean(residuals);
      const confidence = Math.max(0, Math.min(100, 100 - meanResidual * 5));

      const result = {
        containerId,
        currentFillLevel: data[data.length - 1].fill_level,
        predictedFillLevel: Math.round(prediction * 100) / 100,
        daysAhead,
        confidence: Math.round(confidence),
        dataPoints: n,
        predictionDate: new Date(futureTimestamp * 1000).toISOString(),
        modelVersion: '1.0-linear'
      };

      // Sauvegarder la prédiction (ne pas échouer si erreur)
      try {
        await PredictionRepository.savePrediction({
          containerId: result.containerId,
          predictedFillLevel: result.predictedFillLevel,
          predictionDate: result.predictionDate,
          confidence: result.confidence,
          modelVersion: result.modelVersion
        });
      } catch (saveError) {
        logger.warn('Could not save prediction, continuing without save');
      }

      return result;
    } catch (error) {
      logger.error('Error in predictFillLevel:', error);
      throw error;
    }
  }

  /**
   * Prédire quels conteneurs seront critiques
   */
  static async predictCriticalContainers(daysAhead = 1, threshold = 90) {
    try {
      const db = require('../config/database');
      
      // Récupérer tous les conteneurs actifs
      const containersQuery = `
        SELECT id_conteneur, uid, id_zone
        FROM CONTENEUR 
        WHERE statut = 'ACTIF'
        LIMIT 200;
      `;
      
      const containersResult = await db.query(containersQuery);
      const containers = containersResult.rows;

      logger.info(`Predicting for ${containers.length} containers...`);

      // Prédire pour chaque conteneur (en parallèle par batch)
      const batchSize = 20;
      const predictions = [];

      for (let i = 0; i < containers.length; i += batchSize) {
        const batch = containers.slice(i, i + batchSize);
        const batchPredictions = await Promise.all(
          batch.map(async (container) => {
            try {
              const prediction = await this.predictFillLevel(
                container.id_conteneur, 
                daysAhead
              );
              
              if (prediction && prediction.predictedFillLevel >= threshold) {
                return {
                  ...container,
                  ...prediction
                };
              }
              return null;
            } catch (error) {
              logger.error(`Prediction failed for container ${container.id_conteneur}`);
              return null;
            }
          })
        );

        predictions.push(...batchPredictions.filter(p => p !== null));
      }

      // Trier par niveau de remplissage prédit (ignorer les nulls)
      const criticalPredictions = predictions
        .filter(p => p && p.predictedFillLevel !== null)
        .sort((a, b) => b.predictedFillLevel - a.predictedFillLevel);

      logger.info(`Found ${criticalPredictions.length} critical predictions`);

      return criticalPredictions;
    } catch (error) {
      logger.error('Error in predictCriticalContainers:', error);
      throw error;
    }
  }

  /**
   * Intégration prévisions météo (simulation)
   */
  static async predictWithWeather(containerId, daysAhead = 1) {
    try {
      // Prédiction de base
      const basePrediction = await this.predictFillLevel(containerId, daysAhead);
      
      if (!basePrediction) return null;

      // Simulation d'impact météo
      // Dans une vraie implémentation, appeler une API météo
      const weatherImpact = await this._simulateWeatherImpact();

      const adjustedPrediction = basePrediction.predictedFillLevel * weatherImpact;

      return {
        ...basePrediction,
        predictedFillLevel: Math.round(adjustedPrediction * 100) / 100,
        weatherAdjusted: true,
        weatherImpact: Math.round((weatherImpact - 1) * 100)
      };
    } catch (error) {
      logger.error('Error in predictWithWeather:', error);
      throw error;
    }
  }

  /**
   * Simuler l'impact météo
   * TODO: Remplacer par vraie API météo
   */
  static _simulateWeatherImpact() {
    // Open-Meteo API - using node-fetch for Node 20 compatibility
    // https://open-meteo.com/en/docs
    const fetch = require('node-fetch');
    const latitude = 48.8566;
    const longitude = 2.3522;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    
    return fetch(url)
      .then(res => res.json())
      .then(data => {
        const weather = data.current_weather;
        if (!weather) return 1.0;
        if ([61, 63, 65, 80, 81, 82].includes(weather.weathercode)) return 0.95;
        if (weather.weathercode === 0) return 1.10;
        return 1.0;
      })
      .catch(() => 1.0);
  }
}

module.exports = PredictionService;