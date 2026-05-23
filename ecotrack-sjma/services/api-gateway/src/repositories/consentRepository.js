import logger from '../middleware/logger.js';
import BaseRepository from './baseRepository.js';

const repository = new BaseRepository();

/**
 * Art. 7 - Log user consent for GDPR compliance
 * Stores consent proof with IP, user-agent, and exact text
 */
export const logConsent = async (...args) => {
  const params = typeof args[0] === 'object'
    ? {
        idUtilisateur: args[0].userId,
        sessionId: args[0].sessionId,
        typeConsent: args[0].type,
        actionConsent: args[0].action,
        versionDocument: args[0].version,
        intitule: args[0].intitule,
        ipAddress: args[0].ipAddress,
        userAgent: args[0].userAgent
      }
    : {
        idUtilisateur: args[0],
        sessionId: args[1],
        typeConsent: args[2],
        actionConsent: args[3],
        versionDocument: args[4],
        intitule: args[5],
        ipAddress: args[6],
        userAgent: args[7]
      };

  try {
    const query = `
      INSERT INTO ecotrack_archive.consent_logs (
        id_utilisateur, session_id, type_consent, action_consent, 
        version_document, intitule, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING id;
    `;
    const result = await repository.query(query, [
      params.idUtilisateur || null,
      params.sessionId,
      params.typeConsent,
      params.actionConsent,
      params.versionDocument,
      params.intitule,
      params.ipAddress,
      params.userAgent
    ]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error logging consent:', error);
    throw error;
  }
};

/**
 * Art. 25 - Get active consents for a user
 */
export const getConsentsByUser = async (idUtilisateur) => {
  try {
    const query = `
      SELECT * FROM ecotrack_archive.consent_logs
      WHERE id_utilisateur = $1 AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 100;
    `;
    const result = await repository.query(query, [idUtilisateur]);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching consents:', error);
    throw error;
  }
};

/**
 * Récupérer le dernier consentement pour une session donnée
 */
export const getConsentBySession = async (sessionId, typeConsent = 'cookies') => {
  try {
    const query = `
      SELECT *
      FROM ecotrack_archive.consent_logs
      WHERE session_id = $1
        AND type_consent = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await repository.query(query, [sessionId, typeConsent]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching consent by session:', error);
    throw error;
  }
};

/**
 * Supprimer les consentements d'une session
 */
export const deleteConsentBySession = async (sessionId, typeConsent = 'cookies') => {
  try {
    const query = `
      DELETE FROM ecotrack_archive.consent_logs
      WHERE session_id = $1
        AND type_consent = $2;
    `;
    const result = await repository.query(query, [sessionId, typeConsent]);
    return result.rowCount;
  } catch (error) {
    logger.error('Error deleting consent by session:', error);
    throw error;
  }
};

/**
 * Statistiques de consentement cookies
 */
export const getConsentStats = async (typeConsent = 'cookies') => {
  try {
    const query = `
      SELECT action_consent, COUNT(*) AS count
      FROM ecotrack_archive.consent_logs
      WHERE type_consent = $1
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      GROUP BY action_consent
      ORDER BY action_consent;
    `;
    const result = await repository.query(query, [typeConsent]);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching consent stats:', error);
    throw error;
  }
};

/**
 * Art. 25 - Cleanup expired consents (CRON job)
 * CNIL recommends: max 13 months retention
 */
export const cleanupExpiredConsents = async () => {
  try {
    const query = `
      DELETE FROM ecotrack_archive.consent_logs
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING id;
    `;
    const result = await repository.query(query);
    logger.info(`[GDPR] Cleaned up ${result.rowCount} expired consent records`, { action: 'cleanup_consents', count: result.rowCount });
    return result.rowCount;
  } catch (error) {
    logger.error('Error cleaning up expired consents:', error);
    throw error;
  }
};

/**
 * Art. 25, 32 - Archive logs older than 7 days
 */
export const archiveOldLogs = async () => {
  try {
    const query = `
      INSERT INTO ecotrack_archive.archived_logs (
        id_utilisateur, action, description, ip_address, user_agent, created_at
      )
      SELECT id_utilisateur, action, description, ip_address, user_agent, created_at
      FROM public.centralized_logs
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
      ON CONFLICT DO NOTHING;
    `;
    const result = await repository.query(query);
    logger.info(`[GDPR] Archived ${result.rowCount} logs older than 7 days`, { action: 'archive_old_logs', count: result.rowCount });
    return result.rowCount;
  } catch (error) {
    logger.error('Error archiving old logs:', error);
    throw error;
  }
};

/**
 * Art. 25 - Cleanup archived logs older than 12 months
 */
export const cleanupArchivedLogs = async () => {
  try {
    const query = `
      DELETE FROM ecotrack_archive.archived_logs
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING id;
    `;
    const result = await repository.query(query);
    logger.info(`[GDPR] Cleaned up ${result.rowCount} archived logs older than 12 months`, { action: 'cleanup_archived_logs', count: result.rowCount });
    return result.rowCount;
  } catch (error) {
    logger.error('Error cleaning up archived logs:', error);
    throw error;
  }
};

/**
 * Art. 25 - Get user audit trail for export (Art. 15 - Right of access)
 */
export const getUserAuditTrail = async (idUtilisateur) => {
  try {
    const query = `
      SELECT action, description, ip_address, user_agent, created_at
      FROM ecotrack_archive.archived_logs
      WHERE id_utilisateur = $1
      ORDER BY created_at DESC
      LIMIT 1000;
    `;
    const result = await repository.query(query, [idUtilisateur]);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching audit trail:', error);
    throw error;
  }
};

export default {
  logConsent,
  getConsentsByUser,
  getConsentBySession,
  deleteConsentBySession,
  getConsentStats,
  cleanupExpiredConsents,
  archiveOldLogs,
  cleanupArchivedLogs,
  getUserAuditTrail
};
