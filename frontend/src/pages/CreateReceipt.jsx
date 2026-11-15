import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  DeleteOutlined as DeleteIcon,
  Search as SearchIcon,
  ReceiptLong as ReceiptIcon,
  Payments as CashIcon,
  CreditCard as CardIcon,
  Smartphone as MobileIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as SuccessIcon,
  RemoveShoppingCart as ClearCartIcon,
  LocalDrink as DrinkIcon,
  Percent as PercentIcon,
  AttachMoney as FixedIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import AppLayout from '../components/AppLayout';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';
import {
  calculateReceiptTotals,
  calculateChange,
  formatCurrency,
  getCurrencySymbol
} from '../utils/calcEngine';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

const CATEGORIES = ['All', 'Fresh Juice', 'Smoothie', 'Milkshake', 'Mocktail', 'Special Drink'];

export default function CreateReceipt() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { flavours, fetchFlavours, isLoading: flavoursLoading } = useFlavourStore();
  const { createReceipt, isLoading: receiptSubmitting } = useReceiptStore();
  const user = useAuthStore((state) => state.user);

  // Currency & POS Settings
  const [currency, setCurrency] = useState(user?.currency || 'LKR');

  // Catalogue Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Order Ticket / Cart State
  const [cartItems, setCartItems] = useState([]);
  const [discountType, setDiscountType] = useState('fixed'); // fixed | percent
  const [discountValue, setDiscountValue] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(user?.taxRate || 0);

  // Customer State
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Tender State
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash | card | mobile
  const [cashReceived, setCashReceived] = useState('');
  const [formError, setFormError] = useState(null);

  // Post-Checkout Success Dialog State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);

  useEffect(() => {
    fetchFlavours();
  }, [fetchFlavours]);

  useEffect(() => {
    if (user?.currency) {
      setCurrency(user.currency);
    }
  }, [user?.currency]);

  // Filter flavours
  const availableFlavours = useMemo(() => {
    return flavours.filter((f) => !f.isArchived);
  }, [flavours]);

  const filteredFlavours = useMemo(() => {
    return availableFlavours.filter((f) => {
      if (selectedCategory !== 'All' && (f.category || 'Fresh Juice') !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (f.name || '').toLowerCase().includes(q);
        const matchesSku = (f.sku || '').toLowerCase().includes(q);
        return matchesName || matchesSku;
      }
      return true;
    });
  }, [availableFlavours, selectedCategory, searchQuery]);

  // Real-time Authoritative Calculations
  const totals = useMemo(() => {
    const rawDiscount = parseFloat(discountValue) || 0;
    const rawTaxRate = taxEnabled ? parseFloat(taxRate) || 0 : 0;

    return calculateReceiptTotals({
      items: cartItems,
      discount: rawDiscount,
      discountType,
      taxEnabled,
      taxRate: rawTaxRate,
      currency
    });
  }, [cartItems, discountValue, discountType, taxEnabled, taxRate, currency]);

  // Cash change calculation
  const changeCalculation = useMemo(() => {
    if (paymentMethod !== 'cash') return null;
    const received = parseFloat(cashReceived) || 0;
    return calculateChange(totals.totalAmount, received);
  }, [paymentMethod, cashReceived, totals.totalAmount]);

  // Add flavour to cart
  const handleAddToCart = (flavour) => {
    if (flavour.isAvailable === false) return;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.flavourId === flavour._id);
      if (existingIndex >= 0) {
        const next = [...prevItems];
        const newQty = next[existingIndex].quantity + 1;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          subtotal: Math.round((flavour.price * newQty + Number.EPSILON) * 100) / 100
        };
        return next;
      }

      return [
        ...prevItems,
        {
          flavourId: flavour._id,
          flavourName: flavour.name,
          quantity: 1,
          price: flavour.price,
          subtotal: flavour.price
        }
      ];
    });
  };

  // Stepper adjustments
  const handleIncrementQuantity = (index) => {
    setCartItems((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + 1;
      next[index] = {
        ...next[index],
        quantity: newQty,
        subtotal: Math.round((next[index].price * newQty + Number.EPSILON) * 100) / 100
      };
      return next;
    });
  };

  const handleDecrementQuantity = (index) => {
    setCartItems((prev) => {
      const next = [...prev];
      if (next[index].quantity <= 1) {
        return next.filter((_, i) => i !== index);
      }
      const newQty = next[index].quantity - 1;
      next[index] = {
        ...next[index],
        quantity: newQty,
        subtotal: Math.round((next[index].price * newQty + Number.EPSILON) * 100) / 100
      };
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setDiscountValue('');
    setCashReceived('');
    setFormError(null);
  };

  // Quick cash buttons
  const handleQuickCash = (amountToAdd) => {
    const base = amountToAdd === 0 ? totals.totalAmount : (parseFloat(cashReceived) || 0) + amountToAdd;
    setCashReceived(String(Math.ceil(base)));
  };

  // Submit handler (Draft vs Issued)
  const handleCheckout = async (targetStatus = 'issued') => {
    setFormError(null);

    if (cartItems.length === 0) {
      setFormError('Please add at least one item to the order ticket.');
      return;
    }

    if (targetStatus === 'issued' && paymentMethod === 'cash') {
      const received = parseFloat(cashReceived) || 0;
      if (received < totals.totalAmount) {
        setFormError(
          `Insufficient payment received: ${formatCurrency(totals.totalAmount - received, currency)} shortfall.`
        );
        return;
      }
    }

    try {
      const payload = {
        currency,
        status: targetStatus,
        items: totals.items.map((it) => ({
          flavourId: it.flavourId,
          flavourName: it.flavourName,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        discountType: totals.discountType,
        discountValue: totals.discountValue,
        taxEnabled: totals.taxEnabled,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) || totals.totalAmount : undefined,
        customerName: isWalkIn ? 'Walk-in' : (customerName.trim() || 'Walk-in'),
        customerPhone: isWalkIn ? '' : customerPhone.trim(),
        customer: {
          name: isWalkIn ? 'Walk-in' : (customerName.trim() || 'Walk-in'),
          phone: isWalkIn ? '' : customerPhone.trim()
        },
        payment: {
          method: paymentMethod,
          cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) || totals.totalAmount : undefined,
          changeGiven: changeCalculation ? changeCalculation.change : 0
        },
        notes: notes.trim()
      };

      const result = await createReceipt(payload);
      setCompletedReceipt(result);
      setCheckoutModalOpen(true);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to process receipt checkout.');
    }
  };

  // Print & PDF actions
  const handleThermalPrint = () => {
    if (completedReceipt) {
      printThermalReceipt(completedReceipt, user || {});
    }
  };

  const handleDownloadPdf = () => {
    if (completedReceipt) {
      downloadReceiptPdf(completedReceipt, user || {});
    }
  };

  const handleNewOrder = () => {
    setCheckoutModalOpen(false);
    setCompletedReceipt(null);
    handleClearCart();
    setIsWalkIn(true);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  return (
    <AppLayout title="POS Terminal / New Receipt">
      <Box sx={{ maxWidth: 1500, mx: 'auto', pb: 6 }}>
        {/* Error Notification */}
        {formError && (
          <Alert severity="error" onClose={() => setFormError(null)} sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Catalogue & Fast-Touch Tiles */}
          <Grid size={{ xs: 12, lg: 7.5 }}>
            {/* Search & Category Filter Toolbar */}
            <Card sx={{ mb: 2.5, p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search menu catalogue by flavour name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  <ToggleButtonGroup
                    size="small"
                    value={currency}
                    exclusive
                    onChange={(e, val) => val && setCurrency(val)}
                    aria-label="currency toggle"
                  >
                    <ToggleButton value="LKR" aria-label="LKR Currency">
                      Rs.
                    </ToggleButton>
                    <ToggleButton value="USD" aria-label="USD Currency">
                      $
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                <Tabs
                  value={selectedCategory}
                  onChange={(e, val) => setSelectedCategory(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="catalogue category tabs"
                  sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 2, fontSize: '0.85rem' } }}
                >
                  {CATEGORIES.map((cat) => (
                    <Tab key={cat} label={cat} value={cat} />
                  ))}
                </Tabs>
              </Stack>
            </Card>

            {/* Product Catalogue Grid */}
            {flavoursLoading ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            ) : filteredFlavours.length === 0 ? (
              <Card sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
                <DrinkIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
                <Typography variant="h6" fontWeight={700}>
                  No beverage items found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try clearing the category filter or search query.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredFlavours.map((flavour) => {
                  const isInStock = flavour.isAvailable !== false;
                  return (
                    <Grid key={flavour._id} size={{ xs: 6, sm: 4, md: 3 }}>
                      <Card
                        onClick={() => handleAddToCart(flavour)}
                        sx={{
                          height: '100%',
                          p: 1.5,
                          cursor: isInStock ? 'pointer' : 'not-allowed',
                          opacity: isInStock ? 1 : 0.5,
                          transition: 'all 0.15s ease-in-out',
                          border: `1px solid ${theme.palette.divider}`,
                          '&:hover': isInStock
                            ? {
                                transform: 'translateY(-2px)',
                                borderColor: 'primary.main',
                                boxShadow: theme.shadows[3]
                              }
                            : {},
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                color: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <DrinkIcon fontSize="small" />
                            </Box>
                            {!isInStock && (
                              <Chip label="Out of Stock" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                            )}
                          </Stack>

                          <Typography variant="subtitle2" fontWeight={700} noWrap title={flavour.name}>
                            {flavour.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {flavour.category || 'Fresh Juice'}
                          </Typography>
                        </Box>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                            {formatCurrency(flavour.price, currency)}
                          </Typography>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={!isInStock}
                            aria-label={`Add ${flavour.name}`}
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Grid>

          {/* Right Column: Order Ticket / Cart & Tender */}
          <Grid size={{ xs: 12, lg: 4.5 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Cart Header */}
              <CardHeader
                title={`Order Ticket (${totals.items.length})`}
                titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
                action={
                  cartItems.length > 0 && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<ClearCartIcon />}
                      onClick={handleClearCart}
                    >
                      Clear
                    </Button>
                  )
                }
                sx={{ borderBottom: `1px solid ${theme.palette.divider}`, py: 1.5 }}
              />

              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {/* Cart Items List */}
                {cartItems.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                    <Typography variant="body1" fontWeight={600} color="text.secondary">
                      Order Ticket is Empty
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Select beverage items from the menu catalogue to start ringing up the sale.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5} sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5, mb: 2 }}>
                    {cartItems.map((item, idx) => (
                      <Box
                        key={item.flavourId || idx}
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.action.hover, 0.3),
                          border: `1px solid ${theme.palette.divider}`
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box sx={{ flexGrow: 1, mr: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {item.flavourName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(item.price, currency)} each
                            </Typography>
                          </Box>

                          <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: 70, textAlign: 'right' }}>
                            {formatCurrency(item.subtotal, currency)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton
                              size="small"
                              onClick={() => handleDecrementQuantity(idx)}
                              aria-label={`decrease quantity of ${item.flavourName}`}
                              sx={{ border: `1px solid ${theme.palette.divider}`, p: 0.5 }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" fontWeight={700} sx={{ px: 1.5 }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleIncrementQuantity(idx)}
                              aria-label={`increase quantity of ${item.flavourName}`}
                              sx={{ border: `1px solid ${theme.palette.divider}`, p: 0.5 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Stack>

                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(idx)}
                            aria-label={`remove ${item.flavourName}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Divider sx={{ my: 1.5 }} />

                {/* Customer Information Section */}
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isWalkIn}
                        onChange={(e) => setIsWalkIn(e.target.checked)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography variant="caption" fontWeight={600}>Walk-in Customer</Typography>}
                  />

                  {!isWalkIn && (
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Customer Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Phone Number"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>

                {/* Discount & Tax Adjustments */}
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.action.hover, 0.2), mb: 2 }}>
                  <Grid container spacing={1.5} alignItems="center">
                    {/* Discount Input */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={`Discount (${discountType === 'percent' ? '%' : currency})`}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        slotProps={{
                          input: {
                            min: 0,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
                                  title="Toggle fixed vs percentage discount"
                                >
                                  {discountType === 'fixed' ? <FixedIcon fontSize="small" /> : <PercentIcon fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    </Grid>

                    {/* Tax Switch & Rate */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={taxEnabled}
                              onChange={(e) => setTaxEnabled(e.target.checked)}
                              size="small"
                            />
                          }
                          label={<Typography variant="caption">Tax</Typography>}
                          sx={{ mr: 0 }}
                        />
                        {taxEnabled && (
                          <TextField
                            size="small"
                            type="number"
                            label="Tax %"
                            value={taxRate}
                            onChange={(e) => setTaxRate(e.target.value)}
                            slotProps={{ htmlInput: { min: 0, max: 100 } }}
                            sx={{ width: 80 }}
                          />
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                {/* Financial Summary Breakdown */}
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(totals.subtotal, currency)}</Typography>
                  </Stack>

                  {totals.discount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="error.main">Discount</Typography>
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        -{formatCurrency(totals.discount, currency)}
                      </Typography>
                    </Stack>
                  )}

                  {totals.taxAmount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Tax ({totals.taxRate}%)</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatCurrency(totals.taxAmount, currency)}</Typography>
                    </Stack>
                  )}

                  <Divider sx={{ my: 0.5 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>Grand Total</Typography>
                    <Typography variant="h5" fontWeight={800} color="primary.main">
                      {formatCurrency(totals.totalAmount, currency)}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Payment Tender Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    Payment Tender Method
                  </Typography>
                  <ToggleButtonGroup
                    fullWidth
                    size="small"
                    value={paymentMethod}
                    exclusive
                    onChange={(e, val) => val && setPaymentMethod(val)}
                    aria-label="payment method selector"
                    sx={{ mb: 1.5 }}
                  >
                    <ToggleButton value="cash" aria-label="Cash Tender">
                      <CashIcon fontSize="small" sx={{ mr: 0.5 }} /> Cash
                    </ToggleButton>
                    <ToggleButton value="card" aria-label="Card Tender">
                      <CardIcon fontSize="small" sx={{ mr: 0.5 }} /> Card
                    </ToggleButton>
                    <ToggleButton value="mobile" aria-label="Digital Tender">
                      <MobileIcon fontSize="small" sx={{ mr: 0.5 }} /> Mobile
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {/* Cash Change Calculator */}
                  {paymentMethod === 'cash' && (
                    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.success.main, 0.08), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`Cash Received (${currency})`}
                        placeholder="e.g. 1000"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        sx={{ mb: 1, bgcolor: 'background.paper' }}
                      />

                      <Stack direction="row" spacing={0.75} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip label="Exact" size="small" onClick={() => handleQuickCash(0)} />
                        <Chip label="+50" size="small" onClick={() => handleQuickCash(50)} />
                        <Chip label="+100" size="small" onClick={() => handleQuickCash(100)} />
                        <Chip label="+500" size="small" onClick={() => handleQuickCash(500)} />
                        <Chip label="+1000" size="small" onClick={() => handleQuickCash(1000)} />
                      </Stack>

                      {changeCalculation && (
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>
                            {changeCalculation.isSufficient ? 'Change Due:' : 'Shortfall:'}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color={changeCalculation.isSufficient ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(
                              changeCalculation.isSufficient ? changeCalculation.change : changeCalculation.shortfall,
                              currency
                            )}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Primary Checkout Actions */}
                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<ReceiptIcon />}
                    disabled={cartItems.length === 0 || receiptSubmitting}
                    onClick={() => handleCheckout('issued')}
                    sx={{ py: 1.25, fontWeight: 700, fontSize: '1rem' }}
                  >
                    {receiptSubmitting ? 'Processing Sale...' : 'Complete & Issue Receipt'}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    disabled={cartItems.length === 0 || receiptSubmitting}
                    onClick={() => handleCheckout('draft')}
                  >
                    Save as Draft Ticket
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Post-Checkout Success Dialog */}
        <Dialog open={checkoutModalOpen} onClose={handleNewOrder} maxWidth="xs" fullWidth>
          <DialogTitle component="div" sx={{ textAlign: 'center', pt: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1
              }}
            >
              <SuccessIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              Receipt Issued!
            </Typography>
            <Typography variant="subtitle2" color="primary.main" fontFamily="monospace">
              {completedReceipt?.receiptNumber}
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="h4" fontWeight={800} sx={{ my: 1 }}>
              {formatCurrency(completedReceipt?.totalAmount || totals.totalAmount, currency)}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Customer: <strong>{completedReceipt?.customerName || 'Walk-in'}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment: <strong>{completedReceipt?.paymentMethod?.toUpperCase() || paymentMethod.toUpperCase()}</strong>
            </Typography>

            {changeCalculation && changeCalculation.change > 0 && (
              <Box sx={{ mt: 1.5, p: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                <Typography variant="body2" color="success.dark" fontWeight={600}>
                  Change Given: {formatCurrency(changeCalculation.change, currency)}
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleThermalPrint}
              sx={{ py: 1, fontWeight: 700 }}
            >
              Print 80mm Receipt
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<PdfIcon />}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={handleNewOrder}
              sx={{ mt: 0.5 }}
            >
              Start Next Order
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
