import { SpeechRecognitionResult } from '../types';

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
}

/**
 * Speech Recognition Provider interface.
 * All recognition adapters (OpenAI Realtime, Azure, Web Speech) must implement this.
 */
export interface SpeechRecognitionProvider {
  name: string;
  initialize(lang: string, handlers: SpeechRecognitionHandlers): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  destroy(): Promise<void>;
}
