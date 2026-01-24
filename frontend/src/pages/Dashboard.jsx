import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user?.businessName}!</h1>
          <p className="text-gray-600">Manage your juice business efficiently</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/flavours" className="card cursor-pointer hover:scale-105 transform transition">
            <div className="text-4xl mb-3">🍊</div>
            <h2 className="text-2xl font-bold mb-2">Manage Flavours</h2>
            <p className="text-gray-600">Add, edit, and manage juice flavours</p>
          </Link>

          <Link to="/create-receipt" className="card cursor-pointer hover:scale-105 transform transition">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-2xl font-bold mb-2">Create Receipt</h2>
            <p className="text-gray-600">Generate new sales receipts</p>
          </Link>

          <Link to="/receipts" className="card cursor-pointer hover:scale-105 transform transition">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-2xl font-bold mb-2">Receipt History</h2>
            <p className="text-gray-600">View all past receipts and records</p>
          </Link>
        </div>
      </div>
    </div>
  );
}