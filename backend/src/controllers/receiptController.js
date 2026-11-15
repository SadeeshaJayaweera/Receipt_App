const receiptService = require('../services/receiptService');
const PDFDocument = require('pdfkit');

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

      const doc = new PDFDocument({
        size: [226, 600],
        margin: 15
      });
      const filename = `Receipt-${receipt.receiptNumber}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      doc.fontSize(16).font('Helvetica-Bold').text('FRESH JUICE', { align: 'center' });
      doc.fontSize(9).font('Helvetica').text('Your Local Juice Shop', { align: 'center' });
      doc.moveDown(0.5);

      doc.moveTo(15, doc.y).lineTo(211, doc.y).dash(3, { space: 2 }).stroke();
      doc.moveDown(0.5);

      doc.fontSize(8).font('Helvetica');
      doc.text(`Receipt #: ${receipt.receiptNumber}`);
      doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString()}`);
      doc.text(`Time: ${new Date(receipt.createdAt).toLocaleTimeString()}`);
      if (receipt.customerName) {
        doc.text(`Customer: ${receipt.customerName}`);
      }
      doc.moveDown(0.3);

      doc.undash();
      doc.moveTo(15, doc.y).lineTo(211, doc.y).dash(3, { space: 2 }).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').fontSize(8);
      const headerY = doc.y;
      doc.text('ITEM', 15, headerY);
      doc.text('QTY', 140, headerY);
      doc.text('AMOUNT', 165, headerY);
      doc.moveDown(0.3);

      doc.undash();
      doc.moveTo(15, doc.y).lineTo(211, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(8);
      receipt.items.forEach((item) => {
        const itemY = doc.y;
        const itemName = item.flavourName && item.flavourName.length > 18
          ? item.flavourName.substring(0, 18) + '...'
          : (item.flavourName || 'Item');
        doc.text(itemName, 15, itemY);
        doc.text(String(item.quantity || 1), 145, itemY);
        doc.text(`Rs.${(item.subtotal || 0).toFixed(2)}`, 165, itemY);
        doc.moveDown(0.5);
      });

      doc.moveDown(0.3);
      doc.moveTo(15, doc.y).lineTo(211, doc.y).dash(3, { space: 2 }).stroke();
      doc.moveDown(0.5);

      doc.undash();
      doc.fontSize(12).font('Helvetica-Bold');
      const totalY = doc.y;
      doc.text('TOTAL:', 15, totalY);
      doc.text(`Rs.${(receipt.totalAmount || 0).toFixed(2)}`, 145, totalY);
      doc.moveDown(0.5);

      doc.fontSize(8).font('Helvetica');
      doc.text(`Payment: ${(receipt.paymentMethod || 'cash').toUpperCase()}`);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').text('*** THANK YOU ***', { align: 'center' });
      if (receipt.notes) {
        doc.fontSize(7).text(`Note: ${receipt.notes}`, { align: 'center' });
      }

      doc.end();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReceiptController();
