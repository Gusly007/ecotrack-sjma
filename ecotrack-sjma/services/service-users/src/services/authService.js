import { AuthRepository } from '../repositories/auth.repository.js';
import { hashPassword, comparePassword } from "../utils/crypto.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import * as auditService from './auditService.js';
import * as sessionService from './sessionService.js';
import { sendPasswordResetEmail, sendAdminCreatedUserEmail } from './emailService.js';
import crypto from 'crypto';

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
export const forgotPassword = async (email) => {
  try {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw Object.assign(new Error('Aucun compte trouvé avec cet email. Veuillez vérifier ou contacter l\'administrateur.'), { status: 404 });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);
    
    await AuthRepository.createPasswordResetToken(email, resetToken, expiresAt);
    
    const emailResult = await sendPasswordResetEmail(email, resetToken);
    
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
