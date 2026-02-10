// Rôle du fichier : calcul du classement et du niveau des utilisateurs.
import pool from '../config/database.js';

// Détermine un niveau lisible selon le total de points.
const obtenirNiveau = (points) => {
  if (points >= 1000) {
    return 'Légende Verte';
  }
  if (points >= 500) {
    return 'Super-Héros';
  }
  if (points >= 100) {
    return 'Éco-Warrior';
  }
  return 'Débutant';
};

// Met en forme les lignes SQL pour la réponse API.
const mapperClassement = (rows) =>
  rows.map((row) => ({
    rang: Number(row.rang),
    id_utilisateur: row.id_utilisateur,
    points: row.points,
    niveau: obtenirNiveau(row.points),
    badges: row.badges ?? []
  }));

export const recupererClassement = async ({ limite = 10, idUtilisateur } = {}) => {
  // On agrège les badges pour éviter le N+1 et calculer le rang en SQL.
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

  const classement = mapperClassement(rows);

  if (!idUtilisateur) {
    return { classement };
  }

  // Version "focus utilisateur" pour renvoyer son rang actuel.
  const { rows: utilisateurRows } = await pool.query(
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

  return {
    classement,
    utilisateur: utilisateurRows.length ? mapperClassement(utilisateurRows)[0] : null
  };
};
