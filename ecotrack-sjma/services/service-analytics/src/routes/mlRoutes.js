const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const PredictionService = require('../services/predictionService');
const AnomalyService = require('../services/anomalyService');
const logger = require('../utils/logger');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const { mlLimiter } = require('../middleware/rateLimitMiddleware');
const { requirePermission } = require('../middleware/rbac');

/**
 * @swagger
 * components:
 *   schemas:
 *   Prediction:
 *     type: object
 *     properties:
 *       containerId:
 *         type: integer
 *       currentFillLevel:
 *         type: number
 *       predictedFillLevel:
 *         type: number
 *       daysAhead:
 *         type: integer
 *       confidence:
 *         type: integer
 *       weatherImpact:
 *         type: number
 *       weatherAdjusted:
 *         type: boolean
 *   Anomaly:
 *     type: object
 *     properties:
 *       containerId:
 *         type: integer
 *       anomaliesCount:
 *         type: integer
 *       anomaliesRate:
 *         type: string
 *       statistics:
 *         type: object
 *   DefectiveSensor:
 *     type: object
 *     properties:
 *       containerId:
 *         type: integer
 *       containerUid:
 *         type: string
 *       issues:
 *         type: array
 *         items:
 *           type: string
 */

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

/**
 * @swagger
 * /api/analytics/ml/predict:
 *   post:
 *     summary: Prédire le niveau de remplissage d'un conteneur
 *     tags: [ML Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - containerId
 *             properties:
 *               containerId:
 *                 type: integer
 *                 description: ID du conteneur
 *               daysAhead:
 *                 type: integer
 *                 default: 1
 *                 description: Nombre de jours pour la prédiction
 *               includeWeather:
 *                 type: boolean
 *                 default: false
 *                 description: Intégrer les données météo
 *     responses:
 *       200:
 *         description: Prédiction réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Prediction'
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Données insuffisantes
 */
router.post('/ml/predict', authMiddleware, requirePermission('analytics:read'), mlLimiter, ValidationMiddleware.validatePrediction(), async (req, res) => {
  try {
    const { containerId, daysAhead = 1, includeWeather = false } = req.body;
    if (!containerId) {
      return res.status(400).json({ success: false, error: 'containerId is required' });
    }
    let prediction;
    if (includeWeather) {
      prediction = await PredictionService.predictWithWeather(containerId, daysAhead);
    } else {
      prediction = await PredictionService.predictFillLevel(containerId, daysAhead);
    }
    if (!prediction) {
      return res.status(200).json({
        success: true,
        data: {
          containerId,
          daysAhead,
          available: false,
          reason: 'INSUFFICIENT_DATA',
          message: 'Insufficient data for prediction'
        }
      });
    }
    res.json({ success: true, data: prediction });
  } catch (error) {
    logger.error('Error in predictFillLevel:', error);
    res.status(500).json({ success: false, error: 'Prediction failed', message: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/ml/predict-critical:
 *   get:
 *     summary: Prédire les conteneurs qui seront critiques
 *     tags: [ML Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 90
 *     responses:
 *       200:
 *         description: Liste des conteneurs critiques prédits
 */
router.get('/ml/predict-critical', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const { daysAhead = 1, threshold = 90 } = req.query;
    const predictions = await PredictionService.predictCriticalContainers(parseInt(daysAhead), parseInt(threshold));
    res.json({ success: true, data: { count: predictions.length, daysAhead: parseInt(daysAhead), threshold: parseInt(threshold), predictions } });
  } catch (error) {
    logger.error('Error in predictCritical:', error);
    res.status(500).json({ success: false, error: 'Failed to predict critical containers' });
  }
});

/**
 * @swagger
 * /api/analytics/ml/anomalies/{containerId}:
 *   get:
 *     summary: Détecter les anomalies pour un conteneur
 *     tags: [ML Anomalies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 2
 *     responses:
 *       200:
 *         description: Anomalies détectées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Anomaly'
 */
router.get('/ml/anomalies/:containerId', authMiddleware, requirePermission('analytics:read'), async (req, res, next) => {
  try {
    const { containerId } = req.params;
    if (containerId === 'global') {
      return next();
    }
    const { threshold = 2 } = req.query;
    const anomalies = await AnomalyService.detectAnomalies(containerId, parseFloat(threshold));
    res.json({ success: true, data: anomalies });
  } catch (error) {
    logger.error('Error detecting anomalies:', error);
    res.status(500).json({ success: false, error: 'Anomaly detection failed' });
  }
});

/**
 * @swagger
 * /api/analytics/ml/defective-sensors:
 *   get:
 *     summary: Détecter les capteurs défaillants
 *     tags: [ML Anomalies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Capteurs défaillants détectés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     sensors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DefectiveSensor'
 */
router.get('/ml/defective-sensors', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const sensors = await AnomalyService.detectDefectiveSensors();
    res.json({ success: true, data: sensors });
  } catch (error) {
    logger.error('Error getting defective sensors:', error);
    res.status(500).json({ success: false, error: 'Failed to detect defective sensors', message: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/ml/anomalies/global:
 *   get:
 *     summary: Détection globale d'anomalies pour tous les conteneurs (auto-scan)
 *     tags: [ML Anomalies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 2
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Résumé des anomalies globales
 */
router.get('/ml/anomalies/global', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const { threshold = 2, limit = 20 } = req.query;
    const result = await AnomalyService.detectGlobalAnomalies(parseFloat(threshold), parseInt(limit));
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error detecting global anomalies:', error);
    res.status(500).json({ success: false, error: 'Global anomaly detection failed', message: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/ml/anomalies/{containerId}/alerts:
 *   post:
 *     summary: Détecter les anomalies et créer des alertes automatiques
 *     tags: [ML Anomalies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: containerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 2
 *       - in: query
 *         name: autoCreate
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Anomalies détectées et alertes créées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     anomaliesCount:
 *                       type: integer
 *                     alertsCreated:
 *                       type: integer
 *                     message:
 *                       type: string
 */
router.post('/ml/anomalies/:containerId/alerts', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const { containerId } = req.params;
    const { threshold = 2, autoCreate = true } = req.query;
    const anomalies = await AnomalyService.detectAnomalies(containerId, parseFloat(threshold));
    let alertsCreated = 0;
    if (autoCreate && anomalies.anomaliesCount > 0) {
      await AnomalyService.createAlerts(anomalies);
      alertsCreated = Math.min(anomalies.anomaliesCount, 10);
    }
    res.json({ success: true, data: { ...anomalies, alertsCreated, message: alertsCreated > 0 ? `${alertsCreated} alert(s) created` : 'No alerts created' } });
  } catch (error) {
    logger.error('Error detecting anomalies and creating alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to detect anomalies and create alerts' });
  }
});

module.exports = router;
