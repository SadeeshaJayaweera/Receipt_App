const express = require('express');
const flavourController = require('../controllers/flavourController');
const authMiddleware = require('../../middleware/auth');
const validate = require('../middleware/validate');
const { createFlavourSchema, updateFlavourSchema } = require('../validators/flavourValidators');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => flavourController.getAll(req, res, next));
router.post('/', validate(createFlavourSchema), (req, res, next) => flavourController.create(req, res, next));
router.put('/:id', validate(updateFlavourSchema), (req, res, next) => flavourController.update(req, res, next));
router.delete('/:id', (req, res, next) => flavourController.delete(req, res, next));

module.exports = router;
