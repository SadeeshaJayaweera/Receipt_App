import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
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

  const handlePrint = () => {
    const currentTime = new Date();
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) {
      alert('Please allow pop-ups to print the receipt');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${createdReceipt?.receiptNumber || 'Print'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 80mm auto; margin: 0; }
            @media print {
              body { width: 80mm; }
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              padding: 10px;
              font-size: 12px;
              width: 80mm;
              max-width: 80mm;
              background: white;
              color: #000;
            }
            .receipt { width: 100%; }
            .text-center { text-align: center; }
            .store-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .store-info { font-size: 11px; margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .divider-thick { border-top: 2px solid #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .items-header { font-weight: bold; font-size: 10px; padding: 4px 0; border-bottom: 1px solid #000; display: flex; }
            .item-row { display: flex; padding: 4px 0; font-size: 11px; border-bottom: 1px dotted #ccc; }
            .col-item { flex: 1; }
            .col-qty { width: 35px; text-align: center; }
            .col-price { width: 70px; text-align: right; }
            .total-section { margin-top: 8px; }
            .grand-total { font-size: 16px; font-weight: bold; margin: 8px 0; }
            .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; }
            .footer-text { font-size: 12px; font-weight: bold; }
            .footer-sub { font-size: 10px; margin-top: 4px; color: #444; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="text-center">
              <div class="store-name">🧃 FRESH JUICE</div>
              <div class="store-info">${user?.businessName || 'Juice Store'}</div>
              <div class="store-info">Tel: ${user?.phone || 'N/A'}</div>
              ${user?.address ? `<div class="store-info">${user.address}</div>` : ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="row"><span>Receipt #:</span><span><strong>${createdReceipt?.receiptNumber || 'NEW'}</strong></span></div>
            <div class="row"><span>Date:</span><span>${new Date(receiptDate).toLocaleDateString()}</span></div>
            <div class="row"><span>Time:</span><span>${currentTime.toLocaleTimeString()}</span></div>
            ${customerName ? `<div class="row"><span>Customer:</span><span>${customerName}</span></div>` : ''}
            
            <div class="divider"></div>
            
            <div class="items-header">
              <span class="col-item">ITEM</span>
              <span class="col-qty">QTY</span>
              <span class="col-price">AMOUNT</span>
            </div>
            
            ${items.map(item => `
              <div class="item-row">
                <span class="col-item">${item.flavourName}</span>
                <span class="col-qty">${item.quantity}</span>
                <span class="col-price">${formatCurrency(item.subtotal)}</span>
              </div>
            `).join('')}
            
            <div class="divider"></div>
            
            <div class="total-section">
              <div class="row"><span>Subtotal:</span><span>${formatCurrency(totalAmount)}</span></div>
              <div class="row"><span>Tax (0%):</span><span>${formatCurrency(0)}</span></div>
            </div>
            
            <div class="divider-thick"></div>
            
            <div class="row grand-total"><span>TOTAL:</span><span>${formatCurrency(totalAmount)}</span></div>
            
            <div class="divider"></div>
            
            <div class="row"><span>Payment Method:</span><span style="text-transform: uppercase;">${paymentMethod}</span></div>
            
            <div class="footer">
              <div class="footer-text">*** THANK YOU ***</div>
              <div class="footer-sub">Please come again!</div>
              <div class="footer-sub" style="margin-top: 8px;">Powered by Juice Receipt App</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    try {
      const receiptToExport = createdReceipt || {
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
      downloadReceiptPdf(receiptToExport, user || {});
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

  const currentDateTime = new Date();

  const ReceiptPreview = ({ receipt }) => (
    <div id="receipt-content" ref={receiptRef} className="bg-white font-mono text-xs sm:text-sm max-w-xs mx-auto p-4 shadow-lg border" style={{ width: '300px' }}>
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
        <div className="text-lg sm:text-xl font-bold">🧃 FRESH JUICE</div>
        <div className="text-gray-600">{user?.businessName || 'Juice Store'}</div>
        <div className="text-gray-500 text-xs mt-1">Tel: {user?.phone || 'N/A'}</div>
      </div>

      <div className="text-xs mb-3">
        <div className="flex justify-between"><span>Receipt #:</span><span className="font-semibold">{receipt?.receiptNumber || 'NEW'}</span></div>
        <div className="flex justify-between"><span>Date:</span><span>{new Date(receiptDate).toLocaleDateString()}</span></div>
        <div className="flex justify-between"><span>Time:</span><span>{currentDateTime.toLocaleTimeString()}</span></div>
        {customerName && <div className="flex justify-between"><span>Customer:</span><span>{customerName}</span></div>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      <div className="flex justify-between font-bold text-xs mb-1">
        <span className="flex-1">ITEM</span>
        <span className="w-10 text-center">QTY</span>
        <span className="w-20 text-right">AMOUNT</span>
      </div>

      <div className="border-t border-gray-300 mb-2"></div>

      <div className="mb-3">
        {items.length > 0 ? items.map((item, index) => (
          <div key={index} className="flex justify-between py-1">
            <span className="flex-1 truncate">{item.flavourName}</span>
            <span className="w-10 text-center">{item.quantity}</span>
            <span className="w-20 text-right">{formatCurrency(item.subtotal)}</span>
          </div>
        )) : <div className="text-center text-gray-400 py-2">No items</div>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      <div className="flex justify-between py-1"><span>Subtotal:</span><span>{formatCurrency(totalAmount)}</span></div>
      <div className="flex justify-between py-1"><span>Tax (0%):</span><span>{formatCurrency(0)}</span></div>
      <div className="flex justify-between py-2 font-bold text-base border-t-2 border-black mt-2">
        <span>TOTAL:</span><span>{formatCurrency(totalAmount)}</span>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>
      <div className="flex justify-between text-xs"><span>Payment:</span><span className="capitalize font-semibold">{paymentMethod}</span></div>

      <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400">
        <div className="text-xs">*** THANK YOU ***</div>
        <div className="text-xs text-gray-500 mt-1">Please come again!</div>
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