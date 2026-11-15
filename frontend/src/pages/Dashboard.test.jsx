import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';
import Dashboard from './Dashboard';
import useAuthStore from '../store/authStore';
import useAnalyticsStore from '../store/analyticsStore';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';

// Mock zustand stores
vi.mock('../store/authStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/analyticsStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/flavourStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/receiptStore', () => ({
  default: vi.fn()
}));

// Mock Recharts ResponsiveContainer to render children reliably in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div data-testid="mock-responsive-container">{children}</div>
  };
});

describe('Dashboard Component Suite', () => {
  const theme = getAppTheme('light');

  const mockUser = {
    _id: 'user123',
    name: 'Sadeesha',
    businessName: 'Fresh Citrus Juice Bar',
    currency: 'LKR',
    role: 'owner'
  };

  const mockDashboardData = {
    currency: 'LKR',
    metrics: {
      totalRevenue: 154200.5,
      todayRevenue: 14500,
      todayReceipts: 18,
      weekRevenue: 62000,
      monthRevenue: 154200.5,
      avgOrderValue: 805.55,
      counts: {
        total: 195,
        issued: 185,
        draft: 4,
        voided: 6
      }
    },
    topFlavours: [
      { name: 'Fresh Lime & Mint', quantity: 84, revenue: 37800 },
      { name: 'Mango Passion Delight', quantity: 62, revenue: 31000 },
      { name: 'Orange Burst', quantity: 45, revenue: 20250 }
    ],
    paymentBreakdown: [
      { method: 'cash', totalRevenue: 98000, count: 120 },
      { method: 'card', totalRevenue: 42000, count: 50 },
      { method: 'digital_wallet', totalRevenue: 14200.5, count: 15 }
    ],
    dailyTimeline: [
      { date: '2026-11-10', revenue: 12000, count: 14 },
      { date: '2026-11-11', revenue: 15000, count: 18 },
      { date: '2026-11-12', revenue: 14500, count: 17 }
    ]
  };

  const mockFlavours = [
    { _id: 'f1', name: 'Fresh Lime & Mint', price: 450, isAvailable: true },
    { _id: 'f2', name: 'Mango Passion Delight', price: 500, isAvailable: true },
    { _id: 'f3', name: 'Avocado Shake', price: 600, isAvailable: false }
  ];

  const mockReceipts = [
    {
      _id: 'r1',
      receiptNumber: 'RCP-202611-0001',
      customerName: 'Kamal Perera',
      status: 'issued',
      totalAmount: 1350,
      paymentMethod: 'cash',
      createdAt: '2026-11-12T10:00:00.000Z'
    },
    {
      _id: 'r2',
      receiptNumber: 'RCP-202611-0002',
      customerName: 'Nimal Silva',
      status: 'draft',
      totalAmount: 900,
      paymentMethod: 'card',
      createdAt: '2026-11-12T11:30:00.000Z'
    }
  ];

  let mockFetchDashboard;
  let mockFetchFlavours;
  let mockFetchReceipts;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchDashboard = vi.fn().mockResolvedValue(mockDashboardData);
    mockFetchFlavours = vi.fn().mockResolvedValue(mockFlavours);
    mockFetchReceipts = vi.fn().mockResolvedValue({ receipts: mockReceipts });

    useAuthStore.mockImplementation((selector) => {
      const state = { user: mockUser, logout: vi.fn() };
      return selector ? selector(state) : state;
    });

    useAnalyticsStore.mockReturnValue({
      dashboard: mockDashboardData,
      isLoading: false,
      error: null,
      fetchDashboard: mockFetchDashboard
    });

    useFlavourStore.mockReturnValue({
      flavours: mockFlavours,
      isLoading: false,
      fetchFlavours: mockFetchFlavours
    });

    useReceiptStore.mockReturnValue({
      receipts: mockReceipts,
      isLoading: false,
      fetchReceipts: mockFetchReceipts
    });
  });

  const renderDashboard = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  it('renders welcome banner with business name and action controls', async () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: /Welcome back, Fresh Citrus Juice Bar!/i })).toBeInTheDocument();
    expect(screen.getByText(/Real-time sales performance/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /New Receipt/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /refresh dashboard/i })).toBeInTheDocument();
  });

  it('renders key financial KPI cards with formatted currencies', async () => {
    renderDashboard();

    expect(await screen.findByText(/Today's Revenue/i)).toBeInTheDocument();
    expect(await screen.findByText(/Rs. 14,500.00/i)).toBeInTheDocument();

    expect(screen.getByText(/This Week/i)).toBeInTheDocument();
    expect(screen.getByText(/Rs. 62,000.00/i)).toBeInTheDocument();

    expect(screen.getByText(/This Month/i)).toBeInTheDocument();
    expect(screen.getByText(/All-Time Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/AVG. ORDER VALUE/i)).toBeInTheDocument();
    expect(screen.getByText(/Rs. 805.55/i)).toBeInTheDocument();
  });

  it('renders top-selling flavours leaderboard and progress metrics', async () => {
    renderDashboard();

    expect(await screen.findByText('Top-Selling Flavours')).toBeInTheDocument();
    expect(await screen.findByText('Fresh Lime & Mint')).toBeInTheDocument();
    expect(screen.getByText('84 cups')).toBeInTheDocument();
    expect(screen.getByText('Mango Passion Delight')).toBeInTheDocument();
    expect(screen.getByText('62 cups')).toBeInTheDocument();
  });

  it('renders recent receipts table with receipt numbers and status chips', async () => {
    renderDashboard();

    expect(await screen.findByText('Recent Receipts')).toBeInTheDocument();
    expect(await screen.findByText('RCP-202611-0001')).toBeInTheDocument();
    expect(screen.getByText('Kamal Perera')).toBeInTheDocument();
    expect(screen.getByText('Issued')).toBeInTheDocument();
    expect(screen.getByText('RCP-202611-0002')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('triggers currency change when USD toggle is clicked', async () => {
    renderDashboard();

    const usdToggle = await screen.findByRole('button', { name: /USD Currency/i });
    fireEvent.click(usdToggle);

    expect(mockFetchDashboard).toHaveBeenCalledWith('USD');
  });

  it('renders loading skeletons when analytics is loading', () => {
    useAnalyticsStore.mockReturnValue({
      dashboard: null,
      isLoading: true,
      error: null,
      fetchDashboard: mockFetchDashboard
    });

    renderDashboard();

    // Skeletons are rendered during loading
    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders error alert when analytics fetch encounters failure', () => {
    useAnalyticsStore.mockReturnValue({
      dashboard: null,
      isLoading: false,
      error: 'Network connection refused',
      fetchDashboard: mockFetchDashboard
    });

    renderDashboard();

    expect(screen.getByText(/Failed to fetch store analytics: Network connection refused/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(mockFetchDashboard).toHaveBeenCalled();
  });
});
