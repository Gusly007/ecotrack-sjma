const db = require('../config/database');
const logger = require('../utils/logger');
const WEIGHTS = require('../utils/agentPerformanceConstants').WEIGHTS;

class AgentPerformanceRepository {
  /**
   * Calcul du taux de réussite d'un agent sur une période
   * 
   * Taux de réussite basé sur :
   * 1. Conteneurs collectés / conteneurs prévus
   * 2. Respect du temps estimé
   * 3. Respect de la distance estimée
   * 4. Tournées complétées / tournées assignées
   */
  static async getAgentSuccessRate(agentId, startDate, endDate) {
    try {
      const query = `
        WITH agent_stats AS (
          -- Statistiques des tournées
          SELECT 
            t.id_agent,
            -- 1. Taux de collecte des conteneurs
            COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true) as containers_collected,
            COUNT(DISTINCT et.id_conteneur) as containers_total,
            ROUND(
              COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true)::numeric / 
              NULLIF(COUNT(DISTINCT et.id_conteneur), 0) * 100, 
              2
            ) as collection_rate,
            
            -- 2. Respect du temps estimé
            AVG(
              CASE 
                WHEN t.duree_reelle_min <= t.duree_prevue_min THEN 100
                WHEN t.duree_reelle_min <= t.duree_prevue_min * 1.1 THEN 90
                WHEN t.duree_reelle_min <= t.duree_prevue_min * 1.2 THEN 80
                ELSE 70
              END
            ) as time_efficiency_score,
            
            -- 3. Respect de la distance estimée
            AVG(
              CASE 
                WHEN t.distance_reelle_km <= t.distance_prevue_km THEN 100
                WHEN t.distance_reelle_km <= t.distance_prevue_km * 1.05 THEN 95
                WHEN t.distance_reelle_km <= t.distance_prevue_km * 1.1 THEN 85
                ELSE 75
              END
            ) as distance_efficiency_score,
            
            -- 4. Taux de complétion des tournées
            COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE') as routes_completed,
            COUNT(DISTINCT t.id_tournee) as routes_assigned,
            ROUND(
              COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE')::numeric / 
              NULLIF(COUNT(DISTINCT t.id_tournee), 0) * 100, 
              2
            ) as completion_rate,
            
            -- Métriques supplémentaires
            ROUND(AVG(t.distance_reelle_km), 2) as avg_distance_km,
            ROUND(AVG(t.duree_reelle_min), 2) as avg_duration_min,
            
            -- Économies réalisées
            ROUND(SUM(t.distance_prevue_km - t.distance_reelle_km), 2) as distance_saved_km,
            ROUND(SUM(t.duree_prevue_min - t.duree_reelle_min), 2) as time_saved_min
            
          FROM TOURNEE t
          LEFT JOIN ETAPE_TOURNEE et ON et.id_tournee = t.id_tournee
          WHERE t.id_agent = $1
            AND t.date_tournee BETWEEN $2 AND $3
            AND t.statut IN ('TERMINEE', 'EN_COURS')
          GROUP BY t.id_agent
        )
        SELECT 
          *,
          -- Score global de réussite (moyenne pondérée avec WEIGHTS)
          ROUND(
            (collection_rate * ${WEIGHTS.COLLECTION_RATE} +           
             completion_rate * ${WEIGHTS.COMPLETION_RATE} +            
             time_efficiency_score * ${WEIGHTS.TIME_EFFICIENCY} +     
             distance_efficiency_score * ${WEIGHTS.DISTANCE_EFFICIENCY}  
            ), 
            2
          ) as overall_success_rate
        FROM agent_stats;
      `;

      const result = await db.query(query, [agentId, startDate, endDate]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error calculating agent success rate:', error);
      throw error;
    }
  }

  /**
   * Classement des agents par performance
   */
  static async getAgentsRanking(startDate, endDate, limit = 10) {
    try {
      const query = `
        WITH agent_performance AS (
          SELECT 
            u.id_utilisateur,
            u.nom,
            u.prenom,
            COUNT(DISTINCT t.id_tournee) as total_routes,
            COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE') as completed_routes,
            
            -- Taux de collecte
            ROUND(
              COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true)::numeric / 
              NULLIF(COUNT(DISTINCT et.id_conteneur), 0) * 100, 
              2
            ) as collection_rate,
            
            -- Taux de complétion
            ROUND(
              COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE')::numeric / 
              NULLIF(COUNT(DISTINCT t.id_tournee), 0) * 100, 
              2
            ) as completion_rate,
            
            -- Efficacité moyenne
            ROUND(AVG(
              CASE 
                WHEN t.distance_reelle_km <= t.distance_prevue_km THEN 100
                ELSE (t.distance_prevue_km / NULLIF(t.distance_reelle_km, 0) * 100)
              END
            ), 2) as efficiency_score,
            
            -- Économies
            ROUND(SUM(t.distance_prevue_km - t.distance_reelle_km), 2) as distance_saved,
            
            -- Score global avec WEIGHTS
            ROUND(
              (COALESCE(
                COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true)::numeric / 
                NULLIF(COUNT(DISTINCT et.id_conteneur), 0) * 100, 0
              ) * ${WEIGHTS.COLLECTION_RATE} +
              COALESCE(
                COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE')::numeric / 
                NULLIF(COUNT(DISTINCT t.id_tournee), 0) * 100, 0
              ) * ${WEIGHTS.COMPLETION_RATE}),
              2
            ) as overall_score
            
          FROM UTILISATEUR u
          LEFT JOIN TOURNEE t ON t.id_agent = u.id_utilisateur
            AND t.date_tournee BETWEEN $1 AND $2
          LEFT JOIN ETAPE_TOURNEE et ON et.id_tournee = t.id_tournee
          WHERE u.role_par_defaut = 'AGENT'
          GROUP BY u.id_utilisateur, u.nom, u.prenom
          HAVING COUNT(DISTINCT t.id_tournee) > 0
        )
        SELECT 
          *,
          ROW_NUMBER() OVER (ORDER BY overall_score DESC) as rank
        FROM agent_performance
        ORDER BY overall_score DESC
        LIMIT $3;
      `;

      const result = await db.query(query, [startDate, endDate, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting agents ranking:', error);
      throw error;
    }
  }

  /**
   * Détails de performance par agent pour une semaine
   */
  static async getWeeklyPerformance(agentId, weekStartDate) {
    try {
      const query = `
        SELECT 
          DATE(t.date_tournee) as date,
          COUNT(DISTINCT t.id_tournee) as routes_count,
          COUNT(DISTINCT t.id_tournee) FILTER (WHERE t.statut = 'TERMINEE') as routes_completed,
          
          -- Conteneurs par jour
          COUNT(DISTINCT et.id_conteneur) as containers_total,
          COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true) as containers_collected,
          ROUND(
            COUNT(DISTINCT et.id_conteneur) FILTER (WHERE et.collectee = true)::numeric / 
            NULLIF(COUNT(DISTINCT et.id_conteneur), 0) * 100, 
            2
          ) as daily_collection_rate,
          
          -- Distances et temps
          ROUND(SUM(t.distance_reelle_km), 2) as total_distance,
          SUM(t.duree_reelle_min) as total_duration,
          
          -- Efficacité
          ROUND(AVG(
            (t.distance_prevue_km / NULLIF(t.distance_reelle_km, 0)) * 100
          ), 2) as efficiency_pct
          
        FROM TOURNEE t
        LEFT JOIN ETAPE_TOURNEE et ON et.id_tournee = t.id_tournee
        WHERE t.id_agent = $1
          AND t.date_tournee >= $2
          AND t.date_tournee < $2 + INTERVAL '7 days'
        GROUP BY DATE(t.date_tournee)
        ORDER BY date;
      `;

      const result = await db.query(query, [agentId, weekStartDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting weekly performance:', error);
      throw error;
    }
  }
}

module.exports = AgentPerformanceRepository;