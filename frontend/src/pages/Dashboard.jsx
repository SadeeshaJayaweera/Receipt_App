import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useReceiptStore from '../store/receiptStore';
import useFlavourStore from '../store/flavourStore';
import Navbar from '../components/Navbar';
import { useEffect } from 'react';

export default function Dashboard() {
  const user = useAuthStore(state => state.user);
  const { receipts, fetchReceipts } = useReceiptStore();
  const { flavours, fetchFlavours } = useFlavourStore();

  useEffect(() => {
    fetchReceipts();
    fetchFlavours();
  }, [fetchReceipts, fetchFlavours]);

  const todayReceipts = receipts.filter(r => {
    const today = new Date().toDateString();
    return new Date(r.createdAt).toDateString() === today;
  });

  const todayTotal = todayReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Welcome, {user?.businessName || 'User'}! 👋
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your juice business efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">{todayReceipts.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Today's Sales</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">Rs. {todayTotal.toFixed(0)}</div>
            <div className="text-xs sm:text-sm text-gray-600">Today's Revenue</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{receipts.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Receipts</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{flavours.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Flavours</div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg sm:text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link to="/create-receipt" className="card cursor-pointer hover:scale-105 transform transition bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-4xl sm:text-5xl mb-3">📝</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Create Receipt</h2>
            <p className="text-green-100 text-sm sm:text-base">Generate new sales receipts</p>
          </Link>

          <Link to="/flavours" className="card cursor-pointer hover:scale-105 transform transition">
            <div className="text-4xl sm:text-5xl mb-3">🍊</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Manage Flavours</h2>
            <p className="text-gray-600 text-sm sm:text-base">Add, edit, and manage juice flavours</p>
          </Link>

          <Link to="/receipts" className="card cursor-pointer hover:scale-105 transform transition">
            <div className="text-4xl sm:text-5xl mb-3">📋</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Receipt History</h2>
            <p className="text-gray-600 text-sm sm:text-base">View all past receipts and records</p>
          </Link>
        </div>

        {/* Recent Receipts */}
        {receipts.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Recent Receipts</h2>
              <Link to="/receipts" className="text-primary text-sm hover:underline">View All →</Link>
            </div>
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-sm">Receipt #</th>
                      <th className="p-3 text-left text-sm hidden sm:table-cell">Customer</th>
                      <th className="p-3 text-right text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.slice(0, 5).map(receipt => (
                      <tr key={receipt._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm text-primary">{receipt.receiptNumber}</td>
                        <td className="p-3 text-sm hidden sm:table-cell">{receipt.customerName || 'Walk-in'}</td>
                        <td className="p-3 text-right font-bold">Rs. {receipt.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}