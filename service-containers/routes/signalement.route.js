const express = require('express');
const { signalementController } = require('../src/container.di.js');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Signalements
 *   description: API for managing signalements
 */

/**
 * @swagger
 * /signalements:
 *   post:
 *     summary: Create a new signalement
 *     tags: [Signalements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Signalement created
 *       400:
 *         description: Invalid input
 */
router.post('/signalements', signalementController.createSignalement);

/**
 * @swagger
 * /signalements:
 *   get:
 *     summary: Get all signalements
 *     tags: [Signalements]
 *     responses:
 *       200:
 *         description: A list of signalements
 *       500:
 *         description: Server error
 */
router.get('/signalements', signalementController.getAllSignalements);

/**
 * @swagger
 * /signalements/{id}:
 *   get:
 *     summary: Get a signalement by ID
 *     tags: [Signalements]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the signalement
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A signalement object
 *       404:
 *         description: Signalement not found
 *       500:
 *         description: Server error
 */
router.get('/signalements/:id', signalementController.getSignalementById);

/**
 * @swagger
 * /signalements/{id}:
 *   put:
 *     summary: Update a signalement by ID
 *     tags: [Signalements]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the signalement
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated signalement
 *       404:
 *         description: Signalement not found
 *       400:
 *         description: Invalid input
 */
router.put('/signalements/:id', signalementController.updateSignalement);

/**
 * @swagger
 * /signalements/{id}:
 *   delete:
 *     summary: Delete a signalement by ID
 *     tags: [Signalements]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the signalement
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted signalement
 *       404:
 *         description: Signalement not found
 *       500:
 *         description: Server error
 */
router.delete('/signalements/:id', signalementController.deleteSignalement);

module.exports = router;