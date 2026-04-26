/**
 * @swagger
 * tags:
 *   - name: Mesures
 *     description: Données des capteurs IoT
 *   - name: Capteurs
 *     description: Gestion des capteurs
 *   - name: Alertes
 *     description: Alertes automatiques
 *   - name: IoT
 *     description: Administration du service IoT
 */

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { validate, validateQuery, validateParamId, simulateSchema, alertUpdateSchema, paginationSchema, containerQuerySchema } = require('../validators/iot.validator');
const { requirePermission } = require('../middleware/rbac');

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Trop de requêtes, réessayez dans 1 minute',
      timestamp: new Date().toISOString()
    });
  }
});

let controller;

function setController(ctrl) {
  controller = ctrl;
}

/**
 * @swagger
 * /iot/measurements:
 *   get:
 *     summary: Liste des mesures avec filtres
 *     tags: [Mesures]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: id_conteneur
 *         schema: { type: integer }
 *       - in: query
 *         name: id_capteur
 *         schema: { type: integer }
 *       - in: query
 *         name: date_debut
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: date_fin
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Liste des mesures avec pagination
 */
router.get('/iot/measurements', requirePermission('iot:read'), validateQuery(paginationSchema), (req, res, next) => controller.getMeasurements(req, res, next));

/**
 * @swagger
 * /iot/measurements/latest:
 *   get:
 *     summary: Dernières mesures de chaque conteneur
 *     tags: [Mesures]
 *     responses:
 *       200:
 *         description: Dernières mesures
 */
router.get('/iot/measurements/latest', requirePermission('iot:read'), (req, res, next) => controller.getLatestMeasurements(req, res, next));

/**
 * @swagger
 * /iot/measurements/container/{id}:
 *   get:
 *     summary: Mesures d'un conteneur
 *     tags: [Mesures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mesures du conteneur
 */
router.get('/iot/measurements/container/:id', requirePermission('iot:read'), validateParamId, validateQuery(containerQuerySchema), (req, res, next) => controller.getMeasurementsByContainer(req, res, next));

/**
 * @swagger
 * /iot/sensors:
 *   get:
 *     summary: Liste des capteurs
 *     tags: [Capteurs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Liste des capteurs
 */
router.get('/iot/sensors', requirePermission('iot:read'), validateQuery(paginationSchema), (req, res, next) => controller.getSensors(req, res, next));

/**
 * @swagger
 * /iot/sensors/status:
 *   get:
 *     summary: Statut des capteurs
 *     tags: [Capteurs]
 *     responses:
 *       200:
 *         description: Statut des capteurs (total, actifs, inactifs)
 */
router.get('/iot/sensors/status', requirePermission('iot:read'), (req, res, next) => controller.getSensorsStatus(req, res, next));

/**
 * @swagger
 * /iot/sensors/{id}:
 *   get:
 *     summary: Détails d'un capteur
 *     tags: [Capteurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Détails du capteur
 *       404:
 *         description: Capteur non trouvé
 */
router.get('/iot/sensors/:id', requirePermission('iot:read'), validateParamId, (req, res, next) => controller.getSensorById(req, res, next));

/**
 * @swagger
 * /iot/alerts:
 *   get:
 *     summary: Liste des alertes
 *     tags: [Alertes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: statut
 *         schema: { type: string, enum: [ACTIVE, RESOLUE, TOUTES] }
 *     responses:
 *       200:
 *         description: Liste des alertes
 */
router.get('/iot/alerts', requirePermission('iot:read'), validateQuery(paginationSchema), (req, res, next) => controller.getAlerts(req, res, next));

/**
 * @swagger
 * /iot/alerts/{id}:
 *   patch:
 *     summary: Mettre à jour le statut d'une alerte
 *     tags: [Alertes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [ACTIVE, RESOLUE]
 *     responses:
 *       200:
 *         description: Alerte mise à jour
 */
router.patch('/iot/alerts/:id', requirePermission('iot:update'), validateParamId, validate(alertUpdateSchema), (req, res, next) => controller.updateAlertStatus(req, res, next));

/**
 * @swagger
 * /iot/stats:
 *   get:
 *     summary: Statistiques IoT
 *     tags: [IoT]
 *     responses:
 *       200:
 *         description: Statistiques globales
 */
router.get('/iot/stats', requirePermission('iot:read'), (req, res, next) => controller.getStats(req, res, next));

router.get('/alerts', async (req, res, next) => {
  try {
    const pool = require('../db/connexion');
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM alerte_capteur';
    const params = [];
    
    if (status && status !== 'all') {
      query += ' WHERE statut = $1';
      params.push(status);
    }
    
    query += ' ORDER BY date_creation DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    const countResult = await pool.query(
      status && status !== 'all' 
        ? 'SELECT COUNT(*)::int as total FROM alerte_capteur WHERE statut = $1'
        : 'SELECT COUNT(*)::int as total FROM alerte_capteur',
      status && status !== 'all' ? [status] : []
    );
    
    res.json({
      success: true,
      data: result.rows,
      total: countResult.rows[0].total
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.setController = setController;
