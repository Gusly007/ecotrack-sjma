const router = require('express').Router();
const controller = require('../src/container.di.js');

// ========== CRUD de base ==========

// POST - Créer un nouveau conteneur
router.post('/containers', controller.create);

// GET - Récupérer tous les conteneurs avec pagination et filtres
router.get('/containers', controller.getAll);

// GET - Récupérer un conteneur par ID
router.get('/containers/id/:id', controller.getById);

// GET - Récupérer un conteneur par UID
router.get('/containers/uid/:uid', controller.getByUid);

// PATCH - Mettre à jour un conteneur
router.patch('/containers/:id', controller.update);

// PATCH - Mettre à jour le statut d'un conteneur
router.patch('/containers/:id/status', controller.updateStatus);

// DELETE - Supprimer un conteneur
router.delete('/containers/:id', controller.delete);

// DELETE - Supprimer tous les conteneurs
router.delete('/containers', controller.deleteAll);

// ========== Recherche et filtres ==========

// GET - Récupérer les conteneurs par statut
router.get('/containers/status/:statut', controller.getByStatus);

// GET - Récupérer les conteneurs par zone
router.get('/containers/zone/:id_zone', controller.getByZone);

// GET - Rechercher les conteneurs dans un rayon
router.get('/search/radius', controller.getInRadius);

// ========== Statistiques et vérifications ==========

// GET - Compter les conteneurs
router.get('/stats/count', controller.count);

// GET - Vérifier si un conteneur existe par ID
router.get('/check/exists/:id', controller.exists);

// GET - Vérifier si un UID existe
router.get('/check/uid/:uid', controller.existsByUid);

// GET - Récupérer les statistiques globales
router.get('/stats', controller.getStatistics);

module.exports = router;
