import { SpeechRecognitionProvider, SpeechRecognitionHandlers } from '../transcription/recognition';
import { SpeechSynthesisProvider, SpeechSynthesisHandlers } from '../synthesis/synthesis';
import { SpeechRecognitionResult } from '../types';
import { BrowserTTSService } from '../synthesis/browserTtsService';

/**
 * ============================================================================
 * BROWSER WEB SPEECH API PROVIDER ADAPTER
 * ============================================================================
 * WARNING / DESIGN NOTE:
 * - This provider is a BEST-EFFORT FALLBACK only.
 * - It displays LOWER CONFIDENCE RELIABILITY compared to online cloud engines.
 * - It exhibits LOWER LANGUAGE CONSISTENCY, particularly for regional Indian languages.
 * - OpenAI Realtime and Azure Speech APIs remain the primary, preferred providers.
 * ============================================================================
 */

export class BrowserSpeechRecognitionProvider implements SpeechRecognitionProvider {
  readonly name = 'browser';
  private recognition: any = null;
  private handlers: SpeechRecognitionHandlers = {};
  private isListening = false;
  private activeLang = 'en-US';

  async initialize(lang: string, handlers: SpeechRecognitionHandlers): Promise<void> {
    this.handlers = handlers;
    this.activeLang = this.mapLangCode(lang);
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      // In non-supported browsers, we'll gracefully mock so it doesn't crash the system
      console.warn('Web Speech API (SpeechRecognition) is not supported in this browser. Running mock recognition.');
      return;
    }

    this.recognition = new SpeechRecognitionClass();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.activeLang;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.handlers.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const alternative = lastResult[0];
      const result: SpeechRecognitionResult = {
        transcript: alternative.transcript,
        confidence: alternative.confidence || 0.85, // Default confidence if missing
        isFinal: lastResult.isFinal,
      };
      this.handlers.onResult?.(result);
    };

    this.recognition.onerror = (event: any) => {
      const error = new Error(`SpeechRecognition error: ${event.error}`);
      this.handlers.onError?.(error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.handlers.onEnd?.();
    };
  }

  async startListening(): Promise<void> {
    this.isListening = true;
    if (typeof window === 'undefined' || !this.recognition) {
      // Mock mode for testing / Node.js
      this.handlers.onStart?.();
      setTimeout(() => {
        if (this.isListening) {
          const result: SpeechRecognitionResult = {
            transcript: 'skip', // default command mock
            confidence: 0.90,
            isFinal: true,
          };
          this.handlers.onResult?.(result);
          this.handlers.onEnd?.();
          this.isListening = false;
        }
      }, 500);
      return;
    }
    
    try {
      this.recognition.start();
    } catch (e: any) {
      this.handlers.onError?.(e);
    }
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    if (typeof window === 'undefined' || !this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      // Ignore
    }
  }

  async destroy(): Promise<void> {
    await this.stopListening();
    this.recognition = null;
    this.handlers = {};
  }

  private mapLangCode(lang: string): string {
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

export class BrowserSpeechSynthesisProvider implements SpeechSynthesisProvider {
  readonly name = 'browser';
  private handlers: SpeechSynthesisHandlers = {};
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeLang = 'en-US';

  async initialize(lang: string, handlers: SpeechSynthesisHandlers): Promise<void> {
    this.handlers = handlers;
    this.activeLang = this.mapLangCode(lang);
  }

  async speak(text: string, rate: number, volume: number, voice?: string): Promise<void> {
    // If in Node.js / testing, run a mock timer synthesis
    if (typeof window === 'undefined') {
      this.handlers.onStart?.();
      setTimeout(() => {
        this.handlers.onEnd?.();
      }, 300);
      return;
    }

    await this.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = this.activeLang;
    this.currentUtterance.rate = rate;
    this.currentUtterance.volume = volume;

    const matchedVoice = BrowserTTSService.getBestVoice(this.activeLang);
    if (matchedVoice) {
      this.currentUtterance.voice = matchedVoice;
    }


    this.currentUtterance.onstart = () => {
      this.handlers.onStart?.();
    };

    this.currentUtterance.onend = () => {
      this.handlers.onEnd?.();
      this.currentUtterance = null;
    };

    this.currentUtterance.onerror = (event: any) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
        this.handlers.onEnd?.();
        return;
      }
      const error = new Error(`SpeechSynthesis error: ${event.error}`);
      this.handlers.onError?.(error);
      this.currentUtterance = null;
    };

    window.speechSynthesis.speak(this.currentUtterance);
  }

  async cancel(): Promise<void> {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    this.currentUtterance = null;
  }

  async destroy(): Promise<void> {
    await this.cancel();
    this.handlers = {};
  }

  private mapLangCode(lang: string): string {
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
