const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const PredictionService = require('../services/predictionService');
const AnomalyService = require('../services/anomalyService');
const PerformanceService = require('../services/performanceService');
const DashboardAnalyticsRepository = require('../repositories/dashboardAnalyticsRepository');

/**
 * @swagger
 * /api/analytics/weather-impact:
 *   get:
 *     summary: Impact météo actuel sur la collecte
 *     tags: [Analytics]
 */
router.get('/weather-impact', cacheMiddleware(300), async (req, res) => {
  try {
    const fetch = require('node-fetch');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current_weather=true`;
    
    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();
    const weather = data.current_weather || {};
    
    let weatherIcon = 'fa-sun';
    let condition = 'Ensoleillé';
    let impact = 5;
    
    if (weather.weathercode === 0) {
      weatherIcon = 'fa-sun';
      condition = 'Ensoleillé';
      impact = 5;
    } else if (weather.weathercode >= 1 && weather.weathercode <= 3) {
      weatherIcon = 'fa-cloud';
      condition = 'Partiellement nuageux';
      impact = 0;
    } else if (weather.weathercode >= 45 && weather.weathercode <= 48) {
      weatherIcon = 'fa-smog';
      condition = 'Brouillard';
      impact = -10;
    } else if (weather.weathercode >= 51 && weather.weathercode <= 67) {
      weatherIcon = 'fa-cloud-rain';
      condition = 'Pluie';
      impact = -15;
    } else if (weather.weathercode >= 71 && weather.weathercode <= 77) {
      weatherIcon = 'fa-snowflake';
      condition = 'Neige';
      impact = -25;
    } else if (weather.weathercode >= 80 && weather.weathercode <= 82) {
      weatherIcon = 'fa-cloud-showers-heavy';
      condition = 'Averses';
      impact = -20;
    }
    
    res.json({
      success: true,
      data: {
        temperature: weather.temperature || 20,
        condition: condition,
        weatherIcon: weatherIcon,
        weatherCode: weather.weathercode,
        windspeed: weather.windspeed || 0,
        impact: impact,
        prediction: impact > 0 ? 'Favorable' : impact < -10 ? 'Défavorable' : 'Neutre'
      }
    });
  } catch (error) {
    logger.error('Error fetching weather:', error);
    res.json({
      success: true,
      data: {
        temperature: 18,
        condition: 'Données indisponibles',
        weatherIcon: 'fa-cloud',
        impact: 0,
        prediction: 'Neutre'
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/kpis:
 *   get:
 *     summary: KPIs globaux du système
 *     tags: [Analytics]
 */
router.get('/kpis', cacheMiddleware(60), async (req, res) => {
  try {
    const [statsData, alertsData, criticalData] = await Promise.all([
      DashboardAnalyticsRepository.getKpiBaseStats(),
      DashboardAnalyticsRepository.getActiveAlertsCount(),
      DashboardAnalyticsRepository.getCriticalContainersCount(85)
    ]);
    
    const avgFill = parseFloat(statsData.avg_fill_level) || 50;
    const activeAlerts = parseInt(alertsData.active_alerts) || 0;
    const criticalContainersCount = parseInt(criticalData.count) || 0;
    
    let efficiency;
    if (avgFill >= 50 && avgFill <= 70) efficiency = 95;
    else if (avgFill < 50) efficiency = Math.max(40, Math.round(avgFill * 1.6));
    else efficiency = Math.max(40, Math.round(100 - (avgFill - 70) * 2.5));
    
    const satisfaction = Math.max(50, Math.min(100, 100 - (activeAlerts * 1.5)));
    
    // Utiliser PerformanceService pour les métriques environnementales
    let environmentalMetrics = null;
    try {
      const dashboard = await PerformanceService.getCompleteDashboard('week');
      environmentalMetrics = dashboard.environmental;
    } catch (e) {
      logger.warn('PerformanceService not available:', e.message);
    }
    
    const actualCollectionRate = environmentalMetrics?.distance?.reductionPct || 0;
    const actualRecyclingRate = environmentalMetrics?.co2?.reductionPct || 0;
    const actualOptimizedRoutes = environmentalMetrics?.routes && environmentalMetrics.routes.total > 0 
      ? Math.round((environmentalMetrics.routes.completed / environmentalMetrics.routes.total) * 100) 
      : 0;
    const actualCo2Saved = environmentalMetrics?.co2?.saved || 0;

    res.json({
      success: true,
      data: {
        collectionRate: actualCollectionRate,
        efficiency,
        satisfaction,
        recyclingRate: actualRecyclingRate,
        co2Saved: actualCo2Saved.toFixed(2),
        optimizedRoutes: actualOptimizedRoutes,
        totalContainers: parseInt(statsData.active_containers) || 0,
        totalMeasurements: parseInt(statsData.total_measurements) || 0,
        avgFillLevel: avgFill,
        avgBattery: parseFloat(statsData.avg_battery) || 0,
        activeAlerts,
        criticalContainers: criticalContainersCount || 0,
        calculations: {
          collectionRate: { value: actualCollectionRate, formula: 'Distance économisée / Distance planifiée × 100' },
          efficiency: { value: efficiency, formula: `Optimal 50-70% | Actuel: ${avgFill.toFixed(1)}%` },
          satisfaction: { value: satisfaction, formula: `100 - (${activeAlerts} alertes × 1.5)` },
          recyclingRate: { value: actualRecyclingRate, formula: 'CO2 reduction via optimisation × 100' },
          co2Saved: { value: actualCo2Saved.toFixed(2), formula: 'CO2 total évité (kg)' },
          optimizedRoutes: { value: actualOptimizedRoutes, formula: 'Routes effectuées / Routes totale × 100' }
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching KPIs:', error.message);
    res.status(200).json({
      success: true,
      data: {
        collectionRate: 0,
        efficiency: 0,
        satisfaction: 100,
        recyclingRate: 0,
        co2Saved: '0',
        optimizedRoutes: 0,
        totalContainers: 0,
        totalMeasurements: 0,
        avgFillLevel: 0,
        avgBattery: 0,
        activeAlerts: 0,
        criticalContainers: 0,
        calculations: {
          collectionRate: { value: 0, formula: 'Distance économisée / Distance planifiée × 100' },
          efficiency: { value: 0, formula: 'Optimal 50-70%' },
          satisfaction: { value: 100, formula: 'Basé sur les alertes' },
          recyclingRate: { value: 0, formula: 'CO2 reduction via optimisation × 100' },
          co2Saved: { value: '0', formula: 'CO2 total évité (kg)' },
          optimizedRoutes: { value: 0, formula: 'Routes effectuées / Routes totale × 100' }
        }
      }
    });
  }
});

/**
 * @swagger
 * /api/analytics/aggregation/fill-trends:
 *   get:
 *     summary: Tendances de remplissage sur les derniers jours
 *     tags: [Analytics]
 */
router.get('/aggregation/fill-trends', cacheMiddleware(120), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const trends = await DashboardAnalyticsRepository.getFillTrends(days);
    
    res.json({
      success: true,
      data: {
        trends: trends.map(row => ({
          date: row.date,
          avgFillLevel: parseFloat(row.avgfilllevel),
          measurementCount: parseInt(row.measurementcount),
          avgBattery: parseFloat(row.avgbattery)
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching fill trends:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/aggregation/zone-performance:
 *   get:
 *     summary: Performance par zone
 *     tags: [Analytics]
 */
router.get('/aggregation/zone-performance', cacheMiddleware(120), async (req, res) => {
  try {
    const performance = await DashboardAnalyticsRepository.getZonePerformance();
    
    res.json({
      success: true,
      data: {
        zones: performance.map(row => ({
          id: parseInt(row.id),
          name: row.name,
          code: row.code,
          containerCount: parseInt(row.containercount) || 0,
          fillRate: parseFloat(row.fillrate) || 0,
          avgBattery: parseFloat(row.avgbattery) || 0,
          measurementCount: parseInt(row.measurementcount) || 0
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching zone performance:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/critical-containers:
 *   get:
 *     summary: Conteneurs les plus critiques
 *     tags: [Analytics]
 */
router.get('/critical-containers', cacheMiddleware(60), async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 85;
    const limit = parseInt(req.query.limit) || 15;
    const containers = await DashboardAnalyticsRepository.getCriticalContainers(threshold, limit);
    
    res.json({
      success: true,
      data: {
        threshold: threshold,
        count: containers.length,
        containers: containers.map(row => ({
          id: row.id_conteneur,
          uid: row.uid,
          fillLevel: parseFloat(row.filllevel),
          battery: parseFloat(row.battery),
          lastUpdate: row.lastupdate,
          type: row.type,
          zone: row.zone || 'Non assignée',
          status: parseFloat(row.filllevel) >= 90 ? 'critical' : parseFloat(row.filllevel) >= 80 ? 'warning' : 'normal'
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching critical containers:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/type-distribution:
 *   get:
 *     summary: Distribution par type de conteneur
 *     tags: [Analytics]
 */
router.get('/type-distribution', async (req, res) => {
  try {
    const distribution = await DashboardAnalyticsRepository.getTypeDistribution();
    
    res.json({
      success: true,
      data: {
        types: distribution.map(row => ({
          id: row.id_type,
          type: row.type,
          code: row.code,
          containerCount: parseInt(row.containercount) || 0,
          avgFillRate: parseFloat(row.avgfillrate) || 0,
          avgBattery: parseFloat(row.avgbattery) || 0
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching type distribution:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/collecte-stats:
 *   get:
 *     summary: Statistiques de collecte
 *     tags: [Analytics]
 */
router.get('/collecte-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const [summaryRow, dailyStats] = await Promise.all([
      DashboardAnalyticsRepository.getCollecteSummary(days),
      DashboardAnalyticsRepository.getCollecteDaily(days)
    ]);
    
    res.json({
      success: true,
      data: {
        summary: summaryRow ? {
          totalCollections: parseInt(summaryRow.totalcollections) || 0,
          totalKg: parseFloat(summaryRow.totalkg) || 0,
          avgKg: parseFloat(summaryRow.avgkg) || 0,
          maxKg: parseFloat(summaryRow.maxkg) || 0,
          minKg: parseFloat(summaryRow.minkg) || 0
        } : null,
        daily: dailyStats.map(row => ({
          date: row.date,
          collections: parseInt(row.collections),
          totalKg: parseFloat(row.totalkg)
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching collecte stats:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/ml/predictions:
 *   get:
 *     summary: Prédictions ML pour conteneurs critiques
 *     tags: [ML]
 */
router.get('/ml/predictions', async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.daysAhead) || 1;
    const threshold = parseInt(req.query.threshold) || 50;
    
    const predictions = await PredictionService.predictCriticalContainers(daysAhead, threshold);
    
    res.json({
      success: true,
      data: {
        count: predictions.length,
        daysAhead,
        threshold,
        predictions: predictions.slice(0, 20).map(p => ({
          containerId: p.id_conteneur,
          uid: p.uid,
          currentFillLevel: p.currentFillLevel,
          predictedFillLevel: p.predictedFillLevel,
          confidence: p.confidence,
          daysAhead: p.daysAhead,
          modelVersion: p.modelVersion
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching ML predictions:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/ml/defective-sensors:
 *   get:
 *     summary: Capteurs défaillants détectés par ML
 *     tags: [ML]
 */
router.get('/ml/defective-sensors', async (req, res) => {
  try {
    const sensors = await AnomalyService.detectDefectiveSensors();
    
    res.json({
      success: true,
      data: {
        total: sensors.total,
        sensors: sensors.sensors.slice(0, 10),
        detectionDate: sensors.detectionDate
      }
    });
  } catch (error) {
    logger.error('Error fetching defective sensors:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/performance/environmental:
 *   get:
 *     summary: Métriques environnementales calculées
 *     tags: [Performance]
 */
router.get('/performance/environmental', cacheMiddleware(10), async (req, res) => {
  try {
    const period = req.query.period || 'week';
    logger.info({ period }, 'Fetching environmental metrics');
    const dashboard = await PerformanceService.getCompleteDashboard(period);
    logger.info({ period: dashboard.period }, 'Environmental metrics fetched');
    
    res.json({
      success: true,
      data: {
        environmental: dashboard.environmental,
        period: dashboard.period,
        generatedAt: dashboard.generatedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching environmental metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/cache/refresh', async (req, res) => {
  try {
    const { clearCache } = require('../middleware/cacheMiddleware');
    const EnvironmentalConstantsService = require('../services/environmentalConstantsService');
    clearCache();
    await EnvironmentalConstantsService.clearCache();
    await EnvironmentalConstantsService.getEnvironmentalConstants(true);
    res.json({
      success: true,
      message: 'Cache cleared - environmental constants reloaded'
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
