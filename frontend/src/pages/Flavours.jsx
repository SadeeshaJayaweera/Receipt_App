import { useEffect, useState } from 'react';
import useFlavourStore from '../store/flavourStore';
import Navbar from '../components/Navbar';
import FlavourForm from '../components/FlavourForm';

export default function Flavours() {
  const { flavours, fetchFlavours, isLoading } = useFlavourStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchFlavours();
  }, [fetchFlavours]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">🍊 Juice Flavours</h1>
            <p className="text-gray-600 text-sm">{flavours.length} flavour(s) available</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
            }}
            className="btn-primary w-full sm:w-auto"
          >
            {showForm ? '✕ Cancel' : '➕ Add Flavour'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 sm:mb-8">
            <FlavourForm editingId={editingId} onClose={() => {
              setShowForm(false);
              setEditingId(null);
            }} />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p className="text-gray-600">Loading flavours...</p>
          </div>
        ) : flavours.length === 0 ? (
          <div className="text-center py-12 card">
            <div className="text-6xl mb-4">🍹</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Flavours Yet</h2>
            <p className="text-gray-500 mb-4">Add your first juice flavour to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Your First Flavour
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {flavours.map(flavour => (
              <FlavourCard
                key={flavour._id}
                flavour={flavour}
                onEdit={() => {
                  setEditingId(flavour._id);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlavourCard({ flavour, onEdit }) {
  const { deleteFlavour } = useFlavourStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteFlavour(flavour._id);
      setShowDeleteConfirm(false);
    } catch (err) {
      alert('Failed to delete flavour');
    }
  };

  return (
    <div className="card relative overflow-hidden">
      {/* Color accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-yellow-400"></div>

      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg sm:text-xl font-bold">{flavour.name}</h3>
        <span className="text-2xl sm:text-3xl font-bold text-primary">Rs. {flavour.price.toFixed(0)}</span>
      </div>

      {flavour.description && (
        <p className="text-gray-600 text-sm mb-4">{flavour.description}</p>
      )}

      <div className="flex gap-2 mt-auto">
        <button onClick={onEdit} className="btn-secondary flex-1 py-2 text-sm">
          ✏️ Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-danger flex-1 py-2 text-sm"
        >
          🗑️ Delete
        </button>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center p-4">
          <p className="text-center mb-4 font-semibold">Delete "{flavour.name}"?</p>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}