const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const containerCreateSchema = Joi.object({
  capacite_l: Joi.number().integer().min(100).max(5000).required(),
  statut: Joi.string().min(1).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  id_zone: Joi.number().integer().positive().allow(null),
  id_type: Joi.number().integer().positive().allow(null),
}).and('latitude', 'longitude').unknown(false);

const containerUpdateSchema = Joi.object({
  capacite_l: Joi.number().integer().min(100).max(5000),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  id_zone: Joi.number().integer().positive().allow(null),
  id_type: Joi.number().integer().positive().allow(null),
  statut: Joi.forbidden(),
}).and('latitude', 'longitude').unknown(false);

function validateSchema(schema, data) {
  const { error } = schema.validate(data, { abortEarly: false });
  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    const err = new Error(`Validation invalide: ${message}`);
    err.name = 'ValidationError';
    throw err;
  }
}

class ConteneurModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Génère un UID unique pour un conteneur
   * Format: CNT-{12 caractères alphanumériques en majuscules}
   * Exemple: CNT-A1B2C3D4E5F6
   * 
   * @private
   * @param {number} maxAttempts - Nombre maximum de tentatives de génération
   * @returns {Promise<string>} UID unique garanti
   * @throws {Error} Si impossible de générer un UID unique après maxAttempts
   */
  async _generateUniqueUid(maxAttempts = 5) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Génération d'un UID basé sur UUID v4 (cryptographiquement sécurisé)
      const randomPart = uuidv4()
        .replace(/-/g, '')           // Supprime les tirets
        .substring(0, 12)            // Prend les 12 premiers caractères
        .toUpperCase();              // Convertit en majuscules
      
      const uid = `CNT-${randomPart}`;

      // Vérification d'unicité en base de données
      const exists = await this.existByUid(uid);
      
      if (!exists) {
        return uid;
      }

      attempts++;
    }

    throw new Error(
      `Impossible de générer un UID unique après ${maxAttempts} tentatives. ` +
      'Cela indique un problème système critique.'
    );
  }

  /**
   * Enregistre un changement de statut dans l'historique
   * @private
   */
  async _enregistrerHistoriqueStatut(idEntite, typeEntite, ancienStatut, nouveauStatut) {
    // Normaliser typeEntite en majuscules (CONTENEUR, TOURNEE, SIGNALEMENT)
    const typeNormalise = typeEntite.toUpperCase();
    
    await this.db.query(
      `INSERT INTO historique_statut (id_entite, type_entite, ancien_statut, nouveau_statut, date_changement)
       VALUES ($1, $2, $3, $4, NOW())`,
      [idEntite, typeNormalise, ancienStatut, nouveauStatut]
    );
  }

  /**
   * Crée un nouveau conteneur
   * @param {Object} data - Données du conteneur
   * @param {number} data.capacite_l - Capacité en litres (100 à 5000)
   * @param {string} data.statut - Statut libre (string non vide)
   * @param {number} data.latitude - Latitude entre -90 et 90
   * @param {number} data.longitude - Longitude entre -180 et 180
   * @param {number|null} [data.id_zone] - ID de zone (optionnel)
   * @param {number|null} [data.id_type] - ID de type (optionnel)
   */
  async createContainer(data) {
    const { capacite_l: capaciteL, statut, latitude, longitude, id_zone: idZone, id_type: idType } = data;

    // Validation des champs requis
    if (!capaciteL || !statut || !latitude || !longitude) {
      throw new Error('Champs requis manquants: capacite_l, statut, latitude, longitude');
    }

    // Validation des coordonnées GPS
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Coordonnées GPS invalides');
    }

    // Validation de schéma (types et champs autorisés)
    validateSchema(containerCreateSchema, data);

    // Génération d'un UID unique et sécurisé
    const uid = await this._generateUniqueUid();

    // Création du POINT pour PostGIS
    const pointWkt = `POINT(${longitude} ${latitude})`;

    const result = await this.db.query(
      `INSERT INTO conteneur 
       (uid, capacite_l, statut, date_installation, position, id_zone, id_type) 
       VALUES ($1, $2, $3, NOW(), ST_GeomFromText($4, 4326), $5, $6) 
       RETURNING id_conteneur, uid, capacite_l, statut, date_installation, 
                 ST_X(position) as longitude, ST_Y(position) as latitude, 
                 id_zone, id_type`,
      [uid, capaciteL, statut, pointWkt, idZone, idType]
    );

    return result.rows[0];
  }

  /**
   * Met à jour un conteneur
   * @param {number} id - ID du conteneur
   * @param {Object} data - Données à mettre à jour
   * @param {number} [data.capacite_l] - Capacité en litres (100 à 5000)
   * @param {number} [data.latitude] - Latitude entre -90 et 90 (avec longitude)
   * @param {number} [data.longitude] - Longitude entre -180 et 180 (avec latitude)
   * @param {number|null} [data.id_zone] - ID de zone (optionnel)
   * @param {number|null} [data.id_type] - ID de type (optionnel)
   */
  async updateContainer(id, data) {
    if (!id) {
      throw new Error('Champ requis manquant: id');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'statut')) {
      throw new Error('Le statut doit être modifié via la méthode updateStatus dédiée');
    }

    // Validation de schéma (types et champs autorisés)
    validateSchema(containerUpdateSchema, data);

    const { capacite_l: capaciteL, latitude, longitude, id_zone: idZone, id_type: idType } = data;

    // Construire la requête dynamiquement
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (capaciteL !== undefined) {
      updates.push(`capacite_l = $${paramIndex++}`);
      values.push(capaciteL);
    }

    if (latitude !== undefined && longitude !== undefined) {
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordonnées GPS invalides');
      }
      const pointWkt = `POINT(${longitude} ${latitude})`;
      updates.push(`position = ST_GeomFromText($${paramIndex++}, 4326)`);
      values.push(pointWkt);
    }

    if (idZone !== undefined) {
      updates.push(`id_zone = $${paramIndex++}`);
      values.push(idZone);
    }

    if (idType !== undefined) {
      updates.push(`id_type = $${paramIndex++}`);
      values.push(idType);
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
   * Change le statut d'un conteneur avec enregistrement dans l'historique
   * @param {number} id - ID du conteneur
   * @param {string} statut - Nouveau statut (ACTIF, INACTIF, EN_MAINTENANCE)
   * @returns {Object} Conteneur mis à jour avec ancien_statut et changed
   * @throws {Error} Si le conteneur n'existe pas ou si le statut est invalide
   */
  async updateStatus(id, statut) {
    // Validation des paramètres
    if (!id) {
      throw new Error('Le paramètre id est requis');
    }
    if (!statut) {
      throw new Error('Le paramètre statut est requis');
    }

    // Validation du statut
    const validStatuts = ['ACTIF', 'INACTIF', 'EN_MAINTENANCE'];
    if (!validStatuts.includes(statut)) {
      throw new Error(
        `Statut invalide: "${statut}". Valeurs acceptées: ${validStatuts.join(', ')}`
      );
    }

    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Récupérer le conteneur et son statut actuel
      const currentContainer = await client.query(
        'SELECT id_conteneur, uid, statut FROM conteneur WHERE id_conteneur = $1',
        [id]
      );

      if (currentContainer.rows.length === 0) {
        throw new Error(`Conteneur avec l'ID ${id} introuvable`);
      }

      const ancienStatut = currentContainer.rows[0].statut;

      // Ne rien faire si le statut est déjà le même
      if (ancienStatut === statut) {
        await client.query('COMMIT');
        return {
          ...currentContainer.rows[0],
          ancien_statut: ancienStatut,
          changed: false,
          message: 'Le statut est déjà à jour'
        };
      }

      // Mettre à jour le statut
      const result = await client.query(
        `UPDATE conteneur 
         SET statut = $1 
         WHERE id_conteneur = $2 
         RETURNING id_conteneur, uid, statut`,
        [statut, id]
      );

      // Enregistrer dans l'historique
      await client.query(
        `INSERT INTO historique_statut (id_entite, type_entite, ancien_statut, nouveau_statut, date_changement)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, 'CONTENEUR', ancienStatut, statut]
      );

      await client.query('COMMIT');

      return {
        ...result.rows[0],
        ancien_statut: ancienStatut,
        changed: true
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

    if (filters.idZone) {
      query += ` AND id_zone = $${paramIndex++}`;
      params.push(filters.idZone);
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
    const { page = 1, limit = 50, statut, id_zone: idZone, id_type: idType } = options;
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

    if (idZone) {
      query += ` AND id_zone = $${paramIndex++}`;
      params.push(idZone);
    }

    if (idType) {
      query += ` AND id_type = $${paramIndex++}`;
      params.push(idType);
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
  async getContainersByZone(idZone) {
    if (!idZone) {
      throw new Error('Champ requis manquant: idZone');
    }

    const result = await this.db.query(
      `SELECT id_conteneur, uid, capacite_l, statut, date_installation, 
              ST_X(position) as longitude, ST_Y(position) as latitude, 
              id_zone, id_type
       FROM conteneur 
       WHERE id_zone = $1`,
      [idZone]
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
        AVG(capacite_l) as capacite_moyenne
      FROM conteneur
    `);

    return result.rows[0];
  }

  /**
   * Récupère l'historique complet des changements de statut d'un conteneur
   * @param {number} id_conteneur - ID du conteneur
   * @param {Object} options - Options de pagination
   * @param {number} options.limit - Nombre maximum d'entrées à retourner (défaut: 50)
   * @param {number} options.offset - Nombre d'entrées à sauter (défaut: 0)
   * @returns {Array} Liste des changements de statut ordonnés du plus récent au plus ancien
   * @throws {Error} Si l'ID du conteneur n'est pas fourni
   */
  async getHistoriqueStatut(id_conteneur, options = {}) {
    if (!id_conteneur) {
      throw new Error('Le paramètre id_conteneur est requis');
    }

    const { limit = 50, offset = 0 } = options;

    // Validation des options de pagination
    if (limit < 1 || limit > 1000) {
      throw new Error('La limite doit être entre 1 et 1000');
    }
    if (offset < 0) {
      throw new Error('L\'offset doit être un nombre positif');
    }

    const result = await this.db.query(
      `SELECT 
         id_historique,
         id_entite,
         type_entite,
         ancien_statut,
         nouveau_statut,
         date_changement
       FROM historique_statut
       WHERE id_entite = $1 AND type_entite = 'CONTENEUR'
       ORDER BY date_changement DESC
       LIMIT $2 OFFSET $3`,
      [id_conteneur, limit, offset]
    );

    return result.rows;
  }

  /**
   * Recupere les conteneurs avec leur dernier niveau de remplissage
   * Joint les tables conteneur, capteur et mesure (derniere mesure par capteur)
   * @param {Object} options - Options de filtrage
   * @param {number} [options.minLevel] - Niveau minimum de remplissage (0-100)
   * @param {number} [options.maxLevel] - Niveau maximum de remplissage (0-100)
   * @param {number} [options.id_zone] - Filtrer par zone
   * @returns {Promise<Array>} Liste des conteneurs avec fill_level
   */
  async getContainersByFillLevel(options = {}) {
    const { minLevel, maxLevel, id_zone } = options;
    const params = [];
    const conditions = [];

    if (id_zone) {
      params.push(id_zone);
      conditions.push(`c.id_zone = $${params.length}`);
    }

    let havingClause = '';
    const havingConditions = [];

    if (minLevel != null) {
      params.push(minLevel);
      havingConditions.push(`COALESCE(m.niveau_remplissage_pct, 0) >= $${params.length}`);
    }

    if (maxLevel != null) {
      params.push(maxLevel);
      havingConditions.push(`COALESCE(m.niveau_remplissage_pct, 0) <= $${params.length}`);
    }

    if (havingConditions.length > 0) {
      havingClause = `HAVING ${havingConditions.join(' AND ')}`;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const query = `
      SELECT 
        c.id_conteneur, c.uid, c.statut, c.capacite_l,
        c.latitude, c.longitude, c.id_zone, c.id_type,
        COALESCE(m.niveau_remplissage_pct, NULL) AS fill_level
      FROM conteneur c
      LEFT JOIN capteur cap ON cap.id_conteneur = c.id_conteneur
      LEFT JOIN LATERAL (
        SELECT niveau_remplissage_pct 
        FROM mesure 
        WHERE id_capteur = cap.id_capteur 
        ORDER BY date_heure_mesure DESC 
        LIMIT 1
      ) m ON TRUE
      ${whereClause}
      GROUP BY c.id_conteneur, c.uid, c.statut, c.capacite_l,
               c.latitude, c.longitude, c.id_zone, c.id_type,
               m.niveau_remplissage_pct
      ${havingClause}
      ORDER BY fill_level DESC NULLS LAST
    `;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Compte le nombre total de changements de statut pour un conteneur
   * @param {number} id_conteneur - ID du conteneur
   * @returns {number} Nombre total de changements de statut
   * @throws {Error} Si l'ID du conteneur n'est pas fourni
   */
  async countHistoriqueStatut(id_conteneur) {
    if (!id_conteneur) {
      throw new Error('Le paramètre id_conteneur est requis');
    }

    const result = await this.db.query(
      `SELECT COUNT(*) as total
       FROM historique_statut
       WHERE id_entite = $1 AND type_entite = 'conteneur'`,
      [id_conteneur]
    );

    return parseInt(result.rows[0].total, 10);
  }
}
module.exports = ConteneurModel;