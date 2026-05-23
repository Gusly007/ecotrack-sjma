import * as gdprRepository from '../repositories/gdprRepository.js';
import logger from '../utils/logger.js';

/**
 * Art. 15 - Right of access - Export all user personal data
 * Aggregates data from all tables for GDPR compliance
 */
export const exportUserData = async (idUtilisateur) => {
  try {
    // Fetch all user data via repository (transactional)
    const data = await gdprRepository.fetchCompleteUserData(idUtilisateur);

    const exportData = {
      exportedAt: new Date().toISOString(),
      dataVersion: '1.0',
      user: {
        ...data.user,
        password: '[ENCRYPTED - NOT EXPORTED]'
      },
      signalements: data.signalements,
      tournees: data.tournees,
      badges: data.badges,
      defis: data.defis,
      points: data.points,
      auditTrail: data.auditTrail,
      consentRecords: data.consentRecords
    };

    logger.info('[GDPR] User data exported', {
      idUtilisateur,
      action: 'export_user_data',
      recordCount: {
        signalements: data.signalements.length,
        tournees: data.tournees.length,
        badges: data.badges.length,
        auditLogs: data.auditTrail.length
      }
    });

    return exportData;
  } catch (error) {
    logger.error('[GDPR] User data export failed', { error: error.message, idUtilisateur });
    throw error;
  }
};

/**
 * Art. 17 - Right to be forgotten - Soft delete with grace period
 * Allows user to cancel within 30 days
 */
export const requestAccountDeletion = async (idUtilisateur) => {
  try {
    const user = await gdprRepository.requestDeletion(idUtilisateur);
    
    const gracePeriodUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    logger.info('[GDPR] Account deletion requested', {
      idUtilisateur,
      action: 'deletion_requested',
      gracePeriodUntil
    });

    return {
      message: 'Deletion requested. You have 30 days to cancel.',
      deletionRequestedAt: user.deletion_requested_at,
      cancelDeadline: gracePeriodUntil
    };
  } catch (error) {
    logger.error('[GDPR] Account deletion request failed', { error: error.message, idUtilisateur });
    throw error;
  }
};

/**
 * Art. 17 - Cancel account deletion request (within 30-day grace period)
 */
export const cancelAccountDeletion = async (idUtilisateur) => {
  try {
    await gdprRepository.cancelDeletion(idUtilisateur);

    logger.info('[GDPR] Account deletion cancelled', { idUtilisateur, action: 'deletion_cancelled' });
    return { message: 'Account deletion cancelled successfully' };
  } catch (error) {
    logger.error('[GDPR] Account deletion cancellation failed', { error: error.message, idUtilisateur });
    throw error;
  }
};

/**
 * Art. 25 - Anonymize user data after grace period expires
 * Called by CRON job - permanently removes personal data
 */
export const anonymizeExpiredDeletions = async () => {
  try {
    // Find users with expired grace period
    const userIds = await gdprRepository.findExpiredDeletions(100);

    if (userIds.length === 0) {
      return { anonymizedCount: 0 };
    }

    // Anonymize them
    const result = await gdprRepository.anonymizeUsers(userIds);

    logger.info('[GDPR] Anonymized expired deletions', {
      action: 'anonymize_users',
      count: result.anonymizedCount,
      userIds: result.anonymizedIds.slice(0, 10)
    });

    return result;
  } catch (error) {
    logger.error('[GDPR] Anonymization failed', { error: error.message });
    throw error;
  }
};

/**
 * Art. 25 - Anonymize inactive users (3+ years without login)
 * Automatic privacy protection (Data Protection by Design)
 */
export const anonymizeInactiveUsers = async (inactivityDays = 365 * 3) => {
  try {
    // Find inactive users
    const userIds = await gdprRepository.findInactiveUsers(inactivityDays);

    if (userIds.length === 0) {
      return { anonymizedCount: 0 };
    }

    // Anonymize them
    const result = await gdprRepository.anonymizeInactiveUsersBatch(userIds);

    logger.info('[GDPR] Anonymized inactive users', {
      action: 'anonymize_inactive',
      inactivityDays,
      count: result.anonymizedCount
    });

    return result;
  } catch (error) {
    logger.error('[GDPR] Inactive user anonymization failed', { error: error.message });
    throw error;
  }
};

/**
 * Art. 32 - Get user's consent history (proof of compliance)
 */
export const getUserConsentHistory = async (idUtilisateur) => {
  try {
    const consents = await gdprRepository.getConsentHistory(idUtilisateur);
    return consents;
  } catch (error) {
    logger.error('[GDPR] Consent history fetch failed', { error: error.message, idUtilisateur });
    throw error;
  }
};
