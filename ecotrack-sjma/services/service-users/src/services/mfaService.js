import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/auth.repository.js';
import logger from '../utils/logger.js';

/**
 * Génère le QR code pour un secret TOTP existant
 * @param {string} secret - Secret base32
 * @param {string} email - Email pour l'affichage
 * @returns {Promise<string>} - URL du QR code
 */
export const generateQrCode = async (secret, email) => {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret,
    label: `EcoTrack:${email}`,
    issuer: 'EcoTrack',
    encoding: 'base32'
  });

  return new Promise((resolve, reject) => {
    qrcode.toDataURL(otpauthUrl, (err, qrCodeUrl) => {
      if (err) return reject(err);
      resolve(qrCodeUrl);
    });
  });
};

/**
 * Génère un secret TOTP et son QR code pour l'utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {string} email - Email pour l'affichage dans l'app d'authentification
 * @returns {Promise<{secret, qrCodeUrl}>}
 */
export const generateMfaSetup = async (userId, email) => {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `EcoTrack:${email}`,
    issuer: 'EcoTrack'
  });

  const qrCodeUrl = await generateQrCode(secret.base32, email);

  return {
    secret: secret.base32,
    qrCodeUrl
  };
};

/**
 * Vérifie un code TOTP
 * @param {string} token - Code à 6 chiffres
 * @param {string} secret - Secret TOTP de l'utilisateur
 * @returns {boolean}
 */
export const verifyTotp = (token, secret) => {
  // plus AUCUN log du code reçu ni du secret attendu. L'ancienne
  // version imprimait « Expected/Received token » dans les logs applicatifs,
  // ce qui exposait des secrets TOTP à toute personne ayant accès aux logs.
  if (!token || !secret) {
    return false;
  }

  // Nettoyer le token (enlever espaces)
  const cleanToken = token.toString().replace(/\s/g, '');

  // Seuls les codes à 6 chiffres sont des TOTP valides.
  if (!/^\d{6}$/.test(cleanToken)) {
    return false;
  }
  // Tolérance volontairement bornée à ±1 pas de 30 s (3 codes acceptés au
  // total) : au-delà, la probabilité de deviner un code augmente sans gain
  // réel pour le décalage d'horloge des téléphones.
  const result = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: cleanToken,
    window: 1
  });

  if (!result) {
    // Jamais de code (attendu, reçu, fenêtre) dans les logs : un code TOTP
    // reste valide ~30 s et suffirait à prendre un compte.
    logger.warn('[TOTP] Code invalide');
  }

  return result;
};

/**
 * Active le MFA pour un utilisateur (le code doit être vérifié avant l'appel)
 * @param {number} userId
 * @param {string} secret
 * @returns {Promise<{backupCodes: string[]}>}
 */
export const enableMfa = async (userId, secret) => {
  // Générer des codes de secours sécurisés (10 codes à 8 caractères)
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  const activated = await AuthRepository.activatePendingMfa(userId, secret, backupCodes);
  if (!activated) {
    throw Object.assign(new Error('Configuration MFA indisponible ou déjà terminée.'), { status: 400 });
  }

  return { backupCodes };
};

/**
 * Désactive le MFA pour un utilisateur
 * @param {number} userId
 */
export const disableMfa = async (userId) => {
  await AuthRepository.updateMfaSettings(userId, {
    mfa_enabled: false,
    totp_secret: null,
    backup_codes: null
  });
};

/**
 * Sauvegarde le secret temporairement pour setup après regeneration
 * @param {number} userId
 * @param {string} secret
 */
export const saveSetupSecret = async (userId, secret) => {
  await AuthRepository.updateUserMfaSetupSecret(userId, secret);
};

/**
 * Régénère un jeu de codes de secours neufs pour un compte MFA déjà activé et
 * le persiste. Les anciens codes sont remplacés (usage unique, non conservés).
 * @param {number} userId
 * @returns {Promise<string[]>} nouveaux codes en clair (à envoyer par email)
 */
export const regenerateBackupCodes = async (userId) => {
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  await AuthRepository.updateMfaSettings(userId, {
    backup_codes: JSON.stringify(backupCodes)
  });
  return backupCodes;
};

// Durée de validité du code de récupération MFA envoyé par email.
export const MFA_RECOVERY_TTL_MS = 10 * 60 * 1000;

/**
 * Génère un code de récupération MFA à 6 chiffres, le stocke (avec expiration)
 * et renvoie le code en clair. Réutilise la table account_activation_codes,
 * indexée par email : un nouveau code écrase le précédent.
 *
 * Si un code valide existe déjà pour cet email, il est RÉUTILISÉ (pas de
 * nouveau code ni de nouveau mail), pour éviter d'invalider un code déjà reçu
 * à chaque clic.
 * @param {string} email
 * @returns {Promise<{ code: string, reused: boolean }>}
 */
export const createRecoveryCode = async (email) => {
  const existing = await AuthRepository.findActiveActivationByEmail(email);
  if (existing?.code) {
    return { code: existing.code, reused: true };
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + MFA_RECOVERY_TTL_MS);
  await AuthRepository.createActivationCode(email, code, expiresAt);
  return { code, reused: false };
};

/**
 * Vérifie et consomme un code de récupération MFA. En cas de succès, le MFA est
 * réinitialisé (secret TOTP et codes de secours effacés) pour permettre de
 * rescanner un QR neuf.
 * @param {number} userId
 * @param {string} email
 * @param {string} code
 * @returns {Promise<boolean>} true si le code était valide (MFA réinitialisé)
 */
export const verifyRecoveryCode = async (userId, email, code) => {
  const row = await AuthRepository.findActivationByEmailAndCode(email, String(code).trim());
  if (!row) return false;
  await AuthRepository.deleteActivationByEmail(email);
  await AuthRepository.resetMfaForRecovery(userId);
  return true;
};

/**
 * Vérifie si un utilisateur a le MFA activé
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
export const isMfaEnabled = async (userId) => {
  const user = await AuthRepository.findUserById(userId);
  return user?.mfa_enabled || false;
};

/**
 * Vérifie un code MFA (TOTP ou code de secours)
 * @param {string} code - Code fourni
 * @param {object} user - Utilisateur avec son identifiant et son secret TOTP
 * @returns {Promise<{valid: boolean, usedBackupCode: boolean}>}
 */
export const verifyMfaCode = async (code, user) => {
  // Vérifier TOTP
  if (verifyTotp(code, user.totp_secret)) {
    return { valid: true, usedBackupCode: false };
  }

  const normalized = String(code).toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(normalized)) return { valid: false, usedBackupCode: false };
  const consumed = await AuthRepository.consumeMfaBackupCode(user.id_utilisateur, normalized);
  return { valid: consumed, usedBackupCode: consumed };
};
