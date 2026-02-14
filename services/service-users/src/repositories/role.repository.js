// Repository: accès aux données des rôles utilisateur
import pool from '../config/database.js';

export const RoleRepository = {
  async assignRoleToUser(userId, roleId) {
    const result = await pool.query(
      `INSERT INTO user_role (id_utilisateur, id_role) 
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [userId, roleId]
    );
    return result.rows[0];
  },
  async removeRoleFromUser(userId, roleId) {
    await pool.query(
      'DELETE FROM user_role WHERE id_utilisateur = $1 AND id_role = $2',
      [userId, roleId]
    );
  },
  async getUserRoles(userId) {
    const result = await pool.query(
      `SELECT r.id_role, r.nom_role 
       FROM roles r
       JOIN user_role ur ON r.id_role = ur.id_role
       WHERE ur.id_utilisateur = $1`,
      [userId]
    );
    return result.rows;
  }
};
