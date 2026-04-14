
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { UserRepository } from '../repositories/user.repository.js';
import cacheService from './cacheService.js';
import * as sessionService from './sessionService.js';
import { sendAccountStatusEmail, sendRoleChangeEmail, sendAccountDeletedEmail } from './emailService.js';

const USER_PROFILE_TTL = 300; // 5 minutes
const USER_STATS_TTL = 30;   // 30 seconds for testing

/**
 * Récupérer un profil utilisateur basique (avec cache)
 */
export const getUserProfile = async (userId) => {
  const cacheKey = `user:${userId}:profile`;
  
  const result = await cacheService.getOrSet(
    cacheKey,
    () => UserRepository.getUserProfile(userId),
    USER_PROFILE_TTL
  );
  
  return result.data;
};

/**
 * Mettre à jour le profil utilisateur (invalidate cache)
 */
export const updateProfile = async (userId, data) => {
  const result = await UserRepository.updateProfile(userId, data);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:*`);
  
  return result;
};

/**
 * Changer le mot de passe utilisateur
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  const hash = await UserRepository.getPasswordHash(userId);
  if (!hash) throw new Error('User not found');
  const validPassword = await comparePassword(oldPassword, hash);
  if (!validPassword) {
    throw new Error('Current password is incorrect');
  }
  const hashedPassword = await hashPassword(newPassword);
  await UserRepository.updatePassword(userId, hashedPassword);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:*`);
  
  return { message: 'Password changed successfully' };
};

/**
  * Récupérer profil avec stats (avec cache)
 */

export const getProfileWithStats = async (userId) => {
  const cacheKey = `user:${userId}:stats`;
  
  const result = await cacheService.getOrSet(
    cacheKey,
    () => UserRepository.getProfileWithStats(userId),
    USER_STATS_TTL
  );
  
  return result.data;
};

export const getUserStats = async (userId) => {
  const cacheKey = `user:${userId}:activity`;
  
  const result = await cacheService.getOrSet(
    cacheKey,
    () => UserRepository.getUserStats(userId),
    USER_STATS_TTL
  );
  
  return result.data;
};

/**
 * Lister les utilisateurs avec pagination/filtrage
 */
export const listUsers = async (params) => {
  return await UserRepository.listUsers(params);
};

/**
 * Mise à jour administrateur d'un utilisateur (invalidate cache + sessions)
 */
export const updateUserByAdmin = async (userId, data = {}) => {
  const currentUser = await UserRepository.getUserProfile(userId);
  const result = await UserRepository.updateUserByAdmin(userId, data);
  
  if (data.est_active !== undefined && data.est_active !== currentUser.est_active) {
    try {
      await sendAccountStatusEmail(currentUser.email, currentUser.prenom, data.est_active);
    } catch (err) {
      console.error('Failed to send account status email:', err);
    }
  }

  if (data.role_par_defaut && data.role_par_defaut !== currentUser.role_par_defaut) {
    try {
      await sendRoleChangeEmail(currentUser.email, currentUser.prenom, currentUser.role_par_defaut, data.role_par_defaut);
      await sessionService.invalidateAllUserSessions(userId);
    } catch (err) {
      console.error('Failed to send role change email:', err);
    }
  }
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:*`);
  
  return result;
};

/**
 * Suppression d'un utilisateur (invalidate cache)
 */
export const deleteUser = async (userId) => {
  const currentUser = await UserRepository.getUserProfile(userId);
  
  try {
    await sendAccountDeletedEmail(currentUser.email, currentUser.prenom);
  } catch (err) {
    console.error('Failed to send account deletion email:', err);
  }
  
  const result = await UserRepository.deleteUser(userId);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:*`);
  
  return result;
};
