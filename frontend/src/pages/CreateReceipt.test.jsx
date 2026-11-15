import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';
import CreateReceipt from './CreateReceipt';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';

vi.mock('../store/authStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/flavourStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/receiptStore', () => ({
  default: vi.fn()
}));

vi.mock('../utils/thermalPrinter', () => ({
  printThermalReceipt: vi.fn()
}));

vi.mock('../utils/pdfGenerator', () => ({
  downloadReceiptPdf: vi.fn()
}));

describe('CreateReceipt POS Terminal Suite', () => {
  const theme = getAppTheme('light');

  const mockUser = {
    _id: 'user123',
    name: 'Sadeesha',
    businessName: 'Fresh Citrus Juice Bar',
    currency: 'LKR',
    role: 'owner'
  };

  const mockFlavours = [
    {
      _id: 'f1',
      name: 'Fresh Lime & Mint',
      price: 450,
      category: 'Fresh Juice',
      sku: 'LIM-01',
      isAvailable: true,
      isArchived: false
    },
    {
      _id: 'f2',
      name: 'Mango Passion Delight',
      price: 550,
      category: 'Smoothie',
      sku: 'MAN-02',
      isAvailable: true,
      isArchived: false
    },
    {
      _id: 'f3',
      name: 'Sold Out Juice',
      price: 400,
      category: 'Fresh Juice',
      sku: 'OUT-03',
      isAvailable: false,
      isArchived: false
    }
  ];

  let mockFetchFlavours;
  let mockCreateReceipt;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchFlavours = vi.fn().mockResolvedValue(mockFlavours);
    mockCreateReceipt = vi.fn().mockResolvedValue({
      _id: 'rcp123',
      receiptNumber: 'RCP-202611-0001',
      totalAmount: 900,
      customerName: 'Walk-in',
      paymentMethod: 'cash',
      status: 'issued',
      items: [
        { flavourId: 'f1', flavourName: 'Fresh Lime & Mint', quantity: 2, price: 450, subtotal: 900 }
      ]
    });

    useAuthStore.mockImplementation((selector) => {
      const state = { user: mockUser, logout: vi.fn() };
      return selector ? selector(state) : state;
    });

    useFlavourStore.mockReturnValue({
      flavours: mockFlavours,
      isLoading: false,
      fetchFlavours: mockFetchFlavours
    });

    useReceiptStore.mockReturnValue({
      createReceipt: mockCreateReceipt,
      isLoading: false
    });
  });

  const renderPOS = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CreateReceipt />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  it('renders POS terminal layout with menu catalogue and order ticket', async () => {
    renderPOS();

    expect(screen.getByText(/Fresh Lime & Mint/i)).toBeInTheDocument();
    expect(screen.getByText(/Mango Passion Delight/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Ticket \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Ticket is Empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete & Issue Receipt/i })).toBeDisabled();
  });

  it('adds item to order ticket when catalogue tile is clicked', async () => {
    renderPOS();

    const limeCard = screen.getByText('Fresh Lime & Mint');
    fireEvent.click(limeCard);

    expect(screen.getByText(/Order Ticket \(1\)/i)).toBeInTheDocument();
    expect(screen.getAllByText('Fresh Lime & Mint').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rs. 450.00 each')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete & Issue Receipt/i })).not.toBeDisabled();
  });

  it('increments quantity and recalculates totals when + button is clicked', async () => {
    renderPOS();

    const limeCard = screen.getByText('Fresh Lime & Mint');
    fireEvent.click(limeCard);

    const plusBtn = screen.getByLabelText(/increase quantity of Fresh Lime & Mint/i);
    fireEvent.click(plusBtn);

    // Quantity should be 2, subtotal 900
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('Rs. 900.00').length).toBeGreaterThanOrEqual(1);
  });

  it('removes item from cart when delete button is clicked', async () => {
    renderPOS();

    const limeCard = screen.getByText('Fresh Lime & Mint');
    fireEvent.click(limeCard);

    const deleteBtn = screen.getByLabelText(/remove Fresh Lime & Mint/i);
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Order Ticket is Empty/i)).toBeInTheDocument();
  });

  it('calculates cash change and shortfall correctly', async () => {
    renderPOS();

    const limeCard = screen.getByText('Fresh Lime & Mint');
    fireEvent.click(limeCard); // Total: 450

    const cashInput = screen.getByLabelText(/Cash Received \(LKR\)/i);

    // Shortfall case: 400 received on 450 total
    fireEvent.change(cashInput, { target: { value: '400' } });
    expect(screen.getByText(/Shortfall:/i)).toBeInTheDocument();
    expect(screen.getByText('Rs. 50.00')).toBeInTheDocument();

    // Sufficient case: 500 received on 450 total
    fireEvent.change(cashInput, { target: { value: '500' } });
    expect(screen.getByText(/Change Due:/i)).toBeInTheDocument();
    expect(screen.getByText('Rs. 50.00')).toBeInTheDocument();
  });

  it('submits checkout and opens success dialog upon issuing receipt', async () => {
    renderPOS();

    const limeCard = screen.getByText('Fresh Lime & Mint');
    fireEvent.click(limeCard); // 450
    fireEvent.click(limeCard); // 900

    const cashInput = screen.getByLabelText(/Cash Received \(LKR\)/i);
    fireEvent.change(cashInput, { target: { value: '1000' } });

    const issueBtn = screen.getByRole('button', { name: /Complete & Issue Receipt/i });
    fireEvent.click(issueBtn);

    await waitFor(() => {
      expect(mockCreateReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'issued',
          totalAmount: 900,
          customerName: 'Walk-in'
        })
      );
    });

    expect(await screen.findByText(/Receipt Issued!/i)).toBeInTheDocument();
    expect(screen.getByText('RCP-202611-0001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print 80mm Receipt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
  });

  it('allows saving receipt as draft ticket', async () => {
    renderPOS();

    const limeCard = screen.getByText('Fresh Lime & Mint');
    fireEvent.click(limeCard);

    const draftBtn = screen.getByRole('button', { name: /Save as Draft Ticket/i });
    fireEvent.click(draftBtn);

    await waitFor(() => {
      expect(mockCreateReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
          totalAmount: 450
        })
      );
    });
  });
});
