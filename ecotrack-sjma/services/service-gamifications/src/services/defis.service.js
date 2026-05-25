// Rôle du fichier : accès aux défis et participations.
import { DefisRepository } from '../repositories/defis.repository.js';

// Crée un défi avec ses dates et sa récompense.
export const creerDefi = async (defiData) => {
  return await DefisRepository.creerDefi(defiData);
};

// Liste les défis disponibles, les plus récents d'abord.
export const listerDefis = async (options = {}) => {
  return await DefisRepository.listerDefis(options);
};

// Inscrit un utilisateur à un défi.
export const creerParticipation = async ({ idDefi, idUtilisateur }) => {
  return await DefisRepository.creerParticipation({ idDefi, idUtilisateur });
};

// Met à jour la progression d'une participation.
export const mettreAJourProgression = async ({ idDefi, idUtilisateur, progression, statut }) => {
  return await DefisRepository.mettreAJourProgression({ idDefi, idUtilisateur, progression, statut });
};

// Passe automatiquement +1 à la progression de tous les défis actifs dont
// type_action correspond à l'action. Retourne la liste des défis complétés
// durant cet appel (pour que l'orchestrateur attribue la récompense et crée
// une notification).
export const progresserDefisActifs = async ({ client, idUtilisateur, typeAction }) => {
  return await DefisRepository.progresserDefisActifs({ client, idUtilisateur, typeAction });
};
