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
  async findUniqueUserByEmailIgnoreCase(email) {
    const result = await pool.query(
      `SELECT id_utilisateur, email FROM UTILISATEUR
       WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
       LIMIT 2`,
      [email]
    );
    // Une collision de casse ne doit jamais sélectionner arbitrairement un compte.
    return result.rows.length === 1 ? result.rows[0] : undefined;
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
       WHERE id_utilisateur = $2 AND mfa_enabled IS NOT TRUE AND deleted_at IS NULL
       RETURNING id_utilisateur`,
      [secret, userId]
    );
    if (!result.rowCount) {
      throw Object.assign(new Error('Configuration MFA indisponible.'), { status: 400 });
    }
    return result.rows[0];
  },

  async activatePendingMfa(userId, pendingSecret, backupCodes) {
    const result = await pool.query(
      `UPDATE UTILISATEUR
       SET mfa_enabled = TRUE, totp_secret = mfa_setup_secret, backup_codes = $3,
           mfa_setup_secret = NULL, mfa_setup_secret_created_at = NULL
       WHERE id_utilisateur = $1 AND mfa_enabled IS NOT TRUE
         AND mfa_setup_secret = $2 AND deleted_at IS NULL`,
      [userId, pendingSecret, JSON.stringify(backupCodes)]
    );
    return result.rowCount === 1;
  },

  async consumeMfaBackupCode(userId, code) {
    const result = await pool.query(
      `UPDATE UTILISATEUR
       SET backup_codes = (backup_codes::jsonb - $2::text)::text
       WHERE id_utilisateur = $1 AND mfa_enabled IS TRUE AND deleted_at IS NULL
         AND backup_codes::jsonb ? $2::text`,
      [userId, code]
    );
    return result.rowCount === 1;
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

    // n'écrire que les colonnes réellement fournies. Auparavant,
    // l'UPDATE réécrivait mfa_enabled et totp_secret à NULL quand l'appelant ne
    // passait que backup_codes (consommation d'un code de secours), ce qui
    // désactivait le MFA et cassait la connexion TOTP ensuite.
    const columns = [];
    const values = [];
    if (mfa_enabled !== undefined) {
      columns.push(`mfa_enabled = $${columns.length + 1}`);
      values.push(mfa_enabled);
    }
    if (totp_secret !== undefined) {
      columns.push(`totp_secret = $${columns.length + 1}`);
      values.push(totp_secret);
    }
    if (backup_codes !== undefined) {
      columns.push(`backup_codes = $${columns.length + 1}`);
      values.push(backup_codes);
    }
    if (columns.length === 0) {
      return undefined;
    }

    const result = await pool.query(
      `UPDATE UTILISATEUR
       SET ${columns.join(', ')}
       WHERE id_utilisateur = $${columns.length + 1}
       RETURNING id_utilisateur`,
      [...values, userId]
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
