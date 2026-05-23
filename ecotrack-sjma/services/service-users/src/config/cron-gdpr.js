import cron from 'node-cron';
import * as gdprService from '../services/gdprService.js';
import logger from '../utils/logger.js';

/**
 * GDPR Cron Jobs for Service-Users (Art. 25 - Data Protection by Design)
 * Automated anonymization and cleanup
 */

// 02:00 AM daily - Anonymize inactive users (>3 years without login)
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('[GDPR CRON] Starting inactive user anonymization (>3 years)');
    const result = await gdprService.anonymizeInactiveUsers(365 * 3);
    logger.info(`[GDPR CRON] Anonymized ${result.anonymizedCount} inactive users`, {
      action: 'anonymize_inactive',
      count: result.anonymizedCount
    });
  } catch (error) {
    logger.error('[GDPR CRON] Inactive user anonymization failed', { error: error.message });
  }
});

// 02:15 AM daily - Anonymize users with expired deletion request (>30 days grace period)
cron.schedule('15 2 * * *', async () => {
  try {
    logger.info('[GDPR CRON] Starting expired deletion anonymization (>30 days)');
    const result = await gdprService.anonymizeExpiredDeletions();
    logger.info(`[GDPR CRON] Anonymized ${result.anonymizedCount} expired deletions`, {
      action: 'anonymize_expired_deletions',
      count: result.anonymizedCount
    });
  } catch (error) {
    logger.error('[GDPR CRON] Expired deletion anonymization failed', { error: error.message });
  }
});

export { cron };
