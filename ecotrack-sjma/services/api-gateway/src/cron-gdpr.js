import cron from 'node-cron';
import * as consentRepository from './repositories/consentRepository.js';
import logger from './middleware/logger.js';

/**
 * GDPR Compliance Cron Jobs (Art. 25 - Data Protection by Design)
 * Automated cleanup and archival to meet retention requirements
 */

// 03:00 AM daily - Archive logs older than 7 days (Art. 32)
cron.schedule('0 3 * * *', async () => {
  try {
    logger.info('[GDPR CRON] Starting log archival (>7 days)');
    const archived = await consentRepository.archiveOldLogs();
    logger.info(`[GDPR CRON] Archived ${archived} logs`, { action: 'archive_logs' });
  } catch (error) {
    logger.error('[GDPR CRON] Log archival failed', { error: error.message });
  }
});

// 03:15 AM daily - Cleanup archived logs older than 12 months (Art. 25)
cron.schedule('15 3 * * *', async () => {
  try {
    logger.info('[GDPR CRON] Starting archived logs cleanup (>12 months)');
    const deleted = await consentRepository.cleanupArchivedLogs();
    logger.info(`[GDPR CRON] Deleted ${deleted} archived logs`, { action: 'cleanup_archived_logs' });
  } catch (error) {
    logger.error('[GDPR CRON] Archived logs cleanup failed', { error: error.message });
  }
});

// 03:30 AM daily - Cleanup consent logs older than 13 months (Art. 7, CNIL)
cron.schedule('30 3 * * *', async () => {
  try {
    logger.info('[GDPR CRON] Starting consent logs cleanup (>13 months)');
    const deleted = await consentRepository.cleanupExpiredConsents();
    logger.info(`[GDPR CRON] Deleted ${deleted} expired consent records`, { action: 'cleanup_consents' });
  } catch (error) {
    logger.error('[GDPR CRON] Consent cleanup failed', { error: error.message });
  }
});

export { cron };
