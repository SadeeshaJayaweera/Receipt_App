import { create } from 'zustand';
import client from '../api/client';

const useAnalyticsStore = create((set, get) => ({
  dashboard: null,
  isLoading: false,
  error: null,
  currency: 'LKR',

  setCurrency: (currency) => set({ currency }),

  fetchDashboard: async (currencyOverride) => {
    set({ isLoading: true, error: null });
    try {
      const activeCurrency = currencyOverride || get().currency || 'LKR';
      const { data } = await client.get('/analytics/dashboard', {
        params: { currency: activeCurrency }
      });
      set({ dashboard: data, currency: activeCurrency, error: null });
      return data;
    } catch (err) {
      console.error('Fetch dashboard analytics error:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load analytics';
      set({ error: message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useAnalyticsStore;
