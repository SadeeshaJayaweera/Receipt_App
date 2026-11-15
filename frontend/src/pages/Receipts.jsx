import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Skeleton,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  Search as SearchIcon,
  VisibilityOutlined as ViewIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Block as VoidIcon,
  DeleteOutlined as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as IssuedIcon,
  Warning as DraftIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import AppLayout from '../components/AppLayout';
import ReceiptPreviewModal from '../components/ReceiptPreviewModal';
import useReceiptStore from '../store/receiptStore';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../utils/calcEngine';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

export default function Receipts() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const userCurrency = user?.currency || 'LKR';

  const {
    receipts,
    pagination,
    fetchReceipts,
    voidReceipt,
    deleteReceipt,
    isLoading,
    error: storeError
  } = useReceiptStore();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal & Dialog state
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [receiptToVoid, setReceiptToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const loadData = useCallback(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      sort: '-createdAt'
    };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (statusFilter !== 'all') params.status = statusFilter;
    if (paymentFilter !== 'all') params.paymentMethod = paymentFilter;

    fetchReceipts(params);
  }, [page, rowsPerPage, searchTerm, statusFilter, paymentFilter, fetchReceipts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status Summary Stats
  const stats = useMemo(() => {
    const list = receipts || [];
    const issued = list.filter((r) => r.status === 'issued').length;
    const draft = list.filter((r) => r.status === 'draft').length;
    const voided = list.filter((r) => r.status === 'voided').length;
    return {
      total: pagination?.total ?? list.length,
      issued,
      draft,
      voided
    };
  }, [receipts, pagination?.total]);

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setPage(0);
  };

  // Preview Handler
  const handleOpenPreview = (receipt) => {
    setSelectedReceipt(receipt);
    setPreviewOpen(true);
  };

  // Void Handler
  const handleOpenVoidDialog = (receipt) => {
    setReceiptToVoid(receipt);
    setVoidReason('');
    setVoidError(null);
    setVoidDialogOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!receiptToVoid) return;
    if (!voidReason.trim() || voidReason.trim().length < 3) {
      setVoidError('Please provide a descriptive reason for voiding this receipt (minimum 3 characters).');
      return;
    }

    try {
      await voidReceipt(receiptToVoid._id, voidReason.trim());
      setActionFeedback(`Successfully voided receipt ${receiptToVoid.receiptNumber}`);
      setVoidDialogOpen(false);
      setReceiptToVoid(null);
      loadData();
    } catch (err) {
      setVoidError(err.response?.data?.message || err.message || 'Failed to void receipt');
    }
  };

  const handlePrint = (receipt) => {
    printThermalReceipt(receipt, user || {});
  };

  const handleDownloadPdf = (receipt) => {
    downloadReceiptPdf(receipt, user || {});
  };

  const renderStatusChip = (status) => {
    switch (status) {
      case 'issued':
        return <Chip icon={<IssuedIcon />} label="Issued" size="small" color="success" variant="outlined" />;
      case 'draft':
        return <Chip icon={<DraftIcon />} label="Draft" size="small" color="warning" variant="outlined" />;
      case 'voided':
        return <Chip icon={<VoidIcon />} label="Voided" size="small" color="error" variant="outlined" />;
      default:
        return <Chip label={status || 'Unknown'} size="small" variant="outlined" />;
    }
  };

  return (
    <AppLayout title="Receipt History & Audit">
      <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 6 }}>
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
              Receipt History & Audit Log 📋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Search, filter, view, print, and audit customer transactions across all tender types.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title="Refresh receipts list">
              <IconButton
                onClick={loadData}
                disabled={isLoading}
                color="primary"
                aria-label="refresh receipts"
                sx={{
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/create-receipt"
              startIcon={<AddIcon />}
              sx={{ fontWeight: 600, px: 2.5, py: 1 }}
            >
              New Receipt
            </Button>
          </Stack>
        </Box>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <Alert severity="success" onClose={() => setActionFeedback(null)} sx={{ mb: 3 }}>
            {actionFeedback}
          </Alert>
        )}

        {/* Global Error Banner */}
        {storeError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {storeError}
          </Alert>
        )}

        {/* Quick Summary KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.primary.main}` }}>
              <Typography variant="h5" fontWeight={700}>
                {isLoading ? <Skeleton width={50} sx={{ mx: 'auto' }} /> : stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Total Records
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.success.main}` }}>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {isLoading ? <Skeleton width={50} sx={{ mx: 'auto' }} /> : stats.issued}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Issued Receipts
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.warning.main}` }}>
              <Typography variant="h5" fontWeight={700} color="warning.main">
                {isLoading ? <Skeleton width={50} sx={{ mx: 'auto' }} /> : stats.draft}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Draft Tickets
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.error.main}` }}>
              <Typography variant="h5" fontWeight={700} color="error.main">
                {isLoading ? <Skeleton width={50} sx={{ mx: 'auto' }} /> : stats.voided}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Voided Sales
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Filter and Search Toolbar */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Input */}
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by receipt #, customer name, phone, item..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
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
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="issued">Issued Only</MenuItem>
                  <MenuItem value="draft">Drafts Only</MenuItem>
                  <MenuItem value="voided">Voided Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Payment Method Filter */}
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="payment-filter-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-filter-label"
                  label="Payment Method"
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Methods</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="mobile">Mobile</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Reset Filters */}
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Receipts Data Table */}
        {isLoading ? (
          <Stack spacing={1.5}>
            <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
          </Stack>
        ) : receipts.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'No receipts match your search filters'
                : 'No Receipts Recorded Yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try resetting your search query or status filters.'
                : 'Ring up your first customer order at the POS terminal.'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/create-receipt"
              startIcon={<AddIcon />}
            >
              Create New Receipt
            </Button>
          </Card>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Table aria-label="receipt history table">
              <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Receipt #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipts.map((receipt) => {
                  const dateStr = receipt.createdAt ? format(new Date(receipt.createdAt), 'dd MMM yyyy') : '-';
                  const timeStr = receipt.createdAt ? format(new Date(receipt.createdAt), 'hh:mm a') : '-';
                  const custName = receipt.customer?.name || receipt.customerName || 'Walk-in';
                  const itemCount = receipt.items?.length || 0;

                  return (
                    <TableRow
                      key={receipt._id}
                      hover
                      onClick={() => handleOpenPreview(receipt)}
                      sx={{
                        cursor: 'pointer',
                        opacity: receipt.status === 'voided' ? 0.65 : 1
                      }}
                    >
                      {/* Receipt Number */}
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                        {receipt.receiptNumber}
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {dateStr}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {timeStr}
                        </Typography>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {custName}
                        </Typography>
                        {receipt.customer?.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {receipt.customer.phone}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Items Count */}
                      <TableCell align="center">
                        <Chip label={`${itemCount} items`} size="small" variant="outlined" />
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell>
                        <Chip
                          label={(receipt.payment?.method || receipt.paymentMethod || 'cash').toUpperCase()}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>{renderStatusChip(receipt.status)}</TableCell>

                      {/* Total Amount */}
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                          {formatCurrency(receipt.totalAmount, receipt.currency || userCurrency)}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Receipt Preview">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenPreview(receipt)}
                              aria-label={`view receipt ${receipt.receiptNumber}`}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Print 80mm Receipt">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => handlePrint(receipt)}
                              aria-label={`print receipt ${receipt.receiptNumber}`}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => handleDownloadPdf(receipt)}
                              aria-label={`download pdf for ${receipt.receiptNumber}`}
                            >
                              <PdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {receipt.status === 'issued' && (
                            <Tooltip title="Void this receipt">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenVoidDialog(receipt)}
                                aria-label={`void receipt ${receipt.receiptNumber}`}
                              >
                                <VoidIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={pagination?.total ?? receipts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        )}

        {/* Void Receipt Modal Dialog */}
        <Dialog open={voidDialogOpen} onClose={() => setVoidDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
            Void Receipt: {receiptToVoid?.receiptNumber}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Voiding an issued receipt permanently flags it as invalid in sales reporting and updates its audit trail. This operation cannot be reversed.
            </DialogContentText>

            {voidError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {voidError}
              </Alert>
            )}

            <TextField
              fullWidth
              autoFocus
              multiline
              rows={3}
              label="Mandatory Reason for Voiding *"
              placeholder="e.g. Customer returned items / Cashier entered incorrect amount"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setVoidDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmVoid}
              color="error"
              variant="contained"
              disabled={!voidReason.trim() || voidReason.trim().length < 3}
            >
              Confirm & Void Receipt
            </Button>
          </DialogActions>
        </Dialog>

        {/* Full Dual-Mode Receipt Preview Modal */}
        {selectedReceipt && (
          <ReceiptPreviewModal
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            receipt={selectedReceipt}
            business={user || {}}
          />
        )}
      </Box>
    </AppLayout>
  );
}
