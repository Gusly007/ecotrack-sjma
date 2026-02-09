// Rôle du fichier : gestion du catalogue des badges et attribution automatique.
import pool from '../config/database.js';

export const BADGE_SEUILS = {
  DEBUTANT: 100,
  ECO_GUERRIER: 500,
  SUPER_HEROS: 1000
};

// Retourne tous les badges avec leur seuil de points.
export const listerBadges = async () => {
  const { rows } = await pool.query(
    // Lecture du catalogue des badges.
    'SELECT id_badge, code, nom, description FROM badge ORDER BY nom'
  );
  return rows
    .map((badge) => ({
      ...badge,
      points_requis: BADGE_SEUILS[badge.code] ?? null
    }))
    .sort((a, b) => (a.points_requis ?? 0) - (b.points_requis ?? 0));
};

// Retourne les badges déjà obtenus par un utilisateur.
export const listerBadgesUtilisateur = async (idUtilisateur) => {
  const { rows } = await pool.query(
    `SELECT b.id_badge, b.code, b.nom, b.description, bu.date_obtention
     FROM user_badge bu
     JOIN badge b ON b.id_badge = bu.id_badge
     WHERE bu.id_utilisateur = $1
     ORDER BY bu.date_obtention DESC`,
    [idUtilisateur]
  );
  return rows.map((badge) => ({
    ...badge,
    points_requis: BADGE_SEUILS[badge.code] ?? null
  }));
};

// Attribue automatiquement les badges atteints sans doublons.
export const attribuerBadgesAutomatique = async ({ client = pool, idUtilisateur, totalPoints }) => {
  const codes = Object.keys(BADGE_SEUILS);
  if (codes.length === 0) {
    return [];
  }

  const { rows: badgesEligibles } = await client.query(
    // Charge uniquement les badges connus par le service.
    `SELECT id_badge, code, nom
     FROM badge
     WHERE code = ANY($1)`,
    [codes]
  );

  if (badgesEligibles.length === 0) {
    return [];
  }

  // On filtre les badges atteints, puis on insère uniquement ceux non obtenus.
  const badgesFiltres = badgesEligibles
    .map((badge) => ({ ...badge, points_requis: BADGE_SEUILS[badge.code] ?? 0 }))
    .filter((badge) => badge.points_requis <= totalPoints)
    .sort((a, b) => a.points_requis - b.points_requis);

  if (badgesFiltres.length === 0) {
    return [];
  }

  const { rows: badgesExistants } = await client.query(
    // On récupère les badges déjà obtenus pour éviter les doublons.
    'SELECT id_badge FROM user_badge WHERE id_utilisateur = $1',
    [idUtilisateur]
  );

  const existants = new Set(badgesExistants.map((badge) => badge.id_badge));
  const nouveaux = badgesFiltres.filter((badge) => !existants.has(badge.id_badge));

  for (const badge of nouveaux) {
    // Insertion des nouveaux badges uniquement.
    await client.query(
      'INSERT INTO user_badge (id_utilisateur, id_badge) VALUES ($1, $2)',
      [idUtilisateur, badge.id_badge]
    );
  }

  return nouveaux;
};
