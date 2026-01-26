import { useEffect, useState } from 'react';
import useReceiptStore from '../store/receiptStore';
import Navbar from '../components/Navbar';
import { format } from 'date-fns';

export default function Receipts() {
  const { receipts, fetchReceipts, downloadPDF, deleteReceipt, isLoading, error } = useReceiptStore();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleView = (receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteReceipt(id);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete receipt');
    }
  };

  const handlePrint = (receipt) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receipt.receiptNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .store-name { font-size: 18px; font-weight: bold; }
            .info { margin: 5px 0; }
            .items { border-bottom: 1px dashed #000; padding: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .totals { padding: 10px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="store-name">🧃 FRESH JUICE</div>
              <div>Your Local Juice Shop</div>
            </div>
            <div class="info">
              <div>Receipt #: ${receipt.receiptNumber}</div>
              <div>Date: ${format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm')}</div>
              ${receipt.customerName ? `<div>Customer: ${receipt.customerName}</div>` : ''}
            </div>
            <div class="items">
              ${receipt.items.map(item => `
                <div class="item">
                  <span>${item.flavourName} x${item.quantity}</span>
                  <span>Rs. ${item.subtotal.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="totals">
              <div class="total-row grand-total">
                <span>TOTAL:</span>
                <span>Rs. ${receipt.totalAmount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Payment:</span>
                <span>${receipt.paymentMethod}</span>
              </div>
            </div>
            <div class="footer">
              <div>*** THANK YOU ***</div>
              <div>Please come again!</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Receipt Detail Modal
  const ReceiptModal = ({ receipt, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Receipt Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {/* Receipt Content */}
        <div className="p-4 font-mono text-sm">
          <div className="text-center border-b-2 border-dashed pb-3 mb-3">
            <div className="text-xl font-bold">🧃 FRESH JUICE</div>
            <div className="text-gray-600">Receipt #{receipt.receiptNumber}</div>
          </div>

          <div className="mb-3 text-xs">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(receipt.createdAt), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{format(new Date(receipt.createdAt), 'HH:mm:ss')}</span>
            </div>
            {receipt.customerName && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{receipt.customerName}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed my-2"></div>

          {/* Items */}
          <div className="mb-3">
            <div className="flex justify-between font-bold text-xs mb-1">
              <span className="flex-1">ITEM</span>
              <span className="w-10 text-center">QTY</span>
              <span className="w-20 text-right">AMOUNT</span>
            </div>
            {receipt.items.map((item, index) => (
              <div key={index} className="flex justify-between py-1 text-xs">
                <span className="flex-1">{item.flavourName}</span>
                <span className="w-10 text-center">{item.quantity}</span>
                <span className="w-20 text-right">Rs. {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-black pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>Rs. {receipt.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Payment:</span>
              <span className="capitalize">{receipt.paymentMethod}</span>
            </div>
          </div>

          {receipt.notes && (
            <div className="mt-3 text-xs">
              <span className="font-bold">Notes:</span> {receipt.notes}
            </div>
          )}

          <div className="text-center mt-4 pt-3 border-t border-dashed">
            <div className="text-xs">*** THANK YOU ***</div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
          <button
            onClick={() => handlePrint(receipt)}
            className="btn-primary flex-1 py-2 flex items-center justify-center gap-2"
          >
            🖨️ Print
          </button>
          <button
            onClick={() => downloadPDF(receipt._id)}
            className="btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
          >
            📄 PDF
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">📋 Receipt History</h1>
          <div className="text-sm text-gray-600">
            Total: {receipts.length} receipt(s)
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

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
            <a href="/create-receipt" className="btn-primary inline-block">
              Create Your First Receipt
            </a>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-3 text-left rounded-tl-lg">Receipt #</th>
                    <th className="p-3 text-left">Date & Time</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-center">Items</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Payment</th>
                    <th className="p-3 text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt, index) => (
                    <tr
                      key={receipt._id}
                      className={`border-b hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      onClick={() => handleView(receipt)}
                    >
                      <td className="p-3 font-mono font-semibold text-primary">{receipt.receiptNumber}</td>
                      <td className="p-3">
                        <div>{format(new Date(receipt.createdAt), 'dd MMM yyyy')}</div>
                        <div className="text-xs text-gray-500">{format(new Date(receipt.createdAt), 'hh:mm a')}</div>
                      </td>
                      <td className="p-3">{receipt.customerName || <span className="text-gray-400">Walk-in</span>}</td>
                      <td className="p-3 text-center">
                        <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                          {receipt.items.length} item(s)
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-lg">Rs. {receipt.totalAmount.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          receipt.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                          receipt.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {receipt.paymentMethod === 'cash' ? '💵' : receipt.paymentMethod === 'card' ? '💳' : '📱'} {receipt.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleView(receipt)}
                            className="p-2 hover:bg-gray-200 rounded"
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handlePrint(receipt)}
                            className="p-2 hover:bg-gray-200 rounded"
                            title="Print"
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => downloadPDF(receipt._id)}
                            className="p-2 hover:bg-gray-200 rounded"
                            title="Download PDF"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(receipt._id)}
                            className="p-2 hover:bg-red-100 rounded text-red-500"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {receipts.map(receipt => (
                <div
                  key={receipt._id}
                  className="card cursor-pointer"
                  onClick={() => handleView(receipt)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-mono font-bold text-primary">{receipt.receiptNumber}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(receipt.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      receipt.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                      receipt.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {receipt.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-gray-600">
                      {receipt.customerName || 'Walk-in Customer'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {receipt.items.length} item(s)
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-2xl font-bold text-primary">
                      Rs. {receipt.totalAmount.toFixed(2)}
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handlePrint(receipt)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        🖨️
                      </button>
                      <button
                        onClick={() => downloadPDF(receipt._id)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(receipt._id)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-bold">Delete Receipt?</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Detail Modal */}
        {showModal && selectedReceipt && (
          <ReceiptModal
            receipt={selectedReceipt}
            onClose={() => {
              setShowModal(false);
              setSelectedReceipt(null);
            }}
          />
        )}
      </div>
    </div>
  );
}