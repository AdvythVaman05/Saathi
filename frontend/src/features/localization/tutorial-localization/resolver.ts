import { LanguageCode, SystemTranslations } from '../types';
import { translationDictionary } from '../translations';

/**
 * Localized Tutorial Resolver.
 * Resolves static tutorial instructions, falling back to English.
 */
export class LocalizedTutorialResolver {
  resolve(tutorialKey: keyof SystemTranslations['tutorial'], targetLang: LanguageCode): string {
    const dict = translationDictionary[targetLang] || translationDictionary['en'];
    const text = dict?.tutorial?.[tutorialKey];

    if (text) return text;

    return translationDictionary['en']?.tutorial?.[tutorialKey] || '';
  }
}
export const tutorialResolver = new LocalizedTutorialResolver();
export default tutorialResolver;
