class ConteneurModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Crée un nouveau conteneur
   */
  async createContainer(data) {
    const { capacite_l, statut, latitude, longitude, id_zone, id_type } = data;

    // Validation des champs requis
    if (!capacite_l || !statut || !latitude || !longitude) {
      throw new Error('Champs requis manquants: capacite_l, statut, latitude, longitude');
    }

    // Validation des coordonnées GPS
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Coordonnées GPS invalides');
    }

    // Génération de l'UID unique a enlever apres integration avec service UID
    // Format: CNT-XXXXX (max 20 caractères)
    const randomPart = Math.random().toString(36).substr(2, 14).toUpperCase();
    const uid = `CNT-${randomPart}`;

    // Création du POINT pour PostGIS
    const pointWkt = `POINT(${longitude} ${latitude})`;

    const result = await this.db.query(
      `INSERT INTO conteneur 
       (uid, capacite_l, statut, date_installation, position, id_zone, id_type) 
       VALUES ($1, $2, $3, NOW(), ST_GeomFromText($4, 4326), $5, $6) 
       RETURNING id_conteneur, uid, capacite_l, statut, date_installation, 
                 ST_X(position) as longitude, ST_Y(position) as latitude, 
                 id_zone, id_type`,
      [uid, capacite_l, statut, pointWkt, id_zone, id_type]
    );

    return result.rows[0];
  }

  /**
   * Met à jour un conteneur
   */
  async updateContainer(id, data) {
    if (!id) {
      throw new Error('Champ requis manquant: id');
    }

    const { capacite_l, statut, latitude, longitude, id_zone, id_type } = data;

    // Construire la requête dynamiquement
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (capacite_l !== undefined) {
      updates.push(`capacite_l = $${paramIndex++}`);
      values.push(capacite_l);
    }

    if (statut !== undefined) {
      updates.push(`statut = $${paramIndex++}`);
      values.push(statut);
    }

    if (latitude !== undefined && longitude !== undefined) {
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordonnées GPS invalides');
      }
      const pointWkt = `POINT(${longitude} ${latitude})`;
      updates.push(`position = ST_GeomFromText($${paramIndex++}, 4326)`);
      values.push(pointWkt);
    }

    if (id_zone !== undefined) {
      updates.push(`id_zone = $${paramIndex++}`);
      values.push(id_zone);
    }

    if (id_type !== undefined) {
      updates.push(`id_type = $${paramIndex++}`);
      values.push(id_type);
    }

    if (updates.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    values.push(id);

    const result = await this.db.query(
      `UPDATE conteneur 
       SET ${updates.join(', ')} 
       WHERE id_conteneur = $${paramIndex} 
       RETURNING id_conteneur, uid, capacite_l, statut, date_installation, 
                 ST_X(position) as longitude, ST_Y(position) as latitude, 
                 id_zone, id_type`,
      values
    );

    return result.rows[0];
  }

  /**
   * Change le statut d'un conteneur
   */
  async updateStatus(id, statut) {
    if (!id || !statut) {
      throw new Error('Champs requis manquants: id, statut');
    }

    const validStatuts = ['ACTIF', 'INACTIF', 'EN_MAINTENANCE', 'HORS_SERVICE'];
    if (!validStatuts.includes(statut)) {
      throw new Error(`Statut invalide. Valeurs acceptées: ${validStatuts.join(', ')}`);
    }

    const result = await this.db.query(
      `UPDATE conteneur 
       SET statut = $1 
       WHERE id_conteneur = $2 
       RETURNING id_conteneur, uid, statut`,
      [statut, id]
    );

    return result.rows[0];
  }

  /**
   * Supprime un conteneur par ID
   */
  async deleteContainer(id) {
    if (!id) {
      throw new Error('Champ requis manquant: id');
    }

    const result = await this.db.query(
      'DELETE FROM conteneur WHERE id_conteneur = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  }

  /**
   * Supprime tous les conteneurs
   */
  async deleteAllContainers() {
    const result = await this.db.query('DELETE FROM conteneur RETURNING *');
    return result.rows;
  }

  /**
   * Compte le nombre total de conteneurs
   */
  async countContainers(filters = {}) {
    let query = 'SELECT COUNT(*) FROM conteneur WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.statut) {
      query += ` AND statut = $${paramIndex++}`;
      params.push(filters.statut);
    }

    if (filters.id_zone) {
      query += ` AND id_zone = $${paramIndex++}`;
      params.push(filters.id_zone);
    }

    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Vérifie si un conteneur existe
   */
  async existContainer(id) {
    if (!id) {
      throw new Error('Champ requis manquant: id');
    }

    const result = await this.db.query(
      'SELECT 1 FROM conteneur WHERE id_conteneur = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Vérifie si un UID existe
   */
  async existByUid(uid) {
    if (!uid) {
      throw new Error('Champ requis manquant: uid');
    }

    const result = await this.db.query(
      'SELECT 1 FROM conteneur WHERE uid = $1',
      [uid]
    );

    return result.rowCount > 0;
  }

  /**
   * Récupère un conteneur par ID
   */
  async getContainerById(id) {
    if (!id) {
      throw new Error('Champ requis manquant: id');
    }

    const result = await this.db.query(
      `SELECT id_conteneur, uid, capacite_l, statut, date_installation, 
              ST_X(position) as longitude, ST_Y(position) as latitude, 
              id_zone, id_type
       FROM conteneur 
       WHERE id_conteneur = $1`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Récupère un conteneur par UID
   */
  async getContainerByUid(uid) {
    if (!uid) {
      throw new Error('Champ requis manquant: uid');
    }

    const result = await this.db.query(
      `SELECT id_conteneur, uid, capacite_l, statut, date_installation, 
              ST_X(position) as longitude, ST_Y(position) as latitude, 
              id_zone, id_type
       FROM conteneur 
       WHERE uid = $1`,
      [uid]
    );

    return result.rows[0];
  }

  /**
   * Récupère tous les conteneurs avec pagination et filtres
   */
  async getAllContainers(options = {}) {
    const { page = 1, limit = 50, statut, id_zone, id_type } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id_conteneur, uid, capacite_l, statut, date_installation, 
             ST_X(position) as longitude, ST_Y(position) as latitude, 
             id_zone, id_type
      FROM conteneur 
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (statut) {
      query += ` AND statut = $${paramIndex++}`;
      params.push(statut);
    }

    if (id_zone) {
      query += ` AND id_zone = $${paramIndex++}`;
      params.push(id_zone);
    }

    if (id_type) {
      query += ` AND id_type = $${paramIndex++}`;
      params.push(id_type);
    }

    query += ` ORDER BY id_conteneur DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Récupère les conteneurs par statut
   */
  async getContainersByStatus(statut) {
    if (!statut) {
      throw new Error('Champ requis manquant: statut');
    }

    const result = await this.db.query(
      `SELECT id_conteneur, uid, capacite_l, statut, date_installation, 
              ST_X(position) as longitude, ST_Y(position) as latitude, 
              id_zone, id_type
       FROM conteneur 
       WHERE statut = $1`,
      [statut]
    );

    return result.rows;
  }

  /**
   * Récupère les conteneurs par zone
   */
  async getContainersByZone(id_zone) {
    if (!id_zone) {
      throw new Error('Champ requis manquant: id_zone');
    }

    const result = await this.db.query(
      `SELECT id_conteneur, uid, capacite_l, statut, date_installation, 
              ST_X(position) as longitude, ST_Y(position) as latitude, 
              id_zone, id_type
       FROM conteneur 
       WHERE id_zone = $1`,
      [id_zone]
    );

    return result.rows;
  }

  /**
   * Recherche les conteneurs dans un rayon (en km)
   */
  async getContainersInRadius(latitude, longitude, radiusKm) {
    if (!latitude || !longitude || !radiusKm) {
      throw new Error('Champs requis manquants: latitude, longitude, radiusKm');
    }

    const pointWkt = `POINT(${longitude} ${latitude})`;

    const result = await this.db.query(
      `SELECT id_conteneur, uid, capacite_l, statut, date_installation, 
              ST_X(position) as longitude, ST_Y(position) as latitude, 
              id_zone, id_type,
              ST_Distance(position::geography, ST_GeomFromText($1, 4326)::geography) / 1000 as distance_km
       FROM conteneur 
       WHERE ST_DWithin(position::geography, ST_GeomFromText($1, 4326)::geography, $2 * 1000)
       ORDER BY distance_km`,
      [pointWkt, radiusKm]
    );

    return result.rows;
  }

  /**
   * Statistiques des conteneurs
   */
  async getStatistics() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'ACTIF' THEN 1 END) as actifs,
        COUNT(CASE WHEN statut = 'INACTIF' THEN 1 END) as inactifs,
        COUNT(CASE WHEN statut = 'EN_MAINTENANCE' THEN 1 END) as en_maintenance,
        COUNT(CASE WHEN statut = 'HORS_SERVICE' THEN 1 END) as hors_service,
        AVG(capacite_l) as capacite_moyenne
      FROM conteneur
    `);

    return result.rows[0];
  }
}
module.exports = ConteneurModel;