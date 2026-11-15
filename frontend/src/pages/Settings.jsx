import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  CircularProgress,
  Grid,
  MenuItem,
  InputAdornment,
  Divider,
  Chip,
  IconButton,
  Paper,
  useTheme
} from '@mui/material';
import {
  Storefront as StoreIcon,
  ReceiptLong as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import AppLayout from '../components/AppLayout';
import ReceiptThermalPreview from '../components/ReceiptThermalPreview';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/calcEngine';

const AVAILABLE_ICONS = ['🧃', '🥤', '🍹', '🍊', '🍋', '🍍', '☕', '🍉'];

export default function Settings() {
  const theme = useTheme();
  const { user, updateProfile, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState(0);

  // Business profile state
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  // Branding & receipt state
  const [receiptPrefix, setReceiptPrefix] = useState('RCP');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [logoIcon, setLogoIcon] = useState('🧃');
  const [showLogo, setShowLogo] = useState(true);
  const [showCustomerInfo, setShowCustomerInfo] = useState(true);

  // Financial & tax state
  const [defaultCurrency, setDefaultCurrency] = useState('LKR');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);

  // Printing preferences
  const [paperWidth, setPaperWidth] = useState('80mm');
  const [autoPrintOnIssue, setAutoPrintOnIssue] = useState(false);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName || '');
      setTagline(user.tagline || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setWebsite(user.website || '');
      setDefaultCurrency(user.defaultCurrency || 'LKR');
      setReceiptPrefix(user.receiptPrefix || 'RCP');
      setReceiptFooter(user.receiptFooter || 'Thank you for your business!');
      setLogoIcon(user.logoIcon || '🧃');
      setShowLogo(user.showLogo !== undefined ? user.showLogo : true);
      setShowCustomerInfo(user.showCustomerInfo !== undefined ? user.showCustomerInfo : true);
      setTaxEnabled(Boolean(user.taxEnabled));
      setTaxRate(user.taxRate || 0);
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!businessName.trim()) {
      setErrorMessage('Business name is required.');
      return;
    }

    try {
      await updateProfile({
        businessName: businessName.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        address: address.trim(),
        website: website.trim(),
        defaultCurrency,
        receiptPrefix: receiptPrefix.trim().toUpperCase(),
        receiptFooter: receiptFooter.trim(),
        logoIcon,
        showLogo,
        showCustomerInfo,
        taxEnabled,
        taxRate: Number(taxRate) || 0
      });
      setSuccessMessage('Business settings and branding updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update business settings.');
    }
  };

  // Sample data for live receipt preview
  const sampleSubtotal = defaultCurrency === 'USD' ? 12.5 : 1500;
  const sampleTax = taxEnabled ? (sampleSubtotal * (Number(taxRate) || 0)) / 100 : 0;
  const sampleGrandTotal = sampleSubtotal + sampleTax;

  const previewBusiness = {
    businessName: businessName || 'Your Business Name',
    tagline,
    phone,
    address,
    email: user?.email || '',
    website,
    defaultCurrency,
    receiptFooter,
    logoIcon,
    showLogo,
    showCustomerInfo
  };

  const sampleReceipt = {
    receiptNumber: `${receiptPrefix || 'RCP'}-202611-0001`,
    createdAt: new Date().toISOString(),
    currency: defaultCurrency,
    status: 'issued',
    customer: {
      name: 'Sample Customer',
      phone: '+94 77 123 4567'
    },
    items: defaultCurrency === 'USD' ? [
      { flavourName: 'Papaya Lime Splash', quantity: 2, unitPrice: 3.75, subtotal: 7.5 },
      { flavourName: 'Avocado Shake', quantity: 1, unitPrice: 5.0, subtotal: 5.0 }
    ] : [
      { flavourName: 'Papaya Lime Splash', quantity: 2, unitPrice: 450, subtotal: 900 },
      { flavourName: 'Avocado Shake', quantity: 1, unitPrice: 600, subtotal: 600 }
    ],
    subtotal: sampleSubtotal,
    discountAmount: 0,
    taxAmount: sampleTax,
    taxRate: taxEnabled ? Number(taxRate) : 0,
    total: sampleGrandTotal,
    paymentMethod: 'cash',
    amountPaid: sampleGrandTotal,
    changeAmount: 0
  };

  return (
    <AppLayout title="Business Settings">
      <Box sx={{ maxWidth: 1300, mx: 'auto', pb: 6 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Business Settings & Branding ⚙️
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure your store profile, customize thermal receipt branding, set default currencies, and manage tax options.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveSettings}
            disabled={isLoading}
            sx={{ px: 3, py: 1.2, fontWeight: 700 }}
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>

        {/* Feedback Alerts */}
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Configuration Tabs */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ borderRadius: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="settings tabs"
                >
                  <Tab icon={<StoreIcon />} iconPosition="start" label="Store Profile" id="tab-0" />
                  <Tab icon={<ReceiptIcon />} iconPosition="start" label="Receipt Branding" id="tab-1" />
                  <Tab icon={<MoneyIcon />} iconPosition="start" label="Currency & Tax" id="tab-2" />
                  <Tab icon={<PrintIcon />} iconPosition="start" label="Printing Setup" id="tab-3" />
                </Tabs>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {/* Tab 0: Store Profile */}
                {activeTab === 0 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h6" fontWeight={700}>
                      Store Profile Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      These details appear at the top of your printed receipts and customer invoices.
                    </Typography>

                    <TextField
                      label="Business / Store Name"
                      fullWidth
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Fresh Citrus Juice Bar"
                      inputProps={{ 'aria-label': 'Business Name' }}
                    />

                    <TextField
                      label="Tagline or Slogan"
                      fullWidth
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. 100% Fresh & Pure Artisan Fruit Drinks"
                      inputProps={{ 'aria-label': 'Tagline' }}
                    />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Store Telephone / WhatsApp"
                          fullWidth
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +94 11 234 5678"
                          inputProps={{ 'aria-label': 'Phone' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Website / Social Handle"
                          fullWidth
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="e.g. www.freshcitrus.lk"
                          inputProps={{ 'aria-label': 'Website' }}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      label="Physical Store Address"
                      fullWidth
                      multiline
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 42 Marine Drive, Colombo 03, Sri Lanka"
                      inputProps={{ 'aria-label': 'Store Address' }}
                    />
                  </Stack>
                )}

                {/* Tab 1: Receipt Branding */}
                {activeTab === 1 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h6" fontWeight={700}>
                      Receipt Branding & Customization
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customize how your brand is represented on 80mm continuous thermal receipt paper.
                    </Typography>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Header Logo Icon
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                        {AVAILABLE_ICONS.map((icon) => (
                          <Paper
                            key={icon}
                            elevation={logoIcon === icon ? 3 : 0}
                            onClick={() => setLogoIcon(icon)}
                            sx={{
                              p: 1.5,
                              fontSize: '1.5rem',
                              cursor: 'pointer',
                              border: '2px solid',
                              borderColor: logoIcon === icon ? 'primary.main' : 'divider',
                              bgcolor: logoIcon === icon ? 'primary.50' : 'background.paper',
                              borderRadius: 2,
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: 'primary.main' }
                            }}
                          >
                            {icon}
                          </Paper>
                        ))}
                      </Stack>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={showLogo}
                          onChange={(e) => setShowLogo(e.target.checked)}
                          color="primary"
                          slotProps={{ input: { 'aria-label': 'Show Logo on Receipts' } }}
                        />
                      }
                      label="Print Brand Icon on Receipts"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={showCustomerInfo}
                          onChange={(e) => setShowCustomerInfo(e.target.checked)}
                          color="primary"
                          slotProps={{ input: { 'aria-label': 'Show Customer Details' } }}
                        />
                      }
                      label="Print Customer Details on Receipts (when available)"
                    />

                    <TextField
                      label="Receipt Number Prefix"
                      fullWidth
                      value={receiptPrefix}
                      onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase().slice(0, 8))}
                      placeholder="e.g. RCP, JUICE, POS"
                      helperText="2-8 uppercase characters used in sequential receipt numbers (e.g. RCP-202611-0001)"
                      inputProps={{ 'aria-label': 'Receipt Prefix', maxLength: 8 }}
                    />

                    <TextField
                      label="Receipt Footer Message"
                      fullWidth
                      multiline
                      rows={2}
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      placeholder="e.g. Thank you for visiting! Follow us on Instagram @freshcitrus"
                      inputProps={{ 'aria-label': 'Receipt Footer' }}
                    />
                  </Stack>
                )}

                {/* Tab 2: Currency & Tax */}
                {activeTab === 2 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h6" fontWeight={700}>
                      Currency & Tax Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Specify your store currency and automated tax calculations.
                    </Typography>

                    <TextField
                      select
                      label="Default Operating Currency"
                      fullWidth
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      inputProps={{ 'aria-label': 'Operating Currency' }}
                    >
                      <MenuItem value="LKR">LKR (Sri Lankan Rupee - Rs.)</MenuItem>
                      <MenuItem value="USD">USD (United States Dollar - $)</MenuItem>
                    </TextField>

                    <Divider sx={{ my: 1 }} />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={taxEnabled}
                          onChange={(e) => setTaxEnabled(e.target.checked)}
                          color="primary"
                          slotProps={{ input: { 'aria-label': 'Enable Sales Tax' } }}
                        />
                      }
                      label="Enable Sales Tax / VAT Calculation"
                    />

                    {taxEnabled && (
                      <TextField
                        label="Tax Percentage Rate (%)"
                        type="number"
                        fullWidth
                        value={taxRate}
                        onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                        helperText="Applied automatically to eligible line items at POS checkout."
                        inputProps={{ 'aria-label': 'Tax Rate', min: 0, max: 100, step: 0.5 }}
                      />
                    )}
                  </Stack>
                )}

                {/* Tab 3: Printing Setup */}
                {activeTab === 3 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h6" fontWeight={700}>
                      Hardware & Printing Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure your standard POS thermal printer parameters.
                    </Typography>

                    <TextField
                      select
                      label="Thermal Paper Roll Width"
                      fullWidth
                      value={paperWidth}
                      onChange={(e) => setPaperWidth(e.target.value)}
                      inputProps={{ 'aria-label': 'Paper Width' }}
                    >
                      <MenuItem value="80mm">80mm Standard POS Continuous Roll (Recommended)</MenuItem>
                      <MenuItem value="58mm">58mm Compact Mobile Printer Roll</MenuItem>
                    </TextField>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoPrintOnIssue}
                          onChange={(e) => setAutoPrintOnIssue(e.target.checked)}
                          color="primary"
                          slotProps={{ input: { 'aria-label': 'Auto-print on issue' } }}
                        />
                      }
                      label="Automatically open print dialog when receipt is issued at checkout"
                    />

                    <Box sx={{ pt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Test Printer Connection & Output
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<PrintIcon />}
                          onClick={() => printThermalReceipt(sampleReceipt, previewBusiness)}
                        >
                          Print Test 80mm Receipt
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<PdfIcon />}
                          onClick={() => downloadReceiptPdf(sampleReceipt, previewBusiness)}
                        >
                          Download Sample PDF
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                )}
              </CardContent>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.default' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  sx={{ px: 3, py: 1, fontWeight: 700 }}
                >
                  Save Settings
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Live 80mm Thermal Receipt Preview */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ borderRadius: 2, position: { md: 'sticky' }, top: 88 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Live Thermal Receipt Preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Real-time simulation on 80mm thermal paper
                  </Typography>
                </Box>
                <Chip label="80mm Continuous" size="small" color="primary" variant="outlined" />
              </Box>

              <CardContent sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ReceiptThermalPreview
                    receipt={sampleReceipt}
                    user={previewBusiness}
                  />
                </Box>
              </CardContent>

              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<PrintIcon />}
                  onClick={() => printThermalReceipt(sampleReceipt, previewBusiness)}
                >
                  Test Print
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<PdfIcon />}
                  onClick={() => downloadReceiptPdf(sampleReceipt, previewBusiness)}
                >
                  Test PDF
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppLayout>
  );
}
