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
  if (!token || !secret) {
    return false;
  }
  
  // Nettoyer le token (enlever espaces)
  const cleanToken = token.toString().replace(/\s/g, '');
  
  // Vérifier le format (6 chiffres)
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
 * @param {string} token - Code de vérification (vérification déjà faite)
 * @returns {Promise<{backupCodes: string[]}>}
 */
export const enableMfa = async (userId, secret) => {
  // Générer des codes de secours sécurisés (10 codes à 8 caractères)
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  await AuthRepository.updateMfaSettings(userId, {
    mfa_enabled: true,
    totp_secret: secret,
    backup_codes: JSON.stringify(backupCodes)
  });

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
 * @param {object} user - Objet utilisateur avec totp_secret et backup_codes
 * @returns {Promise<{valid: boolean, usedBackupCode: boolean}>}
 */
export const verifyMfaCode = async (code, user) => {
  // Vérifier TOTP
  if (verifyTotp(code, user.totp_secret)) {
    return { valid: true, usedBackupCode: false };
  }

  // Vérifier code de secours
  const backupCodes = JSON.parse(user.backup_codes || '[]');
  const codeIndex = backupCodes.indexOf(code.toUpperCase());
  
  if (codeIndex !== -1) {
    // Invalider le code de secours utilisé
    backupCodes.splice(codeIndex, 1);
    await AuthRepository.updateMfaSettings(user.id_utilisateur, {
      backup_codes: JSON.stringify(backupCodes)
    });
    return { valid: true, usedBackupCode: true };
  }

  return { valid: false, usedBackupCode: false };
};
