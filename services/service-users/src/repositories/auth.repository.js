// Repository: accès aux données utilisateur pour l'authentification
import pool from '../config/database.js';

export const AuthRepository = {
  async findUserByEmailOrPrenom(email, prenom) {
    const result = await pool.query(
      'SELECT id_utilisateur FROM UTILISATEUR WHERE email = $1',
      [email]
    );
    return result.rows;
  },
  async insertUser(email, nom, prenom, hashedPassword, role, id_zone = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO UTILISATEUR (email, nom, prenom, password_hash, role_par_defaut, est_active)
          VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id_utilisateur, email, nom, prenom, role_par_defaut, points`,
        [email, nom, prenom, hashedPassword, role]
      );
      const newUser = result.rows[0];

      if (id_zone && (role === 'GESTIONNAIRE' || role === 'ADMIN')) {
        const column = role === 'GESTIONNAIRE' ? 'id_gestionnaire' : 'id_admin';
        await client.query(
          `UPDATE zone SET ${column} = $1 WHERE id_zone = $2`,
          [newUser.id_utilisateur, id_zone]
        );
      }

      await client.query('COMMIT');
      return newUser;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  async findUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id_utilisateur, email, prenom, password_hash, role_par_defaut, points, est_active FROM UTILISATEUR WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in findUserByEmail:', error);
      throw error;
    }
  },
  async findUserById(userId) {
    const result = await pool.query(
      'SELECT id_utilisateur, email, prenom, role_par_defaut, points FROM UTILISATEUR WHERE id_utilisateur = $1',
      [userId]
    );
    return result.rows[0];
  },
  
  // Mot de passe oublié
  async createPasswordResetToken(email, token, expiresAt) {
    const result = await pool.query(
      `INSERT INTO password_reset_tokens (email, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()
       RETURNING email`,
      [email, token, expiresAt]
    );
    return result.rows[0];
  },
  
  async findPasswordResetToken(token) {
    const result = await pool.query(
      `SELECT email, expires_at FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0];
  },
  
  async updatePassword(email, hashedPassword) {
    const result = await pool.query(
      `UPDATE UTILISATEUR SET password_hash = $1 
       WHERE email = $2 
       RETURNING id_utilisateur`,
      [hashedPassword, email]
    );
    return result.rows[0];
  },
  
  async deletePasswordResetToken(token) {
    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
  }
};
