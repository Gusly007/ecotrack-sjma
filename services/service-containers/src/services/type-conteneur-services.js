/**
 * TypeConteneurService - Service métier pour les types de conteneurs
 */
const Validators = require('../utils/Validators');

class TypeConteneurService {
  constructor(typeConteneurRepository) {
    this.repository = typeConteneurRepository;
  }

  /**
   * Crée un nouveau type de conteneur
   */
  async createTypeConteneur(data) {
    Validators.validateTypeConteneurData(data); // Validation données type conteneur
    return this.repository.createTypeConteneur(data);
  }

  /**
   * Récupère tous les types de conteneur
   */
  async getAllTypes() {
    return this.repository.getAllTypes();
  }

  /**
   * Récupère un type de conteneur par ID
   */
  async getTypeById(id) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    return this.repository.getTypeById(id);
  }

  /**
   * Récupère un type de conteneur par code
   */
  async getTypeByCode(code) {
    Validators.validateCode(code, 'code'); // Validation code type conteneur
    return this.repository.getTypeByCode(code);
  }

  /**
   * Récupère les types de conteneur par nom
   */
  async getTypeByNom(nom) {
    Validators.validateTypeConteneurNom(nom); // Validation nom type conteneur
    return this.repository.getTypeByNom(nom);
  }

  /**
   * Met à jour un type de conteneur
   */
  async updateTypeConteneur(id, data) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    Validators.validateTypeConteneurData(data, { isUpdate: true }); // Validation données type conteneur
    return this.repository.updateTypeConteneur(id, data);
  }

  /**
   * Supprime un type de conteneur
   */
  async deleteTypeConteneur(id) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    return this.repository.deleteTypeConteneur(id);
  }

  /**
   * Supprime tous les types de conteneur
   */
  async deleteAllTypes() {
    return this.repository.deleteAllTypes();
  }

  /**
   * Compte le nombre total de types de conteneur
   */
  async countTypes() {
    return this.repository.countTypes();
  }

  /**
   * Vérifie si un type de conteneur existe
   */
  async typeExists(id) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    return this.repository.typeExists(id);
  }

  /**
   * Vérifie si un code de type existe
   */
  async codeExists(code) {
    Validators.validateCode(code, 'code'); // Validation code type conteneur
    return this.repository.codeExists(code);
  }

  /**
   * Compte le nombre de conteneurs utilisant un type
   */
  async countContainersByType(idType) {
    Validators.validateTypeConteneurId(idType); // Validation ID type conteneur
    return this.repository.countContainersByType(idType);
  }

  /**
   * Récupère les détails d'un type avec statistiques
   */
  async getTypeWithStats(id) {
    Validators.validateTypeConteneurId(id); // Validation ID type conteneur
    return this.repository.getTypeWithStats(id);
  }

  /**
   * Récupère tous les types avec statistiques
   */
  async getAllTypesWithStats() {
    return this.repository.getAllTypesWithStats();
  }
}

module.exports = TypeConteneurService;
