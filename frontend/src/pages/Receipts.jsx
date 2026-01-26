import { useEffect, useState } from 'react';
import useReceiptStore from '../store/receiptStore';
import Navbar from '../components/Navbar';
import { formatDistanceToNow } from 'date-fns';

export default function Receipts() {
  const { receipts, fetchReceipts, downloadPDF, deleteReceipt, isLoading } = useReceiptStore();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReceipts(page);
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Receipt History</h1>

        {isLoading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : receipts.length === 0 ? (
          <p className="text-center text-gray-600">No receipts yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="p-3 text-left">Receipt #</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Items</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(receipt => (
                  <tr key={receipt._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{receipt.receiptNumber}</td>
                    <td className="p-3">{formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })}</td>
                    <td className="p-3">{receipt.items.length} item(s)</td>
                    <td className="p-3 font-bold text-primary">${receipt.totalAmount.toFixed(2)}</td>
                    <td className="p-3 capitalize">{receipt.paymentMethod}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadPDF(receipt._id)}
                          className="btn-secondary py-1 px-2 text-sm"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => deleteReceipt(receipt._id)}
                          className="btn-danger py-1 px-2 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}