// Rôle du fichier : orchestrer l'enregistrement d'une action utilisateur.
import pool from '../config/database.js';
import { calculerPoints, incrementerPoints, enregistrerHistoriquePoints } from './points.service.js';
import { attribuerBadgesSiEligibles } from './badges.service.js';
import { creerNotification } from './notifications.service.js';
import { progresserDefisActifs } from './defis.service.js';
import { BadgeRepository } from '../repositories/badges.repository.js';

// Attribue les badges événementiels (non-points-based) suite à une action.
//
// Couverture actuelle (tous déclenchés par une action 'signalement') :
//   - FIRST_REPORT       → 1er signalement de l'utilisateur
//   - REPORTER_BRONZE    → 5e signalement
//   - REPORTER_SILVER    → 25e signalement
//   - REPORTER_GOLD      → 100e signalement
//   - REPORTER_PLATINUM  → 250e signalement
//   - URGENT_HERO        → 5e signalement avec urgence='HAUTE' ou 'URGENTE'
//   - PHOTO_REPORTER     → 5e signalement avec une photo
//   - NIGHT_OWL          → 1er signalement créé entre 22 h et 6 h
//   - CLEAN_CITY         → 10e signalement passé au statut RESOLU
//   - COMMUNITY_PILLAR   → 3e défi complété (vérifié quand typeAction='defi_reussi')
//
// Tous les checks tournent sur la transaction en cours (`client`) pour rester
// atomiques. Renvoie la liste des badges fraîchement attribués (vide si aucun).
const attribuerBadgesEvenementiels = async (idUtilisateur, typeAction, client) => {
  const newlyAwarded = [];

  // Helper : attribue un badge si l'utilisateur ne l'a pas déjà.
  const tryAward = async (code) => {
    const [b] = await BadgeRepository.getKnownBadges([code], client);
    if (!b) return;
    const existants = new Set(await BadgeRepository.getUserBadgeIds(idUtilisateur, client));
    if (existants.has(b.id_badge)) return;
    await BadgeRepository.insertUserBadge(idUtilisateur, b.id_badge, client);
    newlyAwarded.push({ ...b, points_requis: null });
  };

  if (typeAction === 'signalement') {
    // ----- 1) Compteur de signalements (paliers FIRST/BRONZE/SILVER/GOLD/PLATINUM) -----
    const { rows: cntRows } = await client.query(
      `SELECT COUNT(*)::int AS n
         FROM historique_points
        WHERE id_utilisateur = $1 AND raison = 'signalement'`,
      [idUtilisateur]
    );
    const total = cntRows[0]?.n || 0;
    const tiers = [
      [1,   'FIRST_REPORT'],
      [5,   'REPORTER_BRONZE'],
      [25,  'REPORTER_SILVER'],
      [100, 'REPORTER_GOLD'],
      [250, 'REPORTER_PLATINUM'],
    ];
    for (const [threshold, code] of tiers) {
      if (total === threshold) await tryAward(code);
    }

    // ----- 2) URGENT_HERO : 5 signalements avec urgence haute ou urgente -----
    const { rows: urgRows } = await client.query(
      `SELECT COUNT(*)::int AS n
         FROM signalement
        WHERE id_citoyen = $1
          AND urgence IN ('HAUTE','URGENTE')`,
      [idUtilisateur]
    );
    if ((urgRows[0]?.n || 0) >= 5) await tryAward('URGENT_HERO');

    // ----- 3) PHOTO_REPORTER : 5 signalements avec photo -----
    const { rows: photoRows } = await client.query(
      `SELECT COUNT(*)::int AS n
         FROM signalement
        WHERE id_citoyen = $1
          AND url_photo IS NOT NULL
          AND length(url_photo) > 0`,
      [idUtilisateur]
    );
    if ((photoRows[0]?.n || 0) >= 5) await tryAward('PHOTO_REPORTER');

    // ----- 4) NIGHT_OWL : un signalement créé entre 22 h et 6 h -----
    const { rows: nightRows } = await client.query(
      `SELECT 1
         FROM signalement
        WHERE id_citoyen = $1
          AND (EXTRACT(HOUR FROM date_creation) >= 22
            OR EXTRACT(HOUR FROM date_creation) < 6)
        LIMIT 1`,
      [idUtilisateur]
    );
    if (nightRows.length > 0) await tryAward('NIGHT_OWL');

    // ----- 5) CLEAN_CITY : 10 signalements résolus -----
    const { rows: resoluRows } = await client.query(
      `SELECT COUNT(*)::int AS n
         FROM signalement
        WHERE id_citoyen = $1 AND statut = 'RESOLU'`,
      [idUtilisateur]
    );
    if ((resoluRows[0]?.n || 0) >= 10) await tryAward('CLEAN_CITY');
  }

  if (typeAction === 'defi_reussi') {
    // ----- 6) COMMUNITY_PILLAR : 3 défis complétés -----
    const { rows: defiRows } = await client.query(
      `SELECT COUNT(*)::int AS n
         FROM gamification_participation_defi
        WHERE id_utilisateur = $1 AND statut = 'TERMINE'`,
      [idUtilisateur]
    );
    if ((defiRows[0]?.n || 0) >= 3) await tryAward('COMMUNITY_PILLAR');
  }

  return newlyAwarded;
};

