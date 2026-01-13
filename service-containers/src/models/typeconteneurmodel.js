/**
 * TypeConteneurModel - Gestion des types de conteneurs
 * Modèle pour les opérations CRUD sur la table type_conteneur
 */
class TypeConteneurModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Crée un nouveau type de conteneur
   * @param {Object} data - Données du type de conteneur
   * @param {string} data.code - Code unique du type (ex: ORDURE, RECYCLAGE, VERRE, COMPOST)
   * @param {string} data.nom - Nom du type (ORDURE, RECYCLAGE, VERRE ou COMPOST)
   * @returns {Object} Type de conteneur créé
   * @throws {Error} Si les champs requis sont manquants ou si le code existe déjà
   */
  async createTypeConteneur(data) {
    const { code, nom } = data;

    // Validation des champs requis
    if (!code || !nom) {
      throw new Error('Champs requis manquants: code, nom');
    }

    // Validation du nom
    const validNoms = ['ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'];
    if (!validNoms.includes(nom)) {
      throw new Error(
        `Nom invalide: "${nom}". Valeurs acceptées: ${validNoms.join(', ')}`
      );
    }

    // Vérifier que le code est unique
    const existingCode = await this.db.query(
      'SELECT id_type FROM type_conteneur WHERE code = $1',
      [code]
    );

    if (existingCode.rows.length > 0) {
      throw new Error(`Le code "${code}" existe déjà`);
    }

    const result = await this.db.query(
      `INSERT INTO type_conteneur (code, nom)
       VALUES ($1, $2)
       RETURNING id_type, code, nom`,
      [code, nom]
    );

    return result.rows[0];
  }

  /**
   * Récupère tous les types de conteneur
   * @returns {Array} Liste de tous les types de conteneur
   */
  async getAllTypes() {
    const result = await this.db.query(
      `SELECT id_type, code, nom
       FROM type_conteneur
       ORDER BY nom ASC`
    );

    return result.rows;
  }

  /**
   * Récupère un type de conteneur par ID
   * @param {number} id - ID du type de conteneur
   * @returns {Object} Type de conteneur trouvé
   * @throws {Error} Si l'ID est manquant ou si le type n'existe pas
   */
  async getTypeById(id) {
    if (!id) {
      throw new Error('Le paramètre id est requis');
    }

    const result = await this.db.query(
      `SELECT id_type, code, nom
       FROM type_conteneur
       WHERE id_type = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Type de conteneur avec l'ID ${id} introuvable`);
    }

    return result.rows[0];
  }

  /**
   * Récupère un type de conteneur par code
   * @param {string} code - Code du type de conteneur
   * @returns {Object} Type de conteneur trouvé
   * @throws {Error} Si le code est manquant ou si le type n'existe pas
   */
  async getTypeByCode(code) {
    if (!code) {
      throw new Error('Le paramètre code est requis');
    }

    const result = await this.db.query(
      `SELECT id_type, code, nom
       FROM type_conteneur
       WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      throw new Error(`Type de conteneur avec le code "${code}" introuvable`);
    }

    return result.rows[0];
  }

  /**
   * Récupère les types de conteneur par nom
   * @param {string} nom - Nom du type (ORDURE, RECYCLAGE, VERRE ou COMPOST)
   * @returns {Array} Liste des types correspondants
   * @throws {Error} Si le nom est manquant
   */
  async getTypeByNom(nom) {
    if (!nom) {
      throw new Error('Le paramètre nom est requis');
    }

    const result = await this.db.query(
      `SELECT id_type, code, nom
       FROM type_conteneur
       WHERE nom = $1`,
      [nom]
    );

    return result.rows;
  }

  /**
   * Met à jour un type de conteneur
   * @param {number} id - ID du type de conteneur
   * @param {Object} data - Données à mettre à jour
   * @returns {Object} Type de conteneur mis à jour
   * @throws {Error} Si l'ID est manquant, si aucun champ n'est fourni ou si le type n'existe pas
   */
  async updateTypeConteneur(id, data) {
    if (!id) {
      throw new Error('Le paramètre id est requis');
    }

    const { code, nom } = data;

    // Construire la requête dynamiquement
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (code !== undefined) {
      // Vérifier l'unicité du nouveau code
      const existingCode = await this.db.query(
        'SELECT id_type FROM type_conteneur WHERE code = $1 AND id_type != $2',
        [code, id]
      );

      if (existingCode.rows.length > 0) {
        throw new Error(`Le code "${code}" existe déjà`);
      }

      updates.push(`code = $${paramIndex++}`);
      values.push(code);
    }

    if (nom !== undefined) {
      const validNoms = ['ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'];
      if (!validNoms.includes(nom)) {
        throw new Error(
          `Nom invalide: "${nom}". Valeurs acceptées: ${validNoms.join(', ')}`
        );
      }

      updates.push(`nom = $${paramIndex++}`);
      values.push(nom);
    }

    if (updates.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    values.push(id);

    const result = await this.db.query(
      `UPDATE type_conteneur
       SET ${updates.join(', ')}
       WHERE id_type = $${paramIndex}
       RETURNING id_type, code, nom`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Type de conteneur avec l'ID ${id} introuvable`);
    }

    return result.rows[0];
  }

  /**
   * Supprime un type de conteneur
   * @param {number} id - ID du type de conteneur
   * @returns {Object} Type de conteneur supprimé
   * @throws {Error} Si l'ID est manquant ou si le type n'existe pas
   */
  async deleteTypeConteneur(id) {
    if (!id) {
      throw new Error('Le paramètre id est requis');
    }

    const result = await this.db.query(
      `DELETE FROM type_conteneur
       WHERE id_type = $1
       RETURNING id_type, code, nom`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Type de conteneur avec l'ID ${id} introuvable`);
    }

    return result.rows[0];
  }

  /**
   * Supprime tous les types de conteneur
   * @returns {Array} Types de conteneur supprimés
   */
  async deleteAllTypes() {
    const result = await this.db.query(
      'DELETE FROM type_conteneur RETURNING id_type, code, nom'
    );

    return result.rows;
  }

  /**
   * Compte le nombre total de types de conteneur
   * @returns {number} Nombre de types de conteneur
   */
  async countTypes() {
    const result = await this.db.query('SELECT COUNT(*) as total FROM type_conteneur');
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Vérifie si un type de conteneur existe par ID
   * @param {number} id - ID du type de conteneur
   * @returns {boolean} true si le type existe, false sinon
   * @throws {Error} Si l'ID est manquant
   */
  async typeExists(id) {
    if (!id) {
      throw new Error('Le paramètre id est requis');
    }

    const result = await this.db.query(
      'SELECT 1 FROM type_conteneur WHERE id_type = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Vérifie si un code de type existe
   * @param {string} code - Code du type de conteneur
   * @returns {boolean} true si le code existe, false sinon
   * @throws {Error} Si le code est manquant
   */
  async codeExists(code) {
    if (!code) {
      throw new Error('Le paramètre code est requis');
    }

    const result = await this.db.query(
      'SELECT 1 FROM type_conteneur WHERE code = $1',
      [code]
    );

    return result.rowCount > 0;
  }

  /**
   * Compte le nombre de conteneurs utilisant un type spécifique
   * @param {number} id_type - ID du type de conteneur
   * @returns {number} Nombre de conteneurs utilisant ce type
   * @throws {Error} Si l'ID du type est manquant
   */
  async countContainersByType(id_type) {
    if (!id_type) {
      throw new Error('Le paramètre id_type est requis');
    }

    const result = await this.db.query(
      'SELECT COUNT(*) as total FROM conteneur WHERE id_type = $1',
      [id_type]
    );

    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Récupère les détails d'un type avec le nombre de conteneurs associés
   * @param {number} id - ID du type de conteneur
   * @returns {Object} Type de conteneur avec statistiques
   * @throws {Error} Si l'ID est manquant ou si le type n'existe pas
   */
  async getTypeWithStats(id) {
    if (!id) {
      throw new Error('Le paramètre id est requis');
    }

    const typeData = await this.getTypeById(id);
    const containerCount = await this.countContainersByType(id);

    return {
      ...typeData,
      nombre_conteneurs: containerCount
    };
  }

  /**
   * Récupère tous les types avec statistiques
   * @returns {Array} Liste des types avec le nombre de conteneurs associés
   */
  async getAllTypesWithStats() {
    const result = await this.db.query(`
      SELECT 
        t.id_type,
        t.code,
        t.nom,
        COUNT(c.id_conteneur) as nombre_conteneurs
      FROM type_conteneur t
      LEFT JOIN conteneur c ON t.id_type = c.id_type
      GROUP BY t.id_type, t.code, t.nom
      ORDER BY t.nom ASC
    `);

    return result.rows;
  }
}

module.exports = TypeConteneurModel;
