import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getAppTheme } from '../theme/theme';
import Flavours from './Flavours';
import useAuthStore from '../store/authStore';
import useFlavourStore from '../store/flavourStore';

vi.mock('../store/authStore', () => ({
  default: vi.fn()
}));

vi.mock('../store/flavourStore', () => ({
  default: vi.fn()
}));

describe('Flavours Management Page Suite', () => {
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
      description: 'Refreshing lime juice with garden mint',
      isAvailable: true,
      isArchived: false
    },
    {
      _id: 'f2',
      name: 'Mango Passion Delight',
      price: 550,
      category: 'Smoothie',
      sku: 'MAN-02',
      description: 'Sweet ripe mango blended with passionfruit',
      isAvailable: true,
      isArchived: false
    },
    {
      _id: 'f3',
      name: 'Avocado Shake',
      price: 650,
      category: 'Milkshake',
      sku: 'AVO-03',
      description: 'Creamy avocado blend with milk',
      isAvailable: false,
      isArchived: false
    }
  ];

  let mockFetchFlavours;
  let mockAddFlavour;
  let mockUpdateFlavour;
  let mockToggleAvailability;
  let mockArchiveFlavour;
  let mockRestoreFlavour;
  let mockDeleteFlavour;
  let mockClearError;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchFlavours = vi.fn().mockResolvedValue(mockFlavours);
    mockAddFlavour = vi.fn().mockResolvedValue({ _id: 'f4', name: 'Watermelon Splash', price: 350 });
    mockUpdateFlavour = vi.fn().mockResolvedValue({ _id: 'f1', name: 'Fresh Lime & Extra Mint', price: 480 });
    mockToggleAvailability = vi.fn().mockResolvedValue({ _id: 'f1', isAvailable: false });
    mockArchiveFlavour = vi.fn().mockResolvedValue({ _id: 'f1', isArchived: true });
    mockRestoreFlavour = vi.fn().mockResolvedValue({ _id: 'f1', isArchived: false });
    mockDeleteFlavour = vi.fn().mockResolvedValue({ message: 'Deleted' });
    mockClearError = vi.fn();

    useAuthStore.mockImplementation((selector) => {
      const state = { user: mockUser, logout: vi.fn() };
      return selector ? selector(state) : state;
    });

    useFlavourStore.mockReturnValue({
      flavours: mockFlavours,
      isLoading: false,
      error: null,
      fetchFlavours: mockFetchFlavours,
      addFlavour: mockAddFlavour,
      updateFlavour: mockUpdateFlavour,
      toggleAvailability: mockToggleAvailability,
      archiveFlavour: mockArchiveFlavour,
      restoreFlavour: mockRestoreFlavour,
      deleteFlavour: mockDeleteFlavour,
      clearError: mockClearError
    });
  });

  const renderFlavours = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Flavours />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  it('renders flavours page header, stats cards, and action button', async () => {
    renderFlavours();

    expect(screen.getByRole('heading', { name: /Flavours & Menu Inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Flavour/i })).toBeInTheDocument();

    // Stats cards
    expect(screen.getByText(/Total Flavours/i)).toBeInTheDocument();
    expect(screen.getByText(/In Stock & Available/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Out of Stock/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Menu Categories/i)).toBeInTheDocument();
  });

  it('renders flavours inventory table with item details, formatted prices, and stock switches', async () => {
    renderFlavours();

    expect(screen.getByText('Fresh Lime & Mint')).toBeInTheDocument();
    expect(screen.getByText('Rs. 450.00')).toBeInTheDocument();
    expect(screen.getByText('SKU: LIM-01')).toBeInTheDocument();

    expect(screen.getByText('Mango Passion Delight')).toBeInTheDocument();
    expect(screen.getByText('Rs. 550.00')).toBeInTheDocument();

    expect(screen.getByText('Avocado Shake')).toBeInTheDocument();
    expect(screen.getByText('Rs. 650.00')).toBeInTheDocument();

    // Check stock switches
    const limeStockSwitch = screen.getByLabelText(/Toggle stock for Fresh Lime & Mint/i);
    expect(limeStockSwitch).toBeChecked();

    const avoStockSwitch = screen.getByLabelText(/Toggle stock for Avocado Shake/i);
    expect(avoStockSwitch).not.toBeChecked();
  });

  it('triggers toggleAvailability when stock switch is clicked', async () => {
    renderFlavours();

    const limeStockSwitch = screen.getByLabelText(/Toggle stock for Fresh Lime & Mint/i);
    fireEvent.click(limeStockSwitch);

    expect(mockToggleAvailability).toHaveBeenCalledWith('f1');
  });

  it('filters flavours when searching by name or SKU', async () => {
    renderFlavours();

    const searchInput = screen.getByPlaceholderText(/Search by flavour name, SKU, description.../i);
    fireEvent.change(searchInput, { target: { value: 'Mango' } });

    expect(screen.getByText('Mango Passion Delight')).toBeInTheDocument();
    expect(screen.queryByText('Fresh Lime & Mint')).not.toBeInTheDocument();
    expect(screen.queryByText('Avocado Shake')).not.toBeInTheDocument();
  });

  it('opens Add Flavour dialog and submits new flavour', async () => {
    renderFlavours();

    const addBtn = screen.getByRole('button', { name: /Add Flavour/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Add New Juice Flavour/i })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Flavour Name \*/i);
    const priceInput = screen.getByLabelText(/Price \(LKR\) \*/i);
    const skuInput = screen.getByLabelText(/SKU \/ Item Code/i);

    fireEvent.change(nameInput, { target: { value: 'Watermelon Splash' } });
    fireEvent.change(priceInput, { target: { value: '350' } });
    fireEvent.change(skuInput, { target: { value: 'WAT-04' } });

    const createBtn = screen.getByRole('button', { name: /Create Flavour/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(mockAddFlavour).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Watermelon Splash',
          price: 350,
          sku: 'WAT-04'
        })
      );
    });
  });

  it('opens Edit Flavour dialog with existing data and submits updates', async () => {
    renderFlavours();

    const editBtn = screen.getByLabelText(/edit Fresh Lime & Mint/i);
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: /Edit Juice Flavour/i })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Flavour Name \*/i);
    expect(nameInput).toHaveValue('Fresh Lime & Mint');

    fireEvent.change(nameInput, { target: { value: 'Fresh Lime & Extra Mint' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateFlavour).toHaveBeenCalledWith(
        'f1',
        expect.objectContaining({
          name: 'Fresh Lime & Extra Mint'
        })
      );
    });
  });

  it('opens confirmation dialog and archives flavour when confirmed', async () => {
    renderFlavours();

    const deleteBtn = screen.getByLabelText(/delete Fresh Lime & Mint/i);
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: /Archive Flavour\?/i })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to archive "Fresh Lime & Mint"\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^Archive$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockArchiveFlavour).toHaveBeenCalledWith('f1');
    });
  });

  it('renders friendly empty state when no flavours match search', () => {
    renderFlavours();

    const searchInput = screen.getByPlaceholderText(/Search by flavour name, SKU, description.../i);
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Juice' } });

    expect(screen.getByText(/No flavours match your search filters/i)).toBeInTheDocument();
  });
});
