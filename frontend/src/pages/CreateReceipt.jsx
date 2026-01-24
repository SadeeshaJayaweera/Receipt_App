import { useState, useEffect } from 'react';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';
import Navbar from '../components/Navbar';

export default function CreateReceipt() {
  const { flavours, fetchFlavours } = useFlavourStore();
  const { createReceipt } = useReceiptStore();

  const [items, setItems] = useState([]);
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchFlavours();
  }, []);

  const addItem = () => {
    if (!selectedFlavour || quantity < 1) return;

    const flavour = flavours.find(f => f._id === selectedFlavour);
    const newItem = {
      flavourId: flavour._id,
      flavourName: flavour.name,
      quantity: parseInt(quantity),
      price: flavour.price,
      subtotal: flavour.price * quantity
    };

    setItems([...items, newItem]);
    setSelectedFlavour('');
    setQuantity(1);
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

    try {
      await createReceipt({
        items,
        totalAmount,
        customerName,
        paymentMethod,
        notes
      });
      alert('Receipt created successfully!');
      setItems([]);
      setCustomerName('');
      setNotes('');
    } catch (err) {
      alert('Failed to create receipt');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create New Receipt</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2">Customer Name (Optional)</label>
              <input
                type="text"
                className="input-field"
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
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Add Items</h2>

            <div className="flex gap-2 mb-4">
              <select
                className="input-field flex-1"
                value={selectedFlavour}
                onChange={e => setSelectedFlavour(e.target.value)}
              >
                <option value="">Select Flavour</option>
                {flavours.map(f => (
                  <option key={f._id} value={f._id}>{f.name} - ${f.price}</option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                className="input-field w-20"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />

              <button
                type="button"
                onClick={addItem}
                className="btn-primary"
              >
                Add
              </button>
            </div>

            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2">Flavour</th>
                      <th className="text-left p-2">Qty</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Subtotal</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.flavourName}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2">${item.price.toFixed(2)}</td>
                        <td className="p-2">${item.subtotal.toFixed(2)}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="btn-danger py-1 px-2 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-3xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Notes</label>
              <textarea
                className="input-field"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows="3"
              />
            </div></div>

          <div className="flex gap-4">
            <button type="submit" className="btn-primary flex-1 py-3">
              Create Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}