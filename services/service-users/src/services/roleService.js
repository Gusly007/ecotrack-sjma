import { RoleRepository } from '../repositories/role.repository.js';

/**
 * Assigner un role à un utilisateur
 */
export const assignRoleToUser = async (userId, roleId) => {
  return await RoleRepository.assignRoleToUser(userId, roleId);
};


/** 
 * Retirer un role d'un utilisateur
 */
export const removeRoleFromUser = async (userId, roleId) => {
  return await RoleRepository.removeRoleFromUser(userId, roleId);
};


/**
 * Récupérer les roles d'un utilisateur
 */
export const getUserRoles = async (userId) => {
  return await RoleRepository.getUserRoles(userId);
};
