import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { publicLimiter, loginLimiter } from '../config/rateLimit.js';
import * as sessionController from '../controllers/sessionController.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const registerSchema = {
	body: z.object({
		email: z.string().email(),
		username: z.string().min(2).max(50),
		password: z.string().min(6),
		role: z.enum(['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN']).optional()
	}).strict()
};

const loginSchema = {
	body: z.object({
		email: z.string().email(),
		password: z.string().min(1)
	}).strict()
};

const refreshSchema = {
	body: z.object({
		refreshToken: z.string().min(1)
	}).strict()
};

const logoutSchema = {
	body: z.object({
		refreshToken: z.string().min(1).optional()
	}).strict().optional()
};

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints pour authentification des utilisateurs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - prenom
 *         - email
 *         - password
 *       properties:
 *         prenom:
 *           type: string
 *           description: "Prénom/username de l'utilisateur"
 *           minLength: 2
 *           maxLength: 50
 *           example: "John"
 *         email:
 *           type: string
 *           format: email
 *           description: "Adresse email unique"
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: "Mot de passe minimum 6 caractères"
 *           minLength: 6
 *           example: "password123"
 *         role:
 *           type: string
 *           enum: [CITOYEN, AGENT, GESTIONNAIRE, ADMIN]
 *           default: CITOYEN
 *           description: "Rôle de l'utilisateur"
 *           example: "CITOYEN"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: "Adresse email"
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: "Mot de passe"
 *           example: "password123"
 *
 *     RefreshRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: "Refresh token obtenu lors du login"
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Login successful"
 *         token:
 *           type: string
 *           description: "Access token JWT (24h)"
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           description: "Refresh token JWT (7 jours)"
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           type: object
 *           properties:
 *             id_utilisateur:
 *               type: integer
 *               example: 1
 *             email:
 *               type: string
 *               example: "john.doe@example.com"
 *             prenom:
 *               type: string
 *               example: "John"
 *             role_par_defaut:
 *               type: string
 *               enum: [CITOYEN, AGENT, GESTIONNAIRE, ADMIN]
 *               example: "CITOYEN"
 *             points:
 *               type: integer
 *               example: 0
 *
 *     UserProfile:
 *       type: object
 *       properties:
 *         id_utilisateur:
 *           type: integer
 *           example: 1
 *         email:
 *           type: string
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
 *           example: 100
 *         est_active:
 *           type: boolean
 *           example: true
 *         date_creation:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Invalid credentials"
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Missing required fields: email, password"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "Authorization header with Bearer token"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscrire un nouvel utilisateur
 *     description: Crée un nouveau compte utilisateur et retourne les tokens JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Utilisateur inscrit avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               error: "Password must be at least 6 characters"
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Email already in use"
 */
router.post('/register', publicLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connecter un utilisateur
 *     description: Authentifie un utilisateur et retourne les tokens JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Champs manquants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Email ou password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid email or password"
 *       429:
 *         description: Trop de tentatives (rate limited)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Too many login attempts, please try again later"
 */
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Récupérer le profil connecté
 *     description: Retourne les informations du profil de l'utilisateur authentifié
 *     tags: [Authentication]
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
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Access token required"
 *       403:
 *         description: Token expiré ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid or expired token"
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renouveler l'access token
 *     description: Utilise le refresh token pour obtenir un nouvel access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Token renouvelé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token refreshed"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Refresh token manquant
 *       403:
 *         description: Refresh token invalide ou expiré
 */
router.post('/refresh', validate(refreshSchema), sessionController.refreshAccessToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnecter l'utilisateur
 *     description: Invalide le refresh token fourni
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Token manquant
 */
router.post('/logout', authenticateToken, validate(logoutSchema), sessionController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Déconnecter l'utilisateur de tous les appareils
 *     description: Invalide tous les refresh tokens de l'utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion complète réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out from all devices"
 */
router.post('/logout-all', authenticateToken, sessionController.logoutAll);

export default router;