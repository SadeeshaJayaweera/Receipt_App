import { create } from 'zustand';
import client from '../api/client';

const useReceiptStore = create((set) => ({
  receipts: [],
  currentReceipt: null,
  isLoading: false,
  error: null,

  fetchReceipts: async (page = 1) => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/receipts', { params: { page } });
      set({ receipts: data.receipts, error: null });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createReceipt: async (receiptData) => {
    try {
      const { data } = await client.post('/receipts', receiptData);
      set(state => ({ receipts: [data, ...state.receipts] }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message });
      throw error;
    }
  },

  downloadPDF: async (receiptId) => {
    try {
      const response = await client.get(`/receipts/${receiptId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      set({ error: error.response?.data?.message });
      throw error;
    }
  },

  deleteReceipt: async (id) => {
    try {
      await client.delete(`/receipts/${id}`);
      set(state => ({
        receipts: state.receipts.filter(r => r._id !== id)
      }));
    } catch (error) {
      set({ error: error.response?.data?.message });
      throw error;
    }
  }
}));

export default useReceiptStore;