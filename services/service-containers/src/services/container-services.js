const Validators = require('../utils/Validators');

class ContainerServices {
  constructor(containerModel, socketService = null) {
    this.model = containerModel;
    this.socketService = socketService;
  }

  /**
   * Crée un nouveau conteneur
   */
  async createContainer(data) {
    Validators.validateContainerData(data); // Validation des données du conteneur
    return this.model.createContainer(data);
  }

  /**
   * Met à jour un conteneur
   */
  async updateContainer(id, data) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    Validators.validateContainerData(data, { isUpdate: true }); // Validation des données du conteneur
    return this.model.updateContainer(id, data);
  }

  /**
   * Change le statut d'un conteneur et émet l'événement Socket
   */
  async updateStatus(id, statut) {
    Validators.validateStatut(statut); // Validation du statut  
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    const result = await this.model.updateStatus(id, statut);
    
    // Émettre le changement via Socket.IO si le statut a changé et que Socket.IO est disponible
    if (result.changed && this.socketService) {
      try {
        const container = await this.model.getContainerById(id);
        if (container && container.id_zone) {
          this.socketService.emitStatusChange(container.id_zone, result);
        }
      } catch (error) {
        console.error('[Socket] Erreur lors de l\'émission du changement de statut:', error.message);
      }
    }
    
    return result;
  }

  /**
   * Récupère un conteneur par ID
   */
  async getContainerById(id) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    return this.model.getContainerById(id);
  }

  /**
   * Récupère un conteneur par UID
   */
  async getContainerByUid(uid) {
    Validators.validateContainerUid(uid); // Validation de l'UID du conteneur
    return this.model.getContainerByUid(uid);
  }

  /**
   * Récupère tous les conteneurs
   */
  async getAllContainers(options = {}) {
    const { page = 1, limit = 50, ...filters } = options;
    Validators.validatePagination(page, limit); // Validation des options de pagination
    return this.model.getAllContainers({ page, limit, ...filters });
  }

  /**
   * Récupère les conteneurs par statut
   */
  async getContainersByStatus(statut) {
    Validators.validateStatut(statut); // Validation du statut
    return this.model.getContainersByStatus(statut);
  }

  /**
   * Récupère les conteneurs par zone
   */
  async getContainersByZone(idZone) {
    Validators.validateZoneId(idZone); // Validation de l'ID de la zone
    return this.model.getContainersByZone(idZone);
  }

  /**
   * Recherche les conteneurs dans un rayon
   */
  async getContainersInRadius(latitude, longitude, radiusKm) {
    Validators.validateCoordinates(latitude, longitude); // Validation des coordonnées
    Validators.validateRadius(radiusKm); // Validation du rayon
    return this.model.getContainersInRadius(latitude, longitude, radiusKm);
  }

  /**
   * Supprime un conteneur
   */
  async deleteContainer(id) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    return this.model.deleteContainer(id);
  }

  /**
   * Supprime tous les conteneurs
   */
  async deleteAllContainers() {
    return this.model.deleteAllContainers();
  }

  /**
   * Compte le nombre de conteneurs
   */
  async countContainers(filters = {}) {
    return this.model.countContainers(filters);
  }

  /**
   * Vérifie si un conteneur existe
   */
  async existContainer(id) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    return this.model.existContainer(id);
  }

  /**
   * Vérifie si un UID existe
   */
  async existByUid(uid) {
    Validators.validateContainerUid(uid); // Validation de l'UID du conteneur
    return this.model.existByUid(uid);
  }

  /**
   * Récupère les statistiques des conteneurs
   */
  async getStatistics() {
    return this.model.getStatistics();
  }

  /**
   * Récupère l'historique des changements de statut d'un conteneur
   */
  async getHistoriqueStatut(id_conteneur, options = {}) {
    Validators.validateContainerId(id_conteneur); // Validation de l'ID du conteneur  
    return this.model.getHistoriqueStatut(id_conteneur, options);
  }

  /**
   * Recupere les conteneurs avec leur niveau de remplissage
   */
  async getContainersByFillLevel(options = {}) {
    return this.model.getContainersByFillLevel(options);
  }

  /**
   * Compte le nombre de changements de statut d'un conteneur
   */
  async countHistoriqueStatut(id_conteneur) {
    Validators.validateContainerId(id_conteneur); // Validation de l'ID du conteneur  
    return this.model.countHistoriqueStatut(id_conteneur);
  }
}

module.exports = ContainerServices;
