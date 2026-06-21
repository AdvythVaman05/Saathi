import { create } from 'zustand';
import { applyTheme, type ThemeName } from '../design-system/themes';

export interface AccessibilityPreferencesState {
  userId: string | null;
  speechRate: number;
  speechVolume: number;
  textScale: number;
  highContrast: boolean;
  reducedMotion: boolean;
  preferredVoice: string;
  preferredLanguage: string;

  // Actions
  setUserId: (id: string) => void;
  updatePreference: (key: keyof Omit<AccessibilityPreferencesState, 'userId' | 'updatePreference' | 'setUserId' | 'getThemeName'>, value: unknown) => void;
  getThemeName: () => ThemeName;
}

export const usePreferenceStore = create<AccessibilityPreferencesState>((set, get) => ({
  userId: null,
  speechRate: 1.00,
  speechVolume: 1.00,
  textScale: 1.00,
  highContrast: false,
  reducedMotion: false,
  preferredVoice: 'default',
  preferredLanguage: 'en',

  setUserId: (id) => set({ userId: id }),

  updatePreference: (key, value) => {
    set((state) => {
      const updated = { ...state, [key]: value };
      
      // Post-update visual side-effects
      if (key === 'highContrast') {
        const theme = value ? 'high-contrast-dark' : 'standard';
        applyTheme(theme);
      }
      
      return updated;
    });
  },

  getThemeName: () => {
    const { highContrast } = get();
    return highContrast ? 'high-contrast-dark' : 'standard';
  },
}));
export default usePreferenceStore;
