import { LanguageCode } from '../types';

/**
 * Question Translation Resolver.
 * Resolves translated text for questions and choices, falling back to English.
 */
export class QuestionTranslationResolver {
  /**
   * Resolve a localized string map, e.g. {"en": "Yes", "hi": "हाँ"}
   */
  resolve(textMap: Record<string, string | undefined> | null | undefined, targetLang: LanguageCode): string {
    if (!textMap) return '';

    // 1. Check selected language
    const targetVal = textMap[targetLang];
    if (targetVal) {
      return targetVal;
    }

    // 2. Fallback to English
    const engVal = textMap['en'];
    if (engVal) {
      return engVal;
    }

    // 3. Fallback to any available language key
    const keys = Object.keys(textMap);
    if (keys.length > 0) {
      return textMap[keys[0]] || '';
    }

    return '';
  }
}
export const questionResolver = new QuestionTranslationResolver();
export default questionResolver;
