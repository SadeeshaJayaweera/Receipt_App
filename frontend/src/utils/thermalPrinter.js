import { formatCurrency } from './calcEngine';

export const generateThermalReceiptHtml = (receipt, business = {}) => {
  const currency = receipt.currency || business.defaultCurrency || 'LKR';
  const subtotalVal = receipt.pricing?.subtotal ?? receipt.subtotal ?? 0;
  const discountVal = receipt.pricing?.discount ?? receipt.discount ?? 0;
  const taxVal = receipt.pricing?.tax ?? receipt.tax ?? 0;
  const totalVal = receipt.pricing?.grandTotal ?? receipt.totalAmount ?? 0;

  const dateObj = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
  const dateFormatted = dateObj.toLocaleDateString();
  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const bName = (business.businessName || 'Juice Receipt App').toUpperCase();
  const bAddress = business.address || '';
  const bPhone = business.phone ? `Tel: ${business.phone}` : '';
  const bEmail = business.email || '';
  const footerMsg = business.receiptFooter || 'Thank you for your business!';

  const customerName = receipt.customer?.name || receipt.customerName || '';
  const customerPhone = receipt.customer?.phone || receipt.customerPhone || '';
  const paymentMethod = (receipt.payment?.method || receipt.paymentMethod || 'cash').toUpperCase();
  const amountPaid = receipt.payment?.amountPaid;
  const changeGiven = receipt.payment?.changeGiven;

  const items = receipt.items || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${receipt.receiptNumber || 'Thermal Print'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 4mm 4mm;
      font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .receipt-container {
      width: 100%;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .store-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
    .store-meta { font-size: 10px; margin: 1px 0; }
    .status-banner {
      font-size: 11px;
      font-weight: bold;
      margin: 4px 0;
      padding: 2px 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .divider-solid {
      border-top: 1px solid #000;
      margin: 4px 0;
    }
    .divider-double {
      border-top: 2px solid #000;
      margin: 5px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 10.5px;
    }
    .items-header {
      display: flex;
      font-weight: bold;
      font-size: 10px;
      padding: 3px 0;
      border-bottom: 1px solid #000;
    }
    .item-row {
      display: flex;
      padding: 3px 0;
      font-size: 10.5px;
      border-bottom: 1px dotted #ccc;
    }
    .col-item {
      flex: 1;
      padding-right: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .col-qty {
      width: 28px;
      text-align: center;
    }
    .col-amt {
      width: 65px;
      text-align: right;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: bold;
      margin: 4px 0;
    }
    .footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #000;
    }
    .footer-note {
      font-size: 9.5px;
      margin-top: 3px;
      font-style: italic;
    }
    @media print {
      body { width: 80mm; padding: 2mm 3mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="text-center">
      <div class="store-name">${bName}</div>
      ${bAddress ? `<div class="store-meta">${bAddress}</div>` : ''}
      ${bPhone ? `<div class="store-meta">${bPhone}</div>` : ''}
      ${bEmail ? `<div class="store-meta">${bEmail}</div>` : ''}
    </div>

    ${receipt.status === 'voided' ? '<div class="text-center status-banner">*** VOIDED RECEIPT ***</div>' : ''}
    ${receipt.status === 'draft' ? '<div class="text-center status-banner">*** DRAFT RECEIPT ***</div>' : ''}

    <div class="divider"></div>

    <div class="row"><span>Receipt #:</span><span class="font-bold">${receipt.receiptNumber || 'DRAFT'}</span></div>
    <div class="row"><span>Date:</span><span>${dateFormatted}</span></div>
    <div class="row"><span>Time:</span><span>${timeFormatted}</span></div>
    ${customerName ? `<div class="row"><span>Customer:</span><span>${customerName}</span></div>` : ''}
    ${customerPhone ? `<div class="row"><span>Contact:</span><span>${customerPhone}</span></div>` : ''}

    <div class="divider"></div>

    <div class="items-header">
      <span class="col-item">ITEM</span>
      <span class="col-qty">QTY</span>
      <span class="col-amt">AMOUNT</span>
    </div>

    ${items.map(item => `
      <div class="item-row">
        <span class="col-item">${item.flavourName || 'Item'}</span>
        <span class="col-qty">${item.quantity || 1}</span>
        <span class="col-amt">${formatCurrency(item.subtotal || 0, currency)}</span>
      </div>
    `).join('')}

    <div class="divider-solid"></div>

    <div class="row"><span>Subtotal:</span><span>${formatCurrency(subtotalVal, currency)}</span></div>
    ${discountVal > 0 ? `<div class="row"><span>Discount:</span><span>-${formatCurrency(discountVal, currency)}</span></div>` : ''}
    ${taxVal > 0 || receipt.pricing?.tax > 0 ? `<div class="row"><span>Tax:</span><span>${formatCurrency(taxVal, currency)}</span></div>` : ''}

    <div class="divider-double"></div>

    <div class="total-row"><span>TOTAL:</span><span>${formatCurrency(totalVal, currency)}</span></div>

    <div class="divider-solid"></div>

    <div class="row"><span>Payment:</span><span class="font-bold">${paymentMethod}</span></div>
    ${amountPaid !== undefined && amountPaid > 0 ? `<div class="row"><span>Tendered:</span><span>${formatCurrency(amountPaid, currency)}</span></div>` : ''}
    ${changeGiven !== undefined && changeGiven >= 0 && paymentMethod === 'CASH' ? `<div class="row"><span>Change:</span><span>${formatCurrency(changeGiven, currency)}</span></div>` : ''}

    <div class="footer">
      <div class="font-bold">*** ${footerMsg} ***</div>
      ${receipt.notes ? `<div class="footer-note">Note: ${receipt.notes}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
};

export const printThermalReceipt = (receipt, business = {}) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const html = generateThermalReceiptHtml(receipt, business);

  try {
    let iframe = document.getElementById('thermal-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'thermal-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '100%';
      iframe.style.bottom = '100%';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe printing failed, falling back to popup window', err);
        fallbackPrintWindow(html);
      }
    }, 250);

    return true;
  } catch (err) {
    console.warn('Thermal iframe print error, using popup fallback', err);
    return fallbackPrintWindow(html);
  }
};

const fallbackPrintWindow = (html) => {
  try {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      alert('Please allow pop-ups to print thermal receipts.');
      return false;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
    return true;
  } catch (err) {
    console.error('Failed to open thermal print window:', err);
    return false;
  }
};
