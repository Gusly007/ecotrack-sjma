import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Jeton pré-MFA : preuve qu'un mot de passe valide a été fourni, sans accorder
 * encore de session.
 *
 * Les routes `/auth/mfa/*` ne doivent JAMAIS accepter un `userId` fourni par le
 * client : un ID séquentiel suffisait à régénérer le secret TOTP de n'importe
 * quel compte (V2-002). Elles exigent désormais ce jeton, émis uniquement par
 * `POST /auth/login` après vérification du mot de passe.
 *
 * Propriétés :
 *  - même secret que les access tokens, mais `type: 'mfa'` — le middleware
 *    d'authentification refuse tout ce qui n'est pas `type: 'access'`, donc ce
 *    jeton ne peut pas servir à accéder à l'API ;
 *  - durée de vie courte : le temps de saisir un code, pas plus ;
 *  - lié à un usage : `purpose` limite le jeton à une famille d'actions.
 */
const MFA_TOKEN_TTL = '5m';

export const MFA_TOKEN_TYPE = 'mfa';

export const MFA_PURPOSES = {
  LOGIN: 'mfa_login',
  SETUP: 'mfa_setup',
  RECOVERY: 'mfa_recovery',
};

/**
 * Émet un jeton pré-MFA.
 * @param {number} userId
 * @param {string} purpose - une valeur de MFA_PURPOSES
 * @returns {string}
 */
export const generateMfaToken = (userId, purpose) => {
  if (!userId || !purpose) {
    throw new Error('generateMfaToken: userId et purpose requis');
  }
  return jwt.sign(
    { id: userId, type: MFA_TOKEN_TYPE, purpose },
    env.jwt.secret,
    { expiresIn: MFA_TOKEN_TTL }
  );
};

/**
 * Vérifie un jeton pré-MFA et le `purpose` attendu.
 * @param {string} token
 * @param {string} expectedPurpose
 * @returns {{ id: number, purpose: string }}
 * @throws {Error} si invalide, expiré, mauvais type ou mauvais purpose
 */
export const verifyMfaToken = (token, expectedPurpose) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new Error('Jeton MFA invalide ou expiré');
  }

  if (!decoded || decoded.type !== MFA_TOKEN_TYPE) {
    throw new Error('Jeton MFA invalide ou expiré');
  }
  if (expectedPurpose && decoded.purpose !== expectedPurpose) {
    throw new Error('Jeton MFA non autorisé pour cette action');
  }

  const userId = Number(decoded.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error('Jeton MFA invalide ou expiré');
  }

  return { id: userId, purpose: decoded.purpose };
};

/**
 * Extrait le jeton pré-MFA de la requête : en-tête `X-MFA-Token` ou champ
 * `mfaToken` du corps. Le corps est accepté pour rester compatible avec un
 * client qui ne peut pas poser d'en-tête, mais le jeton n'est jamais un `userId`.
 */
export const readMfaToken = (req) => {
  const header = req.headers?.['x-mfa-token'];
  if (typeof header === 'string' && header.trim()) return header.trim();

  const body = req.body?.mfaToken;
  if (typeof body === 'string' && body.trim()) return body.trim();

  return null;
};

/**
 * Middleware : exige un jeton pré-MFA valide du `purpose` attendu et pose
 * `req.mfaUser = { id }`. Toute absence ou invalidation renvoie 401.
 */
export const requireMfaToken = (purpose) => (req, res, next) => {
  const token = readMfaToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Jeton MFA requis' });
  }

  try {
    const decoded = verifyMfaToken(token, purpose);
    req.mfaUser = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};
