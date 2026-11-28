import * as mfaService from '../services/mfaService.js';
import * as authService from '../services/authService.js';
import * as sessionService from '../services/sessionService.js';
import { sendMfaBackupCodesEmail, sendMfaRecoveryCodeEmail } from '../services/emailService.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import { generateMfaToken, MFA_PURPOSES } from '../utils/mfaToken.js';
import * as auditService from '../services/auditService.js';
import logger from '../utils/logger.js';

/**
 * Envoie les codes de secours par email, en best-effort : un échec d'envoi ne
 * doit pas faire échouer l'activation (les codes restent affichés une fois).
 */
const emailBackupCodes = async (email, backupCodes) => {
  if (!email || !Array.isArray(backupCodes) || backupCodes.length === 0) return;
  try {
    await sendMfaBackupCodesEmail(email, backupCodes);
  } catch (err) {
    logger.warn('[MFA] Échec envoi email codes de secours');
  }
};

/**
 * l'identité de l'utilisateur vient EXCLUSIVEMENT du jeton pré-MFA
 * posé par `requireMfaToken` (req.mfaUser.id), jamais de `req.body.userId`.
 * Un userId séquentiel fourni par le client permettait de régénérer le secret
 * TOTP de n'importe quel compte sans connaître son mot de passe.
 */
const getPreMfaUserId = (req) => req.mfaUser?.id ?? null;

export const setup = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await authService.getUserById(userId);
    const setupData = await mfaService.generateMfaSetup(userId, user.email);
    const { AuthRepository } = await import('../repositories/auth.repository.js');
    await AuthRepository.updateUserMfaSetupSecret(userId, setupData.secret);
    res.json({ secret: setupData.secret, qrCodeUrl: setupData.qrCodeUrl });
  } catch (err) { next(err); }
};

export const verify = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { secret, token } = req.body;
    if (!secret || !token) return res.status(400).json({ error: 'Secret et token requis' });
    if (!mfaService.verifyTotp(String(token), secret)) {
      return res.status(401).json({ error: 'Code MFA invalide' });
    }
    const result = await mfaService.enableMfa(userId, secret);
    const user = await authService.getUserById(userId);
    await emailBackupCodes(user?.email, result.backupCodes);
    res.json({ message: 'MFA activé', backupCodes: result.backupCodes });
  } catch (err) { next(err); }
};

export const disable = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await mfaService.disableMfa(userId);
    res.json({ message: 'MFA désactivé' });
  } catch (err) { next(err); }
};

export const completeSetupAndLogin = async (req, res, next) => {
  try {
    const userId = getPreMfaUserId(req);
    if (!userId) return res.status(401).json({ error: 'Jeton MFA requis' });

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code requis' });

    const user = await authService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const setupSecret = user.mfa_setup_secret;
    if (!setupSecret) return res.status(400).json({ error: 'Setup MFA non initialisé' });

    if (!mfaService.verifyTotp(String(code), setupSecret)) {
      return res.status(401).json({ error: 'Code MFA invalide' });
    }

    const enableResult = await mfaService.enableMfa(userId, setupSecret);
    const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
    const refreshToken = generateRefreshToken(user.id_utilisateur);
    await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);

    // Envoi des codes de secours par email à l'activation (best-effort).
    await emailBackupCodes(user.email, enableResult?.backupCodes);

    try {
      await auditService.logLoginAttempt(user.email, true, req.ip);
    } catch (_) { /* audit best-effort */ }

    res.json({
      message: 'MFA activé et connexion réussie',
      token: accessToken,
      accessToken: accessToken,
      refreshToken,
      // les codes de secours ne sont affichés qu'une seule fois, à
      // l'activation. C'est le seul moment où le client peut les conserver.
      backupCodes: enableResult?.backupCodes || [],
      user: { id: user.id_utilisateur, email: user.email, prenom: user.prenom, role: user.role_par_defaut }
    });
  } catch (err) { next(err); }
};

