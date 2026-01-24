import { useState, useEffect } from 'react';
import useFlavourStore from '../store/flavourStore';

export default function FlavourForm({ editingId, onClose }) {
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });
  const { addFlavour, updateFlavour, flavours } = useFlavourStore();

  useEffect(() => {
    if (editingId) {
      const flavour = flavours.find(f => f._id === editingId);
      if (flavour) {
        setFormData({ name: flavour.name, price: flavour.price, description: flavour.description });
      }
    }
  }, [editingId, flavours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFlavour(editingId, formData);
      } else {
        await addFlavour(formData);
      }
      setFormData({ name: '', price: '', description: '' });
      onClose();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">{editingId ? 'Edit' : 'Add New'} Flavour</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Flavour Name</label>
          <input
            type="text"
            className="input-field"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Price ($)</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Description</label>
          <textarea
            className="input-field"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows="3"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          {editingId ? 'Update' : 'Add'} Flavour
        </button>
      </form>
    </div>
  );
}