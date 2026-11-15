import { useEffect, useState } from 'react';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import { format } from 'date-fns';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import { printThermalReceipt } from '../utils/thermalPrinter';
import ReceiptThermalPreview from '../components/ReceiptThermalPreview';

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
    printThermalReceipt(receipt, user || {});
  };

  const handleDownloadPDF = (receipt) => {
    try {
      downloadReceiptPdf(receipt, user || {});
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  // Modal Component
  const ReceiptModal = ({ receipt, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold">Receipt Preview (80mm)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <div className="p-4 bg-gray-50 flex justify-center">
          <ReceiptThermalPreview
            receipt={receipt}
            business={user || {}}
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPDF}
          />
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