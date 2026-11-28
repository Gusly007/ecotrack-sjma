const express = require('express');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Réservé à GESTIONNAIRE et ADMIN (SCRUM-7) : 401 sans rôle, 403 pour CITOYEN et AGENT.
const canUpdateSignalement = requirePermission('signalement:update');

router.post('/signalements', (req, res, next) => req.controllers.signalement.create(req, res, next));
router.get('/signalements', (req, res, next) => req.controllers.signalement.getAll(req, res, next));
router.get('/signalements/stats', (req, res, next) => req.controllers.signalement.getStats(req, res, next));
router.get('/signalements/types', (req, res, next) => req.controllers.signalement.getTypes(req, res, next));
router.get('/signalements/:id/historique', (req, res, next) => req.controllers.signalement.getHistory(req, res, next));
router.get('/signalements/:id', (req, res, next) => req.controllers.signalement.getById(req, res, next));
router.put('/signalements/:id/status', canUpdateSignalement, (req, res, next) => req.controllers.signalement.updateStatus(req, res, next));
router.put('/signalements/:id/traitement', canUpdateSignalement, (req, res, next) => req.controllers.signalement.saveTreatment(req, res, next));
router.put('/signalements/:id', canUpdateSignalement, (req, res, next) => req.controllers.signalement.update(req, res, next));

module.exports = router;
