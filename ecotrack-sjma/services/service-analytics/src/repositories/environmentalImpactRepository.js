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
          COALESCE(SUM(t.distance_prevue_km), 0) as planned_distance_km,
          COALESCE(SUM(t.distance_reelle_km), 0) as actual_distance_km,
          COALESCE(SUM(t.duree_prevue_min), 0) as planned_duration_min,
          COALESCE(SUM(t.duree_reelle_min), 0) as actual_duration_min,
          COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE') as completed_routes,
          COUNT(DISTINCT t.id_tournee) as total_routes,
          COUNT(DISTINCT et.id_conteneur) as total_containers,
          COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true) as collected_containers
        FROM TOURNEE t
        LEFT JOIN ETAPE_TOURNEE et ON et.id_tournee = t.id_tournee
        WHERE t.date_tournee BETWEEN $1 AND $2
          AND t.statut IN ('TERMINEE', 'EN_COURS');
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
