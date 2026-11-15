import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const MAX_RETRIES = 2;
export const RETRY_DELAY_BASE_MS = 300;

export const isRetryableError = (error) => {
  if (!error) return false;
  // Network errors without response or connection timeouts
  if (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
    return true;
  }
  // Transient server gateway errors (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
  const status = error.response.status;
  return status === 502 || status === 503 || status === 504;
};

export const extractErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  // Server structured error response
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return typeof error.response.data.error === 'string'
      ? error.response.data.error
      : JSON.stringify(error.response.data.error);
  }

  // Network / timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Connection timed out. Please check your network and try again.';
  }
  if (error.message?.includes('Network Error') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return 'Network connection lost. Please check your internet connection.';
  }

  return error.message || 'Server communication failed.';
};

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach bearer token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and exponential backoff retries for idempotent requests
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle token expiration / invalidation (401)
    if (error.response?.status === 401 && !config?._skipAuthRedirect) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location?.pathname && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Retry handling for transient errors on idempotent operations
    if (config && isRetryableError(error)) {
      const isIdempotent = ['get', 'head', 'options'].includes(config.method?.toLowerCase());
      const allowRetry = config.retry !== false && (isIdempotent || config.forceRetry);

      config.__retryCount = config.__retryCount || 0;

      if (allowRetry && config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const delay = RETRY_DELAY_BASE_MS * Math.pow(2, config.__retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return client(config);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
