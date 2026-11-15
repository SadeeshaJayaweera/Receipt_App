import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Collapse,
  Slide,
  Typography
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualCheck = () => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      if (navigator.onLine) {
        setIsOnline(true);
        setShowRestored(true);
        setTimeout(() => setShowRestored(false), 3000);
      }
    }
  };

  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        boxShadow: 4
      }}
      role="status"
      aria-live="polite"
    >
      {!isOnline && (
        <Alert
          severity="warning"
          icon={<OfflineIcon fontSize="inherit" />}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleManualCheck}
              sx={{ fontWeight: 700 }}
            >
              Check Connection
            </Button>
          }
          sx={{
            borderRadius: 0,
            alignItems: 'center',
            bgcolor: 'warning.dark',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' }
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Offline Mode: Internet connection is currently unavailable. POS receipt creation may be delayed until connection is restored.
          </Typography>
        </Alert>
      )}

      {isOnline && showRestored && (
        <Alert
          severity="success"
          icon={<OnlineIcon fontSize="inherit" />}
          onClose={() => setShowRestored(false)}
          sx={{
            borderRadius: 0,
            alignItems: 'center',
            bgcolor: 'success.main',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' }
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Connection Restored: You are back online. All POS and receipt synchronization services are active.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
