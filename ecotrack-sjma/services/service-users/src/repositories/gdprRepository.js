import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * GDPR Repository - Data access layer for user data, consent tracking, and audit trails
 * Handles all database queries for GDPR compliance (Art. 15, 17, 18, 20, 21, 25, 32)
 */

/**
 * Fetch complete user profile (Art. 15 - Right of Access)
 */
export const getUserProfile = async (idUtilisateur) => {
  const query = 'SELECT * FROM public.utilisateur WHERE id_utilisateur = $1 AND deleted_at IS NULL';
  const result = await pool.query(query, [idUtilisateur]);
  return result.rows[0] || null;
};

/**
 * Fetch all user signals/reports
 */
export const getUserSignalements = async (idUtilisateur) => {
  const query = 'SELECT * FROM public.signalements WHERE id_utilisateur = $1 ORDER BY date_creation DESC';
  const result = await pool.query(query, [idUtilisateur]);
  return result.rows;
};

/**
 * Fetch all user routes/collections
 */
export const getUserTournees = async (idUtilisateur) => {
  const query = 'SELECT * FROM public.tournees WHERE id_gestionnaire = $1 ORDER BY date_tournee DESC';
  const result = await pool.query(query, [idUtilisateur]);
  return result.rows;
};

/**
 * Fetch all user badges and achievements
 */
export const getUserBadges = async (idUtilisateur) => {
  const query = `
    SELECT b.* FROM public.badges b
    JOIN public.utilisateur_badges ub ON b.id_badge = ub.id_badge
    WHERE ub.id_utilisateur = $1
    ORDER BY ub.date_obtention DESC
  `;
  const result = await pool.query(query, [idUtilisateur]);
  return result.rows;
};

/**
 * Fetch all user challenges/defis
 */
export const getUserDefis = async (idUtilisateur) => {
  const query = `
    SELECT d.* FROM public.defis d
    WHERE d.id_createur = $1 OR d.id_utilisateur = $1
    ORDER BY d.date_creation DESC
  `;
  const result = await pool.query(query, [idUtilisateur]);
  return result.rows;
};

/**
 * Fetch all user points and gamification data
 */
export const getUserPoints = async (idUtilisateur) => {
  const query = 'SELECT * FROM public.points_utilisateur WHERE id_utilisateur = $1';
  const result = await pool.query(query, [idUtilisateur]);
  return result.rows;
};

/**
 * Fetch user audit trail (activity logs)
 */
export const getUserAuditTrail = async (idUtilisateur, limit = 1000) => {
  const query = `
    SELECT action, description, ip_address, user_agent, created_at
    FROM ecotrack_archive.archived_logs
    WHERE id_utilisateur = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [idUtilisateur, limit]);
  return result.rows;
};

/**
 * Fetch user consent records (Art. 7 proof)
 */
export const getUserConsentRecords = async (idUtilisateur, limit = 100) => {
  const query = `
    SELECT type_consent, action_consent, version_document, intitule, ip_address, user_agent, created_at
    FROM ecotrack_archive.consent_logs
    WHERE id_utilisateur = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [idUtilisateur, limit]);
  return result.rows;
};

/**
 * Request account deletion with 30-day grace period (Art. 17)
 */
export const requestDeletion = async (idUtilisateur) => {
  const query = `
    UPDATE public.utilisateur
    SET deletion_requested_at = CURRENT_TIMESTAMP
    WHERE id_utilisateur = $1 AND deleted_at IS NULL
    RETURNING id_utilisateur, deletion_requested_at, email;
  `;
  const result = await pool.query(query, [idUtilisateur]);
  
  if (result.rowCount === 0) {
    throw new Error('User not found or already deleted');
  }
  
  return result.rows[0];
};

/**
 * Cancel pending deletion request (Art. 17)
 */
export const cancelDeletion = async (idUtilisateur) => {
  const query = `
    UPDATE public.utilisateur
    SET deletion_requested_at = NULL
    WHERE id_utilisateur = $1 AND deleted_at IS NULL AND deletion_requested_at IS NOT NULL
    RETURNING id_utilisateur;
  `;
  const result = await pool.query(query, [idUtilisateur]);

  if (result.rowCount === 0) {
    throw new Error('No active deletion request found');
  }

  return result.rows[0];
};

/**
 * Find users with expired grace period (Art. 25 - Data Protection by Design)
 */
export const findExpiredDeletions = async (limit = 100) => {
  const query = `
    SELECT id_utilisateur FROM public.utilisateur
    WHERE deletion_requested_at IS NOT NULL
      AND deletion_requested_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
      AND deleted_at IS NULL
    LIMIT $1;
  `;
  const result = await pool.query(query, [limit]);
  return result.rows.map(r => r.id_utilisateur);
};

