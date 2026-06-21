export interface SpeechSynthesisHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Speech Synthesis Provider interface.
 * Standardizes text-to-speech rendering across providers.
 */
export interface SpeechSynthesisProvider {
  name: string;
  initialize(lang: string, handlers: SpeechSynthesisHandlers): Promise<void>;
  speak(text: string, rate: number, volume: number, voice?: string): Promise<void>;
  cancel(): Promise<void>;
  destroy(): Promise<void>;
}
