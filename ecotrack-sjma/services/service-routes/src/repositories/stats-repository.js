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
          COUNT(CASE WHEN date_tournee = CURRENT_DATE THEN 1 END) AS aujourd_hui,
          COUNT(CASE WHEN statut IN ('PLANIFIEE', 'EN_COURS')
            AND heure_debut_prevue IS NOT NULL
            AND duree_prevue_min IS NOT NULL
            AND (date_tournee + heure_debut_prevue + duree_prevue_min * INTERVAL '1 minute') < NOW()
            THEN 1 END) AS en_retard,
          COUNT(DISTINCT CASE WHEN statut = 'EN_COURS' AND id_agent IS NOT NULL
            THEN id_agent END) AS agents_terrain
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
   * Statistiques d'un agent spécifique sur une période
   * @param {number} agentId - id_utilisateur de l'agent
   * @param {string} period - 'jour' | 'semaine' | 'mois' (défaut: mois)
   */
  async getAgentStats(agentId, period = 'mois') {
    const intervalMap = {
      jour: '1 day',
      semaine: '7 days',
      mois: '30 days',
    };
    const interval = intervalMap[period] || '30 days';

    const result = await this.db.query(
      `SELECT
        COUNT(DISTINCT t.id_tournee) AS total_tournees,
        COUNT(DISTINCT CASE WHEN t.statut = 'TERMINEE' THEN t.id_tournee END) AS tournees_terminees,
        COUNT(DISTINCT col.id_collecte) AS total_collectes,
        COALESCE(SUM(col.quantite_kg), 0) AS total_kg,
        COALESCE(SUM(t.distance_reelle_km), 0) AS distance_totale_km,
        ROUND(
          COALESCE(SUM(t.distance_reelle_km), 0) * 0.27, 2
        ) AS co2_economise_kg,
        ROUND(
          COUNT(DISTINCT CASE WHEN t.statut = 'TERMINEE' THEN t.id_tournee END)::numeric /
          NULLIF(COUNT(DISTINCT t.id_tournee), 0) * 100, 2
        ) AS taux_reussite_pct,
        (SELECT COUNT(*) FROM signalement WHERE id_citoyen = $1
          AND date_creation >= CURRENT_DATE - $2::interval) AS total_anomalies
       FROM tournee t
       LEFT JOIN collecte col ON col.id_tournee = t.id_tournee
       WHERE t.id_agent = $1
         AND t.date_tournee >= CURRENT_DATE - $2::interval`,
      [agentId, interval]
    );

    const row = result.rows[0] || {};
    return {
      period,
      total_tournees: parseInt(row.total_tournees, 10) || 0,
      tournees_terminees: parseInt(row.tournees_terminees, 10) || 0,
      total_collectes: parseInt(row.total_collectes, 10) || 0,
      total_kg: parseFloat(row.total_kg) || 0,
      distance_totale_km: parseFloat(row.distance_totale_km) || 0,
      co2_economise_kg: parseFloat(row.co2_economise_kg) || 0,
      taux_reussite_pct: parseFloat(row.taux_reussite_pct) || 0,
      total_anomalies: parseInt(row.total_anomalies, 10) || 0,
    };
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

  /**
   * Progression moyenne (%) de toutes les tournées EN_COURS
   */
  async getAverageProgression() {
    const result = await this.db.query(`
      WITH progression AS (
        SELECT
          ROUND(
            COUNT(CASE WHEN et.collectee THEN 1 END)::numeric
            / NULLIF(COUNT(et.id_etape), 0) * 100, 1
          ) AS progression_pct
        FROM tournee t
        JOIN etape_tournee et ON et.id_tournee = t.id_tournee
        WHERE t.statut = 'EN_COURS'
        GROUP BY t.id_tournee
      )
      SELECT ROUND(AVG(progression_pct), 1) AS progression_moyenne_pct
      FROM progression
    `);
    return parseFloat(result.rows[0]?.progression_moyenne_pct) || 0;
  }

  /**
   * Tournées EN_COURS dont la progression dépasse un seuil (défaut 80 %)
   * @param {number} seuil  Pourcentage minimum (0-100)
   */
  async getTourneesNearlyDone(seuil = 80) {
    const result = await this.db.query(
      `WITH progression AS (
        SELECT
          t.id_tournee,
          t.code,
          t.date_tournee,
          t.id_zone,
          t.id_agent,
          COUNT(et.id_etape)                                    AS total_etapes,
          COUNT(CASE WHEN et.collectee THEN 1 END)              AS etapes_collectees,
          ROUND(
            COUNT(CASE WHEN et.collectee THEN 1 END)::numeric
            / NULLIF(COUNT(et.id_etape), 0) * 100, 1
          )                                                     AS progression_pct
        FROM tournee t
        JOIN etape_tournee et ON et.id_tournee = t.id_tournee
        WHERE t.statut = 'EN_COURS'
        GROUP BY t.id_tournee, t.code, t.date_tournee, t.id_zone, t.id_agent
      )
      SELECT
        p.id_tournee,
        p.code,
        p.date_tournee,
        p.total_etapes,
        p.etapes_collectees,
        p.progression_pct,
        z.nom                             AS zone_nom,
        u.nom || ' ' || u.prenom          AS agent_nom
      FROM progression p
      LEFT JOIN zone z         ON z.id_zone          = p.id_zone
      LEFT JOIN utilisateur u  ON u.id_utilisateur   = p.id_agent
      WHERE p.progression_pct > $1
      ORDER BY p.progression_pct DESC`,
      [seuil]
    );
    return result.rows;
  }


  /**
   * Stats personnelles d'un agent sur une période + classement
   * @param {number} agentId
   * @param {string} period  'jour' | 'semaine' | 'mois'
   */
  async getAgentStats(agentId, period = 'semaine') {
    const intervalMap = { jour: '1 day', semaine: '7 days', mois: '30 days' };
    const interval = intervalMap[period] || '7 days';

    const [statsResult, rankResult] = await Promise.all([
      this.db.query(
        `WITH agent_tournees AS (
           SELECT id_tournee, statut, distance_reelle_km, distance_prevue_km
           FROM tournee
           WHERE id_agent = $1
             AND date_tournee >= CURRENT_DATE - $2::interval
         ),
         etape_progress AS (
           SELECT e.id_tournee,
                  COUNT(*)                              AS total_etapes,
                  COUNT(*) FILTER (WHERE e.collectee)  AS etapes_collectees
           FROM etape_tournee e
           WHERE e.id_tournee IN (SELECT id_tournee FROM agent_tournees)
           GROUP BY e.id_tournee
         ),
         collecte_data AS (
           SELECT t.id_tournee,
                  COUNT(DISTINCT col.id_collecte) AS nb_collectes,
                  COALESCE(SUM(col.quantite_kg), 0) AS total_kg
           FROM agent_tournees t
           LEFT JOIN collecte col ON col.id_tournee = t.id_tournee
           GROUP BY t.id_tournee
         )
         SELECT
           COUNT(DISTINCT at.id_tournee)                                     AS total_tournees,
           COUNT(DISTINCT CASE WHEN at.statut = 'TERMINEE'
                               THEN at.id_tournee END)                       AS tournees_terminees,
           COALESCE(SUM(cd.nb_collectes), 0)                                 AS total_collectes,
           COALESCE(SUM(cd.total_kg), 0)                                     AS total_kg,
           COALESCE(SUM(
             COALESCE(
               at.distance_reelle_km,
               at.distance_prevue_km
                 * COALESCE(ep.etapes_collectees, 0)::numeric
                 / NULLIF(ep.total_etapes, 0)
             )
           ), 0)                                                              AS distance_totale_km,
           ROUND(
             COALESCE(SUM(ep.etapes_collectees), 0)::numeric
             / NULLIF(SUM(ep.total_etapes), 0) * 100, 2
           )                                                                  AS taux_reussite_pct
         FROM agent_tournees at
         LEFT JOIN etape_progress ep ON ep.id_tournee = at.id_tournee
         LEFT JOIN collecte_data  cd ON cd.id_tournee = at.id_tournee`,
        [agentId, interval]
      ),
      this.db.query(
        `WITH agent_etapes AS (
           SELECT t.id_agent,
                  COUNT(*) FILTER (WHERE e.collectee) AS etapes_collectees
           FROM tournee t
           JOIN etape_tournee e ON e.id_tournee = t.id_tournee
           WHERE t.date_tournee >= CURRENT_DATE - $1::interval
             AND t.id_agent IS NOT NULL
           GROUP BY t.id_agent
           HAVING COUNT(*) FILTER (WHERE e.collectee) > 0
         ),
         ranked AS (
           SELECT id_agent, etapes_collectees,
                  RANK() OVER (ORDER BY etapes_collectees DESC) AS rang
           FROM agent_etapes
         )
         SELECT rang, etapes_collectees,
                (SELECT COUNT(*) FROM agent_etapes) AS total_agents
         FROM ranked
         WHERE id_agent = $2`,
        [interval, agentId]
      ),
    ]);

    const row  = statsResult.rows[0] || {};
    const rank = rankResult.rows[0]  || {};

    const distanceKm = parseFloat(row.distance_totale_km) || 0;

    return {
      period,
      total_tournees:     parseInt(row.total_tournees, 10)     || 0,
      tournees_terminees: parseInt(row.tournees_terminees, 10) || 0,
      total_collectes:    parseInt(row.total_collectes, 10)    || 0,
      total_kg:           parseFloat(row.total_kg)             || 0,
      distance_totale_km: distanceKm,
      co2_economise_kg:   parseFloat((distanceKm * 0.27).toFixed(2)),
      taux_reussite_pct:  parseFloat(row.taux_reussite_pct)    || 0,
      classement: {
        rang:         parseInt(rank.rang, 10)         || null,
        total_agents: parseInt(rank.total_agents, 10) || 0,
      },
    };
  }
}

module.exports = StatsRepository;
