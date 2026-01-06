import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

// Toutes les routes ici sont protégées
router.use(authenticateToken);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prenom:
 *                 type: string
 *                 example: "John"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_utilisateur:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 prenom:
 *                   type: string
 *                 role_par_defaut:
 *                   type: string
 *                 points:
 *                   type: integer
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: "old_password123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "new_secure_password456"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', authController.changePassword);

/**
 * @swagger
 * /users/profile-with-stats:
 *   get:
 *     summary: Get user profile with stats
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_utilisateur:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 prenom:
 *                   type: string
 *                 role_par_defaut:
 *                   type: string
 *                 points:
 *                   type: integer
 *                 date_creation:
 *                   type: string
 *                   format: date-time
 *                 badge_count:
 *                   type: string # Note: COUNT returns a string in some drivers
 *       401:
 *         description: Unauthorized
 */
router.get('/profile-with-stats', authController.getProfileWithStats);

export default router;
