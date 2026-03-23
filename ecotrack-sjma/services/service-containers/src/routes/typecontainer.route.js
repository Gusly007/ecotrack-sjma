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

const express = require('express');
const { typeConteneurController } = require('../container-di.js');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.get('/', requirePermission('containers:read'), typeConteneurController.getAll);
router.get('/stats/all', requirePermission('containers:read'), typeConteneurController.getAllWithStats);
router.get('/code/:code', requirePermission('containers:read'), typeConteneurController.getByCode);
router.get('/nom/:nom', requirePermission('containers:read'), typeConteneurController.getByNom);
router.get('/:id/stats', requirePermission('containers:read'), typeConteneurController.getWithStats);
router.get('/:id', requirePermission('containers:read'), typeConteneurController.getById);
router.post('/', requirePermission('containers:create'), typeConteneurController.create);
router.put('/:id', requirePermission('containers:update'), typeConteneurController.update);
router.delete('/:id', requirePermission('containers:delete'), typeConteneurController.delete);

module.exports = router;
