export type ThemeName = 'standard' | 'high-contrast-dark' | 'high-contrast-light';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  focusRing: string;
}

export const themeConfigs: Record<ThemeName, ThemeColors> = {
  standard: {
    bgPrimary: 'hsl(215, 25%, 12%)',
    bgSecondary: 'hsl(215, 20%, 18%)',
    textPrimary: 'hsl(0, 0%, 98%)',
    textSecondary: 'hsl(215, 15%, 75%)',
    accent: 'hsl(210, 100%, 65%)',
    focusRing: 'hsl(45, 100%, 50%)',
  },
  'high-contrast-dark': {
    bgPrimary: '#000000',
    bgSecondary: '#121212',
    textPrimary: '#FFFF00',
    textSecondary: '#FFFFFF',
    accent: '#FFFF00',
    focusRing: '#FFFF00',
  },
  'high-contrast-light': {
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F3F4F6',
    textPrimary: '#000000',
    textSecondary: '#1F2937',
    accent: '#0000FF',
    focusRing: '#000000',
  },
};

/**
 * Apply the selected theme properties to the document root element
 */
export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Set data-theme attribute
  if (theme === 'standard') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}
