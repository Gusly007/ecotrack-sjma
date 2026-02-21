
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { UserRepository } from '../repositories/user.repository.js';

/**
 * Récupérer un profil utilisateur basique
 */
export const getUserProfile = async (userId) => {
  return await UserRepository.getUserProfile(userId);
};

/**
 * Mettre à jour le profil utilisateur
 */
export const updateProfile = async (userId, data) => {
  return await UserRepository.updateProfile(userId, data);
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
  return { message: 'Password changed successfully' };
};

/**
  * Récupérer profil avec stats
 */

export const getProfileWithStats = async (userId) => {
  return await UserRepository.getProfileWithStats(userId);
};

/**
 * Lister les utilisateurs avec pagination/filtrage
 */
export const listUsers = async (params) => {
  return await UserRepository.listUsers(params);
};

/**
 * Mise à jour administrateur d'un utilisateur
 */
export const updateUserByAdmin = async (userId, data = {}) => {
  return await UserRepository.updateUserByAdmin(userId, data);
};

/**
 * Suppression d'un utilisateur
 */
export const deleteUser = async (userId) => {
  return await UserRepository.deleteUser(userId);
};
