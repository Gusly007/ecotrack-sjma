/**
 * Service de gestion des alertes automatiques
 * Vérifie les seuils et crée des alertes si nécessaire
 * Envoie des notifications au service-users
 */
const logger = require('../utils/logger');
const config = require('../config/config');
const ApiError = require('../utils/api-error');
const kafkaProducer = require('../../kafkaProducer');

class AlertService {
  constructor(alertRepository, sensorRepository, notificationService) {
    this.alertRepository = alertRepository;
    this.sensorRepository = sensorRepository;
    this.notificationService = notificationService;
  }

  /**
   * Vérifie les seuils d'alerte après réception d'une mesure
   * - fill_level > 90% → alerte DEBORDEMENT
   * - battery < 20% → alerte BATTERIE_FAIBLE
   * - temperature anormale → alerte CAPTEUR_DEFAILLANT
   */
  async checkThresholds(measurement) {
    const alerts = [];

    // Vérification niveau de remplissage critique
    if (measurement.niveau_remplissage_pct >= config.ALERTS.FILL_LEVEL_CRITICAL) {
      const alert = await this._createAlertIfNew(
        measurement.id_conteneur,
        config.ALERT_TYPES.DEBORDEMENT,
        measurement.niveau_remplissage_pct,
        config.ALERTS.FILL_LEVEL_CRITICAL,
        `Niveau de remplissage critique : ${measurement.niveau_remplissage_pct}% (seuil: ${config.ALERTS.FILL_LEVEL_CRITICAL}%)`
      );
      if (alert) alerts.push(alert);
    }

    // Vérification batterie faible
    if (measurement.batterie_pct <= config.ALERTS.BATTERY_LOW) {
      const alert = await this._createAlertIfNew(
        measurement.id_conteneur,
        config.ALERT_TYPES.BATTERIE_FAIBLE,
        measurement.batterie_pct,
        config.ALERTS.BATTERY_LOW,
        `Batterie faible : ${measurement.batterie_pct}% (seuil: ${config.ALERTS.BATTERY_LOW}%)`
      );
      if (alert) alerts.push(alert);
    }

    // Vérification température anormale
    if (measurement.temperature !== null && measurement.temperature !== undefined) {
      if (measurement.temperature < config.ALERTS.TEMPERATURE_MIN ||
          measurement.temperature > config.ALERTS.TEMPERATURE_MAX) {
        const alert = await this._createAlertIfNew(
          measurement.id_conteneur,
          config.ALERT_TYPES.CAPTEUR_DEFAILLANT,
          measurement.temperature,
          measurement.temperature < config.ALERTS.TEMPERATURE_MIN
            ? config.ALERTS.TEMPERATURE_MIN
            : config.ALERTS.TEMPERATURE_MAX,
          `Température anormale : ${measurement.temperature}°C (plage normale: ${config.ALERTS.TEMPERATURE_MIN}°C - ${config.ALERTS.TEMPERATURE_MAX}°C)`
        );
        if (alert) alerts.push(alert);
      }
    }

    // Envoyer les notifications
    for (const alert of alerts) {
      try {
        await this.notificationService.sendAlertNotification(alert, measurement);
      } catch (error) {
        logger.error({ alertId: alert.id_alerte, error: error.message }, 'Failed to send notification');
      }
    }

    if (alerts.length > 0) {
      logger.info({
        containerId: measurement.id_conteneur,
        alertCount: alerts.length,
        types: alerts.map(a => a.type_alerte)
      }, 'Alerts created');
    }

    return alerts;
  }

  /**
   * Détecte les capteurs silencieux et crée des alertes
   */
  async checkSilentSensors() {
    const silentSensors = await this.sensorRepository.findSilentSensors(config.ALERTS.SENSOR_TIMEOUT_HOURS);

    const alerts = [];
    for (const sensor of silentSensors) {
      const alert = await this._createAlertIfNew(
        sensor.id_conteneur,
        config.ALERT_TYPES.CAPTEUR_DEFAILLANT,
        config.ALERTS.SENSOR_TIMEOUT_HOURS,
        config.ALERTS.SENSOR_TIMEOUT_HOURS,
        `Capteur ${sensor.uid_capteur} silencieux depuis plus de ${config.ALERTS.SENSOR_TIMEOUT_HOURS}h`
      );
      if (alert) alerts.push(alert);
    }

    if (alerts.length > 0) {
      logger.info({ count: alerts.length }, 'Silent sensor alerts created');
    }

    return alerts;
  }

  /**
   * Crée une alerte uniquement si aucune alerte active n'existe déjà pour ce conteneur/type
   */
  async _createAlertIfNew(idConteneur, typeAlerte, valeurDetectee, seuil, description) {
    // Vérifier s'il existe déjà une alerte active
    const existing = await this.alertRepository.findActiveByContainerAndType(idConteneur, typeAlerte);
    if (existing) {
      logger.info({
        containerId: idConteneur,
        type: typeAlerte
      }, 'Active alert already exists, skipping');
      return null;
    }

    const alert = await this.alertRepository.create({
      type_alerte: typeAlerte,
      valeur_detectee: valeurDetectee,
      seuil,
      description,
      id_conteneur: idConteneur
    });

    logger.warn({
      alertId: alert.id_alerte,
      type: typeAlerte,
      containerId: idConteneur,
      value: valeurDetectee
    }, 'New alert created');

    await kafkaProducer.sendAlert(alert);
    await kafkaProducer.sendContainerStatus(idConteneur, 'ALERTE_ACTIVE');

    return alert;
  }

  /**
   * Récupère les alertes avec filtres
   */
  async getAlerts(filters) {
    return this.alertRepository.findAll(filters);
  }

  /**
   * Met à jour le statut d'une alerte (résoudre/ignorer)
   */
  async updateAlertStatus(idAlerte, statut) {
    const alert = await this.alertRepository.findById(idAlerte);
    if (!alert) {
      throw new ApiError(404, `Alerte ${idAlerte} non trouvée`);
    }
    if (alert.statut !== 'ACTIVE') {
      throw new ApiError(400, `L'alerte ${idAlerte} n'est pas active (statut: ${alert.statut})`);
    }
    return this.alertRepository.updateStatus(idAlerte, statut);
  }

  /**
   * Statistiques des alertes
   */
  async getAlertStats() {
    return this.alertRepository.getStats();
  }
}

module.exports = AlertService;
