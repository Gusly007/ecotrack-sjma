/**
 * TypeConteneurService - Service métier pour les types de conteneurs
 */
class TypeConteneurService {
  constructor(typeConteneurModel) {
    this.model = typeConteneurModel;
  }

  /**
   * Crée un nouveau type de conteneur
   */
  async createTypeConteneur(data) {
    return this.model.createTypeConteneur(data);
  }

  /**
   * Récupère tous les types de conteneur
   */
  async getAllTypes() {
    return this.model.getAllTypes();
  }

  /**
   * Récupère un type de conteneur par ID
   */
  async getTypeById(id) {
    return this.model.getTypeById(id);
  }

  /**
   * Récupère un type de conteneur par code
   */
  async getTypeByCode(code) {
    return this.model.getTypeByCode(code);
  }

  /**
   * Récupère les types de conteneur par nom
   */
  async getTypeByNom(nom) {
    return this.model.getTypeByNom(nom);
  }

  /**
   * Met à jour un type de conteneur
   */
  async updateTypeConteneur(id, data) {
    return this.model.updateTypeConteneur(id, data);
  }

  /**
   * Supprime un type de conteneur
   */
  async deleteTypeConteneur(id) {
    return this.model.deleteTypeConteneur(id);
  }

  /**
   * Supprime tous les types de conteneur
   */
  async deleteAllTypes() {
    return this.model.deleteAllTypes();
  }

  /**
   * Compte le nombre total de types de conteneur
   */
  async countTypes() {
    return this.model.countTypes();
  }

  /**
   * Vérifie si un type de conteneur existe
   */
  async typeExists(id) {
    return this.model.typeExists(id);
  }

  /**
   * Vérifie si un code de type existe
   */
  async codeExists(code) {
    return this.model.codeExists(code);
  }

  /**
   * Compte le nombre de conteneurs utilisant un type
   */
  async countContainersByType(idType) {
    return this.model.countContainersByType(idType);
  }

  /**
   * Récupère les détails d'un type avec statistiques
   */
  async getTypeWithStats(id) {
    return this.model.getTypeWithStats(id);
  }

  /**
   * Récupère tous les types avec statistiques
   */
  async getAllTypesWithStats() {
    return this.model.getAllTypesWithStats();
  }
}

module.exports = TypeConteneurService;
