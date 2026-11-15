const express = require('express');
const flavourController = require('../controllers/flavourController');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => flavourController.getAll(req, res, next));
router.post('/', (req, res, next) => flavourController.create(req, res, next));
router.put('/:id', (req, res, next) => flavourController.update(req, res, next));
router.delete('/:id', (req, res, next) => flavourController.delete(req, res, next));

module.exports = router;
