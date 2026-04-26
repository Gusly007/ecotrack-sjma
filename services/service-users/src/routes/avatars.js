import express from 'express';
import * as avatarController from '../controllers/avatarController.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Avatars
 *   description: Gestion des avatars utilisateurs
 */

/**
 * @swagger
 * /users/avatar/upload:
 *   post:
 *     summary: Uploader un nouvel avatar
 *     description: Upload une image JPG, PNG ou WebP et crée les miniatures
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Image JPG, PNG ou WebP (max 5MB, 100x100+ pixels)"
 *     responses:
 *       201:
 *         description: Avatar uploadé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Avatar uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_utilisateur:
 *                       type: integer
 *                     avatar_url:
 *                       type: string
 *                       example: "/avatars/original/1-1705305000.jpg"
 *                     avatar_thumbnail:
 *                       type: string
 *                       example: "/avatars/thumbnails/1-1705305000.jpg"
 *                     avatar_mini:
 *                       type: string
 *                       example: "/avatars/mini/1-1705305000.jpg"
 *       400:
 *         description: Fichier invalide
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  avatarController.uploadAvatar
);

/**
 * @swagger
 * /users/avatar/{userId}:
 *   get:
 *     summary: Récupérer l'avatar d'un utilisateur
 *     tags: [Avatars]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Avatar récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 */
router.get('/:userId', avatarController.getUserAvatar);

/**
 * @swagger
 * /users/avatar:
 *   delete:
 *     summary: Supprimer mon avatar
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar supprimé
 */
router.delete(
  '/',
  authenticateToken,
  avatarController.deleteAvatar
);

export default router;