const PDFDocument = require('pdfkit');
const { formatCurrency } = require('../utils/calcEngine');

class PdfReceiptService {
  calculateReceiptHeight(receipt, businessProfile = {}) {
    let height = 150; // base margins and business header
    if (businessProfile.tagline) height += 12;
    if (businessProfile.phone) height += 12;
    if (businessProfile.address) height += 14;
    if (businessProfile.email) height += 12;
    if (businessProfile.website) height += 12;

    height += 55; // receipt number, date, time
    if (receipt.customer?.name || receipt.customerName) height += 12;
    if (receipt.customer?.phone || receipt.customerPhone) height += 12;
    if (receipt.status === 'voided' || receipt.status === 'draft') height += 18;

    height += 25; // table header

    const items = receipt.items || [];
    height += items.length * 18;

    height += 65; // subtotal, discount, tax, total
    if (receipt.pricing?.discount > 0 || receipt.discount > 0) height += 14;
    if (receipt.pricing?.tax > 0 || receipt.tax > 0) height += 14;

    height += 25; // payment method
    if (receipt.payment?.amountPaid > 0) height += 12;
    if (receipt.payment?.changeGiven !== undefined && receipt.payment?.changeGiven >= 0) height += 12;

    height += 45; // thank you, footer, notes
    if (receipt.notes) height += 18;

    return Math.max(380, Math.ceil(height));
  }

