class StatsRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Dashboard global des tournées
   */
  async getDashboard() {
    const [tournees, collectes, vehicules] = await Promise.all([
      this.db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN statut = 'PLANIFIEE' THEN 1 END) AS planifiees,
          COUNT(CASE WHEN statut = 'EN_COURS' THEN 1 END) AS en_cours,
          COUNT(CASE WHEN statut = 'TERMINEE' THEN 1 END) AS terminees,
          COUNT(CASE WHEN statut = 'ANNULEE' THEN 1 END) AS annulees,
          COUNT(CASE WHEN date_tournee = CURRENT_DATE THEN 1 END) AS aujourd_hui
        FROM tournee
      `),
      this.db.query(`
        SELECT
          COUNT(*) AS total_collectes,
          COALESCE(SUM(quantite_kg), 0) AS quantite_totale_kg,
          COALESCE(AVG(quantite_kg), 0) AS quantite_moyenne_kg,
          COUNT(DISTINCT id_conteneur) AS conteneurs_collectes
        FROM collecte
        WHERE date_heure_collecte >= CURRENT_DATE - INTERVAL '30 days'
      `),
      this.db.query(`
        SELECT
          COUNT(*) AS total_vehicules,
          COUNT(CASE WHEN t.statut IN ('PLANIFIEE','EN_COURS') THEN 1 END) AS vehicules_en_service
        FROM vehicule v
        LEFT JOIN tournee t ON t.id_vehicule = v.id_vehicule
          AND t.date_tournee = CURRENT_DATE
        GROUP BY ()
      `)
    ]);

    return {
      tournees: tournees.rows[0],
      collectes_30j: collectes.rows[0],
      vehicules: vehicules.rows[0] || { total_vehicules: 0, vehicules_en_service: 0 }
    };
  }

  /**
   * KPIs de performance
   */
  async getKpis(options = {}) {
    const { date_debut, date_fin, id_zone } = options;

    const params = [];
    const conditions = ['1=1'];
    let idx = 1;

    if (date_debut) { conditions.push(`t.date_tournee >= $${idx++}`); params.push(date_debut); }
    if (date_fin) { conditions.push(`t.date_tournee <= $${idx++}`); params.push(date_fin); }
    if (id_zone) { conditions.push(`t.id_zone = $${idx++}`); params.push(id_zone); }

    const where = conditions.join(' AND ');

    const result = await this.db.query(
      `SELECT
        COUNT(DISTINCT t.id_tournee) AS total_tournees,
        COUNT(DISTINCT CASE WHEN t.statut = 'TERMINEE' THEN t.id_tournee END) AS tournees_terminees,
        ROUND(
          COUNT(DISTINCT CASE WHEN t.statut = 'TERMINEE' THEN t.id_tournee END)::numeric /
          NULLIF(COUNT(DISTINCT t.id_tournee), 0) * 100, 2
        ) AS taux_completion_pct,
        COALESCE(SUM(t.distance_reelle_km), 0) AS distance_totale_km,
        COALESCE(AVG(t.distance_reelle_km), 0) AS distance_moyenne_km,
        COALESCE(SUM(CASE WHEN t.distance_prevue_km > 0
          THEN t.distance_prevue_km - COALESCE(t.distance_reelle_km, t.distance_prevue_km)
          ELSE 0 END), 0) AS distance_economisee_km,
        COUNT(DISTINCT col.id_collecte) AS total_collectes,
        COALESCE(SUM(col.quantite_kg), 0) AS quantite_totale_kg,
        COALESCE(AVG(t.duree_reelle_min), 0) AS duree_moyenne_min,
        ROUND(COALESCE(SUM(t.distance_reelle_km), 0) * 0.27, 2) AS co2_economise_kg
       FROM tournee t
       LEFT JOIN collecte col ON col.id_tournee = t.id_tournee
       WHERE ${where}`,
      params
    );

    return result.rows[0];
  }

  /**
   * Statistiques des collectes par période
   */
  async getCollecteStats(options = {}) {
    const { date_debut, date_fin, id_zone } = options;

    const params = [];
    const conditions = ['1=1'];
    let idx = 1;

    if (date_debut) { conditions.push(`t.date_tournee >= $${idx++}`); params.push(date_debut); }
    if (date_fin) { conditions.push(`t.date_tournee <= $${idx++}`); params.push(date_fin); }
    if (id_zone) { conditions.push(`t.id_zone = $${idx++}`); params.push(id_zone); }

    const where = conditions.join(' AND ');

    const result = await this.db.query(
      `SELECT
        t.date_tournee,
        z.nom AS zone_nom,
        COUNT(col.id_collecte) AS nb_collectes,
        COALESCE(SUM(col.quantite_kg), 0) AS quantite_kg,
        COUNT(DISTINCT t.id_tournee) AS nb_tournees
       FROM tournee t
       LEFT JOIN collecte col ON col.id_tournee = t.id_tournee
       LEFT JOIN zone z ON z.id_zone = t.id_zone
       WHERE ${where}
       GROUP BY t.date_tournee, z.nom
       ORDER BY t.date_tournee DESC`,
      params
    );

    return result.rows;
  }

  /**
   * Comparaison d'algorithmes (estimation)
   */
  async getAlgorithmComparison() {
    const result = await this.db.query(`
      SELECT
        COUNT(*) AS tournees_analysees,
        COALESCE(AVG(distance_prevue_km), 0) AS distance_prevue_moyenne,
        COALESCE(AVG(distance_reelle_km), 0) AS distance_reelle_moyenne,
        COALESCE(
          (AVG(distance_prevue_km) - AVG(distance_reelle_km)) /
          NULLIF(AVG(distance_prevue_km), 0) * 100,
          0
        ) AS gain_pourcentage
      FROM tournee
      WHERE statut = 'TERMINEE'
        AND distance_prevue_km IS NOT NULL
        AND distance_reelle_km IS NOT NULL
    `);
    return result.rows[0];
  }
}

module.exports = StatsRepository;
