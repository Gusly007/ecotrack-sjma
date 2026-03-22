// Rôle du fichier : accès aux données des défis et participations.


export class DefisRepository {
  static async creerDefi({
    titre,
    description,
    objectif,
    recompensePoints,
    dateDebut,
    dateFin,
    typeDefi
  }) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [titre, description, objectif, recompensePoints, dateDebut, dateFin, typeDefi]
    );
    return rows[0];
  }

  static async listerDefis({ page = 1, limit = 20, statut, typeDefi } = {}) {
    const pool = (await import('../config/database.js')).default;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    
    if (statut && statut !== 'TOUS') {
      params.push(statut);
      whereClause += ` WHERE statut = $${params.length}`;
    }
    
    if (typeDefi) {
      params.push(typeDefi);
      whereClause += whereClause ? ` AND type_defi = $${params.length}` : ` WHERE type_defi = $${params.length}`;
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM gamification_defi${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT * FROM gamification_defi${whereClause} ORDER BY date_debut DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    
    return { rows, total };
  }

  static async creerParticipation({ idDefi, idUtilisateur }) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `INSERT INTO gamification_participation_defi (id_defi, id_utilisateur)
       VALUES ($1, $2)
       RETURNING *`,
      [idDefi, idUtilisateur]
    );
    return rows[0];
  }

  static async mettreAJourProgression({ idDefi, idUtilisateur, progression, statut }) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `UPDATE gamification_participation_defi
       SET progression = $1,
           statut = COALESCE($2, statut),
           derniere_maj = CURRENT_TIMESTAMP
       WHERE id_defi = $3 AND id_utilisateur = $4
       RETURNING *`,
      [progression, statut, idDefi, idUtilisateur]
    );
    return rows[0];
  }
}
