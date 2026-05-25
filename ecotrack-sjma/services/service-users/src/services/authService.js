import { AuthRepository } from '../repositories/auth.repository.js';
import { hashPassword, comparePassword } from "../utils/crypto.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import * as auditService from './auditService.js';
import * as sessionService from './sessionService.js';
import { sendPasswordResetEmail, sendAdminCreatedUserEmail, sendCitoyenActivationEmail } from './emailService.js';
import env from '../config/env.js';
import crypto from 'crypto';

// Code numérique à 6 chiffres (000000-999999) — facile à taper depuis un email
// sur mobile. crypto.randomInt assure une distribution cryptographiquement
// aléatoire sur toute la plage.
const generateNumericCode = (digits = 6) => {
  const max = 10 ** digits;
  return String(crypto.randomInt(0, max)).padStart(digits, '0');
};

const ACTIVATION_TTL_MS = 30 * 60 * 1000;

/**
 * Inscrire un nouvel utilisateur
 */
export const registerUser = async (email, nom, prenom, password, role = 'CITOYEN') => {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await AuthRepository.findUserByEmailOrPrenom(email, prenom);
    if (existingUser.length > 0) {
      const error = new Error('Email already in use');
      error.status = 409;
      throw error;
    }
    
    if (!password || password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }
    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);
    // Créer l'utilisateur dans la base de données
    const newUser = await AuthRepository.insertUser(email, nom, prenom, hashedPassword, role);
    // Générer les tokens JWT
    const accessToken = generateToken(newUser.id_utilisateur, newUser.role_par_defaut);
    const refreshToken = generateRefreshToken(newUser.id_utilisateur);

    await sessionService.limitConcurrentSessions(newUser.id_utilisateur);
    await sessionService.storeRefreshToken(newUser.id_utilisateur, refreshToken);

    // Envoyer email de création de compte par admin
    try {
      await sendAdminCreatedUserEmail(email, prenom, nom, role, password);
    } catch (_) {
      // ignore email failures
    }

    // Audit (best-effort)
    try {
      await auditService.logAction(newUser.id_utilisateur, 'USER_REGISTER', 'UTILISATEUR', newUser.id_utilisateur);
    } catch (_) {
      // ignore audit failures
    }

    return {
      user: newUser,
      accessToken,
      refreshToken
    };
  } catch (err) {
    try {
      await auditService.logAction(null, 'USER_REGISTER_FAILED', 'UTILISATEUR', null);
    } catch (_) {
      // ignore audit failures
    }
    throw err;
  }
};

/**
 * Connexion d'un utilisateur
 */
