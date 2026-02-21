const Validators = require('../utils/Validators');
const logger = require('../utils/logger');

class ContainerServices {
  constructor(containerRepository, socketService = null) {
    this.repository = containerRepository;
    this.socketService = socketService;
  }

  /**
   * Crée un nouveau conteneur
   */
  async createContainer(data) {
    Validators.validateContainerData(data); // Validation des données du conteneur
    return this.repository.createContainer(data);
  }

  /**
   * Met à jour un conteneur
   */
  async updateContainer(id, data) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    Validators.validateContainerData(data, { isUpdate: true }); // Validation des données du conteneur
    return this.repository.updateContainer(id, data);
  }

  /**
   * Change le statut d'un conteneur et émet l'événement Socket
   */
  async updateStatus(id, statut) {
    Validators.validateStatut(statut); // Validation du statut  
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    const result = await this.repository.updateStatus(id, statut);
    
    // Émettre le changement via Socket.IO si le statut a changé et que Socket.IO est disponible
    if (result.changed && this.socketService) {
      try {
        const container = await this.repository.getContainerById(id);
        if (container && container.id_zone) {
          this.socketService.emitStatusChange(container.id_zone, result);
        }
      } catch (error) {
        logger.error({ error: error.message }, 'Socket emission error');
      }
    }
    
    return result;
  }

  /**
   * Récupère un conteneur par ID
   */
  async getContainerById(id) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    return this.repository.getContainerById(id);
  }

  /**
   * Récupère un conteneur par UID
   */
  async getContainerByUid(uid) {
    Validators.validateContainerUid(uid); // Validation de l'UID du conteneur
    return this.repository.getContainerByUid(uid);
  }

  /**
   * Récupère tous les conteneurs
   */
  async getAllContainers(options = {}) {
    const { page = 1, limit = 50, ...filters } = options;
    Validators.validatePagination(page, limit); // Validation des options de pagination
    return this.repository.getAllContainers({ page, limit, ...filters });
  }

  /**
   * Récupère les conteneurs par statut
   */
  async getContainersByStatus(statut) {
    Validators.validateStatut(statut); // Validation du statut
    return this.repository.getContainersByStatus(statut);
  }

  /**
   * Récupère les conteneurs par zone
   */
  async getContainersByZone(idZone) {
    Validators.validateZoneId(idZone); // Validation de l'ID de la zone
    return this.repository.getContainersByZone(idZone);
  }

  /**
   * Recherche les conteneurs dans un rayon
   */
  async getContainersInRadius(latitude, longitude, radiusKm) {
    Validators.validateCoordinates(latitude, longitude); // Validation des coordonnées
    Validators.validateRadius(radiusKm); // Validation du rayon
    return this.repository.getContainersInRadius(latitude, longitude, radiusKm);
  }

  /**
   * Supprime un conteneur
   */
  async deleteContainer(id) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    return this.repository.deleteContainer(id);
  }

  /**
   * Supprime tous les conteneurs
   */
  async deleteAllContainers() {
    return this.repository.deleteAllContainers();
  }

  /**
   * Compte le nombre de conteneurs
   */
  async countContainers(filters = {}) {
    return this.repository.countContainers(filters);
  }

  /**
   * Vérifie si un conteneur existe
   */
  async existContainer(id) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    return this.repository.existContainer(id);
  }

  /**
   * Vérifie si un UID existe
   */
  async existByUid(uid) {
    Validators.validateContainerUid(uid); // Validation de l'UID du conteneur
    return this.repository.existByUid(uid);
  }

  /**
   * Récupère les statistiques des conteneurs
   */
  async getStatistics() {
    return this.repository.getStatistics();
  }

  /**
   * Récupère l'historique des changements de statut d'un conteneur
   */
  async getHistoriqueStatut(id_conteneur, options = {}) {
    Validators.validateContainerId(id_conteneur); // Validation de l'ID du conteneur  
    return this.repository.getHistoriqueStatut(id_conteneur, options);
  }

  /**
   * Recupere les conteneurs avec leur niveau de remplissage
   */
  async getContainersByFillLevel(options = {}) {
    return this.repository.getContainersByFillLevel(options);
  }

  /**
   * Compte le nombre de changements de statut d'un conteneur
   */
  async countHistoriqueStatut(id_conteneur) {
    Validators.validateContainerId(id_conteneur); // Validation de l'ID du conteneur  
    return this.repository.countHistoriqueStatut(id_conteneur);
  }
}

module.exports = ContainerServices;
