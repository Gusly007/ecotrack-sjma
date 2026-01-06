import express from 'express';
import * as roleController from '../controllers/roleController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestion des rôles des utilisateurs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RoleAssignmentRequest:
 *       type: object
 *       required:
 *         - roleId
 *       properties:
 *         roleId:
 *           type: integer
 *           description: "Identifiant du rôle à assigner"
 *           example: 2
 *     RolesResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           description: "Liste des rôles associés à l'utilisateur"
 *           items:
 *             type: object
 *             properties:
 *               id_role:
 *                 type: integer
 *                 example: 2
 *               nom_role:
 *                 type: string
 *                 example: "GESTIONNAIRE"
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Role assigné"
 *         data:
 *           type: object
 *           description: "Objet retourné par le service après assignation"
 */


router.use(authenticateToken);

router.use(authorizeRole(['ADMIN']));

/**
 * @swagger
 * /roles/users/{id}:
 *   get:
 *     summary: Récupérer les rôles d'un utilisateur
 *     description: Retourne la liste des rôles associés à l'utilisateur ciblé. Accessible uniquement aux admins.
 *     tags: [Roles]
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
 *         description: Rôles récupérés
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolesResponse'
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès réservé aux admins
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/users/:id', roleController.getUserRoles);

/**
 * @swagger
 * /roles/users/{id}:
 *   post:
 *     summary: Assigner un rôle à un utilisateur
 *     description: Ajoute un rôle à l'utilisateur ciblé. Accessible uniquement aux admins.
 *     tags: [Roles]
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
 *             $ref: '#/components/schemas/RoleAssignmentRequest'
 *     responses:
 *       201:
 *         description: Rôle assigné avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Données manquantes ou invalides
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès réservé aux admins
 *       404:
 *         description: Utilisateur ou rôle non trouvé
 */
router.post('/users/:id', roleController.assignRole);

/**
 * @swagger
 * /roles/users/{id}/{roleId}:
 *   delete:
 *     summary: Retirer un rôle à un utilisateur
 *     description: Supprime le rôle spécifié de l'utilisateur ciblé. Accessible uniquement aux admins.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID de l'utilisateur"
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID du rôle à retirer"
 *     responses:
 *       200:
 *         description: Rôle retiré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès réservé aux admins
 *       404:
 *         description: Utilisateur ou rôle non trouvé
 */
router.delete('/users/:id/:roleId', roleController.removeRole);

export default router;