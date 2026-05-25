// Rôle du fichier : accès aux données de classement (leaderboard).


export class LeaderboardRepository {
  // Scope the leaderboard to CITOYEN only — it represents how eco-engaged a
  // citizen is and should not mix staff accounts (ADMIN/GESTIONNAIRE/AGENT).
  // We also surface prenom + nom so the mobile UI can display a proper name
  // instead of a raw id.
  static async getClassement({ limite = 10 } = {}) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `WITH classement AS (
        SELECT
          u.id_utilisateur,
          u.prenom,
          u.nom,
          u.points,
          RANK() OVER (ORDER BY u.points DESC) AS rang,
          COALESCE(
            JSON_AGG(b.nom ORDER BY b.nom) FILTER (WHERE b.id_badge IS NOT NULL),
            '[]'::json
          ) AS badges
        FROM utilisateur u
        LEFT JOIN user_badge ub ON ub.id_utilisateur = u.id_utilisateur
        LEFT JOIN badge b ON b.id_badge = ub.id_badge
        WHERE u.role_par_defaut = 'CITOYEN' AND u.est_active = true
        GROUP BY u.id_utilisateur, u.prenom, u.nom, u.points
      )
      SELECT *
      FROM classement
      ORDER BY points DESC, id_utilisateur ASC
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
          u.prenom,
          u.nom,
          u.points,
          RANK() OVER (ORDER BY u.points DESC) AS rang,
          COALESCE(
            JSON_AGG(b.nom ORDER BY b.nom) FILTER (WHERE b.id_badge IS NOT NULL),
            '[]'::json
          ) AS badges
        FROM utilisateur u
        LEFT JOIN user_badge ub ON ub.id_utilisateur = u.id_utilisateur
        LEFT JOIN badge b ON b.id_badge = ub.id_badge
        WHERE u.role_par_defaut = 'CITOYEN' AND u.est_active = true
        GROUP BY u.id_utilisateur, u.prenom, u.nom, u.points
      )
      SELECT *
      FROM classement
      WHERE id_utilisateur = $1`,
      [idUtilisateur]
    );
    return rows;
  }
}
