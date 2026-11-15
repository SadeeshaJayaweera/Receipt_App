import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import Navbar from './Navbar';
import { AppThemeProvider } from '../theme/ThemeContext';

vi.mock('../store/authStore', () => ({
  default: () => ({
    user: {
      businessName: 'Paradise Island Juices',
      email: 'owner@paradise.lk',
      logoIcon: '🍹',
      defaultCurrency: 'LKR'
    },
    logout: vi.fn()
  })
}));

describe('Material UI AppLayout & Navigation Suite', () => {
  it('AppLayout renders store brand, navigation links, and child content', () => {
    render(
      <AppThemeProvider>
        <BrowserRouter>
          <AppLayout title="Test Section">
            <div data-testid="page-content">Sample Page Body</div>
          </AppLayout>
        </BrowserRouter>
      </AppThemeProvider>
    );

    expect(screen.getByTestId('page-content')).toBeDefined();
    expect(screen.getByText('Sample Page Body')).toBeDefined();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Flavours & Stock').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Receipt History').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Store Settings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Paradise Island Juices').length).toBeGreaterThanOrEqual(1);
  });

  it('Navbar renders brand and desktop navigation links', () => {
    render(
      <AppThemeProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AppThemeProvider>
    );

    expect(screen.getAllByText('Paradise Island Juices').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('History').length).toBeGreaterThanOrEqual(1);
  });
});
