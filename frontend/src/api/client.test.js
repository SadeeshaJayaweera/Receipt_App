import { describe, it, expect, vi, beforeEach } from 'vitest';
import client, { isRetryableError, extractErrorMessage, MAX_RETRIES } from './client';

describe('API Client Network Resilience Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('attaches Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('token', 'sample-jwt-token-xyz');

    // Test the request interceptor directly
    const interceptor = client.interceptors.request.handlers[0];
    const initialConfig = { headers: {} };
    const modifiedConfig = interceptor.fulfilled(initialConfig);

    expect(modifiedConfig.headers.Authorization).toBe('Bearer sample-jwt-token-xyz');
  });

  it('does not attach Authorization header when no token is present', async () => {
    const interceptor = client.interceptors.request.handlers[0];
    const initialConfig = { headers: {} };
    const modifiedConfig = interceptor.fulfilled(initialConfig);

    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });

  describe('isRetryableError helper', () => {
    it('identifies network disconnect and timeout errors as retryable', () => {
      expect(isRetryableError({ code: 'ECONNABORTED' })).toBe(true);
      expect(isRetryableError({ message: 'Network Error' })).toBe(true);
      expect(isRetryableError({ response: null })).toBe(true);
    });

    it('identifies 502, 503, 504 gateway/service errors as retryable', () => {
      expect(isRetryableError({ response: { status: 502 } })).toBe(true);
      expect(isRetryableError({ response: { status: 503 } })).toBe(true);
      expect(isRetryableError({ response: { status: 504 } })).toBe(true);
    });

    it('does not retry 4xx client errors (400, 401, 403, 404, 422)', () => {
      expect(isRetryableError({ response: { status: 400 } })).toBe(false);
      expect(isRetryableError({ response: { status: 401 } })).toBe(false);
      expect(isRetryableError({ response: { status: 403 } })).toBe(false);
      expect(isRetryableError({ response: { status: 404 } })).toBe(false);
      expect(isRetryableError({ response: { status: 422 } })).toBe(false);
    });
  });

  describe('extractErrorMessage helper', () => {
    it('extracts server message from structured response.data.message', () => {
      const error = {
        response: {
          data: {
            message: 'Flavour SKU already exists for this tenant'
          }
        }
      };
      expect(extractErrorMessage(error)).toBe('Flavour SKU already exists for this tenant');
    });

    it('extracts timeout and network error descriptions gracefully', () => {
      expect(extractErrorMessage({ code: 'ECONNABORTED' })).toMatch(/timed out/i);
      expect(extractErrorMessage({ message: 'Network Error' })).toMatch(/Network connection lost/i);
    });

    it('returns string input directly or default fallback', () => {
      expect(extractErrorMessage('Custom string error message')).toBe('Custom string error message');
      expect(extractErrorMessage(null)).toMatch(/unexpected error/i);
    });
  });
});
