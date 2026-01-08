import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Génère un token JWT pour un utilisateur donné.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} role - Le rôle de l'utilisateur.
 * @returns {string} - Le token JWT généré.
 */

export const generateToken = (userId,role) => {
    return jwt.sign(
        { id: userId, role, type: 'access' },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );
};

/**
 * Générer un refresh token JWT pour un utilisateur donné.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {string} - Le refresh token JWT généré.
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'refresh' },
        env.jwt.refreshSecret,
        { expiresIn: env.jwt.refreshExpiresIn }
    );
};

/**
 * Vérifie si un token JWT est valide.
 * @param {string} token - Le token JWT à vérifier.
 * @returns {object} - Le payload du token si valide.
 * @throws {Error} - Si le token est invalide ou expiré.
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, env.jwt.secret);
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, env.jwt.refreshSecret);
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};

// Backward-compatible alias: in this codebase verifyToken is used for access tokens.
export const verifyToken = verifyAccessToken;