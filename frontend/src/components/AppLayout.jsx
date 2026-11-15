import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Breadcrumbs
} from '@mui/material';
import {
  Menu as MenuIcon,
  DashboardOutlined as DashboardIcon,
  LocalDrinkOutlined as DrinkIcon,
  ReceiptLongOutlined as CreateReceiptIcon,
  HistoryOutlined as HistoryIcon,
  SettingsOutlined as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import { useThemeMode } from '../theme/ThemeContext';

const DRAWER_WIDTH = 260;

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/create-receipt', label: 'POS / New Receipt', icon: <CreateReceiptIcon /> },
  { to: '/flavours', label: 'Flavours & Stock', icon: <DrinkIcon /> },
  { to: '/receipts', label: 'Receipt History', icon: <HistoryIcon /> },
  { to: '/settings', label: 'Store Settings', icon: <SettingsIcon /> }
];

export default function AppLayout({ children, title }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeMode();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Active page title resolution
  const currentNavItem = navItems.find(item => item.to === location.pathname);
  const pageTitle = title || currentNavItem?.label || 'Juice Receipt App';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
        }}
      >
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            color: '#fff',
            width: 40,
            height: 40,
            boxShadow: theme.shadows[1]
          }}
        >
          {user?.logoIcon || '🧃'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {user?.businessName || 'Juice POS'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.tagline || 'Receipt Management'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.to}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  backgroundColor: active
                    ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                    : 'transparent',
                  color: active ? theme.palette.primary.main : theme.palette.text.primary,
                  fontWeight: active ? 600 : 500,
                  '&:hover': {
                    backgroundColor: active
                      ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                      : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: active ? theme.palette.primary.main : theme.palette.text.secondary
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 500
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Quick Footer Profile info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="caption" fontWeight={600} noWrap display="block">
            {user?.email || 'Logged in'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Currency: {user?.defaultCurrency || 'LKR'}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton onClick={handleLogout} size="small" color="error">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Top Application Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Breadcrumbs aria-label="breadcrumb" sx={{ display: { xs: 'none', sm: 'block' }, mb: 0.2 }}>
                <Typography variant="caption" color="text.secondary">Store</Typography>
                <Typography variant="caption" color="text.primary" fontWeight={600}>{pageTitle}</Typography>
              </Breadcrumbs>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {pageTitle}
              </Typography>
            </Box>
          </Box>

          {/* Action Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
              <IconButton onClick={toggleTheme} color="inherit" size="medium">
                {mode === 'dark' ? <LightModeIcon sx={{ color: '#fbbf24' }} /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* User Avatar & Menu */}
            <Tooltip title="Account settings">
              <IconButton onClick={handleUserMenuOpen} size="small" sx={{ ml: 0.5 }}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {(user?.businessName || 'U').charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              onClick={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 3,
                  sx: { minWidth: 200, mt: 1.5, borderRadius: 2 }
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {user?.businessName || 'Business Account'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem component={Link} to="/settings">
                <ListItemIcon><StoreIcon fontSize="small" /></ListItemIcon>
                Store Profile
              </MenuItem>
              <MenuItem component={Link} to="/settings">
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
                <ListItemIcon sx={{ color: theme.palette.error.main }}><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation drawers"
      >
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH }
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8, // Header height offset
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
