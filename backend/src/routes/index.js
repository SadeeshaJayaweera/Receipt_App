const express = require('express');
const authRoutes = require('./authRoutes');
const flavourRoutes = require('./flavourRoutes');
const receiptRoutes = require('./receiptRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/flavours', flavourRoutes);
router.use('/receipts', receiptRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
