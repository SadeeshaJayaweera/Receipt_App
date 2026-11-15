import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  ReceiptLong as ReceiptIcon,
  Description as DocumentIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import useAuthStore from '../store/authStore';
import { formatCurrency, getCurrencySymbol } from '../utils/calcEngine';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

export default function ReceiptPreviewModal({
  open,
  onClose,
  receipt,
  business: businessOverride
}) {
  const theme = useTheme();
  const authUser = useAuthStore((state) => state.user);
  const business = businessOverride || authUser || {};

  const [previewMode, setPreviewMode] = useState('thermal'); // 'thermal' | 'document'
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  if (!receipt) return null;

  const currency = receipt.currency || business.currency || 'LKR';
  const subtotal = receipt.pricing?.subtotal ?? receipt.subtotal ?? 0;
  const discount = receipt.pricing?.discount ?? receipt.discount ?? 0;
  const tax = receipt.pricing?.tax ?? receipt.taxAmount ?? receipt.tax ?? 0;
  const grandTotal = receipt.pricing?.grandTotal ?? receipt.totalAmount ?? 0;

  const dateObj = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const customerName = receipt.customer?.name || receipt.customerName || 'Walk-in';
  const customerPhone = receipt.customer?.phone || receipt.customerPhone;
  const paymentMethod = (receipt.payment?.method || receipt.paymentMethod || 'cash').toUpperCase();
  const cashReceived = receipt.payment?.cashReceived ?? receipt.cashReceived;
  const changeGiven = receipt.payment?.changeGiven ?? receipt.changeGiven;

  const isVoided = receipt.status === 'voided';
  const isDraft = receipt.status === 'draft';

  // Find latest void reason
  const voidEntry = useMemo(() => {
    if (!isVoided) return null;
    if (receipt.voidReason) {
      return { reason: receipt.voidReason, at: receipt.voidedAt };
    }
    const history = receipt.statusHistory || [];
    const voidHistory = [...history].reverse().find((h) => h.status === 'voided');
    return voidHistory ? { reason: voidHistory.reason, at: voidHistory.timestamp } : null;
  }, [isVoided, receipt]);

  const handlePrint = () => {
    printThermalReceipt(receipt, business);
  };

  const handleDownloadPdf = () => {
    downloadReceiptPdf(receipt, business);
  };

  const handleCopyText = async () => {
    const lines = [
      `==============================`,
      `${business.businessName || 'Juice Receipt App'}`,
      business.tagline || '',
      `==============================`,
      `Receipt #: ${receipt.receiptNumber || 'DRAFT'}`,
      `Date: ${dateFormatted} ${timeFormatted}`,
      `Customer: ${customerName}`,
      `Status: ${(receipt.status || 'issued').toUpperCase()}`,
      `------------------------------`,
      ...(receipt.items || []).map(
        (it) => `${it.flavourName} x${it.quantity} - ${formatCurrency(it.subtotal, currency)}`
      ),
      `------------------------------`,
      `Subtotal: ${formatCurrency(subtotal, currency)}`,
      discount > 0 ? `Discount: -${formatCurrency(discount, currency)}` : null,
      tax > 0 ? `Tax: ${formatCurrency(tax, currency)}` : null,
      `TOTAL: ${formatCurrency(grandTotal, currency)}`,
      `Payment: ${paymentMethod}`,
      cashReceived ? `Cash Received: ${formatCurrency(cashReceived, currency)}` : null,
      changeGiven ? `Change Given: ${formatCurrency(changeGiven, currency)}` : null,
      `==============================`,
      business.receiptFooter || 'Thank you for your business!'
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="receipt-preview-dialog-title"
    >
      {/* Dialog Header */}
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ReceiptIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Receipt Preview
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              {receipt.receiptNumber || 'DRAFT TICKET'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            size="small"
            value={previewMode}
            exclusive
            onChange={(e, val) => val && setPreviewMode(val)}
            aria-label="preview mode"
          >
            <ToggleButton value="thermal" aria-label="80mm Thermal Roll Preview">
              <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} /> 80mm
            </ToggleButton>
            <ToggleButton value="document" aria-label="Standard Invoice Document Preview">
              <DocumentIcon fontSize="small" sx={{ mr: 0.5 }} /> Invoice
            </ToggleButton>
          </ToggleButtonGroup>

          <IconButton onClick={onClose} aria-label="close preview" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: alpha(theme.palette.background.default, 0.7), py: 3, px: { xs: 2, sm: 3 } }}>
        {/* Status Warning Banners */}
        {isVoided && (
          <Alert
            severity="error"
            icon={<BlockIcon />}
            sx={{ mb: 2.5, border: `1px solid ${theme.palette.error.main}` }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              THIS RECEIPT IS VOIDED
            </Typography>
            {voidEntry?.reason && (
              <Typography variant="body2">
                Reason: "{voidEntry.reason}"
              </Typography>
            )}
            {voidEntry?.at && (
              <Typography variant="caption" display="block">
                Voided on {new Date(voidEntry.at).toLocaleString()}
              </Typography>
            )}
          </Alert>
        )}

        {isDraft && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              DRAFT TICKET - NOT YET FINALIZED
            </Typography>
            <Typography variant="body2">
              This receipt has not been issued to the customer yet.
            </Typography>
          </Alert>
        )}

        {copiedFeedback && (
          <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
            Receipt summary copied to clipboard!
          </Alert>
        )}

        {/* Preview Container */}
        {previewMode === 'thermal' ? (
          /* 80mm Continuous Thermal Roll View */
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Paper
              elevation={4}
              sx={{
                width: '78mm',
                maxWidth: '100%',
                bgcolor: '#FFFFFF',
                color: '#111827',
                p: 2.5,
                borderRadius: 1,
                border: '1px solid #E5E7EB',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                lineHeight: 1.3,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Void Watermark */}
              {isVoided && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '45%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-35deg)',
                    fontSize: '4.5rem',
                    fontWeight: 900,
                    color: 'rgba(239, 68, 68, 0.22)',
                    letterSpacing: 6,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    border: '4px dashed rgba(239, 68, 68, 0.3)',
                    p: 1
                  }}
                >
                  VOID
                </Box>
              )}

              {/* Business Header */}
              <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                {business.showLogo !== false && (
                  <Typography variant="h5" sx={{ mb: 0.5 }}>
                    {business.logoIcon || '🧃'}
                  </Typography>
                )}
                <Typography variant="subtitle2" fontWeight={800} letterSpacing={1}>
                  {(business.businessName || 'Juice Receipt App').toUpperCase()}
                </Typography>
                {business.tagline && (
                  <Typography variant="caption" fontStyle="italic" display="block">
                    {business.tagline}
                  </Typography>
                )}
                {business.address && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {business.address}
                  </Typography>
                )}
                {business.phone && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Tel: {business.phone}
                  </Typography>
                )}
                {business.website && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {business.website}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#374151' }} />

              {/* Receipt Metadata */}
              <Stack spacing={0.5} sx={{ fontSize: 10.5 }}>
                <Stack direction="row" justifyContent="space-between">
                  <span>Receipt #:</span>
                  <strong>{receipt.receiptNumber || 'DRAFT'}</strong>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <span>Date:</span>
                  <span>{dateFormatted}</span>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <span>Time:</span>
                  <span>{timeFormatted}</span>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <span>Customer:</span>
                  <span>{customerName}</span>
                </Stack>
                {customerPhone && (
                  <Stack direction="row" justifyContent="space-between">
                    <span>Contact:</span>
                    <span>{customerPhone}</span>
                  </Stack>
                )}
              </Stack>

              <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#374151' }} />

              {/* Line Items */}
              <Box sx={{ fontSize: 10.5, mb: 1 }}>
                <Stack direction="row" justifyContent="space-between" fontWeight={800} sx={{ pb: 0.5, borderBottom: '1px solid #111827' }}>
                  <span style={{ flex: 1 }}>ITEM</span>
                  <span style={{ width: 35, textAlign: 'center' }}>QTY</span>
                  <span style={{ width: 70, textAlign: 'right' }}>AMOUNT</span>
                </Stack>

                <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                  {(receipt.items || []).map((item, idx) => (
                    <Box key={idx}>
                      <Stack direction="row" justifyContent="space-between">
                        <span style={{ flex: 1, fontWeight: 600 }}>{item.flavourName}</span>
                        <span style={{ width: 35, textAlign: 'center' }}>x{item.quantity}</span>
                        <span style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(item.subtotal, currency)}
                        </span>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9.5 }}>
                        @{formatCurrency(item.price, currency)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#374151' }} />

              {/* Financial Totals */}
              <Stack spacing={0.5} sx={{ fontSize: 10.5 }}>
                <Stack direction="row" justifyContent="space-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </Stack>

                {discount > 0 && (
                  <Stack direction="row" justifyContent="space-between" sx={{ color: '#DC2626' }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(discount, currency)}</span>
                  </Stack>
                )}

                {tax > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(tax, currency)}</span>
                  </Stack>
                )}

                <Divider sx={{ my: 0.5, borderColor: '#111827' }} />

                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: 12, fontWeight: 900 }}>
                  <span>TOTAL:</span>
                  <span>{formatCurrency(grandTotal, currency)}</span>
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5 }}>
                  <span>Payment Method:</span>
                  <strong>{paymentMethod}</strong>
                </Stack>

                {cashReceived !== undefined && cashReceived > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <span>Cash Tendered:</span>
                    <span>{formatCurrency(cashReceived, currency)}</span>
                  </Stack>
                )}

                {changeGiven !== undefined && changeGiven > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <span>Change Given:</span>
                    <strong>{formatCurrency(changeGiven, currency)}</strong>
                  </Stack>
                )}
              </Stack>

              <Divider sx={{ borderStyle: 'dashed', my: 1.5, borderColor: '#374151' }} />

              {/* Footer */}
              <Box sx={{ textAlign: 'center', fontSize: 10, color: '#4B5563' }}>
                <Typography variant="caption" display="block" fontWeight={600}>
                  {business.receiptFooter || 'Thank you for your business!'}
                </Typography>
                <Typography variant="caption" display="block">
                  Please come again
                </Typography>
              </Box>
            </Paper>
          </Box>
        ) : (
          /* Standard Invoice Document View */
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Void Watermark */}
            {isVoided && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  fontSize: '6rem',
                  fontWeight: 900,
                  color: 'rgba(239, 68, 68, 0.18)',
                  letterSpacing: 8,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  border: '5px dashed rgba(239, 68, 68, 0.25)',
                  px: 4,
                  py: 1
                }}
              >
                VOIDED
              </Box>
            )}

            {/* Document Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="h5">{business.logoIcon || '🧃'}</Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    {business.businessName || 'Juice Receipt App'}
                  </Typography>
                </Stack>
                {business.tagline && (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    {business.tagline}
                  </Typography>
                )}
                {business.address && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {business.address}
                  </Typography>
                )}
                {business.phone && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Phone: {business.phone}
                  </Typography>
                )}
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" fontWeight={800} letterSpacing={1}>
                  RECEIPT
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} fontFamily="monospace" color="primary.main">
                  {receipt.receiptNumber || 'DRAFT'}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Date: {dateFormatted}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Bill To & Info Row */}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Customer
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {customerName}
                </Typography>
                {customerPhone && (
                  <Typography variant="body2" color="text.secondary">
                    {customerPhone}
                  </Typography>
                )}
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Payment Method
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {paymentMethod}
                </Typography>
              </Box>
            </Stack>

            {/* Line Items Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 2.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.4) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(receipt.items || []).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{item.flavourName}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.price, currency)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(item.subtotal, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals Summary */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Box sx={{ width: 240 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(subtotal, currency)}</Typography>
                  </Stack>

                  {discount > 0 && (
                    <Stack direction="row" justifyContent="space-between" sx={{ color: 'error.main' }}>
                      <Typography variant="body2">Discount:</Typography>
                      <Typography variant="body2" fontWeight={600}>-{formatCurrency(discount, currency)}</Typography>
                    </Stack>
                  )}

                  {tax > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Tax:</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatCurrency(tax, currency)}</Typography>
                    </Stack>
                  )}

                  <Divider sx={{ my: 0.5 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={700}>Total Due:</Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      {formatCurrency(grandTotal, currency)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {business.receiptFooter || 'Thank you for choosing our fresh juice bar!'}
            </Typography>
          </Paper>
        )}
      </DialogContent>

      {/* Dialog Action Buttons */}
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<CopyIcon />}
          onClick={handleCopyText}
        >
          Copy Summary
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PdfIcon />}
          onClick={handleDownloadPdf}
        >
          Download PDF
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ fontWeight: 700 }}
        >
          Print 80mm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
