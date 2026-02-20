import { AuthRepository } from '../repositories/auth.repository.js';
import { hashPassword,comparePassword } from "../utils/crypto.js";
import{ generateToken,generateRefreshToken } from "../utils/jwt.js";
import * as auditService from './auditService.js';
import * as sessionService from './sessionService.js';
import { sendPasswordResetEmail } from './emailService.js';
import crypto from 'crypto';

/**
 * Inscrire un nouvel utilisateur
 */

export const registerUser = async (email, nom, prenom, password, role = 'CITOYEN') => {
  // Vérifier si l'utilisateur existe déjà
  const existingUser = await AuthRepository.findUserByEmailOrPrenom(email, prenom);
  if (existingUser.length > 0) {
    throw new Error('Utilisateur déjà existant');
  }
  //Valider password (ajouter des règles de validation si nécessaire)
  if (password.length < 6) {
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
};

/**
 * Connexion d'un utilisateur
 */
export const loginUser = async (email, password, ipAddress = null) => {
  try {
// Récupérer l'utilisateur 
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    //Vérifier si actif
    if (!user.est_active) {
        throw new Error('Utilisateur inactif');
    }
    //Vérifier le mot de passe
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
        throw new Error('Invalid credentials');
    }
    // Générer tokens
  const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
  const refreshToken = generateRefreshToken(user.id_utilisateur);

  await sessionService.limitConcurrentSessions(user.id_utilisateur);
  await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);

  // Audit (best-effort)
  try {
    await auditService.logLoginAttempt(email, true, ipAddress);
  } catch (_) {
    // ignore audit failures
  }

  return {
    user: {
      id: user.id_utilisateur,
      email: user.email,
      prenom: user.prenom,
      role: user.role_par_defaut
    },
    accessToken,
    refreshToken
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
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
};

/**
 * Demander la réinitialisation du mot de passe
 */
export const forgotPassword = async (email) => {
  const user = await AuthRepository.findUserByEmail(email);
  if (!user) {
    return { message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé' };
  }
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 heure
  
  await AuthRepository.createPasswordResetToken(email, resetToken, expiresAt);
  
  const emailResult = await sendPasswordResetEmail(email, resetToken);
  
  const response = { 
    message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé'
  };
  
  if (emailResult.previewUrl) {
    response.previewUrl = emailResult.previewUrl;
  }
  
  return response;
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

