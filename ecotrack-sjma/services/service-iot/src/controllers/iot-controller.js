/**
 * Contrôleur IoT - Endpoints REST pour les mesures, capteurs et alertes
 */
const ApiResponse = require('../utils/api-response');

class IotController {
  constructor(measurementService, sensorService, alertService, mqttHandler) {
    this.measurementService = measurementService;
    this.sensorService = sensorService;
    this.alertService = alertService;
    this.mqttHandler = mqttHandler;

    // Bind des méthodes pour conserver le contexte
    this.getMeasurements = this.getMeasurements.bind(this);
    this.getMeasurementsByContainer = this.getMeasurementsByContainer.bind(this);
    this.getLatestMeasurements = this.getLatestMeasurements.bind(this);
    this.getSensors = this.getSensors.bind(this);
    this.getSensorById = this.getSensorById.bind(this);
    this.getAlerts = this.getAlerts.bind(this);
    this.updateAlertStatus = this.updateAlertStatus.bind(this);
    this.simulate = this.simulate.bind(this);
    this.checkSilentSensors = this.checkSilentSensors.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  /**
   * GET /measurements - Liste des mesures avec filtres
   */
  async getMeasurements(req, res, next) {
    try {
      const { rows, total } = await this.measurementService.getMeasurements(req.query);
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      res.json(ApiResponse.paginated(rows, page, limit, total, 'Mesures récupérées'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /measurements/container/:id - Mesures d'un conteneur
   */
  async getMeasurementsByContainer(req, res, next) {
    try {
      const idConteneur = parseInt(req.params.id, 10);
      const limit = parseInt(req.query.limit, 10) || 100;
      const measurements = await this.measurementService.getMeasurementsByContainer(idConteneur, limit);
      res.json(ApiResponse.success(measurements, 'Mesures du conteneur récupérées'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /measurements/latest - Dernière mesure de chaque conteneur
   */
  async getLatestMeasurements(req, res, next) {
    try {
      const measurements = await this.measurementService.getLatestMeasurements();
      res.json(ApiResponse.success(measurements, 'Dernières mesures récupérées'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /sensors - Liste des capteurs
   */
  async getSensors(req, res, next) {
    try {
      const { rows, total } = await this.sensorService.getSensors(req.query);
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      res.json(ApiResponse.paginated(rows, page, limit, total, 'Capteurs récupérés'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /sensors/:id - Détails d'un capteur
   */
  async getSensorById(req, res, next) {
    try {
      const idCapteur = parseInt(req.params.id, 10);
      const sensor = await this.sensorService.getSensorById(idCapteur);
      res.json(ApiResponse.success(sensor, 'Capteur récupéré'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /alerts - Liste des alertes
   */
  async getAlerts(req, res, next) {
    try {
      const { rows, total } = await this.alertService.getAlerts(req.query);
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      res.json(ApiResponse.paginated(rows, page, limit, total, 'Alertes récupérées'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /alerts/:id - Résoudre/ignorer une alerte
   */
  async updateAlertStatus(req, res, next) {
    try {
      const idAlerte = parseInt(req.params.id, 10);
      const { statut } = req.body;
      const alert = await this.alertService.updateAlertStatus(idAlerte, statut);
      res.json(ApiResponse.success(alert, `Alerte ${statut === 'RESOLUE' ? 'résolue' : 'ignorée'}`));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /simulate - Simuler l'envoi de données d'un capteur (pour tests)
   */
  async simulate(req, res, next) {
    try {
      const { uid_capteur, fill_level, battery, temperature } = req.body;
      const topic = `containers/${uid_capteur}/data`;
      const payload = JSON.stringify({ fill_level, battery, temperature });

      await this.mqttHandler.handleMessage(topic, Buffer.from(payload));

      res.status(201).json(ApiResponse.success(
        { uid_capteur, fill_level, battery, temperature },
        'Données simulées traitées avec succès',
        201
      ));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /check-silent - Vérifier les capteurs silencieux
   */
  async checkSilentSensors(req, res, next) {
    try {
      const alerts = await this.alertService.checkSilentSensors();
      res.json(ApiResponse.success(
        { alerts_created: alerts.length, alerts },
        `Vérification terminée : ${alerts.length} alerte(s) créée(s)`
      ));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /stats - Statistiques IoT globales
   */
  async getStats(req, res, next) {
    try {
      const [measurementStats, alertStats] = await Promise.all([
        this.measurementService.getStats(),
        this.alertService.getAlertStats()
      ]);

      const mqttStats = this.mqttHandler ? this.mqttHandler.getStats() : { processed: 0, errors: 0 };

      res.json(ApiResponse.success({
        measurements: measurementStats,
        alerts: alertStats,
        mqtt: mqttStats
      }, 'Statistiques IoT récupérées'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = IotController;
