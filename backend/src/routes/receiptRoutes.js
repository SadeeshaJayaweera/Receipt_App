const express = require('express');
const receiptController = require('../controllers/receiptController');
const authMiddleware = require('../../middleware/auth');
const validate = require('../middleware/validate');
const { createReceiptSchema, updateReceiptSchema } = require('../validators/receiptValidators');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => receiptController.getAll(req, res, next));
router.get('/:id', (req, res, next) => receiptController.getById(req, res, next));
router.get('/:id/pdf', (req, res, next) => receiptController.exportPdf(req, res, next));
router.post('/', validate(createReceiptSchema), (req, res, next) => receiptController.create(req, res, next));
router.put('/:id', validate(updateReceiptSchema), (req, res, next) => receiptController.update(req, res, next));
router.delete('/:id', (req, res, next) => receiptController.delete(req, res, next));

module.exports = router;
