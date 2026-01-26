import { useState, useEffect } from 'react';
import useFlavourStore from '../store/flavourStore';

export default function FlavourForm({ editingId, onClose }) {
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { addFlavour, updateFlavour, flavours } = useFlavourStore();

  useEffect(() => {
    if (editingId) {
      const flavour = flavours.find(f => f._id === editingId);
      if (flavour) {
        setFormData({ name: flavour.name, price: flavour.price, description: flavour.description || '' });
      }
    } else {
      setFormData({ name: '', price: '', description: '' });
    }
  }, [editingId, flavours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim()
      };

      if (!submitData.name || !submitData.price) {
        setError('Name and price are required');
        setIsSubmitting(false);
        return;
      }

      if (editingId) {
        await updateFlavour(editingId, submitData);
      } else {
        await addFlavour(submitData);
      }
      setFormData({ name: '', price: '', description: '' });
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to save flavour. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">{editingId ? '✏️ Edit' : '➕ Add New'} Flavour</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Flavour Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Orange Juice"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Price (Rs.) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              placeholder="e.g. 250"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
          <textarea
            className="input-field"
            placeholder="Describe the flavour..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows="2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="btn-primary flex-1 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Saving...' : (editingId ? '✅ Update' : '➕ Add')} Flavour
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}