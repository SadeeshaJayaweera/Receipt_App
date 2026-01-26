import { create } from 'zustand';
import client from '../api/client';

const useReceiptStore = create((set, get) => ({
  receipts: [],
  currentReceipt: null,
  isLoading: false,
  error: null,

  fetchReceipts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/receipts');
      // Handle both array and object response formats
      const receiptsArray = Array.isArray(data) ? data : (data.receipts || []);
      set({ receipts: receiptsArray, error: null });
      return receiptsArray;
    } catch (error) {
      console.error('Fetch receipts error:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch receipts', receipts: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createReceipt: async (receiptData) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post('/receipts', receiptData);
      set(state => ({
        receipts: [data, ...state.receipts],
        currentReceipt: data,
        error: null
      }));
      return data;
    } catch (error) {
      console.error('Create receipt error:', error);
      set({ error: error.response?.data?.message || 'Failed to create receipt' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentReceipt: (receipt) => {
    set({ currentReceipt: receipt });
  },

  clearCurrentReceipt: () => {
    set({ currentReceipt: null });
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
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download PDF error:', error);
      set({ error: error.response?.data?.message || 'Failed to download PDF' });
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
      console.error('Delete receipt error:', error);
      set({ error: error.response?.data?.message || 'Failed to delete receipt' });
      throw error;
    }
  }
}));

export default useReceiptStore;