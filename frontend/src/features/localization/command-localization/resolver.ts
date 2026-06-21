import { LanguageCode, SystemTranslations } from '../types';
import { translationDictionary } from '../translations';

/**
 * Localized Command Resolver.
 * Resolves static command translation strings for the UI and voice synthesis.
 */
export class LocalizedCommandResolver {
  resolve(commandKey: keyof SystemTranslations['commands'], targetLang: LanguageCode): string {
    const dict = translationDictionary[targetLang] || translationDictionary['en'];
    const text = dict?.commands?.[commandKey];
    
    if (text) return text;
    
    // Fallback directly to English dictionary
    return translationDictionary['en']?.commands?.[commandKey] || String(commandKey);
  }
}
export const commandResolver = new LocalizedCommandResolver();
export default commandResolver;
