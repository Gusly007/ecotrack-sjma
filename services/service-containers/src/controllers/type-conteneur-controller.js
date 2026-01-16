/**
 * TypeConteneurController - Contrôleur pour les types de conteneurs
 */
class TypeConteneurController {
  constructor(service) {
    this.service = service;

    // 🔒 Binding pour Express
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getAllWithStats = this.getAllWithStats.bind(this);
    this.getById = this.getById.bind(this);
    this.getByCode = this.getByCode.bind(this);
    this.getByNom = this.getByNom.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.deleteAll = this.deleteAll.bind(this);
    this.count = this.count.bind(this);
    this.exists = this.exists.bind(this);
    this.codeExists = this.codeExists.bind(this);
    this.getWithStats = this.getWithStats.bind(this);
  }

  /**
   * Crée un nouveau type de conteneur
   * POST /types-conteneurs
   */
  async create(req, res) {
    try {
      const { code, nom } = req.body;

      if (!code || !nom) {
        return res.status(400).json({
          message: 'Champs requis manquants: code, nom'
        });
      }

      const typeConteneur = await this.service.createTypeConteneur(req.body);
      return res.status(201).json(typeConteneur);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère tous les types de conteneur
   * GET /types-conteneurs
   */
  async getAll(req, res) {
    try {
      const types = await this.service.getAllTypes();
      return res.status(200).json(types);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère tous les types de conteneur avec statistiques
   * GET /types-conteneurs/stats/all
   */
  async getAllWithStats(req, res) {
    try {
      const types = await this.service.getAllTypesWithStats();
      return res.status(200).json(types);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère un type de conteneur par ID
   * GET /types-conteneurs/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID est requis' });
      }

      const type = await this.service.getTypeById(id);
      return res.status(200).json(type);
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

  /**
   * Récupère un type de conteneur par code
   * GET /types-conteneurs/code/:code
   */
  async getByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({ message: 'Code est requis' });
      }

      const type = await this.service.getTypeByCode(code);
      return res.status(200).json(type);
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

  /**
   * Récupère les types de conteneur par nom
   * GET /types-conteneurs/nom/:nom
   */
  async getByNom(req, res) {
    try {
      const { nom } = req.params;

      if (!nom) {
        return res.status(400).json({ message: 'Nom est requis' });
      }

      const types = await this.service.getTypeByNom(nom);
      return res.status(200).json(types);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Met à jour un type de conteneur
   * PATCH /types-conteneurs/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID est requis' });
      }

      const typeConteneur = await this.service.updateTypeConteneur(id, req.body);
      return res.status(200).json(typeConteneur);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Supprime un type de conteneur
   * DELETE /types-conteneurs/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID est requis' });
      }

      const type = await this.service.deleteTypeConteneur(id);
      return res.status(200).json(type);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Supprime tous les types de conteneur
   * DELETE /types-conteneurs
   */
  async deleteAll(req, res) {
    try {
      const types = await this.service.deleteAllTypes();
      return res.status(200).json(types);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Compte le nombre de types de conteneur
   * GET /types-conteneurs/count
   */
  async count(req, res) {
    try {
      const total = await this.service.countTypes();
      return res.status(200).json({ total });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Vérifie si un type de conteneur existe
   * GET /types-conteneurs/check/exists/:id
   */
  async exists(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID est requis' });
      }

      const exists = await this.service.typeExists(id);
      return res.status(200).json({ exists });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Vérifie si un code existe
   * GET /types-conteneurs/check/code/:code
   */
  async codeExists(req, res) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({ message: 'Code est requis' });
      }

      const exists = await this.service.codeExists(code);
      return res.status(200).json({ exists });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /**
   * Récupère un type de conteneur avec statistiques
   * GET /types-conteneurs/:id/stats
   */
  async getWithStats(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID est requis' });
      }

      const typeWithStats = await this.service.getTypeWithStats(id);
      return res.status(200).json(typeWithStats);
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }
}

module.exports = TypeConteneurController;
