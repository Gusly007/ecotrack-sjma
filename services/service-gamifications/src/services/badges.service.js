// Rôle du fichier : gestion du catalogue des badges et attribution automatique.
import { BADGE_SEUILS, BadgeRepository } from '../repositories/badges.repository.js';


// Retourne tous les badges avec leur seuil de points.
export const listerBadges = async () => {
  const rows = await BadgeRepository.getAllBadges();
  return rows
    .map((badge) => ({
      ...badge,
      points_requis: BADGE_SEUILS[badge.code] ?? null
    }))
    .sort((a, b) => (a.points_requis ?? 0) - (b.points_requis ?? 0));
};

// Retourne les badges déjà obtenus par un utilisateur.
export const listerBadgesUtilisateur = async (idUtilisateur) => {
  const rows = await BadgeRepository.getUserBadges(idUtilisateur);
  return rows.map((badge) => ({
    ...badge,
    points_requis: BADGE_SEUILS[badge.code] ?? null
  }));
};

// Attribue automatiquement les badges atteints sans doublons.
export const attribuerBadgesSiEligibles = async (idUtilisateur, totalPoints, client) => {
  const codes = Object.keys(BADGE_SEUILS);
  if (codes.length === 0) return [];

  const badgesEligibles = await BadgeRepository.getKnownBadges(codes, client);
  if (badgesEligibles.length === 0) return [];

  const badgesFiltres = badgesEligibles
    .map((badge) => ({ ...badge, points_requis: BADGE_SEUILS[badge.code] ?? 0 }))
    .filter((badge) => badge.points_requis <= totalPoints)
    .sort((a, b) => a.points_requis - b.points_requis);
  if (badgesFiltres.length === 0) return [];

  const existants = new Set(await BadgeRepository.getUserBadgeIds(idUtilisateur, client));
  const nouveaux = badgesFiltres.filter((badge) => !existants.has(badge.id_badge));

  for (const badge of nouveaux) {
    await BadgeRepository.insertUserBadge(idUtilisateur, badge.id_badge, client);
  }
  return nouveaux;
};
