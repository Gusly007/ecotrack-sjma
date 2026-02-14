// Rôle du fichier : accès aux données de classement (leaderboard).


export class LeaderboardRepository {
  static async getClassement({ limite = 10 } = {}) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `WITH classement AS (
        SELECT
          u.id_utilisateur,
          u.points,
          RANK() OVER (ORDER BY u.points DESC) AS rang,
          COALESCE(
            JSON_AGG(b.nom ORDER BY b.nom) FILTER (WHERE b.id_badge IS NOT NULL),
            '[]'::json
          ) AS badges
        FROM utilisateur u
        LEFT JOIN user_badge ub ON ub.id_utilisateur = u.id_utilisateur
        LEFT JOIN badge b ON b.id_badge = ub.id_badge
        GROUP BY u.id_utilisateur, u.points
      )
      SELECT *
      FROM classement
      ORDER BY points DESC
      LIMIT $1`,
      [limite]
    );
    return rows;
  }

  static async getUtilisateurClassement(idUtilisateur) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `WITH classement AS (
        SELECT
          u.id_utilisateur,
          u.points,
          RANK() OVER (ORDER BY u.points DESC) AS rang,
          COALESCE(
            JSON_AGG(b.nom ORDER BY b.nom) FILTER (WHERE b.id_badge IS NOT NULL),
            '[]'::json
          ) AS badges
        FROM utilisateur u
        LEFT JOIN user_badge ub ON ub.id_utilisateur = u.id_utilisateur
        LEFT JOIN badge b ON b.id_badge = ub.id_badge
        GROUP BY u.id_utilisateur, u.points
      )
      SELECT *
      FROM classement
      WHERE id_utilisateur = $1`,
      [idUtilisateur]
    );
    return rows;
  }
}