// Enregistre une action et gère points, historique, défis, badges et notifications.
export const enregistrerAction = async ({ idUtilisateur, typeAction, pointsCustom }) => {
  const points = calculerPoints(typeAction, pointsCustom);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1) +points sur l'utilisateur
    let totalPoints = await incrementerPoints({
      client,
      idUtilisateur,
      points
    });

    // 2) Ligne historique pour traçabilité + affichage Accueil Citoyen.
    await enregistrerHistoriquePoints({
      client,
      idUtilisateur,
      points,
      typeAction
    });

    // 3) +1 progression sur tous les défis actifs dont type_action correspond.
    //    Pour chaque défi qui atteint l'objectif dans cet appel, on attribue la
    //    récompense_points définie, on écrit une ligne historique 'defi_reussi'
    //    et on prépare une notification.
    const defisTermines = await progresserDefisActifs({
      client,
      idUtilisateur,
      typeAction,
    });

    for (const defi of defisTermines) {
      if (defi.recompense_points > 0) {
        totalPoints = await incrementerPoints({
          client,
          idUtilisateur,
          points: defi.recompense_points,
        });
        await enregistrerHistoriquePoints({
          client,
          idUtilisateur,
          points: defi.recompense_points,
          typeAction: 'defi_reussi',
        });
      }
      await creerNotification(
        {
          idUtilisateur,
          type: 'DEFI',
          titre: 'Défi réussi',
          corps: `Bravo ! Vous avez complété un défi (+${defi.recompense_points} pts).`,
        },
        client
      );
    }

    // 4a) Badges événementiels liés à l'action principale.
    //     Ex. FIRST_REPORT, REPORTER_BRONZE/SILVER/GOLD/PLATINUM,
    //     URGENT_HERO, PHOTO_REPORTER, NIGHT_OWL, CLEAN_CITY (cf.
    //     attribuerBadgesEvenementiels).
    const badgesEvent = await attribuerBadgesEvenementiels(
      idUtilisateur,
      typeAction,
      client
    );

    // 4a-bis) Si au moins un défi a été terminé dans cet appel, on relance
    //         le check événementiel avec typeAction='defi_reussi' pour
    //         attribuer COMMUNITY_PILLAR (3 défis complétés).
    let badgesEventDefi = [];
    if (defisTermines.length > 0) {
      badgesEventDefi = await attribuerBadgesEvenementiels(
        idUtilisateur,
        'defi_reussi',
        client
      );
    }

    // 4b) Vérifie l'éligibilité aux badges par paliers de points avec le total
    //     MIS À JOUR (après défis) et insère les nouveaux badges dans user_badge.
    const badgesSeuils = await attribuerBadgesSiEligibles(
      idUtilisateur,
      totalPoints,
      client
    );
    const nouveauxBadges = [...badgesEvent, ...badgesEventDefi, ...badgesSeuils];

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
      nouveauxBadges,
      defisTermines,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
