import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const updateProfileSchema = {
  body: z.object({
    prenom: z.string().min(2).max(50).optional(),
    email: z.string().email().optional()
  }).strict().refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided'
  })
};

const changePasswordSchema = {
  body: z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6)
  }).strict()
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des profils utilisateurs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         prenom:
 *           type: string
 *           description: "Prénom/username de l'utilisateur"
 *           minLength: 2
 *           maxLength: 50
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: "Adresse email (doit être unique)"
 *           example: "newemail@example.com"
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *           format: password
 *           description: "Mot de passe actuel"
 *           minLength: 6
 *           example: "old_password123"
 *         newPassword:
 *           type: string
 *           format: password
 *           description: "Nouveau mot de passe (minimum 6 caractères)"
 *           minLength: 6
 *           example: "new_secure_password456"
 *
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         id_utilisateur:
 *           type: integer
 *           description: "ID unique de l'utilisateur"
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: "Adresse email"
 *           example: "john.doe@example.com"
 *         prenom:
 *           type: string
 *           description: "Prénom/username"
 *           example: "John"
 *         role_par_defaut:
 *           type: string
 *           enum: [CITOYEN, AGENT, GESTIONNAIRE, ADMIN]
 *           description: "Rôle par défaut"
 *           example: "CITOYEN"
 *         points:
 *           type: integer
 *           description: "Points de gamification"
 *           example: 150
 *         est_active:
 *           type: boolean
 *           description: "Compte actif ou désactivé"
 *           example: true
 *
 *     UserProfileWithStatsResponse:
 *       type: object
 *       properties:
 *         id_utilisateur:
 *           type: integer
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         prenom:
 *           type: string
 *           example: "John"
 *         role_par_defaut:
 *           type: string
 *           enum: [CITOYEN, AGENT, GESTIONNAIRE, ADMIN]
 *           example: "CITOYEN"
 *         points:
 *           type: integer
 *           description: "Points totaux accumulés"
 *           example: 150
 *         date_creation:
 *           type: string
 *           format: date-time
 *           description: "Date de création du compte"
 *           example: "2024-01-15T10:30:00Z"
 *         badge_count:
 *           type: integer
 *           description: "Nombre de badges obtenus"
 *           example: 3
 *
 *     UserListResponse:
 *       type: object
 *       properties:
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 150
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 20
 *             pages:
 *               type: integer
 *               example: 8
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserProfileResponse'
 *
 *     PasswordChangeResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Password changed successfully"
 *
 *     UpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Profile updated successfully"
 *         data:
 *           $ref: '#/components/schemas/UserProfileResponse'
 */

// ============================================
// Routes de profil personnel (tous)
// ============================================

// Middleware : authentification obligatoire pour toutes ces routes
router.use(authenticateToken);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Récupérer mon profil
 *     description: Retourne les informations du profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Token expiré
 */
router.get('/profile', userController.getOwnProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Mettre à jour mon profil
 *     description: Met à jour les informations du profil (prénom, email)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateResponse'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email must be valid"
 *       401:
 *         description: Authentification requise
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email already in use"
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Changer mon mot de passe
 *     description: Change le mot de passe de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordChangeResponse'
 *       400:
 *         description: Données invalides ou mot de passe actuel incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Current password is incorrect"
 *       401:
 *         description: Authentification requise (token manquant ou invalide)
 */
router.post('/change-password', validate(changePasswordSchema), userController.changePassword);

/**
 * @swagger
 * /users/profile-with-stats:
 *   get:
 *     summary: Récupérer mon profil avec statistiques
 *     description: Retourne mon profil avec badges et statistiques
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil avec stats récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfileWithStatsResponse'
 *       401:
 *         description: Authentification requise
 */
router.get('/profile-with-stats', userController.getProfileWithStats);

// ============================================
// Routes d'administration (manager/admin)
// ============================================

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lister tous les utilisateurs
 *     description: |
 *       Liste tous les utilisateurs avec pagination.
 *       Nécessite la permission 'users:read' (typiquement GESTIONNAIRE et ADMIN).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Numéro de la page"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: "Nombre d'utilisateurs par page"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CITOYEN, AGENT, GESTIONNAIRE, ADMIN]
 *         description: "Filtrer par rôle"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Rechercher par email ou prénom"
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Permission insuffisante
 */
router.get(
  '/',
  requirePermission('users:read'),
  userController.listUsers
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer le profil d'un utilisateur
 *     description: |
 *       Récupère le profil d'un utilisateur spécifique.
 *       L'accès dépend des permissions de l'utilisateur connecté.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID de l'utilisateur"
 *     responses:
 *       200:
 *         description: Profil récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfileWithStatsResponse'
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', userController.getUserProfile);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur (admin)
 *     description: |
 *       Met à jour les informations d'un utilisateur.
 *       Accessible uniquement par les admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID de l'utilisateur"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prenom:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@example.com"
 *               est_active:
 *                 type: boolean
 *                 description: "Activer/Désactiver le compte"
 *                 example: true
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateResponse'
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Permission insuffisante
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put(
  '/:id',
  authorizeRole(['ADMIN']),
  userController.updateUserByAdmin
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur (admin)
 *     description: |
 *       Supprime un utilisateur de la base de données.
 *       Accessible uniquement par les admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID de l'utilisateur"
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Permission insuffisante
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete(
  '/:id',
  authorizeRole(['ADMIN']),
  userController.deleteUser
);

export default router;