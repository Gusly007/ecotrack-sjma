const express = require('express');
const router = express.Router();

router.get('/signalements', (req, res, next) => req.controllers.signalement.getAll(req, res, next));
router.get('/signalements/stats', (req, res, next) => req.controllers.signalement.getStats(req, res, next));
router.get('/signalements/types', (req, res, next) => req.controllers.signalement.getTypes(req, res, next));
router.get('/signalements/:id/historique', (req, res, next) => req.controllers.signalement.getHistory(req, res, next));
router.get('/signalements/:id', (req, res, next) => req.controllers.signalement.getById(req, res, next));
router.put('/signalements/:id/status', (req, res, next) => req.controllers.signalement.updateStatus(req, res, next));
router.put('/signalements/:id/traitement', (req, res, next) => req.controllers.signalement.saveTreatment(req, res, next));
router.put('/signalements/:id', (req, res, next) => req.controllers.signalement.update(req, res, next));

module.exports = router;
