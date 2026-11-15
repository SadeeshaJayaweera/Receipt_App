import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import { KeyboardOutlined as KeyboardIcon } from '@mui/icons-material';
import { SHORTCUTS } from '../hooks/useKeyboardShortcuts';

export default function KeyboardShortcutsDialog({ open, onClose }) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="shortcuts-dialog-title"
    >
      <DialogTitle component="div" id="shortcuts-dialog-title" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.50',
              color: 'primary.main'
            }}
          >
            <KeyboardIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Keyboard Shortcuts & POS Keys
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Accelerate cash register operations with keyboard hotkeys
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <Table size="small" aria-label="keyboard shortcuts table">
            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 140 }}>Shortcut Key</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 100 }}>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SHORTCUTS.map((item) => (
                <TableRow key={item.key} hover>
                  <TableCell>
                    <Box
                      component="kbd"
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        fontFamily: 'monospace',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                        color: theme.palette.mode === 'dark' ? 'grey.200' : 'grey.800',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                      }}
                    >
                      {item.key}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.primary">
                      {item.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.category}
                      size="small"
                      color={item.category === 'Navigation' ? 'primary' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
}
