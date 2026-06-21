import { LanguageCode } from '../types';

export interface CodeSwitchDetectionResult {
  isCodeSwitched: boolean;
  primaryLang: LanguageCode;
  mixedLang: LanguageCode | null;
  confidence: number;
}

// Simple common English vocabulary mixed in Indian code-switching (Hinglish/Telglish)
const COMMON_ENGLISH_MIXINS = [
  'yes', 'no', 'repeat', 'back', 'skip', 'help', 'pause', 'resume', 'exit',
  'cane', 'dog', 'guide', 'survey', 'option', 'confirm', 'select', 'submit'
];

/**
 * Code-Switching Detection Service.
 * Analyzes mixed-language transcripts without external API dependencies.
 */
export class CodeSwitchingDetector {
  /**
   * Evaluates if a spoken transcript contains mixed languages
   */
  detect(transcript: string, activeLang: LanguageCode): CodeSwitchDetectionResult {
    const text = transcript.trim().toLowerCase();
    if (!text) {
      return { isCodeSwitched: false, primaryLang: activeLang, mixedLang: null, confidence: 1.0 };
    }

    const words = text.split(/\s+/);
    const hasEnglishWords = words.some((w) => COMMON_ENGLISH_MIXINS.includes(w));
    
    // If active language is English and Hindi terms are present (e.g. "haan", "nahin", "ruko")
    const hasHindiWords = words.some((w) => ['haan', 'nahin', 'ruko', 'chalu', 'madad'].includes(w));

    if (activeLang !== 'en' && hasEnglishWords) {
      return {
        isCodeSwitched: true,
        primaryLang: activeLang,
        mixedLang: 'en',
        confidence: 0.85,
      };
    }

    if (activeLang === 'en' && hasHindiWords) {
      return {
        isCodeSwitched: true,
        primaryLang: 'en',
        mixedLang: 'hi',
        confidence: 0.90,
      };
    }

    return {
      isCodeSwitched: false,
      primaryLang: activeLang,
      mixedLang: null,
      confidence: 1.0,
    };
  }
}
export const codeSwitchDetector = new CodeSwitchingDetector();
export default codeSwitchDetector;
