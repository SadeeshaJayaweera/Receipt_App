const express = require('express');
const Receipt = require('../models/Receipt');
const authMiddleware = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all receipts for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const receipts = await Receipt.find({ userId: req.userId })
      .populate('items.flavourId')
      .sort({ createdAt: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single receipt by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, userId: req.userId })
      .populate('items.flavourId');
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new receipt
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, customerName, notes } = req.body;

    const receipt = new Receipt({
      userId: req.userId,
      items,
      totalAmount,
      paymentMethod,
      customerName,
      notes
    });

    await receipt.save();
    res.status(201).json(receipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a receipt
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, userId: req.userId });
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const { items, totalAmount, paymentMethod, customerName, notes } = req.body;
    receipt.items = items || receipt.items;
    receipt.totalAmount = totalAmount || receipt.totalAmount;
    receipt.paymentMethod = paymentMethod || receipt.paymentMethod;
    receipt.customerName = customerName || receipt.customerName;
    receipt.notes = notes || receipt.notes;

    await receipt.save();
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a receipt
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const receipt = await Receipt.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    res.json({ message: 'Receipt deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export receipt as PDF
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, userId: req.userId })
      .populate('items.flavourId');

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const doc = new PDFDocument();
    const filename = `Receipt-${receipt.receiptNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Receipt', { align: 'center' });
    doc.moveDown();

    // Receipt details
    doc.fontSize(12).font('Helvetica');
    doc.text(`Receipt #: ${receipt.receiptNumber}`);
    doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString()}`);
    doc.text(`Time: ${new Date(receipt.createdAt).toLocaleTimeString()}`);
    doc.moveDown();

    if (receipt.customerName) {
      doc.text(`Customer: ${receipt.customerName}`);
    }

    doc.moveDown();
    doc.text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Items table
    receipt.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.flavourName} x${item.quantity} @ Rs.${item.price} = Rs.${item.subtotal}`);
    });

    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text(`Total: Rs.${receipt.totalAmount.toFixed(2)}`, { align: 'right' });
    doc.fontSize(12).font('Helvetica').text(`Payment Method: ${receipt.paymentMethod}`, { align: 'right' });

    if (receipt.notes) {
      doc.moveDown();
      doc.text(`Notes: ${receipt.notes}`);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
