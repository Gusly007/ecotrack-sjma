const db = require('../config/database');
const logger = require('../utils/logger');

class EnvironmentalImpactRepository {
  /**
   * Récupérer l'impact environnemental pour une période
   */
  static async getEnvironmentalImpact(startDate, endDate) {
    try {
      const query = `
        SELECT 
          COALESCE(SUM(distance_prevue_km), 0) as planned_distance_km,
          COALESCE(SUM(distance_reelle_km), 0) as actual_distance_km,
          COALESCE(SUM(duree_prevue_min), 0) as planned_duration_min,
          COALESCE(SUM(duree_reelle_min), 0) as actual_duration_min,
          COUNT(*) FILTER (WHERE statut = 'TERMINEE') as completed_routes,
          COUNT(*) as total_routes,
          0 as total_containers,
          0 as collected_containers
        FROM TOURNEE
        WHERE date_tournee BETWEEN $1 AND $2
          AND statut IN ('TERMINEE', 'EN_COURS');
      `;

      const result = await db.query(query, [startDate, endDate]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting environmental impact:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'impact par zone
   */
  static async getImpactByZone(startDate, endDate) {
    try {
      const query = `
        SELECT 
          z.id_zone,
          z.nom as zone_name,
          z.code as zone_code,
          COUNT(DISTINCT t.id_tournee) as routes_count,
          COUNT(DISTINCT et.id_conteneur) as containers_count,
          ROUND(AVG(m.niveau_remplissage_pct), 2) as avg_fill_level,
          COALESCE(SUM(t.distance_reelle_km), 0) as total_distance_km
        FROM ZONE z
        LEFT JOIN CONTENEUR c ON c.id_zone = z.id_zone
        LEFT JOIN MESURE m ON m.id_conteneur = c.id_conteneur
        LEFT JOIN ETAPE_TOURNEE et ON et.id_conteneur = c.id_conteneur
        LEFT JOIN TOURNEE t ON t.id_tournee = et.id_tournee 
          AND t.date_tournee BETWEEN $1 AND $2
        GROUP BY z.id_zone, z.nom, z.code
        ORDER BY total_distance_km DESC;
      `;

      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting impact by zone:', error);
      throw error;
    }
  }
}

module.exports = EnvironmentalImpactRepository;
