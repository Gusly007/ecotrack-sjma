/**
 * Repository — table `notification`
 *
 * Compatibilité type ↔ rôle vérifiée en base via une CTE :
 *   ALERTE / TOURNEE  → GESTIONNAIRE, ADMIN
 *   BADGE             → CITOYEN, AGENT
 *   SYSTEME           → tous rôles
 */

const { pool } = require('../db/connexion');
const ApiError = require('../utils/api-error');

// Matrice type → rôles autorisés (doit rester en sync avec le CHECK de la migration)
const TYPE_ROLE_MAP = {
  ALERTE:            ['GESTIONNAIRE', 'ADMIN'],
  TOURNEE:           ['GESTIONNAIRE', 'ADMIN'],
  BADGE:             ['CITOYEN', 'AGENT'],
  SYSTEME:           ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'],
  ADMIN_ALERTE:      ['ADMIN'],
  ADMIN_SERVICE:     ['ADMIN'],
  ADMIN_SEUIL:       ['ADMIN'],
  ADMIN_ML:          ['ADMIN'],
  ADMIN_SECURITE:    ['ADMIN'],
  ADMIN_PERFORMANCE: ['ADMIN'],
  ADMIN_IOT:         ['ADMIN'],
};

const VALID_TYPES = Object.keys(TYPE_ROLE_MAP);
const ADMIN_TYPES = ['ADMIN_ALERTE', 'ADMIN_SERVICE', 'ADMIN_SEUIL', 'ADMIN_ML', 'ADMIN_SECURITE', 'ADMIN_PERFORMANCE', 'ADMIN_IOT'];

class NotificationRepository {
  // ─────────────────────────────────────────────────────────────
  //  ÉCRITURE
  // ─────────────────────────────────────────────────────────────

  /**
   * Crée une notification après vérification que le rôle du destinataire
   * est compatible avec le type demandé.
   *
   * @param {{ id_utilisateur: number, type: string, titre: string, corps: string, priorite?: number, categorie?: string }} payload
   * @returns {Promise<object>} Ligne insérée
   * @throws {ApiError} 400 type invalide · 422 rôle incompatible · 404 utilisateur introuvable
   */
  async createNotification({ id_utilisateur, type, titre, corps, priorite, categorie }) {
    if (!VALID_TYPES.includes(type)) {
      throw new ApiError(400, `Type de notification invalide : ${type}. Valeurs acceptées : ${VALID_TYPES.join(', ')}`);
    }

    const adminType = ADMIN_TYPES.includes(type);

    // CTE : récupère le rôle du destinataire et lève une erreur si l'utilisateur n'existe pas
    const sql = adminType
      ? `
        WITH target_user AS (
          SELECT id_utilisateur, role_par_defaut
          FROM utilisateur
          WHERE id_utilisateur = $1 AND role_par_defaut = 'ADMIN'
        )
        INSERT INTO notification (type, titre, corps, id_utilisateur, priorite, categorie)
        SELECT $2, $3, $4, tu.id_utilisateur, $5, $6
        FROM target_user tu
        RETURNING *
      `
      : `
        WITH target_user AS (
          SELECT id_utilisateur, role_par_defaut
          FROM utilisateur
          WHERE id_utilisateur = $1
        )
        INSERT INTO notification (type, titre, corps, id_utilisateur)
        SELECT $2, $3, $4, tu.id_utilisateur
        FROM target_user tu
        WHERE tu.role_par_defaut = ANY($5::text[])
        RETURNING *
      `;

    const allowedRoles = TYPE_ROLE_MAP[type];
    const params = adminType
      ? [id_utilisateur, type, titre, corps, priorite || 3, categorie || null]
      : [id_utilisateur, type, titre, corps, allowedRoles];
    const result = await pool.query(sql, params);

    if (result.rowCount === 0) {
      // Distinguer utilisateur absent vs rôle incompatible
      const userCheck = await pool.query(
        'SELECT role_par_defaut FROM utilisateur WHERE id_utilisateur = $1',
        [id_utilisateur]
      );
      if (userCheck.rowCount === 0) {
        throw new ApiError(404, `Utilisateur ${id_utilisateur} introuvable`);
      }
      const { role_par_defaut } = userCheck.rows[0];
      throw new ApiError(
        422,
        `Le rôle "${role_par_defaut}" n'est pas autorisé à recevoir des notifications de type "${type}"`
      );
    }

    return result.rows[0];
  }

