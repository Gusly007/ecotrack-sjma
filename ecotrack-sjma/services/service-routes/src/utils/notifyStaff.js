'use strict';

const axios = require('axios');

const NOTIF_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3016';
const INTERNAL_SECRET   = process.env.INTERNAL_SECRET || process.env.JWT_SECRET || 'change_me_in_production_access_secret';

/**
 * Insère une notification pour tous les gestionnaires ET admins actifs,
 * puis émet un événement WebSocket via le service de notifications.
 *
 * @param {object} db   - Pool pg
 * @param {object} opts - { type, titre, corps, priorite, categorie }
 */
async function notifyAllStaff(db, { type, titre, corps, priorite = 2, categorie = null }) {
  try {
    const staffResult = await db.query(
      `SELECT id_utilisateur FROM utilisateur
       WHERE role_par_defaut IN ('GESTIONNAIRE', 'ADMIN')
         AND est_active = true`
    );

    if (staffResult.rows.length === 0) return;

    const values = staffResult.rows.map((_, i) => {
      const base = i * 6;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const params = staffResult.rows.flatMap(r => [
      r.id_utilisateur, type, titre, corps, priorite, categorie
    ]);

    await db.query(
      `INSERT INTO notification (id_utilisateur, type, titre, corps, priorite, categorie)
       VALUES ${values.join(', ')}`,
      params
    );

    // Fire-and-forget: emit WS events + invalidate cache via notification service
    const userIds = staffResult.rows.map(r => r.id_utilisateur);
    axios.post(
      `${NOTIF_SERVICE_URL}/internal/emit-ws`,
      { userIds, notification: { type, titre, corps } },
      { headers: { 'x-internal-secret': INTERNAL_SECRET }, timeout: 3000 }
    ).catch(() => { /* non-critical */ });

  } catch { /* non-critical — ne pas bloquer le flux principal */ }
}

/**
 * Émet un événement WS + invalide le cache pour un seul utilisateur.
 * Appeler APRÈS l'INSERT en base.
 */
async function emitWsForUser(userId) {
  try {
    await axios.post(
      `${NOTIF_SERVICE_URL}/internal/emit-ws`,
      { userIds: [userId], notification: {} },
      { headers: { 'x-internal-secret': INTERNAL_SECRET }, timeout: 3000 }
    );
  } catch { /* non-critical */ }
}

module.exports = { notifyAllStaff, emitWsForUser };
