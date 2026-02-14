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

  static async listerDefis() {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      'SELECT * FROM gamification_defi ORDER BY date_debut DESC'
    );
    return rows;
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
