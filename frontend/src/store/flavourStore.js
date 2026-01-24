import { create } from 'zustand';
import client from '../api/client';

const useFlavourStore = create((set) => ({
  flavours: [],
  isLoading: false,
  error: null,

  fetchFlavours: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/flavours');
      set({ flavours: data, error: null });
    } catch (error) {
      set({ error: error.response?.data?.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addFlavour: async (flavourData) => {
    try {
      const { data } = await client.post('/flavours', flavourData);
      set(state => ({ flavours: [...state.flavours, data] }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message });
      throw error;
    }
  },

  updateFlavour: async (id, flavourData) => {
    try {
      const { data } = await client.put(`/flavours/${id}`, flavourData);
      set(state => ({
        flavours: state.flavours.map(f => f._id === id ? data : f)
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message });
      throw error;
    }
  },

  deleteFlavour: async (id) => {
    try {
      await client.delete(`/flavours/${id}`);
      set(state => ({
        flavours: state.flavours.filter(f => f._id !== id)
      }));
    } catch (error) {
      set({ error: error.response?.data?.message });
      throw error;
    }
  }
}));

export default useFlavourStore;