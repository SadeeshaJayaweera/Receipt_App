import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme
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

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { to: '/create-receipt', label: 'POS / New', icon: <CreateReceiptIcon fontSize="small" /> },
  { to: '/flavours', label: 'Flavours', icon: <DrinkIcon fontSize="small" /> },
  { to: '/receipts', label: 'History', icon: <HistoryIcon fontSize="small" /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon fontSize="small" /> }
];

export default function Navbar() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeMode();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setUserMenuAnchor(null);
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.primary.main,
          color: '#ffffff'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          {/* Logo & Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              component={Link}
              to="/dashboard"
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <span>{user?.logoIcon || '🧃'}</span>
              <span>{user?.businessName || 'Juice POS'}</span>
            </Typography>
          </Box>

          {/* Desktop Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  startIcon={link.icon}
                  sx={{
                    color: '#ffffff',
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 2,
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    fontWeight: active ? 700 : 500,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)'
                    }
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Box>

          {/* Right Action Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
              <IconButton onClick={toggleTheme} color="inherit" size="small">
                {mode === 'dark' ? <LightModeIcon sx={{ color: '#fbbf24' }} /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* User Profile */}
            <Tooltip title="Account settings">
              <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} size="small">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    fontSize: '0.8125rem',
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
              onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 3,
                  sx: { minWidth: 200, mt: 1, borderRadius: 2 }
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
              <MenuItem component={Link} to="/settings" onClick={() => setUserMenuAnchor(null)}>
                <ListItemIcon><StoreIcon fontSize="small" /></ListItemIcon>
                Store Profile
              </MenuItem>
              <MenuItem component={Link} to="/settings" onClick={() => setUserMenuAnchor(null)}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
                <ListItemIcon sx={{ color: theme.palette.error.main }}><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>

            {/* Mobile Hamburger */}
            <IconButton
              color="inherit"
              edge="end"
              aria-label="open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: { width: 260 }
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {user?.logoIcon || '🧃'} {user?.businessName || 'Juice POS'}
          </Typography>
        </Box>
        <Divider />
        <List sx={{ px: 1, py: 2 }}>
          {navLinks.map((link) => (
            <ListItem key={link.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  backgroundColor: isActive(link.to) ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: isActive(link.to) ? theme.palette.primary.main : 'inherit'
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive(link.to) ? theme.palette.primary.main : 'inherit' }}>
                  {link.icon}
                </ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => { setMobileOpen(false); handleLogout(); }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
