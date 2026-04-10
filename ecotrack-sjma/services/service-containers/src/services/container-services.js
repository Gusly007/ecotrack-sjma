const Validators = require('../utils/Validators');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

const CONTAINER_TTL = 120; // 2 minutes
const CONTAINERS_LIST_TTL = 60; // 1 minute

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
    const result = await this.repository.createContainer(data);
    
    // Invalidate containers list cache
    await cacheService.invalidatePattern('containers:list:*');
    
    return result;
  }

  /**
   * Met à jour un conteneur
   */
  async updateContainer(id, data) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    Validators.validateContainerData(data, { isUpdate: true }); // Validation des données du conteneur
    const result = await this.repository.updateContainer(id, data);
    
    // Invalidate container cache
    await cacheService.del(`container:${id}`);
    await cacheService.invalidatePattern('containers:list:*');
    
    return result;
  }

  /**
   * Change le statut d'un conteneur et émet l'événement Socket
   */
  async updateStatus(id, statut) {
    Validators.validateStatut(statut); // Validation du statut  
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    const result = await this.repository.updateStatus(id, statut);
    
    // Invalidate container cache
    await cacheService.del(`container:${id}`);
    
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
   * Récupère un conteneur par ID (avec cache)
   */
  async getContainerById(id) {
    Validators.validateContainerId(id); // Validation de l'ID du conteneur
    
    const cacheKey = `container:${id}`;
    const result = await cacheService.getOrSet(
      cacheKey,
      () => this.repository.getContainerById(id),
      CONTAINER_TTL
    );
    
    return result.data;
  }

  /**
   * Récupère un conteneur par UID (avec cache)
   */
  async getContainerByUid(uid) {
    Validators.validateContainerUid(uid); // Validation de l'UID du conteneur
    
    const cacheKey = `container:uid:${uid}`;
    const result = await cacheService.getOrSet(
      cacheKey,
      () => this.repository.getContainerByUid(uid),
      CONTAINER_TTL
    );
    
    return result.data;
  }

  /**
   * Récupère tous les conteneurs (avec cache)
   */
  async getAllContainers(options = {}) {
    const { page = 1, limit = 50, ...filters } = options;
    Validators.validatePagination(page, limit); // Validation des options de pagination
    
    // Create cache key from options
    const cacheKey = `containers:list:${page}:${limit}:${JSON.stringify(filters)}`;
    
    const result = await cacheService.getOrSet(
      cacheKey,
      () => this.repository.getAllContainers({ page, limit, ...filters }),
      CONTAINERS_LIST_TTL
    );
    
    return result.data;
  }

  /**
   * Récupère les conteneurs par statut (avec cache)
   */
  async getContainersByStatus(statut) {
    Validators.validateStatut(statut); // Validation du statut

    const cacheKey = `containers:status:${statut}`;
    const result = await cacheService.getOrSet(
      cacheKey,
      () => this.repository.getContainersByStatus(statut),
      CONTAINER_TTL
    );

    return result.data;
  }

  /**
   * Récupère les conteneurs par zone (avec cache)
   */
  async getContainersByZone(idZone) {
    Validators.validateZoneId(idZone); // Validation de l'ID de la zone
    
    const cacheKey = `containers:zone:${idZone}`;
    const result = await cacheService.getOrSet(
      cacheKey,
      () => this.repository.getContainersByZone(idZone),
      CONTAINER_TTL
    );
    
    return result.data;
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
    const result = await this.repository.deleteContainer(id);
    
    // Invalidate container cache
    await cacheService.del(`container:${id}`);
    await cacheService.invalidatePattern('containers:list:*');
    
    return result;
  }

  /**
   * Supprime tous les conteneurs
   */
  async deleteAllContainers() {
    const result = await this.repository.deleteAllContainers();
    
    // Invalidate all containers cache
    await cacheService.invalidatePattern('container:*');
    await cacheService.invalidatePattern('containers:*');
    
    return result;
  }

  /**
   * Compte le nombre de conteneurs
   */
  async countContainers() {
    const cacheKey = 'containers:count';
    const result = await cacheService.getOrSet(
      cacheKey,
      () => this.repository.countContainers(),
      CONTAINER_TTL
    );
    
    return result.data;
  }
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
