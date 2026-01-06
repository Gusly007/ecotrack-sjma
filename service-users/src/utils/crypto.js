import bcrypt from 'bcryptjs';
import env from '../config/env.js';

/**
 * Hasher un mot de passe.
 * @param {string} password - Le mot de passe en clair.
 * @returns {Promise<string>} - Le mot de passe hashé.
 */

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(env.security.bcryptRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

/**
 * Comarer un mot de passe en clair avec un mot de passe hashé.
 * @param {string} password - Le mot de passe en clair.
 * @param {string} hashedPassword - Le mot de passe hashé.
 */
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}