  generateReceiptPdf(receipt, businessProfile = {}, outputStream = null) {
    const height = this.calculateReceiptHeight(receipt, businessProfile);
    const doc = new PDFDocument({
      size: [226.77, height],
      margins: { top: 12, bottom: 12, left: 12, right: 12 }
    });

    if (outputStream) {
      doc.pipe(outputStream);
    }

    const pageWidth = 226.77;
    const left = 12;
    const right = pageWidth - 12;
    const contentWidth = right - left;
    const currency = receipt.currency || businessProfile.defaultCurrency || 'LKR';

    const drawDottedLine = () => {
      doc.moveDown(0.2);
      doc.moveTo(left, doc.y).lineTo(right, doc.y).dash(2, { space: 2 }).stroke();
      doc.undash();
      doc.moveDown(0.3);
    };

    const drawSolidLine = () => {
      doc.moveDown(0.2);
      doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
      doc.moveDown(0.3);
    };

    // Business Header
    const bName = (businessProfile.businessName || 'Juice Receipt App').toUpperCase();
    doc.font('Helvetica-Bold').fontSize(11).text(bName, left, doc.y, { align: 'center', width: contentWidth });
    
    doc.font('Helvetica').fontSize(7.5);
    if (businessProfile.tagline) {
      doc.text(businessProfile.tagline, left, doc.y, { align: 'center', width: contentWidth });
    }
    if (businessProfile.address) {
      doc.text(businessProfile.address, left, doc.y, { align: 'center', width: contentWidth });
    }
    if (businessProfile.phone) {
      doc.text(`Tel: ${businessProfile.phone}`, left, doc.y, { align: 'center', width: contentWidth });
    }
    if (businessProfile.email) {
      doc.text(businessProfile.email, left, doc.y, { align: 'center', width: contentWidth });
    }
    if (businessProfile.website) {
      doc.text(businessProfile.website, left, doc.y, { align: 'center', width: contentWidth });
    }

    // Status Banner if voided or draft
    if (receipt.status === 'voided') {
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(9).text('*** VOIDED RECEIPT ***', left, doc.y, { align: 'center', width: contentWidth });
    } else if (receipt.status === 'draft') {
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(8.5).text('*** DRAFT RECEIPT ***', left, doc.y, { align: 'center', width: contentWidth });
    }

    drawDottedLine();

    // Receipt Meta Details
    doc.font('Helvetica').fontSize(7.5);
    const dateObj = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
    doc.text(`Receipt #: ${receipt.receiptNumber || 'DRAFT'}`, left, doc.y);
    doc.text(`Date: ${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, left, doc.y);

    const custName = receipt.customer?.name || receipt.customerName;
    const custPhone = receipt.customer?.phone || receipt.customerPhone;
    if (custName) {
      doc.text(`Customer: ${custName}`, left, doc.y);
    }
    if (custPhone) {
      doc.text(`Contact: ${custPhone}`, left, doc.y);
    }

    drawDottedLine();

    // Table Header
    doc.font('Helvetica-Bold').fontSize(7.5);
    const headerY = doc.y;
    doc.text('ITEM', left, headerY);
    doc.text('QTY', left + 115, headerY, { width: 25, align: 'center' });
    doc.text('AMOUNT', right - 55, headerY, { width: 55, align: 'right' });
    doc.y = headerY + 10;
    drawSolidLine();

    // Line items
    doc.font('Helvetica').fontSize(7.5);
    (receipt.items || []).forEach(item => {
      const itemY = doc.y;
      const name = item.flavourName || 'Item';
      const qty = String(item.quantity || 1);
      const subtotalFormatted = formatCurrency(item.subtotal || 0, currency);

      const displayName = name.length > 20 ? name.substring(0, 19) + '…' : name;
      doc.text(displayName, left, itemY, { width: 110, lineBreak: false });
      doc.text(qty, left + 115, itemY, { width: 25, align: 'center' });
      doc.text(subtotalFormatted, right - 55, itemY, { width: 55, align: 'right' });
      doc.y = itemY + 11;
    });

    drawSolidLine();

    // Financial Summaries
    const subtotalVal = receipt.pricing?.subtotal ?? receipt.subtotal ?? 0;
    const discountVal = receipt.pricing?.discount ?? receipt.discount ?? 0;
    const taxVal = receipt.pricing?.tax ?? receipt.tax ?? 0;
    const totalVal = receipt.pricing?.grandTotal ?? receipt.totalAmount ?? 0;

    const printRow = (label, valueStr, isBold = false, size = 7.5) => {
      if (isBold) {
        doc.font('Helvetica-Bold').fontSize(size);
      } else {
        doc.font('Helvetica').fontSize(size);
      }
      const y = doc.y;
      doc.text(label, left, y);
      doc.text(valueStr, right - 70, y, { width: 70, align: 'right' });
      doc.y = y + (size + 3.5);
    };

    printRow('Subtotal:', formatCurrency(subtotalVal, currency));

    if (discountVal > 0) {
      printRow('Discount:', `-${formatCurrency(discountVal, currency)}`);
    }

    if (taxVal > 0 || (receipt.pricing && receipt.pricing.tax > 0)) {
      printRow('Tax:', formatCurrency(taxVal, currency));
    }

    drawSolidLine();
    printRow('TOTAL:', formatCurrency(totalVal, currency), true, 10);
    drawSolidLine();

    // Payment details
    const pm = (receipt.payment?.method || receipt.paymentMethod || 'cash').toUpperCase();
    printRow('Payment Method:', pm);

    const amountPaid = receipt.payment?.amountPaid;
    const changeGiven = receipt.payment?.changeGiven;
    if (amountPaid !== undefined && amountPaid > 0) {
      printRow('Tendered:', formatCurrency(amountPaid, currency));
    }
    if (changeGiven !== undefined && changeGiven >= 0 && pm === 'CASH') {
      printRow('Change:', formatCurrency(changeGiven, currency));
    }

    drawDottedLine();

    // Footer
    const footerMsg = businessProfile.receiptFooter || 'Thank you for your purchase!';
    doc.font('Helvetica-Bold').fontSize(7.5).text(`*** ${footerMsg} ***`, left, doc.y, { align: 'center', width: contentWidth });

    if (receipt.notes) {
      doc.moveDown(0.2);
      doc.font('Helvetica-Oblique').fontSize(7).text(`Note: ${receipt.notes}`, left, doc.y, { align: 'center', width: contentWidth });
    }

    doc.end();
    return doc;
  }

  generateReceiptPdfBuffer(receipt, businessProfile = {}) {
    return new Promise((resolve, reject) => {
      const buffers = [];
      const doc = this.generateReceiptPdf(receipt, businessProfile);
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));
    });
  }
}

module.exports = new PdfReceiptService();
