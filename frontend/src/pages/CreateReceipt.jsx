import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

export default function CreateReceipt() {
  const { flavours, fetchFlavours } = useFlavourStore();
  const { createReceipt, currentReceipt, clearCurrentReceipt } = useReceiptStore();
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

  // Exchange rate (approximate)
  const exchangeRate = 320; // 1 USD = 320 LKR

  useEffect(() => {
    fetchFlavours();
    return () => clearCurrentReceipt();
  }, [fetchFlavours, clearCurrentReceipt]);

  const formatCurrency = (amount) => {
    if (currency === 'USD') {
      return `$${(amount / exchangeRate).toFixed(2)}`;
    }
    return `Rs. ${amount.toFixed(2)}`;
  };

  const getDisplayPrice = (price) => {
    if (currency === 'USD') {
      return price / exchangeRate;
    }
    return price;
  };

  const addItem = () => {
    if (!selectedFlavour || quantity < 1) {
      alert('Please select a flavour and quantity');
      return;
    }

    const flavour = flavours.find(f => f._id === selectedFlavour);
    if (!flavour) return;

    // Check if item already exists
    const existingIndex = items.findIndex(item => item.flavourId === flavour._id);

    if (existingIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += parseInt(quantity);
      updatedItems[existingIndex].subtotal = updatedItems[existingIndex].quantity * updatedItems[existingIndex].price;
      setItems(updatedItems);
    } else {
      // Add new item
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
        notes,
        currency,
        receiptDate
      });
      setCreatedReceipt(receipt);
      setShowReceipt(true);
    } catch (err) {
      alert('Failed to create receipt: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 10px; font-size: 12px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .store-name { font-size: 18px; font-weight: bold; }
            .info { margin: 5px 0; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-name { flex: 1; }
            .item-qty { width: 40px; text-align: center; }
            .item-price { width: 80px; text-align: right; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
            .barcode { text-align: center; margin: 10px 0; font-size: 10px; letter-spacing: 2px; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleNewReceipt = () => {
    setShowReceipt(false);
    setCreatedReceipt(null);
    setItems([]);
    setCustomerName('');
    setNotes('');
    setPaymentMethod('cash');
  };

  const currentDateTime = new Date();

  // Receipt Preview Component
  const ReceiptPreview = ({ receipt }) => (
    <div ref={receiptRef} className="receipt bg-white font-mono text-xs sm:text-sm max-w-xs mx-auto p-4 shadow-lg border">
      {/* Header */}
      <div className="header text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
        <div className="store-name text-lg sm:text-xl font-bold">🧃 FRESH JUICE</div>
        <div className="text-gray-600">{user?.businessName || 'Juice Store'}</div>
        <div className="text-gray-500 text-xs mt-1">{user?.address || 'Your Local Juice Shop'}</div>
        <div className="text-gray-500 text-xs">Tel: {user?.phone || 'N/A'}</div>
      </div>

      {/* Receipt Info */}
      <div className="info text-xs mb-3">
        <div className="flex justify-between">
          <span>Receipt #:</span>
          <span className="font-semibold">{receipt?.receiptNumber || 'NEW'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(receiptDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{currentDateTime.toLocaleTimeString()}</span>
        </div>
        {customerName && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{customerName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{user?.businessName?.split(' ')[0] || 'Staff'}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Items Header */}
      <div className="flex justify-between font-bold text-xs mb-1">
        <span className="flex-1">ITEM</span>
        <span className="w-10 text-center">QTY</span>
        <span className="w-20 text-right">AMOUNT</span>
      </div>

      <div className="border-t border-gray-300 mb-2"></div>

      {/* Items */}
      <div className="items mb-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between py-1">
            <span className="flex-1 truncate">{item.flavourName}</span>
            <span className="w-10 text-center">{item.quantity}</span>
            <span className="w-20 text-right">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Totals */}
      <div className="totals">
        <div className="flex justify-between py-1">
          <span>Subtotal:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Tax (0%):</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between py-2 font-bold text-base border-t-2 border-black mt-2">
          <span>TOTAL:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>
      <div className="flex justify-between text-xs">
        <span>Payment Method:</span>
        <span className="capitalize font-semibold">{paymentMethod}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span>Currency:</span>
        <span className="font-semibold">{currency}</span>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mt-2 text-xs">
          <span className="font-semibold">Notes:</span> {notes}
        </div>
      )}

      {/* Footer */}
      <div className="footer text-center mt-4 pt-3 border-t border-dashed border-gray-400">
        <div className="text-xs">*** THANK YOU ***</div>
        <div className="text-xs text-gray-500 mt-1">Please come again!</div>
        <div className="barcode mt-3 text-xs tracking-widest">
          ||||| {receipt?.receiptNumber || 'PREVIEW'} |||||
        </div>
      </div>
    </div>
  );

  if (showReceipt && createdReceipt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-600">Receipt Created Successfully!</h1>
          </div>

          <ReceiptPreview receipt={createdReceipt} />

          <div className="flex flex-col sm:flex-row gap-4 mt-6 max-w-xs mx-auto">
            <button onClick={handlePrint} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
              🖨️ Print Receipt
            </button>
            <button onClick={handleNewReceipt} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
              ➕ New Receipt
            </button>
          </div>
          <div className="text-center mt-4">
            <button onClick={() => navigate('/receipts')} className="text-primary underline">
              View All Receipts →
            </button>
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
          {/* Left Column - Form */}
          <div>
            <form onSubmit={handleSubmit}>
              {/* Date and Currency Row */}
              <div className="card mb-4">
                <h2 className="text-lg font-bold mb-4">📅 Receipt Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={receiptDate}
                      onChange={e => setReceiptDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Currency</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300">
                      <button
                        type="button"
                        onClick={() => setCurrency('LKR')}
                        className={`flex-1 py-2 px-4 text-sm font-semibold transition ${
                          currency === 'LKR' 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🇱🇰 LKR
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`flex-1 py-2 px-4 text-sm font-semibold transition ${
                          currency === 'USD' 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🇺🇸 USD
                      </button>
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
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Walk-in Customer"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Payment Method</label>
                    <select
                      className="input-field"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Card</option>
                      <option value="mobile">📱 Mobile Payment</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Items */}
              <div className="card mb-4">
                <h2 className="text-lg font-bold mb-4">🧃 Add Items</h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <select
                    className="input-field flex-1"
                    value={selectedFlavour}
                    onChange={e => setSelectedFlavour(e.target.value)}
                  >
                    <option value="">-- Select Flavour --</option>
                    {flavours.map(f => (
                      <option key={f._id} value={f._id}>
                        {f.name} - {formatCurrency(f.price)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="input-field w-full sm:w-24"
                    placeholder="Qty"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-primary whitespace-nowrap"
                  >
                    ➕ Add
                  </button>
                </div>

                {/* Selected Flavour Preview */}
                {selectedFlavour && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">
                        Selected: {flavours.find(f => f._id === selectedFlavour)?.name}
                      </span>
                      <span className="text-green-600">
                        {formatCurrency(flavours.find(f => f._id === selectedFlavour)?.price || 0)} × {quantity}
                      </span>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                {items.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full min-w-[400px]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 text-sm">Flavour</th>
                          <th className="text-center p-2 text-sm w-20">Qty</th>
                          <th className="text-right p-2 text-sm">Price</th>
                          <th className="text-right p-2 text-sm">Subtotal</th>
                          <th className="text-center p-2 text-sm w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 text-sm font-medium">{item.flavourName}</td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => updateItemQuantity(index, e.target.value)}
                                className="w-16 text-center border rounded py-1"
                              />
                            </td>
                            <td className="p-2 text-right text-sm">{formatCurrency(item.price)}</td>
                            <td className="p-2 text-right text-sm font-semibold">{formatCurrency(item.subtotal)}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700 text-lg"
                              >
                                🗑️
                              </button>
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
                <textarea
                  className="input-field"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows="2"
                  placeholder="Add any special notes..."
                />
              </div>

              {/* Total and Submit */}
              <div className="card bg-primary text-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold">Total Amount:</span>
                  <span className="text-3xl sm:text-4xl font-bold">{formatCurrency(totalAmount)}</span>
                </div>
                <button
                  type="submit"
                  className="w-full bg-white text-primary font-bold py-3 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                  disabled={items.length === 0 || isSubmitting}
                >
                  {isSubmitting ? '⏳ Creating...' : '✅ Create Receipt'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Live Receipt Preview */}
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