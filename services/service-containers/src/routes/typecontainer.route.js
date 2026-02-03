const express = require('express');
const db = require('../src/db/connexion');
const TypeConteneurModel = require('../src/models/type-conteneur-model');
const TypeConteneurService = require('../src/services/type-conteneur-services');
const TypeConteneurController = require('../src/controllers/type-conteneur-controller');

const router = express.Router();

// Initialize dependencies
const typeConteneurModel = new TypeConteneurModel(db);
const typeConteneurService = new TypeConteneurService(typeConteneurModel);
const typeConteneurController = new TypeConteneurController(typeConteneurService);

// GET all type containers
router.get('/', typeConteneurController.getAll);

// GET all type containers with stats
router.get('/stats/all', typeConteneurController.getAllWithStats);

// GET type container by code
router.get('/code/:code', typeConteneurController.getByCode);

// GET type container by nom
router.get('/nom/:nom', typeConteneurController.getByNom);

// GET type container with stats by ID
router.get('/:id/stats', typeConteneurController.getWithStats);

// GET a specific type container by ID
router.get('/:id', typeConteneurController.getById);

// POST create a new type container
router.post('/', typeConteneurController.create);

// PUT update a type container
router.put('/:id', typeConteneurController.update);

// DELETE a type container
router.delete('/:id', typeConteneurController.delete);


module.exports = router;

/**
 * @swagger
 * /typecontainers:
 *   get:
 *     summary: Get all type containers
 *     tags:
 *       - Type Containers
 *     responses:
 *       200:
 *         description: List of all type containers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_type:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   nom:
 *                     type: string
 *   post:
 *     summary: Create a new type container
 *     tags:
 *       - Type Containers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - nom
 *             properties:
 *               code:
 *                 type: string
 *               nom:
 *                 type: string
 *                 enum: [ORDURE, RECYCLAGE, VERRE, COMPOST]
 *     responses:
 *       201:
 *         description: Type container created successfully
 * /typecontainers/stats/all:
 *   get:
 *     summary: Get all type containers with statistics
 *     tags:
 *       - Type Containers
 *     responses:
 *       200:
 *         description: List of all type containers with stats
 * /typecontainers/code/{code}:
 *   get:
 *     summary: Get type container by code
 *     tags:
 *       - Type Containers
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Type container found
 *       404:
 *         description: Type container not found
 * /typecontainers/nom/{nom}:
 *   get:
 *     summary: Get type container by nom
 *     tags:
 *       - Type Containers
 *     parameters:
 *       - in: path
 *         name: nom
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Type container found
 * /typecontainers/{id}:
 *   get:
 *     summary: Get type container by ID
 *     tags:
 *       - Type Containers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Type container found
 *       404:
 *         description: Type container not found
 *   put:
 *     summary: Update a type container
 *     tags:
 *       - Type Containers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               nom:
 *                 type: string
 *     responses:
 *       200:
 *         description: Type container updated successfully
 *   delete:
 *     summary: Delete a type container
 *     tags:
 *       - Type Containers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Type container deleted successfully
 * /typecontainers/{id}/stats:
 *   get:
 *     summary: Get type container with statistics
 *     tags:
 *       - Type Containers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Type container with stats found
 */