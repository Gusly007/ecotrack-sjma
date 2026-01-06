import pool from '../utils/db.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';

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
     RETURNING id_utilisateur, email, prenom, role_par_defaut, points`,
    [prenom, email, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
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
