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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Juice Flavours</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Flavour'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8">
            <FlavourForm editingId={editingId} onClose={() => {
              setShowForm(false);
              setEditingId(null);
            }} />
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-2">{flavour.name}</h3>
      <p className="text-gray-600 mb-3">{flavour.description}</p>
      <p className="text-2xl font-bold text-primary mb-4">${flavour.price.toFixed(2)}</p>
      <div className="flex gap-2">
        <button onClick={onEdit} className="btn-secondary flex-1">Edit</button>
        <button
          onClick={() => deleteFlavour(flavour._id)}
          className="btn-danger flex-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
}