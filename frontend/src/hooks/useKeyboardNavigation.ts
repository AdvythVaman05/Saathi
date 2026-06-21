import { useEffect, type RefObject } from 'react';

export interface ShortcutMapping {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  callback: (e: KeyboardEvent) => void;
}

/**
 * Custom hook to register global accessibility hotkeys.
 * Ensures default browser behavior is prevented when callbacks execute.
 */
export function useKeyboardNavigation(shortcuts: ShortcutMapping[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        
        // Exact matching for modifiers
        const matchesAlt = !shortcut.altKey || e.altKey;
        const matchesCtrl = !shortcut.ctrlKey || e.ctrlKey;
        
        if (matchesKey && matchesAlt && matchesCtrl) {
          e.preventDefault();
          shortcut.callback(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

/**
 * Custom React hook to trap focus within a container element.
 * Essential for dialog screens, dropdown panels, and overlay setups.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // Focus the first element on trap activation
    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = container.querySelectorAll<HTMLElement>(focusableSelectors);
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, active]);
}
