import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Navbar() {
  const logout = useAuthStore(state => state.logout);

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold">🧃 Juice Receipt</Link>
        <div className="flex gap-6">
          <Link to="/dashboard" className="hover:text-green-100">Dashboard</Link>
          <Link to="/flavours" className="hover:text-green-100">Flavours</Link>
          <Link to="/create-receipt" className="hover:text-green-100">Create Receipt</Link>
          <Link to="/receipts" className="hover:text-green-100">History</Link>
        </div><button onClick={logout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
          Logout
        </button>
      </div>
    </nav>
  );
}