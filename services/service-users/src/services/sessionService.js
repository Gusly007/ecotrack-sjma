import { SessionRepository } from '../repositories/session.repository.js';

/**
 * Stocker un refresh token
 */
export const storeRefreshToken = async (userId, token) => {
  return await SessionRepository.storeRefreshToken(userId, token);
};


/**
 * Vérifier si refresh token existe
 */
export const validateRefreshToken = async (userId, token) => {
  return await SessionRepository.validateRefreshToken(userId, token);
};


/**
 * Invalider un refresh token (logout)
 */
export const invalidateRefreshToken = async (userId, token) => {
  return await SessionRepository.invalidateRefreshToken(userId, token);
};


/**
 * Invalider tous les tokens d'un utilisateur (logout partout)
 */
export const invalidateAllTokens = async (userId) => {
  return await SessionRepository.invalidateAllTokens(userId);
};


/**
 * Limiter les sessions simultanées (max 3 par utilisateur)
 */
export const limitConcurrentSessions = async (userId, maxSessions = 3) => {
  return await SessionRepository.limitConcurrentSessions(userId, maxSessions);
};
