
import { AuditRepository } from '../repositories/audit.repository.js';

/**
 * Logger une tentative de connexion
 */
export const logLoginAttempt = async (email, success, ipAddress) => {
  return await AuditRepository.logLoginAttempt(email, success, ipAddress);
};

/**
 * Logger une action sensible
 */
export const logAction = async (userId, action, entityType, entityId = null) => {
  return await AuditRepository.logAction(userId, action, entityType, entityId);
};

/**
 * Récupérer les tentatives de connexion récentes (admin)
 */
export const getRecentLoginAttempts = async (limit = 50) => {
  return await AuditRepository.getRecentLoginAttempts(limit);
};