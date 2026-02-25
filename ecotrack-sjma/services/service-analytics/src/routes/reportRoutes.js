const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/reports/generate', authMiddleware, ReportController.generateReport);
router.get('/reports/download/:filename', authMiddleware, ReportController.downloadReport);

module.exports = router;