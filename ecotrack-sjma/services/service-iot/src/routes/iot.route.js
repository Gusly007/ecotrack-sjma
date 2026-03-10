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
const { validate, validateQuery, validateParamId, simulateSchema, alertUpdateSchema, paginationSchema } = require('../validators/iot.validator');

// Rate limiter pour les routes d'administration (10 req/min)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes, réessayez dans 1 minute',
    timestamp: new Date().toISOString()
  }
});

// Le contrôleur est injecté via le DI container
let controller;

function setController(ctrl) {
  controller = ctrl;
}

// ========== MESURES ==========

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
router.get('/iot/measurements', validateQuery(paginationSchema), (req, res, next) => controller.getMeasurements(req, res, next));

/**
 * @swagger
 * /iot/measurements/latest:
 *   get:
 *     summary: Dernière mesure de chaque conteneur
 *     tags: [Mesures]
 *     responses:
 *       200:
 *         description: Dernières mesures par conteneur
 */
router.get('/iot/measurements/latest', (req, res, next) => controller.getLatestMeasurements(req, res, next));

/**
 * @swagger
 * /iot/measurements/container/{id}:
 *   get:
 *     summary: Mesures d'un conteneur spécifique
 *     tags: [Mesures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID du conteneur
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: Mesures du conteneur
 *       404:
 *         description: Aucune mesure trouvée
 */
router.get('/iot/measurements/container/:id', validateParamId, (req, res, next) => controller.getMeasurementsByContainer(req, res, next));

// ========== CAPTEURS ==========

/**
 * @swagger
 * /iot/sensors:
 *   get:
 *     summary: Liste des capteurs avec leur dernière mesure
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
 *         description: Liste des capteurs avec pagination
 */
router.get('/iot/sensors', validateQuery(paginationSchema), (req, res, next) => controller.getSensors(req, res, next));

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
router.get('/iot/sensors/:id', validateParamId, (req, res, next) => controller.getSensorById(req, res, next));

// ========== ALERTES ==========

/**
 * @swagger
 * /iot/alerts:
 *   get:
 *     summary: Liste des alertes avec filtres
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
 *         schema: { type: string, enum: [ACTIVE, RESOLUE, IGNOREE] }
 *       - in: query
 *         name: type_alerte
 *         schema: { type: string, enum: [DEBORDEMENT, BATTERIE_FAIBLE, CAPTEUR_DEFAILLANT] }
 *       - in: query
 *         name: id_conteneur
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des alertes avec pagination
 */
router.get('/iot/alerts', validateQuery(paginationSchema), (req, res, next) => controller.getAlerts(req, res, next));

/**
 * @swagger
 * /iot/alerts/{id}:
 *   patch:
 *     summary: Mettre à jour le statut d'une alerte (résoudre/ignorer)
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
 *             required: [statut]
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [RESOLUE, IGNOREE]
 *     responses:
 *       200:
 *         description: Alerte mise à jour
 *       404:
 *         description: Alerte non trouvée
 *       400:
 *         description: Alerte déjà traitée
 */
router.patch('/iot/alerts/:id', validateParamId, validate(alertUpdateSchema), (req, res, next) => controller.updateAlertStatus(req, res, next));

// ========== ADMINISTRATION ==========

/**
 * @swagger
 * /iot/simulate:
 *   post:
 *     summary: Simuler l'envoi de données capteur (pour tests)
 *     tags: [IoT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uid_capteur, fill_level, battery]
 *             properties:
 *               uid_capteur:
 *                 type: string
 *                 example: "CAP-001"
 *               fill_level:
 *                 type: number
 *                 example: 85.5
 *               battery:
 *                 type: number
 *                 example: 92.0
 *               temperature:
 *                 type: number
 *                 example: 22.3
 *     responses:
 *       201:
 *         description: Données simulées traitées
 */
router.post('/iot/simulate', adminLimiter, validate(simulateSchema), (req, res, next) => controller.simulate(req, res, next));

/**
 * @swagger
 * /iot/check-silent:
 *   post:
 *     summary: Vérifier les capteurs silencieux
 *     tags: [IoT]
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 */
router.post('/iot/check-silent', adminLimiter, (req, res, next) => controller.checkSilentSensors(req, res, next));

/**
 * @swagger
 * /iot/stats:
 *   get:
 *     summary: Statistiques globales du service IoT
 *     tags: [IoT]
 *     responses:
 *       200:
 *         description: Statistiques mesures, alertes et MQTT
 */
router.get('/iot/stats', (req, res, next) => controller.getStats(req, res, next));

module.exports = router;
module.exports.setController = setController;
