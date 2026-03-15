const router = require('express').Router();

/**
 * @swagger
 * tags:
 *   - name: Véhicules
 *     description: Gestion de la flotte de véhicules
 */

/**
 * @swagger
 * /routes/vehicules:
 *   get:
 *     summary: Liste tous les véhicules
 *     tags: [Véhicules]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Liste des véhicules avec nombre de tournées actives
 */
router.get('/vehicules', (req, res, next) => req.controllers.vehicule.getAll(req, res, next));

/**
 * @swagger
 * /routes/vehicules:
 *   post:
 *     summary: Crée un nouveau véhicule
 *     tags: [Véhicules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero_immatriculation, modele, capacite_kg]
 *             properties:
 *               numero_immatriculation:
 *                 type: string
 *                 maxLength: 10
 *                 example: "AB-123-CD"
 *               modele:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Renault Master"
 *               capacite_kg:
 *                 type: integer
 *                 example: 3500
 *     responses:
 *       201:
 *         description: Véhicule créé
 *       409:
 *         description: Immatriculation déjà existante
 */
router.post('/vehicules', (req, res, next) => req.controllers.vehicule.create(req, res, next));

/**
 * @swagger
 * /routes/vehicules/{id}:
 *   get:
 *     summary: Récupère un véhicule par ID
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Véhicule trouvé
 *       404:
 *         description: Véhicule introuvable
 */
router.get('/vehicules/:id', (req, res, next) => req.controllers.vehicule.getById(req, res, next));

/**
 * @swagger
 * /routes/vehicules/{id}:
 *   patch:
 *     summary: Met à jour un véhicule
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_immatriculation: { type: string }
 *               modele: { type: string }
 *               capacite_kg: { type: integer }
 *     responses:
 *       200:
 *         description: Véhicule mis à jour
 *       404:
 *         description: Véhicule introuvable
 */
router.patch('/vehicules/:id', (req, res, next) => req.controllers.vehicule.update(req, res, next));

/**
 * @swagger
 * /routes/vehicules/{id}:
 *   delete:
 *     summary: Supprime un véhicule
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Véhicule supprimé
 *       404:
 *         description: Véhicule introuvable
 */
router.delete('/vehicules/:id', (req, res, next) => req.controllers.vehicule.delete(req, res, next));

module.exports = router;
