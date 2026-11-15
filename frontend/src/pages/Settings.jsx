import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import ReceiptThermalPreview from '../components/ReceiptThermalPreview';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

export default function Settings() {
  const { user, updateProfile, isLoading } = useAuthStore();

  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('LKR');
  const [receiptPrefix, setReceiptPrefix] = useState('RCP');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [logoIcon, setLogoIcon] = useState('🧃');
  const [showLogo, setShowLogo] = useState(true);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'receipt'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName || '');
      setTagline(user.tagline || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setWebsite(user.website || '');
      setDefaultCurrency(user.defaultCurrency || 'LKR');
      setReceiptPrefix(user.receiptPrefix || 'RCP');
      setReceiptFooter(user.receiptFooter || 'Thank you for your business!');
      setLogoIcon(user.logoIcon || '🧃');
      setShowLogo(user.showLogo !== undefined ? user.showLogo : true);
      setTaxEnabled(Boolean(user.taxEnabled));
      setTaxRate(user.taxRate || 0);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile({
        businessName,
        tagline,
        phone,
        address,
        website,
        defaultCurrency,
        receiptPrefix,
        receiptFooter,
        logoIcon,
        showLogo,
        taxEnabled,
        taxRate: Number(taxRate) || 0
      });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    }
  };

  // Live sample receipt for preview
  const sampleSubtotal = defaultCurrency === 'USD' ? 12.5 : 1500;
  const calculatedTax = taxEnabled ? (sampleSubtotal * (Number(taxRate) || 0)) / 100 : 0;
  const grandTotal = sampleSubtotal + calculatedTax;

  const liveBusiness = {
    businessName: businessName || 'Your Business Name',
    tagline,
    phone,
    address,
    email: user?.email || '',
    website,
    defaultCurrency,
    receiptFooter,
    logoIcon,
    showLogo
  };

  const sampleReceipt = {
    receiptNumber: `${receiptPrefix || 'RCP'}-202611-0001`,
    createdAt: new Date().toISOString(),
    currency: defaultCurrency,
    status: 'issued',
    customer: { name: 'Sample Customer', phone: '+94 77 000 0000' },
    items: defaultCurrency === 'USD' ? [
      { flavourName: 'Papaya Lime Splash', quantity: 2, subtotal: 7.5 },
      { flavourName: 'Avocado Shake', quantity: 1, subtotal: 5.0 }
    ] : [
      { flavourName: 'Papaya Lime Splash', quantity: 2, subtotal: 900 },
      { flavourName: 'Avocado Shake', quantity: 1, subtotal: 600 }
    ],
    pricing: {
      subtotal: sampleSubtotal,
      discount: 0,
      tax: calculatedTax,
      grandTotal: grandTotal
    },
    payment: {
      method: 'cash',
      amountPaid: defaultCurrency === 'USD' ? 15.0 : 2000,
      changeGiven: defaultCurrency === 'USD' ? (15.0 - grandTotal) : (2000 - grandTotal)
    },
    notes: 'Sample preview note'
  };

  const handleTestPrint = () => {
    printThermalReceipt(sampleReceipt, liveBusiness);
  };

  const handleTestDownloadPdf = () => {
    downloadReceiptPdf(sampleReceipt, liveBusiness);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">⚙️ Business & Receipt Settings</h1>
          <div className="text-sm text-gray-500">Tenant ID: {user?.id?.substring(0, 8)}...</div>
        </div>

        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 flex items-center shadow-sm">
            <span className="text-xl mr-2">✓</span> {success}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center shadow-sm">
            <span className="text-xl mr-2">✕</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-7">
            <div className="card">
              {/* Tab navigation */}
              <div className="flex border-b mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
                    activeTab === 'profile'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🏪 Business Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('receipt')}
                  className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
                    activeTab === 'receipt'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🧾 Receipt Customization
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {activeTab === 'profile' && (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Business Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Green Island Juice Bar"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Tagline / Header Slogan</label>
                      <input
                        type="text"
                        className="input-field"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g. 100% Fresh & Organic Natural Juices"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">📞 Phone Number</label>
                        <input
                          type="tel"
                          className="input-field"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +94 77 123 4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">🌐 Website / Social</label>
                        <input
                          type="text"
                          className="input-field"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="e.g. instagram.com/freshjuice"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">📍 Store Address</label>
                      <textarea
                        className="input-field"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. No. 45 Galle Road, Colombo 03"
                        rows="2"
                      />
                    </div>

                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-sm mb-1">📧 Registered Account Email</h3>
                      <p className="text-gray-600 text-sm">{user?.email}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'receipt' && (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Default Currency</label>
                        <select
                          className="input-field"
                          value={defaultCurrency}
                          onChange={(e) => setDefaultCurrency(e.target.value)}
                        >
                          <option value="LKR">🇱🇰 Sri Lankan Rupee (LKR - Rs.)</option>
                          <option value="USD">🇺🇸 US Dollar (USD - $)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Receipt Number Prefix</label>
                        <input
                          type="text"
                          className="input-field uppercase font-mono"
                          value={receiptPrefix}
                          onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
                          placeholder="RCP"
                          maxLength={8}
                        />
                        <p className="text-xs text-gray-500 mt-1">Generates: {receiptPrefix || 'RCP'}-YYYYMM-0001</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Store Icon / Logo Emoji</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            className="input-field text-center text-xl w-20"
                            value={logoIcon}
                            onChange={(e) => setLogoIcon(e.target.value)}
                            maxLength={4}
                          />
                          <div className="flex gap-1 text-xl">
                            {['🧃', '🍹', '🥤', '🍋', '☕'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setLogoIcon(emoji)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showLogo}
                            onChange={(e) => setShowLogo(e.target.checked)}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm font-semibold">Display Logo on Receipts</span>
                        </label>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Receipt Footer / Thank You Note</label>
                      <textarea
                        className="input-field"
                        value={receiptFooter}
                        onChange={(e) => setReceiptFooter(e.target.value)}
                        placeholder="e.g. Thank you for your visit! No refunds on opened drinks."
                        rows="2"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm">Tax Handling (VAT / Sales Tax)</h3>
                          <p className="text-xs text-gray-500">Apply configurable tax calculation to all receipts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={taxEnabled}
                          onChange={(e) => setTaxEnabled(e.target.checked)}
                          className="w-5 h-5 text-primary rounded"
                        />
                      </div>
                      {taxEnabled && (
                        <div>
                          <label className="block text-xs font-semibold mb-1">Tax Percentage (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="input-field max-w-xs"
                            value={taxRate}
                            onChange={(e) => setTaxRate(e.target.value)}
                            placeholder="e.g. 5.0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Saving Settings...' : '💾 Save All Changes'}
                </button>
              </form>
            </div>
          </div>

          {/* Live 80mm Receipt Thermal Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold">📄 Live 80mm Thermal Preview</h2>
                <span className="text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded">
                  Updates in Real Time
                </span>
              </div>
              <div className="bg-gray-200 p-4 rounded-xl shadow-inner flex justify-center">
                <ReceiptThermalPreview
                  receipt={sampleReceipt}
                  business={liveBusiness}
                  onPrint={handleTestPrint}
                  onDownloadPdf={handleTestDownloadPdf}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Click <strong>Print 80mm</strong> or <strong>Download PDF</strong> to test your printer layout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