export const loginUser = async (email, password, ipAddress = null) => {
  try {
    // Récupérer l'utilisateur 
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }
    // Vérifier si actif
    if (!user.est_active) {
      const error = new Error('Compte inactif');
      error.status = 403;
      throw error;
    }
    // Vérifier le mot de passe
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // Vérifier si le compte a été soft-deleted (période de grâce expirée)
    if (user.deleted_at) {
      const error = new Error('Votre compte a été supprimé définitivement. Veuillez contacter l\'administrateur.');
      error.status = 403;
      throw error;
    }

    // Si MFA est activé, demander juste le code (pas de setup)
    if (user.mfa_enabled) {
      await sessionService.limitConcurrentSessions(user.id_utilisateur);
      
      // Audit (best-effort)
      try {
        await auditService.logLoginAttempt(email, true, ipAddress);
      } catch (_) {
        // ignore audit failures
      }

      return {
        requiresMFA: true,
        requiresSetup: false,
        userId: user.id_utilisateur,
        email: user.email,
        // role expose pour permettre au frontend de filtrer par scope
        // (citoyen vs personnel) AVANT la navigation vers la page MFA partagee.
        role: user.role_par_defaut,
        message: 'Entrez le code MFA de votre application'
      };
    }

    // Si MFA n'est pas activé, générer automatiquement le setup
    // Vérifier si un secret de setup existe déjà et n'est pas expiré (< 10 min)
    const setupSecret = user.mfa_setup_secret;
    const setupCreatedAt = user.mfa_setup_secret_created_at;
    const now = new Date();
    const setupAge = setupCreatedAt ? (now - new Date(setupCreatedAt)) / 1000 : Infinity;
    
    let setup;
    if (setupSecret && setupAge < 600) {
      // Réutiliser le secret existant
      console.log('[AuthService] Réutilisation du secret existant, age:', setupAge, 's');
      const { generateQrCode } = await import('../services/mfaService.js');
      const qrCodeUrl = await generateQrCode(setupSecret, user.email);
      setup = { secret: setupSecret, qrCodeUrl };
    } else {
      // Générer un nouveau secret
      console.log('[AuthService] Génération nouveau secret');
      const { generateMfaSetup } = await import('../services/mfaService.js');
      setup = await generateMfaSetup(user.id_utilisateur, user.email);
      
      // ⚠️ IMPORTANT: Sauvegarder le secret en base !
      await storeMfaSetupSecret(user.id_utilisateur, setup.secret);
    }
    
    await sessionService.limitConcurrentSessions(user.id_utilisateur);
    
    // Audit (best-effort)
    try {
      await auditService.logLoginAttempt(email, true, ipAddress);
    } catch (_) {
      // ignore audit failures
    }

    return {
      requiresMFA: true,
      requiresSetup: true,
      mfaSetup: {
        secret: setup.secret,
        qrCodeUrl: setup.qrCodeUrl
      },
      userId: user.id_utilisateur,
      email: user.email,
      // role expose pour le filtrage de scope cote frontend (cf. branche MFA ci-dessus).
      role: user.role_par_defaut,
      message: 'Veuillez scanner le QR code avec Google Authenticator'
    };
  } catch (err) {
    try {
      await auditService.logLoginAttempt(email, false, ipAddress);
    } catch (_) {
      // ignore audit failures
    }
    throw err;
  }
};

/**
 * Récupérer un utilisateur par son ID
 */
