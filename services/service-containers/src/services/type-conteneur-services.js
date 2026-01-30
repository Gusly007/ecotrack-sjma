/**
 * TypeConteneurService - Service métier pour les types de conteneurs
 */
const Validators = require('../utils/Validators');

class TypeConteneurService {
  constructor(typeConteneurModel) {
    this.model = typeConteneurModel;
  }

  /**
   * Crée un nouveau type de conteneur
   */
  async createTypeConteneur(data) {
    Validators.validateTypeConteneurData(data); // Validation données type conteneur
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
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    return this.model.getTypeById(id);
  }

  /**
   * Récupère un type de conteneur par code
   */
  async getTypeByCode(code) {
    Validators.validateCode(code, 'code'); // Validation code type conteneur
    return this.model.getTypeByCode(code);
  }

  /**
   * Récupère les types de conteneur par nom
   */
  async getTypeByNom(nom) {
    Validators.validateTypeConteneurNom(nom); // Validation nom type conteneur
    return this.model.getTypeByNom(nom);
  }

  /**
   * Met à jour un type de conteneur
   */
  async updateTypeConteneur(id, data) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    Validators.validateTypeConteneurData(data, { isUpdate: true }); // Validation données type conteneur
    return this.model.updateTypeConteneur(id, data);
  }

  /**
   * Supprime un type de conteneur
   */
  async deleteTypeConteneur(id) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
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
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    return this.model.typeExists(id);
  }

  /**
   * Vérifie si un code de type existe
   */
  async codeExists(code) {
    Validators.validateCode(code, 'code'); // Validation code type conteneur
    return this.model.codeExists(code);
  }

  /**
   * Compte le nombre de conteneurs utilisant un type
   */
  async countContainersByType(idType) {
    Validators.validateTypeConteneurId(idType); // Validation ID type conteneur
    return this.model.countContainersByType(idType);
  }

  /**
   * Récupère les détails d'un type avec statistiques
   */
  async getTypeWithStats(id) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
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
