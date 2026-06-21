import { SpeechRecognitionProvider } from '../transcription/recognition';
import { SpeechSynthesisProvider } from '../synthesis/synthesis';
import { BrowserSpeechRecognitionProvider, BrowserSpeechSynthesisProvider } from './browser';
import { GroqSpeechRecognitionProvider } from './groq';

export interface ProviderRegistry {
  recognition: Record<string, SpeechRecognitionProvider>;
  synthesis: Record<string, SpeechSynthesisProvider>;
}

// Global registry mapping active adapters
export const providerRegistry: ProviderRegistry = {
  recognition: {},
  synthesis: {},
};

/**
 * Helper to register custom recognition adapters.
 */
export function registerRecognitionProvider(name: string, provider: SpeechRecognitionProvider): void {
  providerRegistry.recognition[name] = provider;
}

/**
 * Helper to register custom synthesis adapters.
 */
export function registerSynthesisProvider(name: string, provider: SpeechSynthesisProvider): void {
  providerRegistry.synthesis[name] = provider;
}

// Default Speech-to-Text Provider
registerRecognitionProvider('groq', new GroqSpeechRecognitionProvider());

// Default Text-to-Speech Provider
registerSynthesisProvider('browser', new BrowserSpeechSynthesisProvider());

// Browser Web Speech recognition fallback
registerRecognitionProvider('browser', new BrowserSpeechRecognitionProvider());


