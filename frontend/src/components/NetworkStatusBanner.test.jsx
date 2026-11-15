import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NetworkStatusBanner from './NetworkStatusBanner';

describe('NetworkStatusBanner Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });
  });

  it('renders nothing when browser is online and no state change has occurred', () => {
    const { container } = render(<NetworkStatusBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('displays offline warning banner when browser goes offline', () => {
    render(<NetworkStatusBanner />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Offline Mode: Internet connection is currently unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Connection/i })).toBeInTheDocument();
  });

  it('displays connection restored alert when browser transitions back online', () => {
    render(<NetworkStatusBanner />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText(/Offline Mode/i)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByText(/Connection Restored: You are back online/i)).toBeInTheDocument();
  });

  it('checks connection when Check Connection button is clicked', () => {
    render(<NetworkStatusBanner />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    const checkBtn = screen.getByRole('button', { name: /Check Connection/i });
    expect(checkBtn).toBeInTheDocument();

    // Mock navigator.onLine as true
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });

    act(() => {
      fireEvent.click(checkBtn);
    });

    expect(screen.getByText(/Connection Restored/i)).toBeInTheDocument();
  });
});
