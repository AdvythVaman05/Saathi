import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceEngineManager } from '../features/voice-engine/providers/manager';
import { usePreferenceStore } from '../stores/preferenceStore';

export interface SpeechSynthesisConfig {
  lang: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Abstraction layer for Text-To-Speech (TTS) synthesis.
 * Escalates dynamically from OpenAI/Azure to Browser SpeechSynthesis.
 */
export function useSpeechSynthesis(config: SpeechSynthesisConfig) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeProviderName, setActiveProviderName] = useState<'openai' | 'azure' | 'browser' | 'groq'>('browser');
  const managerRef = useRef<VoiceEngineManager | null>(null);

  // Initialize VoiceEngineManager
  useEffect(() => {
    const prefs = usePreferenceStore.getState();
    const manager = new VoiceEngineManager({
      preferredProvider: 'browser',
      lang: config.lang,
      confidenceThreshold: 0.80,
    });

    managerRef.current = manager;
    setActiveProviderName(manager.getActiveProviderName());
  }, [config.lang]);

  const speak = useCallback(async (text: string, rate = 1.0, volume = 1.0, voice = 'default') => {
    if (!managerRef.current) return;
    setIsSpeaking(true);

    const runSpeak = async () => {
      try {
        const provider = managerRef.current!.getSynthesisProvider();
        await provider.initialize(config.lang, {
          onStart: () => {
            config.onStart?.();
          },
          onEnd: () => {
            setIsSpeaking(false);
            config.onEnd?.();
          },
          onError: async (err: any) => {
            console.error('Synthesis provider error:', err);
            const outcome = managerRef.current!.handleProviderError(err);
            if (outcome.action === 'retry') {
              setTimeout(() => {
                runSpeak();
              }, outcome.delay || 1000);
            } else if (outcome.action === 'fallback') {
              try {
                const nextProvider = managerRef.current!.triggerFallback();
                setActiveProviderName(nextProvider);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('saathi-aria-announcement', {
                    detail: { message: `Switching to fallback voice provider: ${nextProvider}` }
                  }));
                }
                await provider.destroy();
                runSpeak();
              } catch (fallbackErr) {
                config.onError?.('All voice synthesis engines exhausted.');
                setIsSpeaking(false);
              }
            } else {
              config.onError?.(err);
              setIsSpeaking(false);
            }
          }
        });
        await provider.speak(text, rate, volume, voice);
      } catch (err: any) {
        config.onError?.(err);
        setIsSpeaking(false);
      }
    };

    runSpeak();
  }, [config]);

  const cancel = useCallback(async () => {
    setIsSpeaking(false);
    if (!managerRef.current) return;
    try {
      const provider = managerRef.current.getSynthesisProvider();
      await provider.cancel();
    } catch (e) {
      console.warn('Failed to cancel speaking:', e);
    }
  }, []);

  return {
    isSpeaking,
    provider: activeProviderName,
    speak,
    cancel,
  };
}
export default useSpeechSynthesis;