export const loginWithMfa = async (req, res, next) => {
  try {
    const userId = getPreMfaUserId(req);
    if (!userId) return res.status(401).json({ error: 'Jeton MFA requis' });

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code requis' });

    const user = await authService.getUserById(userId);
    if (!user || !user.mfa_enabled) return res.status(400).json({ error: 'MFA non activé' });

    const verification = await mfaService.verifyMfaCode(code, user);

    if (!verification.valid) {
      // V2-002 : plus AUCUNE régénération de secret ni retour de secret sur
      // échec. L'ancien comportement remplaçait le secret MFA de la victime et
      // renvoyait le nouveau dans la réponse 401.
      return res.status(401).json({ error: 'Code MFA invalide' });
    }

    const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
    const refreshToken = generateRefreshToken(user.id_utilisateur);
    await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);

    try {
      await auditService.logLoginAttempt(user.email, true, req.ip);
    } catch (_) { /* audit best-effort */ }

    res.json({
      message: 'Login successful',
      token: accessToken,
      accessToken: accessToken,
      refreshToken,
      usedBackupCode: verification.usedBackupCode || false,
      user: { id: user.id_utilisateur, email: user.email, prenom: user.prenom, role: user.role_par_defaut }
    });
  } catch (err) { next(err); }
};

/**
 * POST /auth/mfa/recover/request — l'utilisateur a passé le mot de passe
 * (jeton pré-MFA) mais a perdu/supprimé son appareil. On envoie un code de
 * récupération à 6 chiffres par email. Réponse volontairement neutre.
 */
export const requestRecovery = async (req, res, next) => {
  try {
    const userId = getPreMfaUserId(req);
    if (!userId) return res.status(401).json({ error: 'Jeton MFA requis' });

    const user = await authService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const { code, reused } = await mfaService.createRecoveryCode(user.email);
    if (!reused) {
      try {
        await sendMfaRecoveryCodeEmail(user.email, code);
      } catch (err) {
        logger.warn('[MFA] Échec envoi email code de récupération');
      }
    }

    res.json({
      message: reused
        ? 'Un code de récupération valide a déjà été envoyé par email. Utilisez le dernier mail reçu.'
        : 'Un code de récupération a été envoyé par email.',
      reused,
      expiresInMinutes: Math.round(mfaService.MFA_RECOVERY_TTL_MS / 60000)
    });
  } catch (err) { next(err); }
};

/**
 * POST /auth/mfa/recover/verify — valide le code reçu par email, réinitialise
 * le MFA (efface ancien TOTP et codes de secours) et renvoie un jeton pré-MFA
 * de purpose SETUP pour afficher un QR neuf à scanner.
 */
export const verifyRecovery = async (req, res, next) => {
  try {
    const userId = getPreMfaUserId(req);
    if (!userId) return res.status(401).json({ error: 'Jeton MFA requis' });

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code requis' });

    const user = await authService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const ok = await mfaService.verifyRecoveryCode(userId, user.email, code);
    if (!ok) return res.status(401).json({ error: 'Code de récupération invalide ou expiré' });

    // Nouveau setup : un QR neuf sera généré au prochain /auth/login
    // (requiresSetup=true). On renvoie un jeton de setup pour enchaîner.
    const setupToken = generateMfaToken(userId, MFA_PURPOSES.SETUP);
    res.json({
      message: 'Double authentification réinitialisée. Connectez-vous pour scanner un nouveau QR code.',
      mfaToken: setupToken,
      requiresSetup: true
    });
  } catch (err) { next(err); }
};

/**
 * POST /auth/mfa/backup-codes/resend — utilisateur authentifié (session
 * complète). Régénère un jeu de codes de secours et l'envoie par email.
 * Les anciens codes deviennent donc invalides (remplacement, pas ajout).
 */
export const resendBackupCodes = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await authService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (!user.mfa_enabled) {
      return res.status(400).json({ error: 'MFA non activé' });
    }

    const backupCodes = await mfaService.regenerateBackupCodes(userId);
    await emailBackupCodes(user.email, backupCodes);

    res.json({ message: 'De nouveaux codes de secours ont été envoyés par email.' });
  } catch (err) { next(err); }
};
