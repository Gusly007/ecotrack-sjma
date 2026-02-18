// Rôle du fichier : accès aux défis et participations.
import { DefisRepository } from '../repositories/defis.repository.js';

// Crée un défi avec ses dates et sa récompense.
export const creerDefi = async (defiData) => {
  return await DefisRepository.creerDefi(defiData);
};

// Liste les défis disponibles, les plus récents d'abord.
export const listerDefis = async () => {
  return await DefisRepository.listerDefis();
};

// Inscrit un utilisateur à un défi.
export const creerParticipation = async ({ idDefi, idUtilisateur }) => {
  return await DefisRepository.creerParticipation({ idDefi, idUtilisateur });
};

// Met à jour la progression d'une participation.
export const mettreAJourProgression = async ({ idDefi, idUtilisateur, progression, statut }) => {
  return await DefisRepository.mettreAJourProgression({ idDefi, idUtilisateur, progression, statut });
};
