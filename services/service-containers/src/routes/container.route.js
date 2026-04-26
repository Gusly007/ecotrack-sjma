const router = require('express').Router();
const controller = require('../container-di.js');
const { requirePermission } = require('../middleware/rbac');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// POST - Créer un nouveau conteneur
/**
 * @swagger
 * /containers:
 *   post:
 *     summary: Crée un nouveau conteneur
 *     description: Crée un nouveau conteneur avec les informations fournies. Les champs capacite_l, statut, latitude et longitude sont obligatoires.
 *     tags:
 *       - Conteneurs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - capacite_l
 *               - statut
 *               - latitude
 *               - longitude
 *             properties:
 *               capacite_l:
 *                 type: integer
 *                 description: Capacité du conteneur en litres
 *                 example: 1200
 *               statut:
 *                 type: string
 *                 enum: [ACTIF, INACTIF, EN_MAINTENANCE]
 *                 description: Statut du conteneur
 *                 example: ACTIF
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitude de la position du conteneur
 *                 example: 48.8566
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitude de la position du conteneur
 *                 example: 2.3522
 *               id_zone:
 *                 type: integer
 *                 description: Identifiant de la zone associée
 *                 example: 1
 *               id_type:
 *                 type: integer
 *                 description: Identifiant du type de conteneur
 *                 example: 1
 *     responses:
 *       201:
 *         description: Conteneur créé avec succès
 *       400:
 *         description: Requête invalide
 *       500:
 *         description: Erreur serveur
 */
router.post('/containers', requirePermission('containers:create'), controller.create);

// GET - Récupérer tous les conteneurs
/**
 * @swagger
 * /containers:
 *   get:
 *     summary: Récupère tous les conteneurs
 *     description: Récupère la liste de tous les conteneurs avec pagination et filtres
 *     tags:
 *       - Conteneurs
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
 *         description: Liste des conteneurs récupérée
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers', requirePermission('containers:read'), controller.getAll);

// GET - Récupérer un conteneur par ID
/**
 * @swagger
 * /containers/id/{id}:
 *   get:
 *     summary: Récupère un conteneur par son ID
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du conteneur
 *     responses:
 *       200:
 *         description: Conteneur récupéré
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/id/:id', requirePermission('containers:read'), controller.getById);

// GET - Récupérer un conteneur par UID
/**
 * @swagger
 * /containers/uid/{uid}:
 *   get:
 *     summary: Récupère un conteneur par son UID
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant unique du conteneur (format CNT-XXXXX)
 *     responses:
 *       200:
 *         description: Conteneur récupéré
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/uid/:uid', requirePermission('containers:read'), controller.getByUid);

// GET - Récupérer les conteneurs par statut
/**
 * @swagger
 * /containers/status/{statut}:
 *   get:
 *     summary: Récupère les conteneurs par statut
 *     tags:
 *       - Recherche et Filtres
 *     parameters:
 *       - in: path
 *         name: statut
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ACTIF, INACTIF, EN_MAINTENANCE]
 *         description: Statut à rechercher
 *     responses:
 *       200:
 *         description: Liste des conteneurs par statut
 *       404:
 *         description: Aucun conteneur trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/status/:statut', requirePermission('containers:read'), controller.getByStatus);

// GET - Récupérer les conteneurs par zone
/**
 * @swagger
 * /containers/zone/{id_zone}:
 *   get:
 *     summary: Récupère les conteneurs d'une zone
 *     tags:
 *       - Recherche et Filtres
 *     parameters:
 *       - in: path
 *         name: id_zone
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la zone
 *     responses:
 *       200:
 *         description: Liste des conteneurs dans la zone
 *       404:
 *         description: Aucun conteneur trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/zone/:id_zone', requirePermission('containers:read'), controller.getByZone);

// GET - Conteneurs avec niveau de remplissage
/**
 * @swagger
 * /containers/fill-levels:
 *   get:
 *     summary: Récupère les conteneurs avec leur niveau de remplissage
 *     description: Joint les tables conteneur, capteur et mesure pour retourner le dernier niveau de remplissage
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: query
 *         name: min_level
 *         schema:
 *           type: number
 *         description: Niveau de remplissage minimum (0-100)
 *       - in: query
 *         name: max_level
 *         schema:
 *           type: number
 *         description: Niveau de remplissage maximum (0-100)
 *       - in: query
 *         name: id_zone
 *         schema:
 *           type: integer
 *         description: Filtrer par zone
 *     responses:
 *       200:
 *         description: Liste des conteneurs avec fill_level
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/fill-levels', requirePermission('containers:read'), controller.getFillLevels);

// Alias de compatibilite (ancien endpoint frontend)
router.get('/containers/with-fill-level', requirePermission('containers:read'), controller.getFillLevels);

// GET - Historique des changements de statut
/**
 * @swagger
 * /containers/{id}/status/history:
 *   get:
 *     summary: Récupère l'historique des changements de statut
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du conteneur
 *     responses:
 *       200:
 *         description: Historique récupéré
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/:id/status/history', requirePermission('containers:read'), controller.getStatusHistory);

// PATCH - Mettre à jour un conteneur
/**
 * @swagger
 * /containers/{id}:
 *   patch:
 *     summary: Met à jour un conteneur existant
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du conteneur à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               capacite_l:
 *                 type: integer
 *               latitude:
 *                 type: number
 *                 format: double
 *               longitude:
 *                 type: number
 *                 format: double
 *               id_zone:
 *                 type: integer
 *               id_type:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Conteneur mis à jour
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/containers/:id', requirePermission('containers:update'), controller.update);

// Alias de compatibilite frontend
router.patch('/containers/id/:id', requirePermission('containers:update'), controller.update);

// PATCH - Mettre à jour le statut d'un conteneur
/**
 * @swagger
 * /containers/{id}/status:
 *   patch:
 *     summary: Met à jour le statut d'un conteneur
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du conteneur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [ACTIF, INACTIF, EN_MAINTENANCE]
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/containers/:id/status', requirePermission('containers:update'), controller.updateStatus);

// DELETE - Supprimer un conteneur
/**
 * @swagger
 * /containers/{id}:
 *   delete:
 *     summary: Supprime un conteneur
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du conteneur à supprimer
 *     responses:
 *       200:
 *         description: Conteneur supprimé
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/containers/:id', requirePermission('containers:delete'), controller.delete);

// Alias de compatibilite frontend
router.delete('/containers/id/:id', requirePermission('containers:delete'), controller.delete);

// DELETE - Supprimer tous les conteneurs
/**
 * @swagger
 * /containers:
 *   delete:
 *     summary: Supprime tous les conteneurs
 *     description: Attention - Cette opération supprimera tous les conteneurs de la base de données
 *     tags:
 *       - Conteneurs
 *     responses:
 *       200:
 *         description: Tous les conteneurs ont été supprimés
 *       500:
 *         description: Erreur serveur
 */
