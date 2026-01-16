class ContainerServices {
  constructor(containerModel, socketService = null) {
    this.model = containerModel;
    this.socketService = socketService;
  }

  /**
   * Crée un nouveau conteneur
   */
  async createContainer(data) {
    return this.model.createContainer(data);
  }

  /**
   * Met à jour un conteneur
   */
  async updateContainer(id, data) {
    return this.model.updateContainer(id, data);
  }

  /**
   * Change le statut d'un conteneur et émet l'événement Socket
   */
  async updateStatus(id, statut) {
    const result = await this.model.updateStatus(id, statut);
    console.log('[DEBUG] updateStatus result:', result);
    console.log('[DEBUG] socketService exists:', !!this.socketService);
    
    // Émettre le changement via Socket.IO si le statut a changé et que Socket.IO est disponible
    if (result.changed && this.socketService) {
      try {
        const container = await this.model.getContainerById(id);
        console.log('[DEBUG] container:', container);
        if (container && container.id_zone) {
          console.log('[DEBUG] Emitting to zone:', container.id_zone);
          this.socketService.emitStatusChange(container.id_zone, result);
        } else {
          console.log('[DEBUG] No zone or no container');
        }
      } catch (error) {
        console.error('[Socket] Erreur lors de l\'émission du changement de statut:', error.message);
      }
    } else {
      console.log('[DEBUG] Not emitting - changed:', result.changed, 'socketService:', !!this.socketService);
    }
    
    return result;
  }

  /**
   * Récupère un conteneur par ID
   */
  async getContainerById(id) {
    return this.model.getContainerById(id);
  }

  /**
   * Récupère un conteneur par UID
   */
  async getContainerByUid(uid) {
    return this.model.getContainerByUid(uid);
  }

  /**
   * Récupère tous les conteneurs
   */
  async getAllContainers(options = {}) {
    return this.model.getAllContainers(options);
  }

  /**
   * Récupère les conteneurs par statut
   */
  async getContainersByStatus(statut) {
    return this.model.getContainersByStatus(statut);
  }

  /**
   * Récupère les conteneurs par zone
   */
  async getContainersByZone(id_zone) {
    return this.model.getContainersByZone(id_zone);
  }

  /**
   * Recherche les conteneurs dans un rayon
   */
  async getContainersInRadius(latitude, longitude, radiusKm) {
    return this.model.getContainersInRadius(latitude, longitude, radiusKm);
  }

  /**
   * Supprime un conteneur
   */
  async deleteContainer(id) {
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
    return this.model.existContainer(id);
  }

  /**
   * Vérifie si un UID existe
   */
  async existByUid(uid) {
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
    return this.model.getHistoriqueStatut(id_conteneur, options);
  }

  /**
   * Compte le nombre de changements de statut d'un conteneur
   */
  async countHistoriqueStatut(id_conteneur) {
    return this.model.countHistoriqueStatut(id_conteneur);
  }
}

module.exports = ContainerServices;
