import { VoiceProviderType, VoiceEngineConfig } from '../types';
import { SpeechRecognitionProvider } from '../transcription/recognition';
import { SpeechSynthesisProvider } from '../synthesis/synthesis';
import { providerRegistry } from './registry';

export class VoiceEngineManager {
  private config: VoiceEngineConfig;
  private activeProvider: VoiceProviderType;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(config: VoiceEngineConfig) {
    this.config = config;
    this.activeProvider = config.preferredProvider || 'groq';
  }

  getActiveProviderName(): VoiceProviderType {
    return this.activeProvider;
  }

  /**
   * Resolves the active recognition adapter from the registry
   */
  getRecognitionProvider(): SpeechRecognitionProvider {
    const provider = providerRegistry.recognition[this.activeProvider];
    if (!provider) {
      throw new Error(`SpeechRecognitionProvider ${this.activeProvider} not registered.`);
    }
    return provider;
  }

  /**
   * Resolves the active synthesis adapter from the registry.
   * Force-maps to 'browser' local speech synthesis.
   */
  getSynthesisProvider(): SpeechSynthesisProvider {
    const provider = providerRegistry.synthesis['browser'];
    if (!provider) {
      throw new Error("SpeechSynthesisProvider 'browser' not registered.");
    }
    return provider;
  }

  /**
   * Fallback management service logic.
   * Groq falls back directly to Manual Response Mode by throwing a fatal error.
   */
  triggerFallback(): VoiceProviderType {
    const current = this.activeProvider;
    if (current === 'groq') {
      throw new Error('Groq speech recognition exhausted. Falling back to Manual Response Mode.');
    }
    throw new Error('All speech providers exhausted. Voice engine failed.');
  }



  /**
   * Error handling service: evaluates failures and decides whether to retry or trigger fallback.
   */
  handleProviderError(error: Error): { action: 'retry' | 'fallback' | 'fatal'; delay?: number } {
    console.error(`Voice provider error in ${this.activeProvider}:`, error);

    // If terminal authentication error, trigger fallback immediately
    if (error.message.includes('auth') || error.message.includes('401') || error.message.includes('403')) {
      return { action: 'fallback' };
    }

    // Handle transient timeouts / 5xx errors with retries
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const delay = Math.pow(2, this.retryCount) * 250;
      return { action: 'retry', delay };
    }

    // Exhausted retries -> trigger fallback
    if (this.activeProvider !== 'browser') {
      return { action: 'fallback' };
    }

    return { action: 'fatal' };
  }
}
export default VoiceEngineManager;
