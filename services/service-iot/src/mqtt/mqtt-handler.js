/**
 * Gestionnaire de messages MQTT
 * Parse, valide et traite les données des capteurs IoT
 */
const logger = require('../utils/logger');
const kafkaProducer = require('../../kafkaProducer');

class MqttHandler {
  constructor(measurementService, alertService) {
    this.measurementService = measurementService;
    this.alertService = alertService;
    this.processedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Traite un message MQTT reçu
   * Topic attendu : containers/{uid_capteur}/data
   * Payload JSON : { fill_level, battery, temperature }
   */
  async handleMessage(topic, payload) {
    // Extraire l'UID du capteur depuis le topic
    const topicParts = topic.split('/');
    if (topicParts.length !== 3 || topicParts[0] !== 'containers' || topicParts[2] !== 'data') {
      logger.warn({ topic }, 'MQTT topic format invalid, ignored');
      return;
    }
    const uidCapteur = topicParts[1];

    // Parser le payload JSON
    let data;
    try {
      data = JSON.parse(payload.toString());
    } catch (err) {
      this.errorCount++;
      logger.error({ topic, error: err.message }, 'Invalid JSON payload');
      return;
    }

    // Valider les données
    const validation = this._validateData(data);
    if (!validation.valid) {
      this.errorCount++;
      logger.warn({
        uidCapteur,
        errors: validation.errors
      }, 'Sensor data validation failed');
      return;
    }

    try {
      // Stocker la mesure en base
      const measurement = await this.measurementService.processMeasurement(uidCapteur, {
        niveau_remplissage_pct: data.fill_level,
        batterie_pct: data.battery,
        temperature: data.temperature !== undefined ? data.temperature : null
      });

      if (!measurement) {
        this.errorCount++;
        logger.warn({ uidCapteur }, 'Sensor not found in database');
        return;
      }

      this.processedCount++;

      await kafkaProducer.sendSensorData({
        capteur_id: measurement.id_capteur,
        capteurId: measurement.id_capteur,
        uid_capteur: measurement.uid_capteur,
        id_conteneur: measurement.id_conteneur,
        id_zone: measurement.id_zone,
        fill_level: data.fill_level,
        battery: data.battery,
        temperature: data.temperature !== undefined ? data.temperature : null
      });

      // Vérifier les seuils d'alerte
      await this.alertService.checkThresholds(measurement);

      logger.info({
        uidCapteur,
        fillLevel: data.fill_level,
        battery: data.battery,
        containerId: measurement.id_conteneur
      }, 'Sensor data processed successfully');

    } catch (err) {
      this.errorCount++;
      logger.error({
        uidCapteur,
        error: err.message
      }, 'Error processing sensor data');
    }
  }

  /**
   * Valide les données brutes du capteur
   */
  _validateData(data) {
    const errors = [];

    if (data.fill_level === undefined || data.fill_level === null) {
      errors.push('fill_level is required');
    } else if (typeof data.fill_level !== 'number' || data.fill_level < 0 || data.fill_level > 100) {
      errors.push('fill_level must be a number between 0 and 100');
    }

    if (data.battery === undefined || data.battery === null) {
      errors.push('battery is required');
    } else if (typeof data.battery !== 'number' || data.battery < 0 || data.battery > 100) {
      errors.push('battery must be a number between 0 and 100');
    }

    if (data.temperature !== undefined && data.temperature !== null) {
      if (typeof data.temperature !== 'number' || data.temperature < -50 || data.temperature > 100) {
        errors.push('temperature must be a number between -50 and 100');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getStats() {
    return {
      processed: this.processedCount,
      errors: this.errorCount
    };
  }
}

module.exports = MqttHandler;
