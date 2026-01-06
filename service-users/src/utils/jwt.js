import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Génère un token JWT pour un utilisateur donné.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} role - Le rôle de l'utilisateur.
 * @returns {string} - Le token JWT généré.
 */

export const generateToken = (userId,role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * Générer un refresh token JWT pour un utilisateur donné.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {string} - Le refresh token JWT généré.
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

/**
 * Vérifie si un token JWT est valide.
 * @param {string} token - Le token JWT à vérifier.
 * @returns {object} - Le payload du token si valide.
 * @throws {Error} - Si le token est invalide ou expiré.
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
}