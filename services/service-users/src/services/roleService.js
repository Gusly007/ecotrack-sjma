import { RoleRepository } from '../repositories/role.repository.js';
import cacheService from './cacheService.js';

const ROLES_TTL = 1800; // 30 minutes

/**
 * Assigner un role à un utilisateur
 */
export const assignRoleToUser = async (userId, roleId) => {
  const result = await RoleRepository.assignRoleToUser(userId, roleId);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:roles*`);
  
  return result;
};


/** 
 * Retirer un role d'un utilisateur
 */
export const removeRoleFromUser = async (userId, roleId) => {
  const result = await RoleRepository.removeRoleFromUser(userId, roleId);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`user:${userId}:roles*`);
  
  return result;
};


/**
 * Récupérer les roles d'un utilisateur (avec cache)
 */
export const getUserRoles = async (userId) => {
  const cacheKey = `user:${userId}:roles`;
  
  const result = await cacheService.getOrSet(
    cacheKey,
    () => RoleRepository.getUserRoles(userId),
    ROLES_TTL
  );
  
  return result.data;
};