router.delete('/containers', requirePermission('containers:delete'), controller.deleteAll);

// GET - Rechercher les conteneurs dans un rayon
/**
 * @swagger
 * /search/radius:
 *   get:
 *     summary: Recherche les conteneurs dans un rayon
 *     description: Trouve tous les conteneurs à proximité d'une localisation donnée
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
 *         description: Liste des conteneurs trouvés
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get('/search/radius', requirePermission('containers:read'), controller.getInRadius);

// GET - Compter les conteneurs
/**
 * @swagger
 * /stats/count:
 *   get:
 *     summary: Compte le nombre total de conteneurs
 *     tags:
 *       - Statistiques
 *     responses:
 *       200:
 *         description: Nombre de conteneurs
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
router.get('/stats/count', requirePermission('containers:read'), controller.count);

// GET - Vérifier si un conteneur existe par ID
/**
 * @swagger
 * /check/exists/{id}:
 *   get:
 *     summary: Vérifie l'existence d'un conteneur par ID
 *     tags:
 *       - Vérifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du conteneur
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
router.get('/check/exists/:id', requirePermission('containers:read'), controller.exists);

// GET - Vérifier si un UID existe
/**
 * @swagger
 * /check/uid/{uid}:
 *   get:
 *     summary: Vérifie l'existence d'un conteneur par UID
 *     tags:
 *       - Vérifications
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant unique du conteneur
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
router.get('/check/uid/:uid', requirePermission('containers:read'), controller.existsByUid);

// GET - Statistiques globales
/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Récupère les statistiques globales des conteneurs
 *     description: Retourne les statistiques complètes sur les conteneurs
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
 *                 total:
 *                   type: integer
 *                 par_statut:
 *                   type: object
 *                 par_zone:
 *                   type: object
 *                 capacite_totale:
 *                   type: integer
 *       500:
 *         description: Erreur serveur
 */
router.get('/stats', requirePermission('containers:read'), controller.getStatistics);

module.exports = router;
