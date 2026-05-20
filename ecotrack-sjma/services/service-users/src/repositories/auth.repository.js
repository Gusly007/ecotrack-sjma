// Repository: accès aux données utilisateur pour l'authentification
import pool from '../config/database.js';

export const AuthRepository = {
  async findUserByEmailOrPrenom(email, prenom) {
    const result = await pool.query(
      'SELECT id_utilisateur FROM UTILISATEUR WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows;
  },
  async insertUser(email, nom, prenom, hashedPassword, role) {
    const result = await pool.query(
      `INSERT INTO UTILISATEUR (email, nom, prenom, password_hash, role_par_defaut, est_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id_utilisateur, email, nom, prenom, role_par_defaut, points`,
      [email, nom, prenom, hashedPassword, role]
    );
    return result.rows[0];
  },
  async findUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id_utilisateur, email, prenom, password_hash, role_par_defaut, points, est_active, deleted_at FROM UTILISATEUR WHERE email = $1',
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
      'SELECT id_utilisateur, email, prenom, role_par_defaut, points, deleted_at FROM UTILISATEUR WHERE id_utilisateur = $1 AND deleted_at IS NULL',
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
  },

  async updateUserMfaSetupSecret(userId, secret) {
    const result = await pool.query(
      `UPDATE UTILISATEUR 
       SET mfa_setup_secret = $1, mfa_setup_secret_created_at = NOW()
       WHERE id_utilisateur = $2
       RETURNING id_utilisateur`,
      [secret, userId]
    );
    return result.rows[0];
  },

  async findUserByIdWithMfa(userId) {
    const result = await pool.query(
      `SELECT id_utilisateur, email, prenom, role_par_defaut, points, 
              mfa_setup_secret, mfa_setup_secret_created_at, totp_secret, mfa_enabled,
              backup_codes, deleted_at
       FROM UTILISATEUR 
       WHERE id_utilisateur = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return result.rows[0];
  },

  async updateMfaSettings(userId, settings) {
    const { mfa_enabled, totp_secret, backup_codes } = settings;
    
    const result = await pool.query(
      `UPDATE UTILISATEUR 
       SET mfa_enabled = $1, totp_secret = $2, backup_codes = $3
       WHERE id_utilisateur = $4
       RETURNING id_utilisateur`,
      [mfa_enabled, totp_secret, backup_codes, userId]
    );
    return result.rows[0];
  }
};
