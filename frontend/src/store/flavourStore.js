import { create } from 'zustand';
import client from '../api/client';

const useFlavourStore = create((set, get) => ({
  flavours: [],
  isLoading: false,
  error: null,

  fetchFlavours: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get('/flavours', { params });
      const flavoursArray = Array.isArray(data) ? data : [];
      set({ flavours: flavoursArray, error: null });
      return flavoursArray;
    } catch (error) {
      console.error('Fetch flavours error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch flavours';
      set({ error: errorMessage, flavours: [] });
      return [];
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
        flavours: state.flavours.map(f => (f._id === id ? data : f))
      }));
      return data;
    } catch (error) {
      console.error('Update flavour error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update flavour';
      set({ error: errorMessage });
      throw error;
    }
  },

  toggleAvailability: async (id) => {
    // Optimistic toggle
    const currentFlavours = get().flavours;
    const target = currentFlavours.find(f => f._id === id);
    if (!target) return;

    const nextAvailability = !target.isAvailable;
    set(state => ({
      flavours: state.flavours.map(f => (f._id === id ? { ...f, isAvailable: nextAvailability } : f))
    }));

    try {
      const { data } = await client.patch(`/flavours/${id}/toggle-availability`);
      set(state => ({
        flavours: state.flavours.map(f => (f._id === id ? data : f))
      }));
      return data;
    } catch (error) {
      console.error('Toggle availability error:', error);
      // Revert on error
      set({ flavours: currentFlavours });
      const errorMessage = error.response?.data?.message || 'Failed to toggle availability';
      set({ error: errorMessage });
      throw error;
    }
  },

  archiveFlavour: async (id) => {
    set({ error: null });
    try {
      const { data } = await client.patch(`/flavours/${id}/archive`);
      set(state => ({
        flavours: state.flavours.map(f => (f._id === id ? data : f))
      }));
      return data;
    } catch (error) {
      console.error('Archive flavour error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to archive flavour';
      set({ error: errorMessage });
      throw error;
    }
  },

  restoreFlavour: async (id) => {
    set({ error: null });
    try {
      const { data } = await client.patch(`/flavours/${id}/restore`);
      set(state => ({
        flavours: state.flavours.map(f => (f._id === id ? data : f))
      }));
      return data;
    } catch (error) {
      console.error('Restore flavour error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to restore flavour';
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
