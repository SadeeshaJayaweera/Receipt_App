import React, { useEffect, useState, useMemo } from 'react';
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
  Switch,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  ArchiveOutlined as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  LocalDrink as DrinkIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  FilterList as FilterListIcon,
  CheckCircle as InStockIcon,
  CancelOutlined as OutOfStockIcon
} from '@mui/icons-material';

import AppLayout from '../components/AppLayout';
import useFlavourStore from '../store/flavourStore';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../utils/calcEngine';

const CATEGORIES = [
  'All',
  'Fresh Juice',
  'Smoothie',
  'Milkshake',
  'Mocktail',
  'Special Drink'
];

export default function Flavours() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const userCurrency = user?.currency || 'LKR';

  const {
    flavours,
    fetchFlavours,
    addFlavour,
    updateFlavour,
    toggleAvailability,
    archiveFlavour,
    restoreFlavour,
    deleteFlavour,
    isLoading,
    error: storeError,
    clearError
  } = useFlavourStore();

  // Filters and views
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // all, inStock, outOfStock
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingFlavour, setEditingFlavour] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flavourToDelete, setFlavourToDelete] = useState(null);

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Fresh Juice',
    sku: '',
    description: '',
    isAvailable: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    fetchFlavours({ includeArchived: true });
  }, [fetchFlavours]);

  // Filtered flavours
  const filteredFlavours = useMemo(() => {
    return flavours.filter((item) => {
      // Archive filter
      if (!showArchived && item.isArchived) return false;
      if (showArchived && !item.isArchived) return false;

      // Category filter
      if (selectedCategory !== 'All' && (item.category || 'Fresh Juice') !== selectedCategory) {
        return false;
      }

      // Availability filter
      const isInStock = item.isAvailable !== false;
      if (availabilityFilter === 'inStock' && !isInStock) return false;
      if (availabilityFilter === 'outOfStock' && isInStock) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesSku = (item.sku || '').toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        return matchesName || matchesSku || matchesDesc;
      }

      return true;
    });
  }, [flavours, showArchived, selectedCategory, availabilityFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const activeFlavours = flavours.filter((f) => !f.isArchived);
    const inStock = activeFlavours.filter((f) => f.isAvailable !== false).length;
    const outOfStock = activeFlavours.length - inStock;
    const categoriesSet = new Set(activeFlavours.map((f) => f.category || 'Fresh Juice'));
    return {
      total: activeFlavours.length,
      inStock,
      outOfStock,
      categoriesCount: categoriesSet.size
    };
  }, [flavours]);

  // Form handlers
  const handleOpenAddDialog = () => {
    setEditingFlavour(null);
    setFormData({
      name: '',
      price: '',
      category: 'Fresh Juice',
      sku: '',
      description: '',
      isAvailable: true
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (flavour) => {
    setEditingFlavour(flavour);
    setFormData({
      name: flavour.name || '',
      price: flavour.price !== undefined ? String(flavour.price) : '',
      category: flavour.category || 'Fresh Juice',
      sku: flavour.sku || '',
      description: flavour.description || '',
      isAvailable: flavour.isAvailable !== false
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setEditingFlavour(null);
    setFormErrors({});
    clearError();
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Flavour name is required';
    }
    const numPrice = parseFloat(formData.price);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.price = 'Valid non-negative price is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category || 'Fresh Juice',
        sku: (formData.sku || '').trim().toUpperCase(),
        description: (formData.description || '').trim(),
        isAvailable: formData.isAvailable
      };

      if (editingFlavour) {
        await updateFlavour(editingFlavour._id, payload);
        setActionFeedback(`Updated "${payload.name}" successfully`);
      } else {
        await addFlavour(payload);
        setActionFeedback(`Added new flavour "${payload.name}"`);
      }
      handleCloseFormDialog();
    } catch (err) {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stock toggle handler
  const handleToggleStock = async (id, name, currentStock) => {
    try {
      await toggleAvailability(id);
      setActionFeedback(`"${name}" is now ${!currentStock ? 'in stock' : 'out of stock'}`);
    } catch (err) {
      // Reverted in store
    }
  };

  // Archive / Delete confirmation
  const handleOpenDeleteConfirm = (flavour) => {
    setFlavourToDelete(flavour);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!flavourToDelete) return;
    try {
      if (showArchived) {
        // Permanent delete from archived view
        await deleteFlavour(flavourToDelete._id);
        setActionFeedback(`Permanently deleted "${flavourToDelete.name}"`);
      } else {
        // Soft archive
        await archiveFlavour(flavourToDelete._id);
        setActionFeedback(`Archived "${flavourToDelete.name}"`);
      }
    } catch (err) {
      // Error handled by store
    } finally {
      setDeleteConfirmOpen(false);
      setFlavourToDelete(null);
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await restoreFlavour(id);
      setActionFeedback(`Restored "${name}" to active menu`);
    } catch (err) {
      // Error in store
    }
  };

  return (
    <AppLayout title="Flavours & Menu">
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
              Flavours & Menu Inventory 🍊
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure juice beverages, retail pricing, categories, and real-time stock levels.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ fontWeight: 600, px: 2.5, py: 1 }}
          >
            Add Flavour
          </Button>
        </Box>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <Alert severity="success" onClose={() => setActionFeedback(null)} sx={{ mb: 3 }}>
            {actionFeedback}
          </Alert>
        )}

        {/* Global Store Error */}
        {storeError && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
            {storeError}
          </Alert>
        )}

        {/* Quick KPI Overview Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.primary.main}` }}>
              <Typography variant="h5" fontWeight={700}>
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Total Flavours
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.success.main}` }}>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : stats.inStock}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                In Stock & Available
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.warning.main}` }}>
              <Typography variant="h5" fontWeight={700} color="warning.main">
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : stats.outOfStock}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Out of Stock
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
              <Typography variant="h5" fontWeight={700}>
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : stats.categoriesCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Menu Categories
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search Toolbar */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Input */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by flavour name, SKU, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Category Filter */}
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-filter-label">Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  label="Category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Availability Filter */}
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="availability-filter-label">Stock Status</InputLabel>
                <Select
                  labelId="availability-filter-label"
                  label="Stock Status"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="inStock">In Stock Only</MenuItem>
                  <MenuItem value="outOfStock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* View Mode & Archived Toggle */}
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} alignItems="center">
                <Button
                  size="small"
                  variant={showArchived ? 'contained' : 'outlined'}
                  color={showArchived ? 'secondary' : 'inherit'}
                  onClick={() => setShowArchived(!showArchived)}
                  startIcon={<ArchiveIcon />}
                >
                  {showArchived ? 'Viewing Archived' : 'Show Archived'}
                </Button>

                <ToggleButtonGroup
                  size="small"
                  value={viewMode}
                  exclusive
                  onChange={(e, val) => val && setViewMode(val)}
                  aria-label="view layout mode"
                >
                  <ToggleButton value="table" aria-label="table view">
                    <ViewListIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="grid" aria-label="grid view">
                    <ViewModuleIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {/* Flavours Listing */}
        {isLoading ? (
          <Stack spacing={1.5}>
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
          </Stack>
        ) : filteredFlavours.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
            <DrinkIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {searchTerm || selectedCategory !== 'All' || availabilityFilter !== 'all'
                ? 'No flavours match your search filters'
                : showArchived
                ? 'No archived flavours found'
                : 'No Flavours Added Yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || selectedCategory !== 'All' || availabilityFilter !== 'all'
                ? 'Try clearing or adjusting your search filters to find menu items.'
                : 'Create your first beverage flavour to begin generating receipts.'}
            </Typography>
            {!showArchived && (
              <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
                Add Your First Flavour
              </Button>
            )}
          </Card>
        ) : viewMode === 'table' ? (
          /* Table View */
          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Table aria-label="flavours inventory table">
              <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Flavour & Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>In Stock Switch</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFlavours.map((flavour) => {
                  const isInStock = flavour.isAvailable !== false;
                  return (
                    <TableRow key={flavour._id} hover sx={{ opacity: flavour.isArchived ? 0.6 : 1 }}>
                      {/* Name & SKU */}
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
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
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {flavour.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {flavour.sku && (
                                <Chip label={`SKU: ${flavour.sku}`} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                              )}
                              {flavour.description && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
                                  {flavour.description}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Chip
                          label={flavour.category || 'Fresh Juice'}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* Retail Price */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {formatCurrency(flavour.price, userCurrency)}
                        </Typography>
                      </TableCell>

                      {/* Instant Stock Availability Toggle */}
                      <TableCell align="center">
                        <Tooltip title={isInStock ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}>
                          <Switch
                            checked={isInStock}
                            disabled={flavour.isArchived}
                            onChange={() => handleToggleStock(flavour._id, flavour.name, isInStock)}
                            color="success"
                            slotProps={{ input: { 'aria-label': `Toggle stock for ${flavour.name}` } }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Status Chip */}
                      <TableCell>
                        {flavour.isArchived ? (
                          <Chip label="Archived" size="small" color="default" variant="outlined" />
                        ) : isInStock ? (
                          <Chip icon={<InStockIcon />} label="In Stock" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip icon={<OutOfStockIcon />} label="Out of Stock" size="small" color="warning" variant="outlined" />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {flavour.isArchived ? (
                            <Tooltip title="Restore to menu">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleRestore(flavour._id, flavour.name)}
                                aria-label="restore flavour"
                              >
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Edit flavour details">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(flavour)}
                                aria-label={`edit ${flavour.name}`}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title={showArchived ? 'Permanently Delete' : 'Archive flavour'}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteConfirm(flavour)}
                              aria-label={`delete ${flavour.name}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* Grid / Card View */
          <Grid container spacing={2.5}>
            {filteredFlavours.map((flavour) => {
              const isInStock = flavour.isAvailable !== false;
              return (
                <Grid key={flavour._id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderTop: `4px solid ${
                        isInStock ? theme.palette.primary.main : theme.palette.warning.main
                      }`,
                      opacity: flavour.isArchived ? 0.6 : 1
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {flavour.name}
                          </Typography>
                          <Chip
                            label={flavour.category || 'Fresh Juice'}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        <Typography variant="h5" fontWeight={700} color="primary.main">
                          {formatCurrency(flavour.price, userCurrency)}
                        </Typography>
                      </Stack>

                      {flavour.sku && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          SKU: <strong>{flavour.sku}</strong>
                        </Typography>
                      )}

                      {flavour.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {flavour.description}
                        </Typography>
                      )}

                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Switch
                            size="small"
                            checked={isInStock}
                            disabled={flavour.isArchived}
                            onChange={() => handleToggleStock(flavour._id, flavour.name, isInStock)}
                            color="success"
                          />
                          <Typography variant="caption" fontWeight={600} color={isInStock ? 'success.main' : 'warning.main'}>
                            {isInStock ? 'IN STOCK' : 'OUT OF STOCK'}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.5}>
                          {!flavour.isArchived ? (
                            <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(flavour)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton size="small" color="primary" onClick={() => handleRestore(flavour._id, flavour.name)}>
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(flavour)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Add / Edit Flavour Dialog */}
        <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingFlavour ? 'Edit Juice Flavour' : 'Add New Juice Flavour'}
          </DialogTitle>
          <form onSubmit={handleSubmitForm}>
            <DialogContent dividers>
              {storeError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {storeError}
                </Alert>
              )}

              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Flavour Name *"
                  placeholder="e.g. Fresh Lime & Mint"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                  autoFocus
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label={`Price (${userCurrency}) *`}
                      placeholder="e.g. 450"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      error={Boolean(formErrors.price)}
                      helperText={formErrors.price}
                      slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="SKU / Item Code"
                      placeholder="e.g. LIM-01"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    />
                  </Grid>
                </Grid>

                <FormControl fullWidth>
                  <InputLabel id="dialog-category-label">Category</InputLabel>
                  <Select
                    labelId="dialog-category-label"
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description (Optional)"
                  placeholder="Fresh squeezed lime juice with garden mint leaves..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Switch
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    color="success"
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {formData.isAvailable ? 'Item is currently In Stock' : 'Mark as Out of Stock'}
                  </Typography>
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseFormDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingFlavour ? 'Save Changes' : 'Create Flavour'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete / Archive Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {showArchived ? 'Permanently Delete Flavour?' : 'Archive Flavour?'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {showArchived
                ? `Are you sure you want to permanently delete "${flavourToDelete?.name}"? This action cannot be undone.`
                : `Are you sure you want to archive "${flavourToDelete?.name}"? It will no longer appear in the active POS menu, but historical receipts remain intact.`}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
            >
              {showArchived ? 'Delete Permanently' : 'Archive'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
