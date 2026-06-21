import { LanguageCode, SystemTranslations } from '../types';
import { translationDictionary } from '../translations';

/**
 * Localized Error Resolver.
 * Resolves static error translations, falling back to English.
 */
export class LocalizedErrorResolver {
  resolve(errorKey: keyof SystemTranslations['errors'], targetLang: LanguageCode): string {
    const dict = translationDictionary[targetLang] || translationDictionary['en'];
    const text = dict?.errors?.[errorKey];

    if (text) return text;

    return translationDictionary['en']?.errors?.[errorKey] || 'An error occurred';
  }
}
export const errorResolver = new LocalizedErrorResolver();
export default errorResolver;
