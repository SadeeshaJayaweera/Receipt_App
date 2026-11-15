import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../theme/ThemeContext';

export const SHORTCUTS = [
  { key: 'F1 / ?', description: 'Show keyboard shortcuts guide', category: 'General' },
  { key: 'F2 / Alt+N', description: 'Create new receipt (POS checkout)', category: 'Navigation' },
  { key: 'F3 / Alt+H', description: 'Go to Receipt History & Audit Log', category: 'Navigation' },
  { key: 'F4 / Alt+D', description: 'Go to Business Dashboard & Analytics', category: 'Navigation' },
  { key: 'F6 / Alt+F', description: 'Go to Flavours & Inventory Management', category: 'Navigation' },
  { key: 'F9 / Alt+S', description: 'Go to Business Settings & Branding', category: 'Navigation' },
  { key: 'F8 / Alt+T', description: 'Toggle Light / Dark theme mode', category: 'General' },
  { key: 'Esc', description: 'Close open dialogs and modals', category: 'General' }
];

export default function useKeyboardShortcuts({ onOpenHelp }) {
  const navigate = useNavigate();
  const { toggleTheme } = useThemeMode();

  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Function keys are always handled even when typing (POS cashier standard)
      if (event.key === 'F1') {
        event.preventDefault();
        onOpenHelp?.();
        return;
      }

      if (event.key === 'F2') {
        event.preventDefault();
        navigate('/create-receipt');
        return;
      }

      if (event.key === 'F3') {
        event.preventDefault();
        navigate('/receipts');
        return;
      }

      if (event.key === 'F4') {
        event.preventDefault();
        navigate('/dashboard');
        return;
      }

      if (event.key === 'F6') {
        event.preventDefault();
        navigate('/flavours');
        return;
      }

      if (event.key === 'F8') {
        event.preventDefault();
        toggleTheme?.();
        return;
      }

      if (event.key === 'F9') {
        event.preventDefault();
        navigate('/settings');
        return;
      }

      // Do not trigger non-function shortcuts while typing in inputs
      if (isInput) return;

      // Question mark (?) opens help
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        onOpenHelp?.();
        return;
      }

      // Alt key combinations
      if (event.altKey) {
        const key = event.key.toLowerCase();
        if (key === 'n') {
          event.preventDefault();
          navigate('/create-receipt');
        } else if (key === 'h') {
          event.preventDefault();
          navigate('/receipts');
        } else if (key === 'd') {
          event.preventDefault();
          navigate('/dashboard');
        } else if (key === 'f') {
          event.preventDefault();
          navigate('/flavours');
        } else if (key === 's') {
          event.preventDefault();
          navigate('/settings');
        } else if (key === 't') {
          event.preventDefault();
          toggleTheme?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleTheme, onOpenHelp]);
}
