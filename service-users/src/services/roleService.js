import pool from '../config/database.js';

/**
 * Assigner un role à un utilisateur
 */
export const assignRoleToUser = async (userId, roleId) => {
    const result = await pool.query(
    `INSERT INTO user_role (id_utilisateur, id_role) 
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING  --Evite les doublons de role 
     RETURNING *`, // Retourne la ligne insérée avec toutes ses colonnes
    [userId, roleId]
    );
    return result.rows[0];
};

/** 
 * Retirer un role d'un utilisateur
 */
export const removeRoleFromUser = async (userId, roleId) => {
     await pool.query(
    'DELETE FROM user_role WHERE id_utilisateur = $1 AND id_role = $2',
    [userId, roleId]
  );
};

/**
 * Récupérer les roles d'un utilisateur
 */
export const getUserRoles = async (userId) => {
    const result = await pool.query(
    `SELECT r.id_role, r.nom_role 
     FROM roles r
     JOIN user_role ur ON r.id_role = ur.id_role
     WHERE ur.id_utilisateur = $1`,
    [userId]
  );
    return result.rows;
};