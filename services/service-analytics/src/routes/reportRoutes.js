const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const { reportLimiter } = require('../middleware/rateLimitMiddleware');
const { requirePermission } = require('../middleware/rbac');

/**
 * @swagger
 * /api/analytics/reports/generate:
 *   post:
 *     summary: Générer un rapport PDF ou Excel
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 default: pdf
 *               reportType:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *                 default: weekly
 *               email:
 *                 type: string
 *                 description: Email optionnel pour envoyer le rapport
 *     responses:
 *       200:
 *         description: Rapport généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     format:
 *                       type: string
 *                     reportType:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     url:
 *                       type: string
 *                     size:
 *                       type: number
 *                     emailSent:
 *                       type: boolean
 *                     generatedAt:
 *                       type: string
 *       401:
 *         description: Non autorisé
 */
router.post('/reports/generate', authMiddleware, requirePermission('analytics:read'), reportLimiter, ValidationMiddleware.validateReportRequest(), ReportController.generateReport);

/**
 * @swagger
 * /api/analytics/reports/download/{filename}:
 *   get:
 *     summary: Télécharger un rapport
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom du fichier à télécharger
 *     responses:
 *       200:
 *         description: Fichier PDF ou Excel
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Rapport non trouvé
 */
router.get('/reports/download/:filename', authMiddleware, requirePermission('analytics:read'), ReportController.downloadReport);

/**
 * @swagger
 * /api/analytics/reports/environmental:
 *   post:
 *     summary: Générer un rapport d'impact environnemental
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 default: pdf
 *               period:
 *                 type: string
 *                 enum: [day, week, month]
 *                 default: week
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rapport généré
 */
router.post('/reports/environmental', authMiddleware, requirePermission('analytics:read'), ReportController.generateEnvironmentalReport);

/**
 * @swagger
 * /api/analytics/reports/routes-performance:
 *   post:
 *     summary: Générer un rapport de performance des tournées
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 default: pdf
 *               period:
 *                 type: string
 *                 enum: [day, week, month]
 *                 default: week
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rapport généré
 */
router.post('/reports/routes-performance', authMiddleware, requirePermission('analytics:read'), ReportController.generateRoutesPerformanceReport);

module.exports = router;