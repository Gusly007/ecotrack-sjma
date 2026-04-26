import { SessionRepository } from '../repositories/session.repository.js';
import env from '../config/env.js';

export const storeRefreshToken = async (userId, token) => {
  return await SessionRepository.storeRefreshToken(userId, token);
};

export const validateRefreshToken = async (userId, token) => {
  return await SessionRepository.validateRefreshToken(userId, token);
};

export const invalidateRefreshToken = async (userId, token) => {
  return await SessionRepository.invalidateRefreshToken(userId, token);
};

export const invalidateAllTokens = async (userId) => {
  return await SessionRepository.invalidateAllTokens(userId);
};

export const limitConcurrentSessions = async (userId, maxSessions = null) => {
  const max = maxSessions ?? env.session.maxConcurrentSessions;
  return await SessionRepository.limitConcurrentSessions(userId, max);
};

export const invalidateAllUserSessions = async (userId) => {
  return await SessionRepository.invalidateAllTokens(userId);
};
