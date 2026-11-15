const mongoose = require('mongoose');
const receiptService = require('../services/receiptService');
const pdfReceiptService = require('../services/pdfReceiptService');
const User = require('../models/User');

class ReceiptController {
  async getAll(req, res, next) {
    try {
      const receipts = await receiptService.getAll(req.userId, req.query);
      res.json(receipts);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const receipt = await receiptService.getById(req.userId, req.params.id);
      res.json(receipt);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const receipt = await receiptService.create(req.userId, req.body);
      res.status(201).json(receipt);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const receipt = await receiptService.update(req.userId, req.params.id, req.body);
      res.json(receipt);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await receiptService.delete(req.userId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async voidReceipt(req, res, next) {
    try {
      const receipt = await receiptService.voidReceipt(req.userId, req.params.id, req.body.reason);
      res.json(receipt);
    } catch (err) {
      next(err);
    }
  }

  async issueDraft(req, res, next) {
    try {
      const receipt = await receiptService.issueDraft(req.userId, req.params.id);
      res.json(receipt);
    } catch (err) {
      next(err);
    }
  }

  async exportPdf(req, res, next) {
    try {
      const receipt = await receiptService.getById(req.userId, req.params.id);
      
      let userProfile = {};
      if (User && mongoose.connection && mongoose.connection.readyState === 1) {
        userProfile = await User.findById(req.userId).select('businessName phone address email receiptFooter defaultCurrency').lean() || {};
      }

      const filename = `Receipt-${receipt.receiptNumber || receipt._id}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      pdfReceiptService.generateReceiptPdf(receipt, userProfile, res);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReceiptController();
