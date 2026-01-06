import pool from '../config/database.js';

/**
 * Logger une tentative de connexion
 */
export const logLoginAttempt = async (email, success, ipAddress) => {
  await pool.query(
    `INSERT INTO JOURNAL_AUDIT (id_acteur, action, type_entite, date_creation)
     VALUES (
       (SELECT id_utilisateur FROM UTILISATEUR WHERE email = $1),
       $2,
       'LOGIN',
       CURRENT_TIMESTAMP
     )`,
    [email, success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED']
  );
};

/**
 * Logger une action sensible
 */
export const logAction = async (userId, action, entityType, entityId = null) => {
  await pool.query(
    `INSERT INTO JOURNAL_AUDIT (id_acteur, action, type_entite, id_entite, date_creation)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
    [userId, action, entityType, entityId]
  );
};

/**
 * Récupérer les tentatives de connexion récentes (admin)
 */
export const getRecentLoginAttempts = async (limit = 50) => {
  const result = await pool.query(
    `SELECT id_audit, id_acteur, action, date_creation
     FROM JOURNAL_AUDIT
     WHERE type_entite = 'LOGIN'
     ORDER BY date_creation DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
};