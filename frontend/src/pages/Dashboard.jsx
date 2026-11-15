import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  LinearProgress,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalanceWallet as MonthIcon,
  AttachMoney as TotalIcon,
  ReceiptLong as ReceiptLongIcon,
  LocalDrink as DrinkIcon,
  Analytics as AnalyticsIcon,
  CheckCircleOutlined as HealthIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  CreditCard as CardIcon,
  Payments as CashIcon,
  Smartphone as DigitalIcon,
  ShoppingBag as BagIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import AppLayout from '../components/AppLayout';
import useAuthStore from '../store/authStore';
import useAnalyticsStore from '../store/analyticsStore';
import useFlavourStore from '../store/flavourStore';
import useReceiptStore from '../store/receiptStore';
import { formatCurrency, getCurrencySymbol } from '../utils/calcEngine';

// Chart color palettes
const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function Dashboard() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { dashboard, isLoading: analyticsLoading, error: analyticsError, fetchDashboard } = useAnalyticsStore();
  const { flavours, isLoading: flavoursLoading, fetchFlavours } = useFlavourStore();
  const { receipts, isLoading: receiptsLoading, fetchReceipts } = useReceiptStore();

  const [activeCurrency, setActiveCurrency] = useState(user?.currency || 'LKR');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const initialCurrency = user?.currency || 'LKR';
    setActiveCurrency(initialCurrency);
    loadAllData(initialCurrency);
  }, [user?.currency]);

  const loadAllData = async (curr) => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchDashboard(curr),
        fetchFlavours(),
        fetchReceipts({ limit: 5, sort: '-createdAt' })
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCurrencyChange = (event, newCurrency) => {
    if (newCurrency && newCurrency !== activeCurrency) {
      setActiveCurrency(newCurrency);
      fetchDashboard(newCurrency);
    }
  };

  const handleManualRefresh = () => {
    loadAllData(activeCurrency);
  };

  const metrics = dashboard?.metrics || {
    totalRevenue: 0,
    todayRevenue: 0,
    todayReceipts: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    avgOrderValue: 0,
    counts: { total: 0, issued: 0, draft: 0, voided: 0 }
  };

  const timelineData = useMemo(() => {
    if (!dashboard?.dailyTimeline || dashboard.dailyTimeline.length === 0) return [];
    return dashboard.dailyTimeline.map((item) => ({
      date: item.date,
      revenue: item.revenue || 0,
      count: item.count || 0
    }));
  }, [dashboard?.dailyTimeline]);

  const paymentData = useMemo(() => {
    if (!dashboard?.paymentBreakdown || dashboard.paymentBreakdown.length === 0) return [];
    return dashboard.paymentBreakdown.map((item) => ({
      name: item.method ? item.method.replace('_', ' ').toUpperCase() : 'OTHER',
      value: item.totalRevenue || 0,
      count: item.count || 0
    }));
  }, [dashboard?.paymentBreakdown]);

  const topFlavours = useMemo(() => {
    return dashboard?.topFlavours || [];
  }, [dashboard?.topFlavours]);

  const highestFlavourQty = topFlavours.length > 0 ? topFlavours[0].quantity : 1;

  const recentList = useMemo(() => {
    if (receipts && receipts.length > 0) {
      return receipts.slice(0, 5);
    }
    return [];
  }, [receipts]);

  const isLoading = analyticsLoading || flavoursLoading || receiptsLoading || isRefreshing;

  const renderStatusChip = (status) => {
    switch (status) {
      case 'issued':
        return <Chip label="Issued" size="small" color="success" variant="outlined" />;
      case 'draft':
        return <Chip label="Draft" size="small" color="warning" variant="outlined" />;
      case 'voided':
        return <Chip label="Voided" size="small" color="error" variant="outlined" />;
      default:
        return <Chip label={status || 'Unknown'} size="small" variant="outlined" />;
    }
  };

  return (
    <AppLayout title="Store Dashboard">
      <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 6 }}>
        {/* Header Banner */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 4
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Welcome back, {user?.businessName || user?.name || 'Store Manager'}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time sales performance, store activity, and product insights.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={activeCurrency}
              exclusive
              onChange={handleCurrencyChange}
              size="small"
              aria-label="dashboard currency selector"
              sx={{ bgcolor: 'background.paper' }}
            >
              <ToggleButton value="LKR" aria-label="LKR Currency">
                Rs. LKR
              </ToggleButton>
              <ToggleButton value="USD" aria-label="USD Currency">
                $ USD
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Refresh dashboard data">
              <span>
                <IconButton
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  color="primary"
                  aria-label="refresh dashboard"
                  sx={{
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  <RefreshIcon
                    sx={{
                      animation: isLoading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/create-receipt"
              startIcon={<AddIcon />}
              sx={{ fontWeight: 600, px: 2.5, py: 0.9 }}
            >
              New Receipt
            </Button>
          </Stack>
        </Box>

        {/* Analytics Fetch Error Banner */}
        {analyticsError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => loadAllData(activeCurrency)}>
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            Failed to fetch store analytics: {analyticsError}
          </Alert>
        )}

        {/* Primary Financial Metric KPI Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Today's Revenue */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${theme.palette.success.main}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                      Today's Revenue
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={120} height={40} />
                    ) : (
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                        {formatCurrency(metrics.todayRevenue, activeCurrency)}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: theme.palette.success.main
                    }}
                  >
                    <TrendingUpIcon />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isLoading ? <Skeleton width={80} /> : `${metrics.todayReceipts || 0} receipts today`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Week's Revenue */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${theme.palette.info.main}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                      This Week
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={120} height={40} />
                    ) : (
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                        {formatCurrency(metrics.weekRevenue, activeCurrency)}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.12),
                      color: theme.palette.info.main
                    }}
                  >
                    <CalendarTodayIcon />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Current week gross sales
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Month's Revenue */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${theme.palette.secondary.main}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                      This Month
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={120} height={40} />
                    ) : (
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                        {formatCurrency(metrics.monthRevenue, activeCurrency)}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.12),
                      color: theme.palette.secondary.main
                    }}
                  >
                    <MonthIcon />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Monthly accumulated total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Revenue */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${theme.palette.primary.main}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                      All-Time Revenue
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={120} height={40} />
                    ) : (
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                        {formatCurrency(metrics.totalRevenue, activeCurrency)}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main
                    }}
                  >
                    <TotalIcon />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {metrics.counts.issued} issued receipts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Operational Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {/* Average Order Value */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.12),
                      color: theme.palette.warning.main
                    }}
                  >
                    <AnalyticsIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      AVG. ORDER VALUE
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={80} height={30} />
                    ) : (
                      <Typography variant="h6" fontWeight={700}>
                        {formatCurrency(metrics.avgOrderValue, activeCurrency)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Transactions */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main
                    }}
                  >
                    <ReceiptLongIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      TOTAL TRANSACTIONS
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={80} height={30} />
                    ) : (
                      <Typography variant="h6" fontWeight={700}>
                        {metrics.counts.total} receipts
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Flavours In Menu */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.12),
                      color: theme.palette.secondary.main
                    }}
                  >
                    <DrinkIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      MENU FLAVOURS
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={80} height={30} />
                    ) : (
                      <Typography variant="h6" fontWeight={700}>
                        {flavours.length} items
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Transaction Health / Completion */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: theme.palette.success.main
                    }}
                  >
                    <HealthIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      SUCCESS RATE
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={80} height={30} />
                    ) : (
                      <Typography variant="h6" fontWeight={700}>
                        {metrics.counts.total > 0
                          ? `${Math.round((metrics.counts.issued / metrics.counts.total) * 100)}%`
                          : '100%'}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Visual Analytics: Daily Revenue Timeline & Payment Breakdown */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Revenue Timeline (Area Chart) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%', p: 1 }}>
              <CardHeader
                title="Revenue Performance Trend"
                subheader="Daily gross earnings for issued receipts (last 30 days)"
                titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
              />
              <CardContent sx={{ pt: 0 }}>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                ) : timelineData.length === 0 ? (
                  <Box
                    sx={{
                      height: 280,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.action.hover, 0.05),
                      borderRadius: 2,
                      p: 3
                    }}
                  >
                    <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      No sales recorded in the timeline period yet.
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Issue your first receipt to see daily trends.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                      <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke={theme.palette.text.secondary}
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(val) => `${getCurrencySymbol(activeCurrency)} ${val}`}
                        />
                        <ChartTooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8,
                            boxShadow: theme.shadows[3]
                          }}
                          formatter={(value) => [formatCurrency(value, activeCurrency), 'Revenue']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#revenueGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Method Distribution */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%', p: 1 }}>
              <CardHeader
                title="Payment Methods"
                subheader="Breakdown by tender type"
                titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
              />
              <CardContent sx={{ pt: 0 }}>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                ) : paymentData.length === 0 ? (
                  <Box
                    sx={{
                      height: 280,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.action.hover, 0.05),
                      borderRadius: 2,
                      p: 3
                    }}
                  >
                    <CashIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      No payment records available.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 280, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flexGrow: 1, minHeight: 180 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={160}>
                        <PieChart>
                          <Pie
                            data={paymentData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                          >
                            {paymentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            formatter={(value) => [formatCurrency(value, activeCurrency), 'Total']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {paymentData.map((item, idx) => (
                        <Stack
                          key={item.name}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ px: 1 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: CHART_COLORS[idx % CHART_COLORS.length]
                              }}
                            />
                            <Typography variant="body2" fontWeight={500}>
                              {item.name}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(item.value, activeCurrency)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Flavours Leaderboard & Recent Receipts Activity */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Top-Selling Flavours */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Top-Selling Flavours"
                subheader="Most popular juice products by quantity sold"
                titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
                action={
                  <Button component={Link} to="/flavours" size="small" endIcon={<ArrowForwardIcon />}>
                    Inventory
                  </Button>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                {isLoading ? (
                  <Stack spacing={2}>
                    <Skeleton height={50} />
                    <Skeleton height={50} />
                    <Skeleton height={50} />
                  </Stack>
                ) : topFlavours.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <DrinkIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No flavour sales recorded yet.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2.5}>
                    {topFlavours.map((item, index) => {
                      const percentage = Math.round((item.quantity / highestFlavourQty) * 100);
                      return (
                        <Box key={item.name || index}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 1,
                                  bgcolor: index === 0 ? 'primary.main' : alpha(theme.palette.text.secondary, 0.15),
                                  color: index === 0 ? 'primary.contrastText' : 'text.primary',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 12,
                                  fontWeight: 700
                                }}
                              >
                                #{index + 1}
                              </Box>
                              <Typography variant="body2" fontWeight={600}>
                                {item.name}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Chip label={`${item.quantity} cups`} size="small" variant="outlined" />
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(item.revenue, activeCurrency)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                bgcolor: index === 0 ? theme.palette.primary.main : theme.palette.secondary.main
                              }
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Receipts Table */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Recent Receipts"
                subheader="Latest customer sales transactions"
                titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
                action={
                  <Button component={Link} to="/receipts" size="small" endIcon={<ArrowForwardIcon />}>
                    View All
                  </Button>
                }
              />
              <CardContent sx={{ pt: 0, p: { xs: 1, sm: 2 } }}>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                ) : recentList.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <ReceiptLongIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No receipts created yet.
                    </Typography>
                    <Button
                      component={Link}
                      to="/create-receipt"
                      variant="outlined"
                      size="small"
                      sx={{ mt: 2 }}
                    >
                      Create First Receipt
                    </Button>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                    <Table size="small" aria-label="recent receipts table">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Receipt #</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentList.map((r) => (
                          <TableRow key={r._id || r.receiptNumber} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                              {r.receiptNumber}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {r.customer?.name || r.customerName || 'Walk-in'}
                              </Typography>
                              {r.paymentMethod && (
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                  {r.paymentMethod.replace('_', ' ')}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{renderStatusChip(r.status)}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(r.totalAmount, r.currency || activeCurrency)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Launchpad Navigation Tiles */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Quick Management Launchpad
        </Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              component={Link}
              to="/create-receipt"
              sx={{
                p: 2,
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.shadows[4],
                  borderColor: 'primary.main'
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main
                  }}
                >
                  <ReceiptLongIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    POS Receipt
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fast cashier checkout
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              component={Link}
              to="/flavours"
              sx={{
                p: 2,
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.shadows[4],
                  borderColor: 'primary.main'
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                    color: theme.palette.secondary.main
                  }}
                >
                  <DrinkIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Flavours
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pricing & stock levels
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              component={Link}
              to="/receipts"
              sx={{
                p: 2,
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.shadows[4],
                  borderColor: 'primary.main'
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.12),
                    color: theme.palette.info.main
                  }}
                >
                  <BagIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Receipt History
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Audit log & reprint
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              component={Link}
              to="/settings"
              sx={{
                p: 2,
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.shadows[4],
                  borderColor: 'primary.main'
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.12),
                    color: theme.palette.success.main
                  }}
                >
                  <HealthIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Store Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Branding & printing
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppLayout>
  );
}
