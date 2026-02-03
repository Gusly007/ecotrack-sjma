const router = require('express').Router();
const controller = require('../container-di.js');
const socketMiddleware = require('../middleware/socket-middleware');

// Appliquer le middleware pour injecter Socket.IO à chaque requête
router.use(socketMiddleware);

// ========== CRUD de base ==========

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
 *                 enum: [ACTIF, INACTIF, EN_MAINTENANCE, HORS_SERVICE]
 *                 description: Statut du conteneur (ACTIF, INACTIF, EN_MAINTENANCE ou HORS_SERVICE)
 *                 example: ACTIF
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitude de la position du conteneur (entre -90 et 90)
 *                 example: 48.8566
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitude de la position du conteneur (entre -180 et 180)
 *                 example: 2.3522
 *               id_zone:
 *                 type: integer
 *                 description: Identifiant de la zone associée au conteneur
 *                 example: 1
 *               id_type:
 *                 type: integer
 *                 description: Identifiant du type de conteneur
 *                 example: 1
 *     responses:
 *       201:
 *         description: Conteneur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_conteneur:
 *                   type: integer
 *                 uid:
 *                   type: string
 *                 capacite_l:
 *                   type: integer
 *                 statut:
 *                   type: string
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 date_installation:
 *                   type: string
 *                   format: date-time
 *                 id_zone:
 *                   type: integer
 *                 id_type:
 *                   type: integer
 *       400:
 *         description: Requête invalide - champs requis manquants ou coordonnées GPS invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/containers', controller.create);

// GET - Récupérer tous les conteneurs avec pagination et filtres
/**
 * @swagger
 * /containers:
 *   get:
 *     summary: Récupère tous les conteneurs
 *     description: Récupère la liste de tous les conteneurs avec support de la pagination et des filtres
 *     tags:
 *       - Conteneurs
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de la page (par défaut 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre de résultats par page (par défaut 10)
 *     responses:
 *       200:
 *         description: Liste des conteneurs récupérée avec succès
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers', controller.getAll);

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
 *         description: Conteneur récupéré avec succès
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/id/:id', controller.getById);

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
 *         description: Conteneur récupéré avec succès
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/uid/:uid', controller.getByUid);

// PATCH - Mettre à jour un conteneur
/**
 * @swagger
 * /containers/{id}:
 *   patch:
 *     summary: Met à jour un conteneur existant
 *     description: Met à jour les informations d'un conteneur. Seuls les champs fournis seront modifiés.
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
 *                 description: Capacité du conteneur en litres
 *               statut:
 *                 type: string
 *                 enum: [ACTIF, INACTIF, EN_MAINTENANCE, HORS_SERVICE]
 *                 description: Statut du conteneur
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitude de la position du conteneur
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitude de la position du conteneur
 *               id_zone:
 *                 type: integer
 *                 description: Identifiant de la zone
 *               id_type:
 *                 type: integer
 *                 description: Identifiant du type de conteneur
 *     responses:
 *       200:
 *         description: Conteneur mis à jour avec succès
 *       400:
 *         description: Requête invalide ou aucun champ à mettre à jour
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/containers/:id', controller.update);

// PATCH - Mettre à jour le statut d'un conteneur
/**
 * @swagger
 * /containers/{id}/status:
 *   patch:
 *     summary: Met à jour le statut d'un conteneur
 *     description: Change le statut d'un conteneur. Les valeurs acceptées sont ACTIF, INACTIF, EN_MAINTENANCE ou HORS_SERVICE.
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
 *                 enum: [ACTIF, INACTIF, EN_MAINTENANCE, HORS_SERVICE]
 *                 description: Nouveau statut du conteneur
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/containers/:id/status', (req, res) => req.containerController.updateStatus(req, res));

// GET - Récupérer l'historique des changements de statut d'un conteneur
/**
 * @swagger
 * /containers/{id}/status/history:
 *   get:
 *     summary: Récupère l'historique des changements de statut d'un conteneur
 *     description: Retourne tous les changements de statut d'un conteneur spécifique, triés du plus récent au plus ancien
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
 *         description: Historique récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_historique:
 *                     type: integer
 *                   ancien_statut:
 *                     type: string
 *                     nullable: true
 *                   nouveau_statut:
 *                     type: string
 *                   date_changement:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: ID manquant
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/:id/status/history', controller.getStatusHistory);

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
 *         description: Conteneur supprimé avec succès
 *       404:
 *         description: Conteneur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/containers/:id', controller.delete);

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
router.delete('/containers', controller.deleteAll);

// ========== Recherche et filtres ==========

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
 *           enum: [ACTIF, INACTIF, EN_MAINTENANCE, HORS_SERVICE]
 *         description: Statut à rechercher
 *     responses:
 *       200:
 *         description: Liste des conteneurs par statut
 *       404:
 *         description: Aucun conteneur trouvé avec ce statut
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/status/:statut', controller.getByStatus);

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
 *         description: Aucun conteneur trouvé dans cette zone
 *       500:
 *         description: Erreur serveur
 */
router.get('/containers/zone/:id_zone', controller.getByZone);

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
 *         description: Liste des conteneurs trouvés dans le rayon
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get('/search/radius', controller.getInRadius);

// ========== Statistiques et vérifications ==========

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
router.get('/stats/count', controller.count);

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
router.get('/check/exists/:id', controller.exists);

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
router.get('/check/uid/:uid', controller.existsByUid);

// GET - Récupérer les statistiques globales
/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Récupère les statistiques globales des conteneurs
 *     description: Retourne les statistiques complètes sur les conteneurs (total, par statut, par zone, etc.)
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
router.get('/stats', controller.getStatistics);

module.exports = router;
