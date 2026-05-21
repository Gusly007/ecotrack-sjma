// Rôle du fichier : calcul des statistiques par jour/semaine/mois.
import pool from '../config/database.js';

// Retourne les stats globales et agrégées pour un utilisateur.
export const recupererStatsUtilisateur = async ({ idUtilisateur }) => {
  const { rows: totalRows } = await pool.query(
    // Lecture du total de points.
    'SELECT points FROM utilisateur WHERE id_utilisateur = $1',
    [idUtilisateur]
  );

  if (totalRows.length === 0) {
    const error = new Error('Utilisateur introuvable');
    error.status = 404;
    throw error;
  }

  const totalPoints = totalRows[0].points;

  const { rows: statsJour } = await pool.query(
    // Agrégation par jour sur les 7 derniers jours.
    `SELECT date_trunc('day', date_creation) AS periode, SUM(delta_points) AS points
     FROM historique_points
     WHERE id_utilisateur = $1
     GROUP BY periode
     ORDER BY periode DESC
     LIMIT 7`,
    [idUtilisateur]
  );

  const { rows: statsSemaine } = await pool.query(
    // Agrégation par semaine sur les 8 dernières semaines.
    `SELECT date_trunc('week', date_creation) AS periode, SUM(delta_points) AS points
     FROM historique_points
     WHERE id_utilisateur = $1
     GROUP BY periode
     ORDER BY periode DESC
     LIMIT 8`,
    [idUtilisateur]
  );

  const { rows: statsMois } = await pool.query(
    // Agrégation par mois sur 12 mois.
    `SELECT date_trunc('month', date_creation) AS periode, SUM(delta_points) AS points
     FROM historique_points
     WHERE id_utilisateur = $1
     GROUP BY periode
     ORDER BY periode DESC
     LIMIT 12`,
    [idUtilisateur]
  );

  return {
    totalPoints,
    parJour: statsJour,
    parSemaine: statsSemaine,
    parMois: statsMois,
    impactCO2: Math.round(totalPoints * 0.02)
  };
};

// Retourne l'historique brut des transactions de points (une ligne par événement).
// Utilisé par l'écran "Historique des points" côté citoyen, pour afficher la raison
// exacte de chaque gain/perte (ex: "SIGNALEMENT_VALIDE", "PARTICIPATION_DEFI").
export const recupererHistoriquePoints = async ({ idUtilisateur, limit = 100 }) => {
  const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));

  const { rows } = await pool.query(
    `SELECT id_historique,
            id_utilisateur,
            delta_points,
            raison,
            date_creation
     FROM historique_points
     WHERE id_utilisateur = $1
     ORDER BY date_creation DESC
     LIMIT $2`,
    [idUtilisateur, safeLimit]
  );

  return rows;
};
