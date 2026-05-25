// Rôle du fichier : calcul du classement et du niveau des utilisateurs.
import { LeaderboardRepository } from '../repositories/leaderboard.repository.js';

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
// `prenom`/`nom` viennent de la repo (JOIN utilisateur) — utilisés par la modale
// Classement de l'UI mobile. Si absents (payload legacy), on fournit un fallback
// "Citoyen #<id>" côté front.
const mapperClassement = (rows) =>
  rows.map((row) => ({
    rang: Number(row.rang),
    id_utilisateur: row.id_utilisateur,
    prenom: row.prenom ?? null,
    nom: row.nom ?? null,
    points: row.points,
    niveau: obtenirNiveau(row.points),
    badges: row.badges ?? []
  }));


export const recupererClassement = async ({ limite = 10, idUtilisateur } = {}) => {
  const rows = await LeaderboardRepository.getClassement({ limite });
  const classement = mapperClassement(rows);

  if (!idUtilisateur) {
    return { classement };
  }

  const utilisateurRows = await LeaderboardRepository.getUtilisateurClassement(idUtilisateur);
  return {
    classement,
    utilisateur: utilisateurRows.length ? mapperClassement(utilisateurRows)[0] : null
  };
};
