'use strict';

const { pool } = require('../db/connexion');

class ZoneRepository {
  /**
   * Retourne le gestionnaire et l'admin responsables d'un conteneur.
   * Requête : conteneur → zone → (id_gestionnaire, id_admin)
   *
   * @param {number} id_conteneur
   * @returns {Promise<{ id_gestionnaire: number|null, id_admin: number|null, zone_nom: string, zone_code: string }|null>}
   */
  async findResponsablesByContainer(id_conteneur) {
    const sql = `
      SELECT
        z.id_gestionnaire,
        z.id_admin,
        z.nom  AS zone_nom,
        z.code AS zone_code
      FROM zone z
      JOIN conteneur c ON c.id_zone = z.id_zone
      WHERE c.id_conteneur = $1
      LIMIT 1
    `;
    const result = await pool.query(sql, [id_conteneur]);
    return result.rows[0] || null;
  }

  /**
   * Retourne les responsables d'une zone directement par id_zone.
   *
   * @param {number} id_zone
   * @returns {Promise<{ id_gestionnaire: number|null, id_admin: number|null, zone_nom: string, zone_code: string }|null>}
   */
  async findResponsablesByZone(id_zone) {
    const sql = `
      SELECT
        id_gestionnaire,
        id_admin,
        nom  AS zone_nom,
        code AS zone_code
      FROM zone
      WHERE id_zone = $1
      LIMIT 1
    `;
    const result = await pool.query(sql, [id_zone]);
    return result.rows[0] || null;
  }
}

module.exports = new ZoneRepository();
