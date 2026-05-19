import express from 'express';
import * as gdprService from '../services/gdprService.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /users/me/export:
 *   get:
 *     tags:
 *       - GDPR (Art. 15 - Right of Access)
 *     summary: Export all personal data
 *     description: Download a complete copy of your personal data in JSON format (Art. 15 RGPD)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exportedAt:
 *                   type: string
 *                 user:
 *                   type: object
 *                 signalements:
 *                   type: array
 *                 tournees:
 *                   type: array
 *                 badges:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Export failed
 */
router.get('/me/export', authenticateToken, async (req, res) => {
  try {
    const idUtilisateur = req.user.id_utilisateur;
    const data = await gdprService.exportUserData(idUtilisateur);
    
    // Return as downloadable JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ecotrack-data-${idUtilisateur}-${Date.now()}.json"`);
    res.json(data);
  } catch (error) {
    logger.error('Export failed', { error: error.message, userId: req.user.id_utilisateur });
    res.status(500).json({ error: 'Export failed' });
  }
});

/**
 * @swagger
 * /users/me/delete:
 *   post:
 *     tags:
 *       - GDPR (Art. 17 - Right to be Forgotten)
 *     summary: Request account deletion
 *     description: Request permanent deletion of your account (30-day grace period to cancel)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password confirmation
 *     responses:
 *       200:
 *         description: Deletion requested successfully
 *       400:
 *         description: Password required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Request failed
 */
router.post('/me/delete', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required for confirmation' });
    }

    // Verify password (implement password verification logic)
    // This should call your password verification function

    const idUtilisateur = req.user.id_utilisateur;
    const result = await gdprService.requestAccountDeletion(idUtilisateur);
    
    res.json({
      message: result.message,
      deletionRequestedAt: result.deletionRequestedAt,
      cancelDeadline: result.cancelDeadline,
      info: 'Your account will be permanently deleted and anonymized after 30 days. You can cancel this request by contacting support.'
    });
  } catch (error) {
    logger.error('Deletion request failed', { error: error.message, userId: req.user.id_utilisateur });
    res.status(500).json({ error: 'Deletion request failed' });
  }
});

/**
 * @swagger
 * /users/me/cancel-deletion:
 *   post:
 *     tags:
 *       - GDPR (Art. 17 - Right to be Forgotten)
 *     summary: Cancel account deletion request
 *     description: Cancel pending deletion (within 30-day grace period)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deletion cancelled successfully
 *       500:
 *         description: Cancellation failed
 */
router.post('/me/cancel-deletion', authenticateToken, async (req, res) => {
  try {
    const idUtilisateur = req.user.id_utilisateur;
    const result = await gdprService.cancelAccountDeletion(idUtilisateur);
    
    res.json(result);
  } catch (error) {
    logger.error('Deletion cancellation failed', { error: error.message, userId: req.user.id_utilisateur });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/me/consents:
 *   get:
 *     tags:
 *       - GDPR (Art. 7 & 32 - Consent & Security)
 *     summary: Get user's consent history
 *     description: View all consent records for audit trail purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consent records retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 consents:
 *                   type: array
 *                 totalRecords:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Fetch failed
 */
router.get('/me/consents', authenticateToken, async (req, res) => {
  try {
    const idUtilisateur = req.user.id_utilisateur;
    const consents = await gdprService.getUserConsentHistory(idUtilisateur);
    
    res.json({
      consents,
      totalRecords: consents.length,
      info: 'Proof of all consents given (Art. 7 compliance)'
    });
  } catch (error) {
    logger.error('Consent history fetch failed', { error: error.message, userId: req.user.id_utilisateur });
    res.status(500).json({ error: 'Failed to fetch consent history' });
  }
});

export default router;
