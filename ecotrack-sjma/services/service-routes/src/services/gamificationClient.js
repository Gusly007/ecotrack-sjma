// Tiny HTTP client to talk to service-gamifications directly over the Docker
// internal network (bypassing the gateway). Used after a citizen action
// (signalement creation) to award points, progress defis and check badges.
//
// Forwards `x-user-id` / `x-user-role` from the original caller so gamification
// RBAC (`gamification:self_action`) and the self-scope check in
// actionsController both pass.
//
// Failures are swallowed — gamification is an async side-effect and must not
// block the primary action (creating a signalement). Only logs a warning.
//
// Uses Node 20's built-in global `fetch` instead of axios to avoid adding a
// runtime dependency (the service doesn't ship axios in its package.json).

const GAMIFICATION_URL =
  process.env.GAMIFICATIONS_SERVICE_URL ||
  process.env.GAMIFICATION_SERVICE_URL ||
  'http://service-gamifications:3014';

const TIMEOUT_MS = Number(process.env.GAMIFICATION_TIMEOUT_MS) || 2500;

/**
 * POST /actions — register a user action (awards points, progresses defis,
 * auto-awards badges in a single transaction on the gamification side).
 *
 * @param {Object} args
 * @param {number} args.idUtilisateur    — target user id
 * @param {string} args.typeAction       — e.g. 'signalement', 'collecte'
 * @param {number} [args.pointsCustom]   — override the default +10
 * @param {string} [args.actingUserId]   — x-user-id to forward (usually same as idUtilisateur)
 * @param {string} [args.actingUserRole] — x-user-role to forward
 * @returns {Promise<Object|null>}  resolves with the gamification response or null on failure
 */
async function registerAction({ idUtilisateur, typeAction, pointsCustom, actingUserId, actingUserRole }) {
  const headers = { 'content-type': 'application/json' };
  if (actingUserId != null) headers['x-user-id'] = String(actingUserId);
  if (actingUserRole) headers['x-user-role'] = actingUserRole;

  const body = { id_utilisateur: idUtilisateur, type_action: typeAction };
  if (Number.isInteger(pointsCustom) && pointsCustom > 0) body.points = pointsCustom;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${GAMIFICATION_URL}/actions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      console.warn('[gamificationClient] registerAction non-2xx:', res.status, data);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[gamificationClient] registerAction failed:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { registerAction };
