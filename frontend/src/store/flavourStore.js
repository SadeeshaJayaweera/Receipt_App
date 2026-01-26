import { create } from 'zustand';
import client from '../api/client';

const useFlavourStore = create((set) => ({
  flavours: [],
  isLoading: false,
  error: null,

  fetchFlavours: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get('/flavours');
      const flavoursArray = Array.isArray(data) ? data : [];
      set({ flavours: flavoursArray, error: null });
      return flavoursArray;
    } catch (error) {
      console.error('Fetch flavours error:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch flavours', flavours: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addFlavour: async (flavourData) => {
    set({ error: null });
    try {
      const { data } = await client.post('/flavours', flavourData);
      set(state => ({ flavours: [...state.flavours, data] }));
      return data;
    } catch (error) {
      console.error('Add flavour error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add flavour';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateFlavour: async (id, flavourData) => {
    set({ error: null });
    try {
      const { data } = await client.put(`/flavours/${id}`, flavourData);
      set(state => ({
        flavours: state.flavours.map(f => f._id === id ? data : f)
      }));
      return data;
    } catch (error) {
      console.error('Update flavour error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update flavour';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteFlavour: async (id) => {
    set({ error: null });
    try {
      await client.delete(`/flavours/${id}`);
      set(state => ({
        flavours: state.flavours.filter(f => f._id !== id)
      }));
    } catch (error) {
      console.error('Delete flavour error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete flavour';
      set({ error: errorMessage });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));

export default useFlavourStore;