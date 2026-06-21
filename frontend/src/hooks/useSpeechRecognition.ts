import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceEngineManager } from '../features/voice-engine/providers/manager';
import { usePreferenceStore } from '../stores/preferenceStore';

export interface SpeechRecognitionConfig {
  lang: string;
  onResult: (transcript: string, confidence: number) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Abstraction layer for Speech Recognition.
 * Fully integrates with VoiceEngineManager, providers (OpenAI, Azure, Browser), and failover logic.
 */
export function useSpeechRecognition(config: SpeechRecognitionConfig) {
  const [isListening, setIsListening] = useState(false);
  const [activeProviderName, setActiveProviderName] = useState<'openai' | 'azure' | 'browser' | 'groq'>('groq');
  const managerRef = useRef<VoiceEngineManager | null>(null);

  // Initialize VoiceEngineManager
  useEffect(() => {
    const prefs = usePreferenceStore.getState();
    const manager = new VoiceEngineManager({
      preferredProvider: 'groq',
      lang: config.lang,
      confidenceThreshold: 0.80,
    });

    managerRef.current = manager;
    setActiveProviderName(manager.getActiveProviderName());
  }, [config.lang]);

  const startListening = useCallback(async () => {
    if (!managerRef.current) return;
    setIsListening(true);
    
    const runStart = async () => {
      try {
        const provider = managerRef.current!.getRecognitionProvider();
        await provider.initialize(config.lang, {
          onStart: () => {
            config.onStart?.();
          },
          onResult: (res) => {
            config.onResult(res.transcript, res.confidence);
          },
          onError: async (err) => {
            console.error('Recognition provider error:', err);
            const outcome = managerRef.current!.handleProviderError(err);
            if (outcome.action === 'retry') {
              setTimeout(() => {
                runStart();
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
                runStart();
              } catch (fallbackErr) {
                config.onError('All voice recognition engines exhausted.');
                setIsListening(false);
              }
            } else {
              config.onError(err.message);
              setIsListening(false);
            }
          },
          onEnd: () => {
            config.onEnd?.();
          }
        });
        await provider.startListening();
      } catch (err: any) {
        config.onError(err.message || 'Failed to start voice recognition.');
        setIsListening(false);
      }
    };

    runStart();
  }, [config]);

  const stopListening = useCallback(async () => {
    setIsListening(false);
    if (!managerRef.current) return;
    try {
      const provider = managerRef.current.getRecognitionProvider();
      await provider.stopListening();
    } catch (e) {
      console.warn('Failed to stop listening:', e);
    }
  }, []);

  return {
    isListening,
    provider: activeProviderName,
    startListening,
    stopListening,
  };
}
export default useSpeechRecognition;
