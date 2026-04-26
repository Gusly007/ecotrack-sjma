/**
 * Service de traitement des mesures capteur
 * Reçoit les données, les stocke et met à jour les capteurs/conteneurs
 */
const logger = require('../utils/logger');
const ApiError = require('../utils/api-error');

class MeasurementService {
  constructor(measurementRepository, sensorRepository) {
    this.measurementRepository = measurementRepository;
    this.sensorRepository = sensorRepository;
  }

  /**
   * Traite une mesure reçue d'un capteur MQTT
   * 1. Trouve le capteur par UID
   * 2. Insère la mesure
   * 3. Met à jour la dernière communication du capteur
   * Retourne la mesure enrichie ou null si capteur non trouvé
   */
  async processMeasurement(uidCapteur, data) {
    // Trouver le capteur
    const sensor = await this.sensorRepository.findByUid(uidCapteur);
    if (!sensor) {
      logger.warn({ uidCapteur }, 'Sensor not found for UID');
      return null;
    }

    // Insérer la mesure
    const measurement = await this.measurementRepository.create({
      niveau_remplissage_pct: data.niveau_remplissage_pct,
      batterie_pct: data.batterie_pct,
      temperature: data.temperature,
      id_capteur: sensor.id_capteur,
      id_conteneur: sensor.id_conteneur
    });

    // Mettre à jour la dernière communication
    await this.sensorRepository.updateLastCommunication(sensor.id_capteur);

    // Enrichir la mesure avec les infos du capteur
    return {
      ...measurement,
      uid_capteur: sensor.uid_capteur,
      uid_conteneur: sensor.uid_conteneur,
      id_conteneur: sensor.id_conteneur,
      id_zone: sensor.id_zone
    };
  }

  /**
   * Récupère les mesures avec filtres et pagination
   */
  async getMeasurements(filters) {
    return this.measurementRepository.findAll(filters);
  }

  /**
   * Récupère les mesures d'un conteneur spécifique
   */
  async getMeasurementsByContainer(idConteneur, limit) {
    const measurements = await this.measurementRepository.findByContainerId(idConteneur, limit);
    if (!measurements.length) {
      throw new ApiError(404, `Aucune mesure trouvée pour le conteneur ${idConteneur}`);
    }
    return measurements;
  }

  /**
   * Récupère la dernière mesure de chaque conteneur
   */
  async getLatestMeasurements() {
    return this.measurementRepository.findLatestPerContainer();
  }

  /**
   * Statistiques globales des mesures
   */
  async getStats() {
    return this.measurementRepository.getStats();
  }
}

module.exports = MeasurementService;
