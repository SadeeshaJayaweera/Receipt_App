import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

export default function Settings() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile({ businessName, phone, address });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">⚙️ Settings</h1>

        <div className="card">
          <h2 className="text-xl font-bold mb-6">Business Profile</h2>
          <p className="text-gray-600 text-sm mb-6">
            This information will appear on your receipts. Make sure your phone number is set so it shows on printed receipts.
          </p>

          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4 flex items-center">
              <span className="text-xl mr-2">✓</span> {success}
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex items-center">
              <span className="text-xl mr-2">✕</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Business Name *</label>
              <input
                type="text"
                className="input-field"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your Business Name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">📞 Phone Number *</label>
              <input
                type="tel"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +94 77 123 4567"
              />
              <p className="text-xs text-gray-500 mt-1">This will appear on all your receipts</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">📍 Business Address</label>
              <textarea
                className="input-field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your business address"
                rows="2"
              />
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">📧 Email</h3>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </form>
        </div>

        <div className="card mt-6">
          <h2 className="text-xl font-bold mb-4">Receipt Preview</h2>
          <div className="bg-white border-2 border-dashed p-4 rounded-lg font-mono text-sm text-center">
            <div className="text-lg font-bold">🧃 FRESH JUICE</div>
            <div className="text-gray-700">{businessName || 'Your Business Name'}</div>
            <div className="text-gray-500 text-xs mt-1">Tel: {phone || 'Not set'}</div>
            {address && <div className="text-gray-500 text-xs">{address}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
