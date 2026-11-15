import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import { printThermalReceipt } from '../utils/thermalPrinter';
import ReceiptThermalPreview from '../components/ReceiptThermalPreview';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

export default function CreateReceipt() {
  const { flavours, fetchFlavours } = useFlavourStore();
  const { createReceipt } = useReceiptStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const receiptRef = useRef(null);

  const [items, setItems] = useState([]);
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exchangeRate = 320;

  useEffect(() => {
    fetchFlavours();
  }, [fetchFlavours]);

  const formatCurrency = (amount) => {
    if (currency === 'USD') {
      return `$${(amount / exchangeRate).toFixed(2)}`;
    }
    return `Rs. ${amount.toFixed(2)}`;
  };

  const addItem = () => {
    if (!selectedFlavour || quantity < 1) {
      alert('Please select a flavour and quantity');
      return;
    }

    const flavour = flavours.find(f => f._id === selectedFlavour);
    if (!flavour) return;

    const existingIndex = items.findIndex(item => item.flavourId === flavour._id);

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += parseInt(quantity);
      updatedItems[existingIndex].subtotal = updatedItems[existingIndex].quantity * updatedItems[existingIndex].price;
      setItems(updatedItems);
    } else {
      const newItem = {
        flavourId: flavour._id,
        flavourName: flavour.name,
        quantity: parseInt(quantity),
        price: flavour.price,
        subtotal: flavour.price * parseInt(quantity)
      };
      setItems([...items, newItem]);
    }

    setSelectedFlavour('');
    setQuantity(1);
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = [...items];
    updatedItems[index].quantity = parseInt(newQuantity);
    updatedItems[index].subtotal = updatedItems[index].price * parseInt(newQuantity);
    setItems(updatedItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const receipt = await createReceipt({
        items,
        totalAmount,
        customerName,
        paymentMethod,
        notes
      });
      setCreatedReceipt(receipt);
      setShowReceipt(true);
    } catch (err) {
      alert('Failed to create receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActiveReceiptObject = () => {
    return createdReceipt || {
      receiptNumber: 'NEW',
      createdAt: receiptDate || new Date().toISOString(),
      currency: currency || user?.defaultCurrency || 'LKR',
      customer: { name: customerName },
      customerName,
      items,
      pricing: { subtotal: totalAmount, discount: 0, tax: 0, grandTotal: totalAmount },
      totalAmount,
      payment: { method: paymentMethod },
      paymentMethod,
      notes
    };
  };

  const handlePrint = () => {
    printThermalReceipt(getActiveReceiptObject(), user || {});
  };

  const handleDownloadPDF = async () => {
    try {
      downloadReceiptPdf(getActiveReceiptObject(), user || {});
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleNewReceipt = () => {
    setShowReceipt(false);
    setCreatedReceipt(null);
    setItems([]);
    setCustomerName('');
    setNotes('');
  };

  const ReceiptPreview = ({ receipt }) => (
    <div id="receipt-content" ref={receiptRef} className="flex justify-center">
      <ReceiptThermalPreview
        receipt={receipt || getActiveReceiptObject()}
        business={user || {}}
      />
    </div>
  );

  if (showReceipt && createdReceipt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-600">Receipt Created!</h1>
          </div>
          <ReceiptPreview receipt={createdReceipt} />
          <div className="flex flex-col sm:flex-row gap-4 mt-6 max-w-md mx-auto">
            <button onClick={handlePrint} className="btn-primary flex-1 py-3">🖨️ Print</button>
            <button onClick={handleDownloadPDF} className="btn-secondary flex-1 py-3 bg-red-500 hover:bg-red-600 text-white">📄 Save PDF</button>
            <button onClick={handleNewReceipt} className="btn-secondary flex-1 py-3">➕ New Receipt</button>
          </div>
          <div className="text-center mt-4">
            <button onClick={() => navigate('/receipts')} className="text-primary underline">View All Receipts →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Create New Receipt</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <form onSubmit={handleSubmit}>
              {/* Date & Currency */}
              <div className="card mb-4">
                <h2 className="text-lg font-bold mb-4">📅 Receipt Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Date</label>
                    <input type="date" className="input-field" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Currency</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300">
                      <button type="button" onClick={() => setCurrency('LKR')} className={`flex-1 py-2 px-4 text-sm font-semibold transition ${currency === 'LKR' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🇱🇰 LKR</button>
                      <button type="button" onClick={() => setCurrency('USD')} className={`flex-1 py-2 px-4 text-sm font-semibold transition ${currency === 'USD' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🇺🇸 USD</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="card mb-4">
                <h2 className="text-lg font-bold mb-4">👤 Customer Info</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Customer Name (Optional)</label>
                    <input type="text" className="input-field" placeholder="Walk-in Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Payment Method</label>
                    <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Card</option>
                      <option value="mobile">📱 Mobile</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Items */}
              <div className="card mb-4">
                <h2 className="text-lg font-bold mb-4">🧃 Add Items</h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <select className="input-field flex-1" value={selectedFlavour} onChange={e => setSelectedFlavour(e.target.value)}>
                    <option value="">-- Select Flavour --</option>
                    {flavours.map(f => (<option key={f._id} value={f._id}>{f.name} - {formatCurrency(f.price)}</option>))}
                  </select>
                  <input type="number" min="1" className="input-field w-full sm:w-24" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} />
                  <button type="button" onClick={addItem} className="btn-primary whitespace-nowrap">➕ Add</button>
                </div>

                {/* Selected Flavour Preview */}
                {selectedFlavour && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">Selected: {flavours.find(f => f._id === selectedFlavour)?.name}</span>
                      <span className="text-green-600">{formatCurrency(flavours.find(f => f._id === selectedFlavour)?.price || 0)} × {quantity}</span>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                {items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[350px]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 text-sm">Flavour</th>
                          <th className="text-center p-2 text-sm w-20">Qty</th>
                          <th className="text-right p-2 text-sm">Subtotal</th>
                          <th className="text-center p-2 text-sm w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 text-sm">{item.flavourName}</td>
                            <td className="p-2 text-center">
                              <input type="number" min="1" value={item.quantity} onChange={e => updateItemQuantity(index, e.target.value)} className="w-16 text-center border rounded py-1" />
                            </td>
                            <td className="p-2 text-right text-sm font-semibold">{formatCurrency(item.subtotal)}</td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🛒</div>
                    <p>No items added yet</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="card mb-4">
                <label className="block text-sm font-semibold mb-2">📝 Notes (Optional)</label>
                <textarea className="input-field" value={notes} onChange={e => setNotes(e.target.value)} rows="2" placeholder="Add any special notes..." />
              </div>

              {/* Total and Submit */}
              <div className="card bg-primary text-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold">Total:</span>
                  <span className="text-3xl sm:text-4xl font-bold">{formatCurrency(totalAmount)}</span>
                </div>
                <button type="submit" className="w-full bg-white text-primary font-bold py-3 rounded-lg hover:bg-gray-100 transition disabled:opacity-50" disabled={items.length === 0 || isSubmitting}>
                  {isSubmitting ? '⏳ Creating...' : '✅ Create Receipt'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <h2 className="text-lg font-bold mb-4 text-center">📄 Live Preview</h2>
              <ReceiptPreview receipt={null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}