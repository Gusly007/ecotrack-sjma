// Rôle du fichier : orchestrer l'enregistrement d'une action utilisateur.
import pool from '../config/database.js';
import { calculerPoints, incrementerPoints, enregistrerHistoriquePoints } from './points.service.js';
import { attribuerBadgesAutomatique } from './badges.service.js';
import { creerNotification } from './notifications.service.js';

// Enregistre une action et gère points, historique, badges et notifications.
export const enregistrerAction = async ({ idUtilisateur, typeAction, pointsCustom }) => {
  const points = calculerPoints(typeAction, pointsCustom);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // On centralise ici la logique d'orchestration pour éviter des effets de bord.
    const totalPoints = await incrementerPoints({
      client,
      idUtilisateur,
      points
    });

    await enregistrerHistoriquePoints({
      client,
      idUtilisateur,
      points,
      typeAction
    });

    const nouveauxBadges = await attribuerBadgesAutomatique({
      client,
      idUtilisateur,
      totalPoints
    });

    for (const badge of nouveauxBadges) {
      // Une notification est créée pour chaque badge débloqué.
      await creerNotification(
        {
          idUtilisateur,
          type: 'BADGE',
          titre: 'Nouveau badge débloqué',
          corps: `Félicitations ! Vous avez obtenu le badge « ${badge.nom} ».`
        },
        client
      );
    }

    await client.query('COMMIT');

    return {
      pointsAjoutes: points,
      totalPoints,
      nouveauxBadges
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
