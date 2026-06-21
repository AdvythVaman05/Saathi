import { LanguageCode } from '../types';
import { usePreferenceStore } from '../../../stores/preferenceStore';

export class LanguageSwitchingService {
  /**
   * Persist and apply the selected language code across frontend modules
   */
  changeLanguage(code: LanguageCode): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saathi_preferred_language', code);
    }
    
    // Sync with global preference store
    usePreferenceStore.getState().updatePreference('preferredLanguage', code);

    // Dynamic side-effect: set document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', code);
    }
  }

  /**
   * Load preferred language from local storage, defaulting to English
   */
  loadPersistedLanguage(): LanguageCode {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saathi_preferred_language');
      if (saved) return saved as LanguageCode;
    }
    return 'en';
  }
}
export const languageSwitcher = new LanguageSwitchingService();
export default languageSwitcher;
