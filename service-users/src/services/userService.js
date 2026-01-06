import pool from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';

const userProfileColumns = `id_utilisateur, email, prenom, role_par_defaut, points, est_active, date_creation`;

const resolveUserRow = (result) => {
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  return result.rows[0];
};

/**
 * Récupérer un profil utilisateur basique
 */
export const getUserProfile = async (userId) => {
  const result = await pool.query(
    `SELECT ${userProfileColumns}
     FROM UTILISATEUR
     WHERE id_utilisateur = $1`,
    [userId]
  );

  return resolveUserRow(result);
};

/**
 * Mettre à jour le profil utilisateur
 */
export const updateProfile = async (userId, data) => {
    const { prenom,email } = data;

    const result = await pool.query(
    `UPDATE UTILISATEUR 
     SET prenom = COALESCE($1, prenom),
         email = COALESCE($2, email)
     WHERE id_utilisateur = $3 
     RETURNING ${userProfileColumns}`,
    [prenom, email, userId]
  );

  return resolveUserRow(result);
};

/**
 * Changer le mot de passe utilisateur
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await pool.query(
    'SELECT password_hash FROM UTILISATEUR WHERE id_utilisateur = $1',
    [userId]
  );

  if (user.rows.length === 0) {
    throw new Error('User not found');
  }

  // Vérifier ancien password
  const validPassword = await comparePassword(oldPassword, user.rows[0].password_hash);
  if (!validPassword) {
    throw new Error('Current password is incorrect');
  }

    // Hasher le nouveau mot de passe
  const hashedPassword = await hashPassword(newPassword);

  await pool.query(
    'UPDATE UTILISATEUR SET password_hash = $1 WHERE id_utilisateur = $2',
    [hashedPassword, userId]
  );

  return { message: 'Password changed successfully' };
};

/**
  * Récupérer profil avec stats
 */

export const getProfileWithStats = async (userId) => {
  const result = await pool.query(
    `SELECT 
       u.id_utilisateur,
       u.email,
       u.prenom,
       u.role_par_defaut,
       u.points,
       u.date_creation,
       u.est_active,
       COUNT(DISTINCT ub.id_badge) as badge_count
     FROM UTILISATEUR u
     LEFT JOIN user_badge ub ON u.id_utilisateur = ub.id_utilisateur
     WHERE u.id_utilisateur = $1
     GROUP BY u.id_utilisateur`,
    [userId]
  );
    if (result.rows.length === 0) {
    throw new Error('User not found');
    }
    return result.rows[0];
};

/**
 * Lister les utilisateurs avec pagination/filtrage
 */
export const listUsers = async ({ page = 1, limit = 20, role, search } = {}) => {
  const pageNumber = Number.isNaN(parseInt(page, 10)) ? 1 : Math.max(1, parseInt(page, 10));
  const limitNumber = Number.isNaN(parseInt(limit, 10))
    ? 20
    : Math.max(1, Math.min(100, parseInt(limit, 10)));
  const offset = (pageNumber - 1) * limitNumber;

  const filters = [];
  const params = [];

  if (role) {
    params.push(role.toString().toUpperCase());
    filters.push(`role_par_defaut = $${params.length}`);
  }

  if (search) {
    const normalizedSearch = `%${search.toString().toLowerCase()}%`;
    params.push(normalizedSearch);
    const idx = params.length;
    filters.push(`(LOWER(email) LIKE $${idx} OR LOWER(prenom) LIKE $${idx})`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM UTILISATEUR ${whereClause}`,
    params
  );

  const total = countResult.rows[0]?.count ?? 0;
  const dataResult = await pool.query(
    `SELECT ${userProfileColumns}
     FROM UTILISATEUR
     ${whereClause}
     ORDER BY date_creation DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limitNumber, offset]
  );

  const pages = total === 0 ? 0 : Math.ceil(total / limitNumber);

  return {
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      pages
    },
    data: dataResult.rows
  };
};

/**
 * Mise à jour administrateur d'un utilisateur
 */
export const updateUserByAdmin = async (userId, data = {}) => {
  const { prenom, email, est_active, role_par_defaut } = data;

  const result = await pool.query(
    `UPDATE UTILISATEUR
     SET prenom = COALESCE($1, prenom),
         email = COALESCE($2, email),
         est_active = COALESCE($3, est_active),
         role_par_defaut = COALESCE($4, role_par_defaut)
     WHERE id_utilisateur = $5
     RETURNING ${userProfileColumns}`,
    [prenom, email, est_active, role_par_defaut, userId]
  );

  return resolveUserRow(result);
};

/**
 * Suppression d'un utilisateur
 */
export const deleteUser = async (userId) => {
  const result = await pool.query(
    'DELETE FROM UTILISATEUR WHERE id_utilisateur = $1 RETURNING id_utilisateur',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return { message: 'User deleted successfully' };
};
