const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard', (req, res, next) => analyticsController.getDashboard(req, res, next));

module.exports = router;
