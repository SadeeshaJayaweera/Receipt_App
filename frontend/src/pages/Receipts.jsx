import { useEffect, useState } from 'react';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

export default function Receipts() {
  const { receipts, fetchReceipts, deleteReceipt, isLoading, error } = useReceiptStore();
  const { user } = useAuthStore();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleDelete = async (id) => {
    try {
      await deleteReceipt(id);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete receipt');
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const handlePrint = (receipt) => {
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) {
      alert('Please allow pop-ups to print the receipt');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.receiptNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 80mm auto; margin: 0; }
            @media print { body { width: 80mm; } }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              padding: 10px;
              font-size: 12px;
              width: 80mm;
              max-width: 80mm;
              background: white;
              color: #000;
            }
            .receipt { width: 100%; }
            .text-center { text-align: center; }
            .store-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .store-info { font-size: 11px; margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .divider-thick { border-top: 2px solid #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .items-header { font-weight: bold; font-size: 10px; padding: 4px 0; border-bottom: 1px solid #000; display: flex; }
            .item-row { display: flex; padding: 4px 0; font-size: 11px; border-bottom: 1px dotted #ccc; }
            .col-item { flex: 1; }
            .col-qty { width: 35px; text-align: center; }
            .col-price { width: 70px; text-align: right; }
            .grand-total { font-size: 16px; font-weight: bold; margin: 8px 0; }
            .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; }
            .footer-text { font-size: 12px; font-weight: bold; }
            .footer-sub { font-size: 10px; margin-top: 4px; color: #444; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="text-center">
              <div class="store-name">🧃 FRESH JUICE</div>
              <div class="store-info">${user?.businessName || 'Juice Store'}</div>
              <div class="store-info">Tel: ${user?.phone || 'N/A'}</div>
              ${user?.address ? `<div class="store-info">${user.address}</div>` : ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="row"><span>Receipt #:</span><span><strong>${receipt.receiptNumber}</strong></span></div>
            <div class="row"><span>Date:</span><span>${format(new Date(receipt.createdAt), 'dd/MM/yyyy')}</span></div>
            <div class="row"><span>Time:</span><span>${format(new Date(receipt.createdAt), 'HH:mm:ss')}</span></div>
            ${receipt.customerName ? `<div class="row"><span>Customer:</span><span>${receipt.customerName}</span></div>` : ''}
            
            <div class="divider"></div>
            
            <div class="items-header">
              <span class="col-item">ITEM</span>
              <span class="col-qty">QTY</span>
              <span class="col-price">AMOUNT</span>
            </div>
            
            ${receipt.items.map(item => `
              <div class="item-row">
                <span class="col-item">${item.flavourName}</span>
                <span class="col-qty">${item.quantity}</span>
                <span class="col-price">${formatCurrency(item.subtotal)}</span>
              </div>
            `).join('')}
            
            <div class="divider"></div>
            
            <div class="row"><span>Subtotal:</span><span>${formatCurrency(receipt.totalAmount)}</span></div>
            <div class="row"><span>Tax (0%):</span><span>${formatCurrency(0)}</span></div>
            
            <div class="divider-thick"></div>
            
            <div class="row grand-total"><span>TOTAL:</span><span>${formatCurrency(receipt.totalAmount)}</span></div>
            
            <div class="divider"></div>
            
            <div class="row"><span>Payment:</span><span style="text-transform: uppercase;">${receipt.paymentMethod}</span></div>
            
            <div class="footer">
              <div class="footer-text">*** THANK YOU ***</div>
              <div class="footer-sub">Please come again!</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleDownloadPDF = (receipt) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200]
      });

      const pageWidth = 80;
      let y = 10;
      const leftMargin = 5;
      const rightMargin = pageWidth - 5;

      const centerText = (text, yPos, fontSize = 10) => {
        pdf.setFontSize(fontSize);
        const textWidth = pdf.getTextWidth(text);
        pdf.text(text, (pageWidth - textWidth) / 2, yPos);
      };

      const leftRightText = (leftText, rightText, yPos, fontSize = 9) => {
        pdf.setFontSize(fontSize);
        pdf.text(leftText, leftMargin, yPos);
        const rightWidth = pdf.getTextWidth(rightText);
        pdf.text(rightText, rightMargin - rightWidth, yPos);
      };

      const drawDashedLine = (yPos) => {
        pdf.setLineDashPattern([1, 1], 0);
        pdf.line(leftMargin, yPos, rightMargin, yPos);
        pdf.setLineDashPattern([], 0);
      };

      const drawSolidLine = (yPos, lineWidth = 0.3) => {
        pdf.setLineWidth(lineWidth);
        pdf.line(leftMargin, yPos, rightMargin, yPos);
        pdf.setLineWidth(0.1);
      };

      // Header
      pdf.setFont('helvetica', 'bold');
      centerText('FRESH JUICE', y, 14);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      centerText(user?.businessName || 'Juice Store', y, 10);
      y += 4;
      centerText(`Tel: ${user?.phone || 'N/A'}`, y, 9);
      y += 4;
      if (user?.address) {
        centerText(user.address, y, 8);
        y += 4;
      }

      y += 2;
      drawDashedLine(y);
      y += 5;

      // Receipt Info
      leftRightText('Receipt #:', receipt.receiptNumber, y);
      y += 4;
      leftRightText('Date:', format(new Date(receipt.createdAt), 'dd/MM/yyyy'), y);
      y += 4;
      leftRightText('Time:', format(new Date(receipt.createdAt), 'HH:mm:ss'), y);
      y += 4;
      if (receipt.customerName) {
        leftRightText('Customer:', receipt.customerName, y);
        y += 4;
      }

      drawDashedLine(y);
      y += 4;

      // Items Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('ITEM', leftMargin, y);
      pdf.text('QTY', 50, y);
      pdf.text('AMOUNT', rightMargin - pdf.getTextWidth('AMOUNT'), y);
      y += 2;
      drawSolidLine(y);
      y += 4;

      // Items
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      receipt.items.forEach(item => {
        const itemName = item.flavourName.length > 20 ? item.flavourName.substring(0, 20) + '...' : item.flavourName;
        pdf.text(itemName, leftMargin, y);
        pdf.text(item.quantity.toString(), 52, y);
        const priceText = formatCurrency(item.subtotal);
        pdf.text(priceText, rightMargin - pdf.getTextWidth(priceText), y);
        y += 5;
      });

      drawDashedLine(y);
      y += 5;

      // Totals
      leftRightText('Subtotal:', formatCurrency(receipt.totalAmount), y);
      y += 4;
      leftRightText('Tax (0%):', formatCurrency(0), y);
      y += 3;
      drawSolidLine(y, 0.5);
      y += 5;

      // Grand Total
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      leftRightText('TOTAL:', formatCurrency(receipt.totalAmount), y, 12);
      y += 4;
      drawSolidLine(y, 0.5);
      y += 5;

      // Payment
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      leftRightText('Payment:', receipt.paymentMethod.toUpperCase(), y);
      y += 3;
      drawDashedLine(y);
      y += 6;

      // Footer
      pdf.setFont('helvetica', 'bold');
      centerText('*** THANK YOU ***', y, 11);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      centerText('Please come again!', y, 9);

      const fileName = `receipt-${receipt.receiptNumber}-${format(new Date(receipt.createdAt), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  // Modal Component
  const ReceiptModal = ({ receipt, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Receipt Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <div className="p-4 font-mono text-sm bg-white" style={{ maxWidth: '300px', margin: '0 auto' }}>
          <div className="text-center border-b-2 border-dashed pb-3 mb-3">
            <div className="text-xl font-bold">🧃 FRESH JUICE</div>
            <div className="text-gray-700">{user?.businessName || 'Juice Store'}</div>
            <div className="text-gray-500 text-xs">Tel: {user?.phone || 'N/A'}</div>
            <div className="text-gray-600 mt-1">#{receipt.receiptNumber}</div>
          </div>
          <div className="mb-3 text-xs">
            <div className="flex justify-between"><span>Date:</span><span>{format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm')}</span></div>
            {receipt.customerName && <div className="flex justify-between"><span>Customer:</span><span>{receipt.customerName}</span></div>}
          </div>
          <div className="border-t border-dashed my-2"></div>
          <div className="mb-3">
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between py-1 text-xs">
                <span className="flex-1">{item.flavourName}</span>
                <span className="w-10 text-center">x{item.quantity}</span>
                <span className="w-20 text-right">Rs. {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-black pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>Rs. {receipt.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-dashed my-2"></div>
          <div className="flex justify-between text-xs"><span>Payment:</span><span className="capitalize font-semibold">{receipt.paymentMethod}</span></div>
          <div className="text-center mt-4 pt-3 border-t border-dashed">
            <div className="text-xs font-bold">*** THANK YOU ***</div>
            <div className="text-xs text-gray-500 mt-1">Please come again!</div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
          <button onClick={() => handlePrint(receipt)} className="btn-primary flex-1 py-2">🖨️ Print</button>
          <button onClick={() => handleDownloadPDF(receipt)} className="btn-secondary flex-1 py-2">📄 PDF</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">📋 Receipt History</h1>
          <span className="text-sm text-gray-600">{receipts.length} receipt(s)</span>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p className="text-gray-600">Loading receipts...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-12 card">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Receipts Yet</h2>
            <p className="text-gray-500 mb-4">Start creating receipts to see them here</p>
            <a href="/create-receipt" className="btn-primary inline-block">Create Your First Receipt</a>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-3 text-left rounded-tl-lg">Receipt #</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-center">Items</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Payment</th>
                    <th className="p-3 text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt, i) => (
                    <tr key={receipt._id} className={`border-b hover:bg-gray-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} onClick={() => setSelectedReceipt(receipt)}>
                      <td className="p-3 font-mono font-semibold text-primary">{receipt.receiptNumber}</td>
                      <td className="p-3">
                        <div>{format(new Date(receipt.createdAt), 'dd MMM yyyy')}</div>
                        <div className="text-xs text-gray-500">{format(new Date(receipt.createdAt), 'hh:mm a')}</div>
                      </td>
                      <td className="p-3">{receipt.customerName || <span className="text-gray-400">Walk-in</span>}</td>
                      <td className="p-3 text-center"><span className="bg-gray-100 px-2 py-1 rounded-full text-sm">{receipt.items.length}</span></td>
                      <td className="p-3 text-right font-bold text-lg">Rs. {receipt.totalAmount.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${receipt.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : receipt.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {receipt.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setSelectedReceipt(receipt)} className="p-2 hover:bg-gray-200 rounded" title="View">👁️</button>
                          <button onClick={() => handlePrint(receipt)} className="p-2 hover:bg-gray-200 rounded" title="Print">🖨️</button>
                          <button onClick={() => handleDownloadPDF(receipt)} className="p-2 hover:bg-gray-200 rounded" title="PDF">📄</button>
                          <button onClick={() => setDeleteConfirm(receipt._id)} className="p-2 hover:bg-red-100 rounded text-red-500" title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {receipts.map(receipt => (
                <div key={receipt._id} className="card cursor-pointer" onClick={() => setSelectedReceipt(receipt)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-mono font-bold text-primary">{receipt.receiptNumber}</div>
                      <div className="text-xs text-gray-500">{format(new Date(receipt.createdAt), 'dd MMM yyyy, hh:mm a')}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${receipt.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : receipt.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {receipt.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-gray-600">{receipt.customerName || 'Walk-in'}</div>
                    <div className="text-sm text-gray-500">{receipt.items.length} item(s)</div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-2xl font-bold text-primary">Rs. {receipt.totalAmount.toFixed(2)}</div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handlePrint(receipt)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded">🖨️</button>
                      <button onClick={() => handleDownloadPDF(receipt)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded">📄</button>
                      <button onClick={() => setDeleteConfirm(receipt._id)} className="p-2 bg-red-50 hover:bg-red-100 rounded text-red-500">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-bold">Delete Receipt?</h3>
                <p className="text-gray-600 text-sm">This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {selectedReceipt && <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
      </div>
    </div>
  );
}