  /**
   * Insère plusieurs notifications en une seule transaction.
   * Chaque entrée est vérifiée contre la matrice type/rôle avant insertion.
   *
   * Utile quand une alerte sur une zone doit notifier le gestionnaire ET l'admin
   * de cette zone, ou quand un événement touche plusieurs gestionnaires à la fois.
   *
   * @param {Array<{ id_utilisateur: number, type: string, titre: string, corps: string }>} notifications
   * @returns {Promise<object[]>} Toutes les lignes insérées
   * @throws {ApiError} 400 tableau vide · 422 entrée incompatible
   */
  async createBulkNotifications(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new ApiError(400, 'Le tableau de notifications ne peut pas être vide');
    }

    // Validation JS rapide avant d'ouvrir une transaction
    for (const n of notifications) {
      if (!VALID_TYPES.includes(n.type)) {
        throw new ApiError(400, `Type invalide "${n.type}" pour l'utilisateur ${n.id_utilisateur}`);
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const inserted = [];

      for (const { id_utilisateur, type, titre, corps, priorite, categorie } of notifications) {
        const allowedRoles = TYPE_ROLE_MAP[type];
        const adminType = ADMIN_TYPES.includes(type);

        const sql = adminType
          ? `
            WITH target_user AS (
              SELECT id_utilisateur, role_par_defaut
              FROM utilisateur
              WHERE id_utilisateur = $1 AND role_par_defaut = 'ADMIN'
            )
            INSERT INTO notification (type, titre, corps, id_utilisateur, priorite, categorie)
            SELECT $2, $3, $4, tu.id_utilisateur, $5, $6
            FROM target_user tu
            RETURNING *
          `
          : `
            WITH target_user AS (
              SELECT id_utilisateur, role_par_defaut
              FROM utilisateur
              WHERE id_utilisateur = $1
            )
            INSERT INTO notification (type, titre, corps, id_utilisateur)
            SELECT $2, $3, $4, tu.id_utilisateur
            FROM target_user tu
            WHERE tu.role_par_defaut = ANY($5::text[])
            RETURNING *
          `;

        const params = adminType
          ? [id_utilisateur, type, titre, corps, priorite || 3, categorie || null]
          : [id_utilisateur, type, titre, corps, allowedRoles];
        const result = await client.query(sql, params);

        if (result.rowCount === 0) {
          const userCheck = await client.query(
            'SELECT role_par_defaut FROM utilisateur WHERE id_utilisateur = $1',
            [id_utilisateur]
          );
          if (userCheck.rowCount === 0) {
            throw new ApiError(404, `Utilisateur ${id_utilisateur} introuvable`);
          }
          const { role_par_defaut } = userCheck.rows[0];
          throw new ApiError(
            422,
            `Rôle "${role_par_defaut}" incompatible avec le type "${type}" (utilisateur ${id_utilisateur})`
          );
        }

        inserted.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Marque une notification comme lue.
   * - Un utilisateur ordinaire ne peut marquer que ses propres notifications.
   * - Un ADMIN peut marquer n'importe quelle notification (bypass).
   *
   * @param {number}  id_notification
   * @param {number}  id_utilisateur   Id de l'utilisateur authentifié
   * @param {string}  [role]           Rôle de l'utilisateur (permet le bypass ADMIN)
   * @returns {Promise<object>} Notification mise à jour
   * @throws {ApiError} 404 introuvable · 403 non propriétaire
   */
  async markAsRead(id_notification, id_utilisateur, role = null) {
    // Les ADMIN peuvent marquer leurs propres notifs + les notifs orphelines système
    // mais pas celles d'autres utilisateurs (chacun gère sa boîte)
    const sql = `
      UPDATE notification
      SET est_lu = TRUE
      WHERE id_notification = $1
        AND (
          id_utilisateur = $2
          OR ($3 = 'ADMIN' AND type = 'SYSTEME')
        )
      RETURNING *
    `;

    const result = await pool.query(sql, [id_notification, id_utilisateur, role]);

    if (result.rowCount === 0) {
      // Distinguer "n'existe pas" vs "appartient à quelqu'un d'autre"
      const exists = await pool.query(
        'SELECT id_notification FROM notification WHERE id_notification = $1',
        [id_notification]
      );
      if (exists.rowCount === 0) {
        throw new ApiError(404, `Notification ${id_notification} introuvable`);
      }
      throw new ApiError(403, 'Vous n\'êtes pas propriétaire de cette notification');
    }

    return result.rows[0];
  }

  /**
   * Marque toutes les notifications non lues d'un utilisateur comme lues.
   *
   * @param {number} id_utilisateur
   * @returns {Promise<number>} Nombre de lignes mises à jour
   */
  async markAllAsRead(id_utilisateur) {
    const result = await pool.query(
      `UPDATE notification
       SET est_lu = TRUE
       WHERE id_utilisateur = $1 AND est_lu = FALSE
       RETURNING id_notification`,
      [id_utilisateur]
    );

    return result.rowCount;
  }

  /**
   * Supprime une notification.
   * - Propriétaire uniquement, sauf ADMIN qui peut supprimer ses notifications SYSTEME.
   *
   * @param {number} id_notification
   * @param {number} id_utilisateur
   * @param {string} [role]
   * @returns {Promise<void>}
   * @throws {ApiError} 404 introuvable · 403 non propriétaire
   */
  async deleteNotification(id_notification, id_utilisateur, role = null) {
    const sql = `
      DELETE FROM notification
      WHERE id_notification = $1
        AND (
          id_utilisateur = $2
          OR ($3 = 'ADMIN' AND type = 'SYSTEME')
        )
      RETURNING id_notification
    `;

    const result = await pool.query(sql, [id_notification, id_utilisateur, role]);

    if (result.rowCount === 0) {
      const exists = await pool.query(
        'SELECT id_notification FROM notification WHERE id_notification = $1',
        [id_notification]
      );
      if (exists.rowCount === 0) {
        throw new ApiError(404, `Notification ${id_notification} introuvable`);
      }
      throw new ApiError(403, 'Vous n\'êtes pas propriétaire de cette notification');
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  COMPTAGE & STATISTIQUES (À METTRE EN CACHE)
  // ─────────────────────────────────────────────────────────────

  /**
   * Compte les notifications non lues d'un utilisateur
   * IMPORTANT : À mettre en cache (TTL 30s) car appelé très souvent
   *
   * @param {number} id_utilisateur
   * @returns {Promise<number>} Nombre de notifications non lues
   */
  async getUnreadCount(id_utilisateur) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notification WHERE id_utilisateur = $1 AND est_lu = FALSE',
      [id_utilisateur]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Récupère la matrice des types valides
   * IMPORTANT : À mettre en cache (TTL 1h) - jamais modifié en prod
   *
   * @returns {Promise<object>} Matrice TYPE_ROLE_MAP
   */
  async getValidTypesList() {
    return TYPE_ROLE_MAP;
  }

  /**
   * Récupère toutes les notifications d'un utilisateur avec pagination
   *
   * @param {number} id_utilisateur
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<object>} { data: [], total: number }
   */
  async getNotificationsByUser(id_utilisateur, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM notification WHERE id_utilisateur = $1',
      [id_utilisateur]
    );

    const dataResult = await pool.query(
      `SELECT * FROM notification
       WHERE id_utilisateur = $1
       ORDER BY date_creation DESC
       LIMIT $2 OFFSET $3`,
      [id_utilisateur, limit, offset]
    );

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      limit
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  ADMIN - Méthodes spécifiques
  // ─────────────────────────────────────────────────────────────

  /**
   * Retourne tous les IDs des utilisateurs avec le rôle ADMIN
   */
  async findAllAdminUserIds() {
    const result = await pool.query(
      "SELECT id_utilisateur FROM utilisateur WHERE role_par_defaut = 'ADMIN'"
    );
    return result.rows.map(r => r.id_utilisateur);
  }

  /**
   * Récupère les notifications admin avec filtres
   *
   * @param {object} filters
   * @param {number} filters.id_utilisateur
   * @param {string} [filters.type]
   * @param {number} [filters.priorite]
   * @param {boolean} [filters.est_lu]
   * @param {string} [filters.categorie]
   * @param {number} [filters.page=1]
   * @param {number} [filters.limit=20]
   */
  async getAdminNotifications(filters) {
    const { id_utilisateur, type, priorite, est_lu, categorie, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['id_utilisateur = $1'];
    const params = [id_utilisateur];
    let paramIndex = 2;

    if (type && ADMIN_TYPES.includes(type)) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    } else {
      conditions.push(`type = ANY($${paramIndex++}::text[])`);
      params.push(ADMIN_TYPES);
    }

    if (priorite) {
      conditions.push(`priorite = $${paramIndex++}`);
      params.push(priorite);
    }

    if (est_lu !== undefined) {
      conditions.push(`est_lu = $${paramIndex++}`);
      params.push(est_lu);
    }

    if (categorie) {
      conditions.push(`categorie = $${paramIndex++}`);
      params.push(categorie);
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM notification WHERE ${whereClause}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT * FROM notification
       WHERE ${whereClause}
       ORDER BY priorite ASC, date_creation DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      limit
    };
  }

  /**
   * Statistiques des notifications admin pour un utilisateur
   */
  async getAdminNotificationStats(id_utilisateur) {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE type LIKE 'ADMIN_%') AS total,
        COUNT(*) FILTER (WHERE type LIKE 'ADMIN_%' AND est_lu = FALSE) AS non_lues,
        COUNT(*) FILTER (WHERE type LIKE 'ADMIN_%' AND priorite = 1 AND est_lu = FALSE) AS urgentes,
        COUNT(*) FILTER (WHERE type LIKE 'ADMIN_%' AND priorite = 2 AND est_lu = FALSE) AS hautes,
        COUNT(*) FILTER (WHERE type LIKE 'ADMIN_%' AND priorite = 3 AND est_lu = FALSE) AS moyennes,
        COUNT(*) FILTER (WHERE type LIKE 'ADMIN_%' AND priorite = 4 AND est_lu = FALSE) AS basses
      FROM notification
      WHERE id_utilisateur = $1`,
      [id_utilisateur]
    );

    const typeStats = await pool.query(
      `SELECT type, COUNT(*) as count,
        COUNT(*) FILTER (WHERE est_lu = FALSE) as non_lues
       FROM notification
       WHERE id_utilisateur = $1 AND type LIKE 'ADMIN_%'
       GROUP BY type
       ORDER BY count DESC`,
      [id_utilisateur]
    );

    return {
      totals: result.rows[0],
      byType: typeStats.rows,
      categories: {
        ALERTES: 'ADMIN_ALERTE',
        INFRASTRUCTURE: 'ADMIN_SERVICE',
        CONTENEURS: 'ADMIN_SEUIL',
        ML_ANOMALIES: 'ADMIN_ML',
        SECURITE: 'ADMIN_SECURITE',
        PERFORMANCE: 'ADMIN_PERFORMANCE',
        IOT: 'ADMIN_IOT'
      }
    };
  }

  /**
   * Marque comme lue une notification admin
   */
  async markAsReadAdmin(id_notification, id_utilisateur, role = null) {
    const sql = `
      UPDATE notification
      SET est_lu = TRUE
      WHERE id_notification = $1
        AND id_utilisateur = $2
        AND type LIKE 'ADMIN_%'
      RETURNING *
    `;

    const result = await pool.query(sql, [id_notification, id_utilisateur]);

    if (result.rowCount === 0) {
      const exists = await pool.query(
        'SELECT id_notification FROM notification WHERE id_notification = $1',
        [id_notification]
      );
      if (exists.rowCount === 0) {
        throw new ApiError(404, `Notification ${id_notification} introuvable`);
      }
      throw new ApiError(403, 'Vous n\'êtes pas propriétaire de cette notification');
    }

    return result.rows[0];
  }

  /**
   * Supprime une notification admin (owned by id_utilisateur, any type).
   */
  async deleteAdminNotification(id_notification, id_utilisateur) {
    const result = await pool.query(
      `DELETE FROM notification
       WHERE id_notification = $1 AND id_utilisateur = $2
       RETURNING id_notification`,
      [id_notification, id_utilisateur]
    );

    if (result.rowCount === 0) {
      const exists = await pool.query(
        'SELECT id_notification FROM notification WHERE id_notification = $1',
        [id_notification]
      );
      if (exists.rowCount === 0) {
        throw new ApiError(404, `Notification ${id_notification} introuvable`);
      }
      throw new ApiError(403, 'Vous n\'êtes pas propriétaire de cette notification');
    }
  }
}

module.exports = new NotificationRepository();
