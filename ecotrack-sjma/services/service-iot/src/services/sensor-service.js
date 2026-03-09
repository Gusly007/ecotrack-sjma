/**
 * Service pour les capteurs
 */
const ApiError = require('../utils/api-error');

class SensorService {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  /**
   * Liste tous les capteurs avec pagination
   */
  async getSensors(filters) {
    return this.sensorRepository.findAll(filters);
  }

  /**
   * Récupère un capteur par son ID
   */
  async getSensorById(idCapteur) {
    const sensor = await this.sensorRepository.findById(idCapteur);
    if (!sensor) {
      throw new ApiError(404, `Capteur ${idCapteur} non trouvé`);
    }
    return sensor;
  }

  /**
   * Récupère un capteur par son UID
   */
  async getSensorByUid(uid) {
    const sensor = await this.sensorRepository.findByUid(uid);
    if (!sensor) {
      throw new ApiError(404, `Capteur ${uid} non trouvé`);
    }
    return sensor;
  }
}

module.exports = SensorService;
