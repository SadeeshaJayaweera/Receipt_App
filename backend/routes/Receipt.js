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

// Export receipt as PDF - Supermarket style
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, userId: req.userId })
      .populate('items.flavourId');

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Create a narrow PDF to match receipt paper (80mm = ~226 points)
    const doc = new PDFDocument({
      size: [226, 600],
      margin: 15
    });
    const filename = `Receipt-${receipt.receiptNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    const width = 226 - 30; // width minus margins
    const centerX = 113;

    // Store Header
    doc.fontSize(16).font('Helvetica-Bold').text('FRESH JUICE', { align: 'center' });
    doc.fontSize(9).font('Helvetica').text('Your Local Juice Shop', { align: 'center' });
    doc.fontSize(8).text('Tel: N/A', { align: 'center' });
    doc.moveDown(0.5);

    // Dashed line
    doc.moveTo(15, doc.y).lineTo(211, doc.y).dash(3, { space: 2 }).stroke();
    doc.moveDown(0.5);

    // Receipt info
    doc.fontSize(8).font('Helvetica');
    doc.text(`Receipt #: ${receipt.receiptNumber}`);
    doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString()}`);
    doc.text(`Time: ${new Date(receipt.createdAt).toLocaleTimeString()}`);
    if (receipt.customerName) {
      doc.text(`Customer: ${receipt.customerName}`);
    }
    doc.moveDown(0.3);

    // Dashed line
    doc.undash();
    doc.moveTo(15, doc.y).lineTo(211, doc.y).dash(3, { space: 2 }).stroke();
    doc.moveDown(0.5);

    // Items header
    doc.font('Helvetica-Bold').fontSize(8);
    const headerY = doc.y;
    doc.text('ITEM', 15, headerY);
    doc.text('QTY', 140, headerY);
    doc.text('AMOUNT', 165, headerY);
    doc.moveDown(0.3);

    // Solid line
    doc.undash();
    doc.moveTo(15, doc.y).lineTo(211, doc.y).stroke();
    doc.moveDown(0.3);

    // Items
    doc.font('Helvetica').fontSize(8);
    receipt.items.forEach((item) => {
      const itemY = doc.y;
      const itemName = item.flavourName.length > 18 ? item.flavourName.substring(0, 18) + '...' : item.flavourName;
      doc.text(itemName, 15, itemY);
      doc.text(item.quantity.toString(), 145, itemY);
      doc.text(`Rs.${item.subtotal.toFixed(2)}`, 165, itemY);
      doc.moveDown(0.5);
    });

    doc.moveDown(0.3);

    // Dashed line
    doc.moveTo(15, doc.y).lineTo(211, doc.y).dash(3, { space: 2 }).stroke();
    doc.moveDown(0.5);

    // Totals
    doc.undash();
    doc.fontSize(8);
    const subtotalY = doc.y;
    doc.text('Subtotal:', 15, subtotalY);
    doc.text(`Rs.${receipt.totalAmount.toFixed(2)}`, 165, subtotalY);
    doc.moveDown(0.3);

    const taxY = doc.y;
    doc.text('Tax (0%):', 15, taxY);
    doc.text('Rs.0.00', 165, taxY);
    doc.moveDown(0.5);

    // Grand total with solid line
    doc.moveTo(15, doc.y).lineTo(211, doc.y).lineWidth(2).stroke();
    doc.moveDown(0.3);

    doc.fontSize(12).font('Helvetica-Bold');
    const totalY = doc.y;
    doc.text('TOTAL:', 15, totalY);
    doc.text(`Rs.${receipt.totalAmount.toFixed(2)}`, 145, totalY);
    doc.moveDown(0.5);

    doc.moveTo(15, doc.y).lineTo(211, doc.y).lineWidth(2).stroke();
    doc.moveDown(0.5);

    // Payment method
    doc.fontSize(8).font('Helvetica');
    const paymentY = doc.y;
    doc.text('Payment:', 15, paymentY);
    doc.text(receipt.paymentMethod.toUpperCase(), 165, paymentY);
    doc.moveDown(0.5);

    // Dashed line
    doc.lineWidth(1);
    doc.moveTo(15, doc.y).lineTo(211, doc.y).dash(3, { space: 2 }).stroke();
    doc.moveDown(0.5);

    // Footer
    doc.undash();
    doc.fontSize(10).font('Helvetica-Bold').text('*** THANK YOU ***', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text('Please come again!', { align: 'center' });

    if (receipt.notes) {
      doc.moveDown(0.5);
      doc.fontSize(7).text(`Note: ${receipt.notes}`, { align: 'center' });
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
