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
  // `estActive` par défaut TRUE pour ne pas casser le flow admin/manager
  // upstream qui crée des comptes immédiatement actifs. Le flow citoyen
  // self-registration passe FALSE et complète via /auth/citoyen/verify-activation.
  async insertUser(email, nom, prenom, hashedPassword, role, estActive = true) {
    const result = await pool.query(
      `INSERT INTO UTILISATEUR (email, nom, prenom, password_hash, role_par_defaut, est_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_utilisateur, email, nom, prenom, role_par_defaut, points, est_active`,
      [email, nom, prenom, hashedPassword, role, estActive]
    );
    return result.rows[0];
  },
  async findUserByEmail(email) {
    try {
      const result = await pool.query(
        `SELECT id_utilisateur, email, prenom, nom, password_hash, role_par_defaut, points,
                est_active, deleted_at, avatar_url, avatar_thumbnail, avatar_mini
         FROM UTILISATEUR WHERE email = $1 AND deleted_at IS NULL`,
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
  },

  // ====================================================================
  // Activation citoyen (table account_activation_codes — code 6 chiffres).
  // Une seule ligne par email : un nouveau code écrase le précédent. Le
  // flow est isolé du reset password admin/manager (token hex 64 chars).
  // ====================================================================
  async createActivationCode(email, code, expiresAt) {
    const result = await pool.query(
      `INSERT INTO account_activation_codes (email, code, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET code = EXCLUDED.code,
             expires_at = EXCLUDED.expires_at,
             created_at = NOW()
       RETURNING email`,
      [email, code, expiresAt]
    );
    return result.rows[0];
  },

  async findActivationByEmailAndCode(email, code) {
    const result = await pool.query(
      `SELECT email, expires_at FROM account_activation_codes
       WHERE email = $1 AND code = $2 AND expires_at > NOW()`,
      [email, code]
    );
    return result.rows[0];
  },

  async deleteActivationByEmail(email) {
    await pool.query(
      `DELETE FROM account_activation_codes WHERE email = $1`,
      [email]
    );
  },

  async setUserActive(email, isActive = true) {
    await pool.query(
      `UPDATE UTILISATEUR SET est_active = $2 WHERE email = $1`,
      [email, isActive]
    );
  }
};