export const getUserById = async (userId) => {
  const user = await AuthRepository.findUserByIdWithMfa(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Stocker le secret MFA en attente de vérification
 */
export const storeMfaSetupSecret = async (userId, secret) => {
  try {
    await AuthRepository.updateUserMfaSetupSecret(userId, secret);
    console.log('[AuthService] MFA setup secret stored for userId:', userId);
  } catch (error) {
    console.error('[AuthService] Failed to store MFA setup secret:', error);
    throw error;
  }
};

/**
 * Demander la réinitialisation du mot de passe
 */
export const forgotPassword = async (email, { from } = {}) => {
  try {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw Object.assign(new Error('Aucun compte trouvé avec cet email. Veuillez vérifier ou contacter l\'administrateur.'), { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await AuthRepository.createPasswordResetToken(email, resetToken, expiresAt);

    // `from === 'citoyen'` aiguille le lien email vers /citoyen/reset-password
    // (page isolée du scope mobile, redirige vers /citoyen/login après succès).
    const emailResult = await sendPasswordResetEmail(email, resetToken, { from });
    
    const response = { 
      message: 'Un lien de réinitialisation a été envoyé à votre email.'
    };
    
    if (emailResult.previewUrl) {
      response.previewUrl = emailResult.previewUrl;
      response.resetToken = resetToken;
    }
    
    return response;
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    throw error;
  }
};

/**
 * Réinitialiser le mot de passe
 */
export const resetPassword = async (token, newPassword) => {
  const resetData = await AuthRepository.findPasswordResetToken(token);

  if (!resetData) {
    throw new Error('Token invalide ou expiré');
  }

  if (newPassword.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  const hashedPassword = await hashPassword(newPassword);
  await AuthRepository.updatePassword(resetData.email, hashedPassword);
  await AuthRepository.deletePasswordResetToken(token);

  return { message: 'Mot de passe réinitialisé avec succès' };
};

/**
 * Activer un compte utilisateur avec mot de passe temporaire
 */
export const activateAccount = async (email, token, newPassword) => {
  const user = await AuthRepository.findUserByEmail(email);
  
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (newPassword.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  const hashedPassword = await hashPassword(newPassword);
  await AuthRepository.updatePassword(email, hashedPassword);

  return { message: 'Compte activé avec succès' };
};

// ====================================================================
// Self-registration citoyen (flow isolé du flow admin-créé upstream).
// 1) POST /auth/citoyen/register   → crée user inactif + envoie code 6 chiffres
// 2) POST /auth/citoyen/verify-activation → valide code, active, renvoie JWT
// 3) POST /auth/citoyen/resend-activation → régénère et renvoie un code
//
// Admin/manager continuent d'utiliser registerUser() qui auto-active et
// envoie un mot de passe temporaire. Aucune intersection.
// ====================================================================

export const registerCitoyen = async (email, nom, prenom, password) => {
  const existing = await AuthRepository.findUserByEmailOrPrenom(email, prenom);
  if (existing.length > 0) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }
  if (!password || password.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  const hashedPassword = await hashPassword(password);
  // est_active = false : l'utilisateur doit saisir le code reçu par email
  // avant de pouvoir se connecter.
  const newUser = await AuthRepository.insertUser(email, nom, prenom, hashedPassword, 'CITOYEN', false);

  const code = generateNumericCode(6);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
  await AuthRepository.createActivationCode(email, code, expiresAt);

  let emailResult = { success: false };
  try {
    emailResult = await sendCitoyenActivationEmail(email, prenom, code);
  } catch (err) {
    console.error('[registerCitoyen] activation email failed:', err.message);
  }

  // Audit best-effort.
  try {
    await auditService.logAction(newUser.id_utilisateur, 'CITOYEN_REGISTER', 'UTILISATEUR', newUser.id_utilisateur);
  } catch (_) { /* ignore */ }

  // En dev seulement : log le previewUrl Ethereal + le code côté serveur
  // pour faciliter le test. En production, le code ne quitte jamais l'email.
  if (env.nodeEnv !== 'production' && emailResult?.previewUrl) {
    console.log('[Email][DEV] Citoyen activation preview:', emailResult.previewUrl, '| code:', code);
  }

  return {
    message: "Un code d'activation a été envoyé à votre email.",
    email,
    requiresActivation: true,
    user: {
      id_utilisateur: newUser.id_utilisateur,
      email: newUser.email,
      prenom: newUser.prenom,
      nom: newUser.nom
    }
  };
};

export const verifyCitoyenActivation = async (email, code) => {
  const row = await AuthRepository.findActivationByEmailAndCode(email, code);
  if (!row) {
    const error = new Error("Code d'activation invalide ou expiré");
    error.status = 400;
    throw error;
  }

  await AuthRepository.setUserActive(email, true);
  await AuthRepository.deleteActivationByEmail(email);

  const user = await AuthRepository.findUserByEmail(email);
  if (!user) {
    throw new Error('User not found after activation');
  }

  const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
  const refreshToken = generateRefreshToken(user.id_utilisateur);
  await sessionService.limitConcurrentSessions(user.id_utilisateur);
  await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);

  return {
    message: 'Compte activé avec succès',
    token: accessToken,
    refreshToken,
    user: {
      id_utilisateur: user.id_utilisateur,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      role_par_defaut: user.role_par_defaut,
      points: user.points,
      avatar_url: user.avatar_url || null,
      avatar_thumbnail: user.avatar_thumbnail || null,
      avatar_mini: user.avatar_mini || null
    }
  };
};

export const resendCitoyenActivation = async (email) => {
  const user = await AuthRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error("Aucun compte trouvé avec cet email");
    error.status = 404;
    throw error;
  }
  if (user.est_active) {
    return { message: 'Compte déjà activé. Connectez-vous.', alreadyActive: true };
  }

  const code = generateNumericCode(6);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
  await AuthRepository.createActivationCode(email, code, expiresAt);

  let emailResult = { success: false };
  try {
    emailResult = await sendCitoyenActivationEmail(email, user.prenom, code);
  } catch (err) {
    console.error('[resendCitoyenActivation] email failed:', err.message);
  }

  if (env.nodeEnv !== 'production' && emailResult?.previewUrl) {
    console.log('[Email][DEV] Citoyen re-activation preview:', emailResult.previewUrl, '| code:', code);
  }

  return { message: 'Un nouveau code a été envoyé à votre email.' };
};
