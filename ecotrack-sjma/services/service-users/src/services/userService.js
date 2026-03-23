
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { UserRepository } from '../repositories/user.repository.js';
import cacheService from './cacheService.js';

const USER_PROFILE_TTL = 300; // 5 minutes
const USER_STATS_TTL = 300;   // 5 minutes

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

/**
 * Lister les utilisateurs avec pagination/filtrage
 */
export const listUsers = async (params) => {
  return await UserRepository.listUsers(params);
};

/**
 * Mise à jour administrateur d'un utilisateur (invalidate cache)
 */
export const updateUserByAdmin = async (userId, data = {}) => {
  const result = await UserRepository.updateUserByAdmin(userId, data);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:*`);
  
  return result;
};

/**
 * Suppression d'un utilisateur (invalidate cache)
 */
export const deleteUser = async (userId) => {
  const result = await UserRepository.deleteUser(userId);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:*`);
  
  return result;
};
