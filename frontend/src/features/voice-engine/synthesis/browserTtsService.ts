/**
 * BrowserTTSService
 * Resolves language-aware high-quality regional voices for standard Indian languages.
 */
export class BrowserTTSService {
  /**
   * Retrieves the best high-quality local speech synthesis voice for the target language.
   * Prioritizes 'Google' voices, 'Natural' (Microsoft Edge), 'Siri/Premium' (Apple Safari),
   * and 'Neural' engines before falling back.
   */
  static getBestVoice(lang: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined') return null;
    
    const voices = window.speechSynthesis.getVoices();
    const mappedLang = this.mapLangCode(lang);

    // 1. Filter voices for the exact target language (e.g. 'hi-IN')
    let langVoices = voices.filter(
      (v) => v.lang.toLowerCase().replace('_', '-') === mappedLang.toLowerCase()
    );

    // 2. Fallback: Search by prefix match (e.g. 'hi')
    if (langVoices.length === 0) {
      langVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(lang.toLowerCase())
      );
    }

    if (langVoices.length === 0) {
      return null;
    }

    // 3. Select high-quality voice using prioritised search terms
    const priorityTerms = ['natural', 'google', 'premium', 'siri', 'neural', 'microsoft'];
    for (const term of priorityTerms) {
      const match = langVoices.find((v) =>
        v.name.toLowerCase().includes(term)
      );
      if (match) return match;
    }

    // 4. Fallback to the first matching language voice
    return langVoices[0];
  }

  private static mapLangCode(lang: string): string {
    const map: Record<string, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
    };
    return map[lang] || lang;
  }
}
