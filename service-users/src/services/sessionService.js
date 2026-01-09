import pool from '../config/database.js';
import { hashToken } from '../utils/crypto.js';

/**
 * Stocker un refresh token
 */
export const storeRefreshToken = async (userId, token) => {
  const tokenHash = hashToken(token);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
    [userId, tokenHash]
  );
};

/**
 * Vérifier si refresh token existe
 */
export const validateRefreshToken = async (userId, token) => {
  const tokenHash = hashToken(token);
  const result = await pool.query(
    'SELECT id FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND created_at > NOW() - INTERVAL \'7 days\'',
    [userId, tokenHash]
  );

  return result.rows.length > 0;
};

/**
 * Invalider un refresh token (logout)
 */
export const invalidateRefreshToken = async (userId, token) => {
  const tokenHash = hashToken(token);
  await pool.query(
    'DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2',
    [userId, tokenHash]
  );
};

/**
 * Invalider tous les tokens d'un utilisateur (logout partout)
 */
export const invalidateAllTokens = async (userId) => {
  await pool.query(
    'DELETE FROM refresh_tokens WHERE user_id = $1',
    [userId]
  );
};

/**
 * Limiter les sessions simultanées (max 3 par utilisateur)
 */
export const limitConcurrentSessions = async (userId, maxSessions = 3) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM refresh_tokens WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
    [userId]
  );

  const count = parseInt(result?.rows?.[0]?.count ?? '0', 10);
  if (count >= maxSessions) {
    // Supprimer la plus ancienne session
    await pool.query(
      `DELETE FROM refresh_tokens 
       WHERE user_id = $1 
       AND created_at = (
         SELECT MIN(created_at) FROM refresh_tokens WHERE user_id = $1
       )`,
      [userId]
    );
  }
};