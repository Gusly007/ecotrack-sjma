import express from 'express';
import logger from '../middleware/logger.js';
import * as consentRepository from '../repositories/consentRepository.js';

const router = express.Router();

/**
 * @swagger
 * /api/V1/consent:
 *   post:
 *     tags:
 *       - GDPR (Art. 7)
 *     summary: Log user consent (cookies, CGU, privacy policy)
 *     description: Record consent/refusal with proof (IP, user-agent) for GDPR compliance (Art. 7)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - typeConsent
 *               - actionConsent
 *               - intitule
 *             properties:
 *               idUtilisateur:
 *                 type: integer
 *                 description: User ID (null for anonymous)
 *               sessionId:
 *                 type: string
 *                 description: Session ID for anonymous tracking
 *               typeConsent:
 *                 type: string
 *                 enum: [cookies, cgu, privacy]
 *               actionConsent:
 *                 type: string
 *                 enum: [accepted, rejected]
 *               versionDocument:
 *                 type: string
 *                 default: "1.0"
 *               intitule:
 *                 type: string
 *                 description: Exact text shown to user (CNIL requirement)
 *     responses:
 *       201:
 *         description: Consent recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 consentId:
 *                   type: integer
 *                 recordedAt:
 *                   type: string
 *                 retentionUntil:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/consent', async (req, res) => {
  try {
    const { idUtilisateur, sessionId, typeConsent, actionConsent, versionDocument, intitule } = req.body;

    // Validate required fields
    if (!typeConsent || !actionConsent || !intitule) {
      return res.status(400).json({
        error: 'Missing required fields: typeConsent, actionConsent, intitule'
      });
    }

    if (!idUtilisateur && !sessionId) {
      return res.status(400).json({
        error: 'Either idUtilisateur or sessionId must be provided'
      });
    }

    // Extract IP address (for CNIL requirement)
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.socket.remoteAddress || 
                     req.connection.remoteAddress ||
                     'unknown';

    // Get user agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Log consent in database
    const consent = await consentRepository.logConsent(
      idUtilisateur || null,
      sessionId,
      typeConsent,
      actionConsent,
      versionDocument || '1.0',
      intitule,
      ipAddress,
      userAgent
    );

    logger.info('[GDPR] Consent recorded', {
      action: `consent_${actionConsent}`,
      typeConsent,
      idUtilisateur: idUtilisateur || 'anonymous',
      sessionId: sessionId || 'none'
    });

    res.status(201).json({
      success: true,
      consentId: consent.id,
      message: `Consent ${actionConsent} recorded (Art. 7 - GDPR)`,
      recordedAt: new Date().toISOString(),
      retentionUntil: new Date(Date.now() + 13 * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    logger.error('[GDPR] Consent logging failed', { error: error.message });
    res.status(500).json({ error: 'Failed to record consent' });
  }
});

/**
 * @swagger
 * /api/V1/consent/{userId}:
 *   get:
 *     tags:
 *       - GDPR (Art. 7)
 *     summary: Get user's consent history
 *     description: Retrieve all consent records for a user (proof of GDPR compliance)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
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
 *       500:
 *         description: Server error
 */
router.get('/consent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // In production, add proper authentication check
    // Verify that authenticated user can only view their own records

    const consents = await consentRepository.getConsentsByUser(userId);

    res.json({
      consents,
      totalRecords: consents.length,
      message: 'User consent records (Art. 7 - GDPR proof)'
    });
  } catch (error) {
    logger.error('[GDPR] Consent retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve consent records' });
  }
});

export default router;
