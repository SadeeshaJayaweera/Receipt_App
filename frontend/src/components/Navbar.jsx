import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Navbar() {
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: '🏠 Dashboard' },
    { to: '/flavours', label: '🍊 Flavours' },
    { to: '/create-receipt', label: '📝 Create' },
    { to: '/receipts', label: '📋 History' },
    { to: '/settings', label: '⚙️ Settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            🧃 <span className="hidden sm:inline">Juice Receipt</span><span className="sm:hidden">JR</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg transition ${isActive(link.to) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
              >
                {link.label}
              </Link>
            ))}
            <button onClick={logout} className="ml-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition">
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/20 pt-4">
            <div className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition ${isActive(link.to) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { logout(); setIsMenuOpen(false); }}
                className="mt-2 bg-red-500 hover:bg-red-600 px-4 py-3 rounded-lg transition text-left"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}