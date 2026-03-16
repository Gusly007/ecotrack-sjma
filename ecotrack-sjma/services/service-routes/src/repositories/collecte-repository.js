class CollecteRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Enregistre une collecte et met à jour l'étape de tournée
   */
  async recordCollecte(tourneeId, conteneurId, quantiteKg) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Vérifier que l'étape existe dans la tournée
      const etapeResult = await client.query(
        `SELECT id_etape, collectee FROM etape_tournee
         WHERE id_tournee = $1 AND id_conteneur = $2`,
        [tourneeId, conteneurId]
      );

      if (etapeResult.rows.length === 0) {
        const ApiError = require('../utils/api-error');
        throw ApiError.notFound(`Le conteneur ${conteneurId} ne fait pas partie de la tournée ${tourneeId}`);
      }

      // Créer l'enregistrement de collecte
      const collecteResult = await client.query(
        `INSERT INTO collecte (date_heure_collecte, quantite_kg, id_tournee, id_conteneur)
         VALUES (NOW(), $1, $2, $3)
         RETURNING *`,
        [quantiteKg, tourneeId, conteneurId]
      );

      // Marquer l'étape comme collectée
      await client.query(
        `UPDATE etape_tournee SET collectee = TRUE
         WHERE id_tournee = $1 AND id_conteneur = $2`,
        [tourneeId, conteneurId]
      );

      await client.query('COMMIT');
      return collecteResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les collectes d'une tournée
   */
  async findByTournee(tourneeId) {
    const result = await this.db.query(
      `SELECT
        col.*,
        c.uid AS conteneur_uid, c.capacite_l,
        ST_X(c.position) AS longitude, ST_Y(c.position) AS latitude
       FROM collecte col
       JOIN conteneur c ON c.id_conteneur = col.id_conteneur
       WHERE col.id_tournee = $1
       ORDER BY col.date_heure_collecte ASC`,
      [tourneeId]
    );
    return result.rows;
  }

  /**
   * Rapport de signalement d'anomalie (utilise la table signalement)
   */
  async reportAnomalie(tourneeId, conteneurId, agentId, typeAnomalie, description) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Récupérer l'id du type de signalement
      const typeResult = await client.query(
        `SELECT id_type FROM type_signalement WHERE libelle = $1`,
        [typeAnomalie]
      );

      if (typeResult.rows.length === 0) {
        const ApiError = require('../utils/api-error');
        throw ApiError.notFound(`Type d'anomalie inconnu: ${typeAnomalie}`);
      }

      const idType = typeResult.rows[0].id_type;
      const descriptionComplete = `[Tournée #${tourneeId}] ${description}`;

      // Créer le signalement avec l'agent comme rapporteur
      const signalResult = await client.query(
        `INSERT INTO signalement (description, statut, id_type, id_conteneur, id_citoyen)
         VALUES ($1, 'OUVERT', $2, $3, $4)
         RETURNING *`,
        [descriptionComplete, idType, conteneurId, agentId]
      );

      await client.query('COMMIT');
      return signalResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les anomalies d'une tournée
   */
  async findAnomaliesByTournee(tourneeId) {
    const result = await this.db.query(
      `SELECT
        s.*,
        ts.libelle AS type_libelle, ts.priorite,
        c.uid AS conteneur_uid,
        u.nom AS agent_nom, u.prenom AS agent_prenom
       FROM signalement s
       JOIN type_signalement ts ON ts.id_type = s.id_type
       JOIN conteneur c ON c.id_conteneur = s.id_conteneur
       JOIN utilisateur u ON u.id_utilisateur = s.id_citoyen
       WHERE s.description LIKE $1
       ORDER BY s.date_creation DESC`,
      [`[Tournée #${tourneeId}]%`]
    );
    return result.rows;
  }

  /**
   * Récupère le progrès d'une tournée
   */
  async getTourneeProgress(tourneeId) {
    const result = await this.db.query(
      `SELECT
        COUNT(*) AS total_etapes,
        COUNT(CASE WHEN e.collectee = TRUE THEN 1 END) AS etapes_collectees,
        SUM(CASE WHEN e.collectee = TRUE THEN COALESCE(col.quantite_kg, 0) ELSE 0 END) AS quantite_totale_kg
       FROM etape_tournee e
       LEFT JOIN collecte col ON col.id_tournee = e.id_tournee AND col.id_conteneur = e.id_conteneur
       WHERE e.id_tournee = $1`,
      [tourneeId]
    );
    return result.rows[0];
  }
}

module.exports = CollecteRepository;
