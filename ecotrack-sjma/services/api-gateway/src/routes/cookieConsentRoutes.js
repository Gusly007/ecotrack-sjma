import express from 'express';
import CookieConsentController from '../controllers/cookieConsentController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/cookies/consent
 * @desc Enregistrer le consentement aux cookies (public)
 * @access Public
 */
router.post('/consent', CookieConsentController.recordConsent);

/**
 * @route GET /api/cookies/consent/:sessionId
 * @desc Récupérer le consentement existant (public)
 * @access Public
 */
router.get('/consent/:sessionId', CookieConsentController.getConsent);

/**
 * @route PATCH /api/cookies/consent/:sessionId
 * @desc Mettre à jour le consentement (public)
 * @access Public
 */
router.patch('/consent/:sessionId', CookieConsentController.updateConsent);

/**
 * @route DELETE /api/cookies/consent/:sessionId
 * @desc Supprimer le consentement (droit à l'oubli - RGPD) (public)
 * @access Public
 */
router.delete('/consent/:sessionId', CookieConsentController.deleteConsent);

/**
 * @route GET /api/cookies/stats
 * @desc Récupérer statistiques de consentement (admin)
 * @access Admin
 */
router.get('/stats', requireRole('ADMIN'), CookieConsentController.getConsentStats);

export default router;
