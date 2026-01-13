class ContainerController {
  constructor(service) {
    this.service = service;

    // 🔒 binding pour Express
    // It ensures that the methods have the correct 'this' context when called as route handlers in Express.
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.getById = this.getById.bind(this);
    this.getByUid = this.getByUid.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getByStatus = this.getByStatus.bind(this);
    this.getByZone = this.getByZone.bind(this);
    this.getInRadius = this.getInRadius.bind(this);
    this.delete = this.delete.bind(this);
    this.deleteAll = this.deleteAll.bind(this);
    this.count = this.count.bind(this);
    this.exists = this.exists.bind(this);
    this.existsByUid = this.existsByUid.bind(this);
    this.getStatistics = this.getStatistics.bind(this);
    this.getStatusHistory = this.getStatusHistory.bind(this);
  }

  /**
   * Crée un nouveau conteneur
   */
  async create(req, res) {
    try {
      const { capacite_l, statut, latitude, longitude, id_zone, id_type } = req.body;

      if (!capacite_l || !statut || latitude == null || longitude == null) {
        return res.status(400).json({ 
          message: 'Champs requis manquants: capacite_l, statut, latitude, longitude' 
        });
      }

      const container = await this.service.createContainer(req.body);
      return res.status(201).json(container);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Met à jour un conteneur
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID est requis' });
      }

      const updated = await this.service.updateContainer(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Conteneur introuvable' });
      }

      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Change le statut d'un conteneur
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      if (!statut) {
        return res.status(400).json({ message: 'Statut est requis' });
      }

      const updated = await this.service.updateStatus(id, statut);
      if (!updated) {
        return res.status(404).json({ message: 'Conteneur introuvable' });
      }

      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère un conteneur par ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const container = await this.service.getContainerById(id);
      if (!container) {
        return res.status(404).json({ message: 'Conteneur introuvable' });
      }

      return res.status(200).json(container);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère un conteneur par UID
   */
  async getByUid(req, res) {
    try {
      const { uid } = req.params;

      const container = await this.service.getContainerByUid(uid);
      if (!container) {
        return res.status(404).json({ message: 'Conteneur introuvable' });
      }

      return res.status(200).json(container);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère tous les conteneurs avec pagination
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 50, statut, id_zone, id_type } = req.query;
      const options = { 
        page: parseInt(page), 
        limit: parseInt(limit),
        statut,
        id_zone,
        id_type
      };

      const containers = await this.service.getAllContainers(options);
      return res.status(200).json(containers);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère les conteneurs par statut
   */
  async getByStatus(req, res) {
    try {
      const { statut } = req.params;

      const containers = await this.service.getContainersByStatus(statut);
      return res.status(200).json(containers);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère les conteneurs par zone
   */
  async getByZone(req, res) {
    try {
      const { id_zone } = req.params;

      const containers = await this.service.getContainersByZone(id_zone);
      return res.status(200).json(containers);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Recherche les conteneurs dans un rayon
   */
  async getInRadius(req, res) {
    try {
      const { latitude, longitude, radiusKm } = req.query;

      if (!latitude || !longitude || !radiusKm) {
        return res.status(400).json({ 
          message: 'latitude, longitude et radiusKm sont requis' 
        });
      }

      const containers = await this.service.getContainersInRadius(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radiusKm)
      );
      return res.status(200).json(containers);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Supprime un conteneur
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await this.service.deleteContainer(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Conteneur introuvable' });
      }

      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Supprime tous les conteneurs
   */
  async deleteAll(req, res) {
    try {
      const deleted = await this.service.deleteAllContainers();
      return res.status(200).json({ 
        message: `${deleted.length} conteneur(s) supprimé(s)`,
        count: deleted.length 
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Compte les conteneurs
   */
  async count(req, res) {
    try {
      const { statut, id_zone } = req.query;
      const filters = {};
      if (statut) filters.statut = statut;
      if (id_zone) filters.id_zone = id_zone;

      const count = await this.service.countContainers(filters);
      return res.status(200).json({ count });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Vérifie si un conteneur existe
   */
  async exists(req, res) {
    try {
      const { id } = req.params;

      const exists = await this.service.existContainer(id);
      return res.status(200).json({ exists });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Vérifie si un UID existe
   */
  async existsByUid(req, res) {
    try {
      const { uid } = req.params;

      const exists = await this.service.existByUid(uid);
      return res.status(200).json({ exists });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère les statistiques
   */
  async getStatistics(req, res) {
    try {
      const stats = await this.service.getStatistics();
      return res.status(200).json(stats);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère l'historique des changements de statut d'un conteneur
   */
  async getStatusHistory(req, res) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ID est requis' });
      }

      const options = {};
      if (limit) options.limit = parseInt(limit, 10);
      if (offset) options.offset = parseInt(offset, 10);

      const history = await this.service.getHistoriqueStatut(id, options);
      return res.status(200).json(history);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = ContainerController;