/**
 * Anonymize multiple users after grace period expires
 */
export const anonymizeUsers = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return { anonymizedCount: 0 };
  }

  const query = `
    UPDATE public.utilisateur
    SET 
      deleted_at = CURRENT_TIMESTAMP,
      anonymized = TRUE,
      prenom = 'Anonyme',
      nom = 'Utilisateur',
      email = CONCAT('anonymized_', id_utilisateur, '@ecotrack.local'),
      telephone = NULL,
      deletion_requested_at = NULL
    WHERE id_utilisateur = ANY($1)
    RETURNING id_utilisateur;
  `;
  
  const result = await pool.query(query, [userIds]);
  return { anonymizedCount: result.rowCount, anonymizedIds: result.rows.map(r => r.id_utilisateur) };
};

/**
 * Find inactive users (3+ years without login) for automatic anonymization
 */
export const findInactiveUsers = async (inactivityDays = 365 * 3) => {
  const query = `
    SELECT id_utilisateur FROM public.utilisateur
    WHERE last_login_date < CURRENT_TIMESTAMP - INTERVAL '${inactivityDays} days'
      AND anonymized = FALSE
      AND deleted_at IS NULL
    LIMIT 100;
  `;
  const result = await pool.query(query);
  return result.rows.map(r => r.id_utilisateur);
};

/**
 * Anonymize inactive users
 */
export const anonymizeInactiveUsersBatch = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return { anonymizedCount: 0 };
  }

  const query = `
    UPDATE public.utilisateur
    SET 
      anonymized = TRUE,
      prenom = 'Anonyme',
      nom = 'Utilisateur',
      email = CONCAT('inactive_', id_utilisateur, '@ecotrack.local'),
      telephone = NULL
    WHERE id_utilisateur = ANY($1)
    RETURNING id_utilisateur;
  `;
  
  const result = await pool.query(query, [userIds]);
  return { anonymizedCount: result.rowCount, anonymizedIds: result.rows.map(r => r.id_utilisateur) };
};

/**
 * Fetch complete consent history for audit purposes
 */
export const getConsentHistory = async (idUtilisateur, limit = 100) => {
  const query = `
    SELECT 
      type_consent, 
      action_consent, 
      version_document, 
      intitule,
      ip_address,
      user_agent,
      created_at
    FROM ecotrack_archive.consent_logs
    WHERE id_utilisateur = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const result = await pool.query(query, [idUtilisateur, limit]);
  return result.rows;
};

/**
 * Transactional export - fetch all user data within a transaction
 */
export const fetchCompleteUserData = async (idUtilisateur) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Fetch all data in parallel
    const [
      user,
      signalements,
      tournees,
      badges,
      defis,
      points,
      auditTrail,
      consentRecords
    ] = await Promise.all([
      getUserProfile(idUtilisateur).catch(() => null),
      client.query(
        'SELECT * FROM public.signalements WHERE id_utilisateur = $1 ORDER BY date_creation DESC',
        [idUtilisateur]
      ).then(r => r.rows),
      client.query(
        'SELECT * FROM public.tournees WHERE id_gestionnaire = $1 ORDER BY date_tournee DESC',
        [idUtilisateur]
      ).then(r => r.rows),
      client.query(
        `SELECT b.* FROM public.badges b
         JOIN public.utilisateur_badges ub ON b.id_badge = ub.id_badge
         WHERE ub.id_utilisateur = $1
         ORDER BY ub.date_obtention DESC`,
        [idUtilisateur]
      ).then(r => r.rows),
      client.query(
        `SELECT d.* FROM public.defis d
         WHERE d.id_createur = $1 OR d.id_utilisateur = $1
         ORDER BY d.date_creation DESC`,
        [idUtilisateur]
      ).then(r => r.rows),
      client.query(
        'SELECT * FROM public.points_utilisateur WHERE id_utilisateur = $1',
        [idUtilisateur]
      ).then(r => r.rows),
      client.query(
        `SELECT action, description, ip_address, user_agent, created_at
         FROM ecotrack_archive.archived_logs
         WHERE id_utilisateur = $1
         ORDER BY created_at DESC LIMIT 1000`,
        [idUtilisateur]
      ).then(r => r.rows),
      client.query(
        `SELECT type_consent, action_consent, version_document, ip_address, created_at
         FROM ecotrack_archive.consent_logs
         WHERE id_utilisateur = $1
         ORDER BY created_at DESC LIMIT 100`,
        [idUtilisateur]
      ).then(r => r.rows)
    ]);

    if (!user) {
      throw new Error('User not found or already deleted');
    }

    await client.query('COMMIT');

    return {
      user,
      signalements,
      tournees,
      badges,
      defis,
      points,
      auditTrail,
      consentRecords
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
