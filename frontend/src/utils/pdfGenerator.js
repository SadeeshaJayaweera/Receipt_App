import { jsPDF } from 'jspdf';
import { formatCurrency } from './calcEngine';

export const calculateReceiptHeightMm = (receipt, business = {}) => {
  let height = 55; // base margins & business header
  if (business.address) height += 5;
  if (business.phone) height += 4;
  if (business.email) height += 4;

  height += 20; // receipt #, date, time
  if (receipt.customer?.name || receipt.customerName) height += 5;
  if (receipt.customer?.phone || receipt.customerPhone) height += 5;
  if (receipt.status === 'voided' || receipt.status === 'draft') height += 7;

  height += 10; // items header

  const items = receipt.items || [];
  height += items.length * 5.5;

  height += 20; // subtotal, total
  if ((receipt.pricing?.discount || receipt.discount || 0) > 0) height += 5;
  if ((receipt.pricing?.tax || receipt.tax || 0) > 0) height += 5;

  height += 12; // payment details
  if (receipt.payment?.amountPaid > 0) height += 5;
  if (receipt.payment?.changeGiven !== undefined && receipt.payment?.changeGiven >= 0) height += 5;

  height += 20; // footer note & thank you
  if (receipt.notes) height += 6;

  return Math.max(140, Math.ceil(height));
};

export const generateReceiptPdf = (receipt, business = {}) => {
  const heightMm = calculateReceiptHeightMm(receipt, business);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, heightMm]
  });

  const pageWidth = 80;
  const leftMargin = 5;
  const rightMargin = pageWidth - 5;
  const currency = receipt.currency || business.defaultCurrency || 'LKR';
  let y = 8;

  const centerText = (text, fontSize = 8.5, isBold = false) => {
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    const textWidth = pdf.getTextWidth(text);
    pdf.text(text, (pageWidth - textWidth) / 2, y);
    y += (fontSize * 0.35) + 1.2;
  };

  const leftRightText = (leftText, rightText, fontSize = 7.5, isBold = false) => {
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    pdf.text(leftText, leftMargin, y);
    const rightWidth = pdf.getTextWidth(rightText);
    pdf.text(rightText, rightMargin - rightWidth, y);
    y += (fontSize * 0.35) + 1.2;
  };

  const drawDashedLine = () => {
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(leftMargin, y, rightMargin, y);
    pdf.setLineDashPattern([], 0);
    y += 2.5;
  };

  const drawSolidLine = (lineWidth = 0.2) => {
    pdf.setLineWidth(lineWidth);
    pdf.line(leftMargin, y, rightMargin, y);
    pdf.setLineWidth(0.1);
    y += 2.5;
  };

  // Business Header
  const bName = (business.businessName || 'Juice Receipt App').toUpperCase();
  centerText(bName, 11, true);

  if (business.address) centerText(business.address, 7.5);
  if (business.phone) centerText(`Tel: ${business.phone}`, 7.5);
  if (business.email) centerText(business.email, 7.5);

  if (receipt.status === 'voided') {
    centerText('*** VOIDED RECEIPT ***', 8.5, true);
  } else if (receipt.status === 'draft') {
    centerText('*** DRAFT RECEIPT ***', 8, true);
  }

  drawDashedLine();

  // Receipt meta
  leftRightText('Receipt #:', receipt.receiptNumber || 'DRAFT', 7.5);
  const dateObj = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
  leftRightText('Date:', dateObj.toLocaleDateString(), 7.5);
  leftRightText('Time:', dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 7.5);

  const customerName = receipt.customer?.name || receipt.customerName;
  const customerPhone = receipt.customer?.phone || receipt.customerPhone;
  if (customerName) leftRightText('Customer:', customerName, 7.5);
  if (customerPhone) leftRightText('Contact:', customerPhone, 7.5);

  drawDashedLine();

  // Items Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('ITEM', leftMargin, y);
  pdf.text('QTY', 48, y);
  const amtHeader = 'AMOUNT';
  pdf.text(amtHeader, rightMargin - pdf.getTextWidth(amtHeader), y);
  y += 2;
  drawSolidLine(0.2);

  // Items
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  (receipt.items || []).forEach(item => {
    const name = item.flavourName || 'Item';
    const displayName = name.length > 20 ? name.substring(0, 19) + '…' : name;
    pdf.text(displayName, leftMargin, y);
    pdf.text(String(item.quantity || 1), 50, y);
    const priceText = formatCurrency(item.subtotal || 0, currency);
    pdf.text(priceText, rightMargin - pdf.getTextWidth(priceText), y);
    y += 4;
  });

  drawSolidLine(0.2);

  // Totals
  const subtotalVal = receipt.pricing?.subtotal ?? receipt.subtotal ?? 0;
  const discountVal = receipt.pricing?.discount ?? receipt.discount ?? 0;
  const taxVal = receipt.pricing?.tax ?? receipt.tax ?? 0;
  const totalVal = receipt.pricing?.grandTotal ?? receipt.totalAmount ?? 0;

  leftRightText('Subtotal:', formatCurrency(subtotalVal, currency), 7.5);
  if (discountVal > 0) {
    leftRightText('Discount:', `-${formatCurrency(discountVal, currency)}`, 7.5);
  }
  if (taxVal > 0 || (receipt.pricing && receipt.pricing.tax > 0)) {
    leftRightText('Tax:', formatCurrency(taxVal, currency), 7.5);
  }

  drawSolidLine(0.3);
  leftRightText('TOTAL:', formatCurrency(totalVal, currency), 9.5, true);
  drawSolidLine(0.3);

  // Payment
  const pm = (receipt.payment?.method || receipt.paymentMethod || 'cash').toUpperCase();
  leftRightText('Payment:', pm, 7.5);
  const amountPaid = receipt.payment?.amountPaid;
  const changeGiven = receipt.payment?.changeGiven;
  if (amountPaid !== undefined && amountPaid > 0) {
    leftRightText('Tendered:', formatCurrency(amountPaid, currency), 7.5);
  }
  if (changeGiven !== undefined && changeGiven >= 0 && pm === 'CASH') {
    leftRightText('Change:', formatCurrency(changeGiven, currency), 7.5);
  }

  drawDashedLine();

  // Footer
  const footerMsg = business.receiptFooter || 'Thank you for your business!';
  centerText(`*** ${footerMsg} ***`, 7.5, true);
  if (receipt.notes) {
    centerText(`Note: ${receipt.notes}`, 7);
  }

  return pdf;
};

export const downloadReceiptPdf = (receipt, business = {}, options = {}) => {
  const pdf = generateReceiptPdf(receipt, business);
  const dateStr = (receipt.createdAt ? new Date(receipt.createdAt) : new Date()).toISOString().split('T')[0];
  const fileName = `receipt-${receipt.receiptNumber || 'draft'}-${dateStr}.pdf`;
  if (options.save !== false && typeof pdf.save === 'function') {
    pdf.save(fileName);
  }
  return fileName;
};
