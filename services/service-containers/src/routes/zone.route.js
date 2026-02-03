const router = require('express').Router();
const { zoneController } = require('../container-di.js');

// ========== CRUD de base ==========

// POST - Créer une nouvelle zone
/**
 * @swagger
 * /zones:
 *   post:
 *     summary: Crée une nouvelle zone
 *     description: Crée une nouvelle zone avec les informations fournies. Tous les champs sont obligatoires.
 *     tags:
 *       - Zones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - nom
 *               - population
 *               - superficie_km2
 *               - latitude
 *               - longitude
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code unique de la zone
 *                 example: ZONE001
 *               nom:
 *                 type: string
 *                 description: Nom de la zone
 *                 example: Paris
 *               population:
 *                 type: integer
 *                 description: Population de la zone
 *                 example: 2161000
 *               superficie_km2:
 *                 type: number
 *                 format: double
 *                 description: Superficie de la zone en km²
 *                 example: 105.4
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitude du centre de la zone (entre -90 et 90)
 *                 example: 48.8566
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitude du centre de la zone (entre -180 et 180)
 *                 example: 2.3522
 *     responses:
 *       201:
 *         description: Zone créée avec succès
 *       400:
 *         description: Requête invalide - champs requis manquants ou données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/zones', zoneController.create);

// GET - Récupérer toutes les zones avec pagination
/**
 * @swagger
 * /zones:
 *   get:
 *     summary: Récupère toutes les zones
 *     description: Récupère la liste de toutes les zones avec support de la pagination
 *     tags:
 *       - Zones
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre de résultats par page
 *     responses:
 *       200:
 *         description: Liste des zones récupérée avec succès
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones', zoneController.getAll);

// GET - Récupérer une zone par ID
/**
 * @swagger
 * /zones/{id}:
 *   get:
 *     summary: Récupère une zone par son ID
 *     tags:
 *       - Zones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la zone
 *     responses:
 *       200:
 *         description: Zone récupérée avec succès
 *       400:
 *         description: ID manquant
 *       404:
 *         description: Zone non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/:id', zoneController.getById);

// GET - Récupérer une zone par son code
/**
 * @swagger
 * /zones/code/{code}:
 *   get:
 *     summary: Récupère une zone par son code
 *     tags:
 *       - Zones
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code unique de la zone
 *     responses:
 *       200:
 *         description: Zone récupérée avec succès
 *       400:
 *         description: Code manquant
 *       404:
 *         description: Zone non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/code/:code', zoneController.getByCode);

// PATCH - Mettre à jour une zone
/**
 * @swagger
 * /zones/{id}:
 *   patch:
 *     summary: Met à jour une zone
 *     description: Met à jour les informations d'une zone. Seuls les champs fournis seront modifiés.
 *     tags:
 *       - Zones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la zone à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code unique de la zone
 *               nom:
 *                 type: string
 *                 description: Nom de la zone
 *               population:
 *                 type: integer
 *                 description: Population de la zone
 *               superficie_km2:
 *                 type: number
 *                 format: double
 *                 description: Superficie de la zone en km²
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitude du centre de la zone
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitude du centre de la zone
 *     responses:
 *       200:
 *         description: Zone mise à jour avec succès
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Zone non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.patch('/zones/:id', zoneController.update);

// DELETE - Supprimer une zone
/**
 * @swagger
 * /zones/{id}:
 *   delete:
 *     summary: Supprime une zone
 *     tags:
 *       - Zones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la zone à supprimer
 *     responses:
 *       200:
 *         description: Zone supprimée avec succès
 *       400:
 *         description: ID manquant
 *       404:
 *         description: Zone non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/zones/:id', zoneController.delete);

// DELETE - Supprimer toutes les zones
/**
 * @swagger
 * /zones:
 *   delete:
 *     summary: Supprime toutes les zones
 *     description: Attention - Cette opération supprimera toutes les zones de la base de données
 *     tags:
 *       - Zones
 *     responses:
 *       200:
 *         description: Toutes les zones ont été supprimées
 *       500:
 *         description: Erreur serveur
 */
router.delete('/zones', zoneController.deleteAll);

// ========== Recherche et filtres ==========

// GET - Rechercher les zones par nom
/**
 * @swagger
 * /zones/search:
 *   get:
 *     summary: Recherche les zones par nom
 *     description: Trouve toutes les zones dont le nom contient la chaîne de recherche (insensible à la casse)
 *     tags:
 *       - Recherche et Filtres
 *     parameters:
 *       - in: query
 *         name: nom
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom ou partie du nom de la zone à rechercher
 *     responses:
 *       200:
 *         description: Liste des zones trouvées
 *       400:
 *         description: Paramètre "nom" requis
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/search', zoneController.searchByName);

// GET - Rechercher les zones dans un rayon
/**
 * @swagger
 * /zones/radius:
 *   get:
 *     summary: Recherche les zones dans un rayon
 *     description: Trouve toutes les zones à proximité d'une localisation donnée
 *     tags:
 *       - Recherche et Filtres
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: Latitude du point central de recherche
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: Longitude du point central de recherche
 *       - in: query
 *         name: rayon
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: Rayon de recherche en kilomètres
 *     responses:
 *       200:
 *         description: Liste des zones trouvées dans le rayon avec distances
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/radius', zoneController.getInRadius);

// ========== Statistiques et vérifications ==========

// GET - Compter les zones
/**
 * @swagger
 * /zones/count:
 *   get:
 *     summary: Compte le nombre total de zones
 *     tags:
 *       - Statistiques
 *     responses:
 *       200:
 *         description: Nombre de zones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/count', zoneController.count);

// GET - Récupérer les statistiques globales des zones
/**
 * @swagger
 * /zones/stats/global:
 *   get:
 *     summary: Récupère les statistiques globales des zones
 *     description: Retourne les statistiques complètes sur les zones (total, moyenne, min/max de population et superficie)
 *     tags:
 *       - Statistiques
 *     responses:
 *       200:
 *         description: Statistiques globales récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_zones:
 *                   type: integer
 *                 population_totale:
 *                   type: integer
 *                 popolazione_moyenne:
 *                   type: number
 *                 population_min:
 *                   type: integer
 *                 population_max:
 *                   type: integer
 *                 superficie_totale_km2:
 *                   type: number
 *                 superficie_moyenne_km2:
 *                   type: number
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/stats/global', zoneController.getStatistics);

// GET - Vérifier si une zone existe par ID
/**
 * @swagger
 * /zones/check/exists/{id}:
 *   get:
 *     summary: Vérifie l'existence d'une zone par ID
 *     tags:
 *       - Vérifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la zone
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/check/exists/:id', zoneController.exists);

// GET - Vérifier si un code de zone existe
/**
 * @swagger
 * /zones/check/code/{code}:
 *   get:
 *     summary: Vérifie l'existence d'une zone par code
 *     tags:
 *       - Vérifications
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code unique de la zone
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *       500:
 *         description: Erreur serveur
 */
router.get('/zones/check/code/:code', zoneController.codeExists);

module.exports = router;
