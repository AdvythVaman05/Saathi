import { SpeechRecognitionProvider, SpeechRecognitionHandlers } from '../transcription/recognition';
import { SpeechSynthesisProvider, SpeechSynthesisHandlers } from '../synthesis/synthesis';
import { SpeechRecognitionResult } from '../types';
import { AudioCaptureService } from '../pipeline/AudioCaptureService';

export class AzureSpeechRecognitionProvider implements SpeechRecognitionProvider {
  readonly name = 'azure';
  private handlers: SpeechRecognitionHandlers = {};
  private activeLang = 'en-US';
  private recordedChunks: Float32Array[] = [];
  private subscriptionKey: string;
  private region: string;
  private isListening = false;
  private isTesting = false;

  constructor() {
    this.subscriptionKey = process.env.NEXT_PUBLIC_AZURE_KEY || 'mock-key';
    this.region = process.env.NEXT_PUBLIC_AZURE_REGION || 'eastus';
    this.isTesting = typeof window === 'undefined';
  }

  async initialize(lang: string, handlers: SpeechRecognitionHandlers): Promise<void> {
    this.handlers = handlers;
    this.activeLang = this.mapLangCode(lang);
  }

  async startListening(): Promise<void> {
    this.isListening = true;
    this.recordedChunks = [];
    this.handlers.onStart?.();

    if (this.isTesting) {
      return;
    }

    // Subscribe to AudioCaptureService at Azure's expected rate of 16kHz
    const capturer = AudioCaptureService.getInstance();
    capturer.subscribe('azure-recognition', (data) => {
      if (this.isListening) {
        this.recordedChunks.push(data.resampledFloat32);
      }
    }, 16000);

    await capturer.startCapture();
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.isTesting) {
      setTimeout(() => {
        const mockResult: SpeechRecognitionResult = {
          transcript: 'repeat',
          confidence: 0.92,
          isFinal: true,
        };
        this.handlers.onResult?.(mockResult);
        this.handlers.onEnd?.();
      }, 100);
      return;
    }

    const capturer = AudioCaptureService.getInstance();
    capturer.unsubscribe('azure-recognition');

    // Compile recorded chunks
    const totalLength = this.recordedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    if (totalLength === 0) {
      this.handlers.onEnd?.();
      return;
    }

    const mergedBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      mergedBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert Float32 to Int16
    const int16PCM = new Int16Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      const s = Math.max(-1, Math.min(1, mergedBuffer[i]));
      int16PCM[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Wrap in WAV header
    const wavBuffer = this.writeWavHeader(int16PCM, 16000);

    try {
      const url = `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.activeLang}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Accept': 'application/json',
        },
        body: wavBuffer,
      });

      if (!response.ok) {
        throw new Error(`Azure STT error: HTTP status ${response.status}`);
      }

      const data = await response.json();
      const result: SpeechRecognitionResult = {
        transcript: data.DisplayText || '',
        confidence: data.RecognitionStatus === 'Success' ? 0.90 : 0.0,
        isFinal: true,
      };

      this.handlers.onResult?.(result);
    } catch (e: any) {
      this.handlers.onError?.(e);
    } finally {
      this.handlers.onEnd?.();
    }
  }

  async destroy(): Promise<void> {
    await this.stopListening();
    this.handlers = {};
  }

  private writeWavHeader(samples: Int16Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (v: DataView, off: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(off + i, str.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(44 + i * 2, samples[i], true);
    }
    
    return buffer;
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

export class AzureSpeechSynthesisProvider implements SpeechSynthesisProvider {
  readonly name = 'azure';
  private handlers: SpeechSynthesisHandlers = {};
  private activeLang = 'en-US';
  private subscriptionKey: string;
  private region: string;
  private audioContext: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private isTesting = false;

  constructor() {
    this.subscriptionKey = process.env.NEXT_PUBLIC_AZURE_KEY || 'mock-key';
    this.region = process.env.NEXT_PUBLIC_AZURE_REGION || 'eastus';
    this.isTesting = typeof window === 'undefined';
  }

  async initialize(lang: string, handlers: SpeechSynthesisHandlers): Promise<void> {
    this.handlers = handlers;
    this.activeLang = this.mapLangCode(lang);
  }

  async speak(text: string, rate: number, volume: number, voice?: string): Promise<void> {
    if (this.isTesting) {
      this.handlers.onStart?.();
      setTimeout(() => {
        this.handlers.onEnd?.();
      }, 100);
      return;
    }

    await this.cancel();

    // Map rate multiplier to relative percentage (+/- %) for Azure
    const relativeRate = Math.round((rate - 1.0) * 100);
    const rateStr = relativeRate >= 0 ? `+${relativeRate}%` : `${relativeRate}%`;

    const localeVoice = voice || this.getDefaultVoice(this.activeLang);
    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${this.activeLang}'>
        <voice name='${localeVoice}'>
          <prosody rate='${rateStr}' volume='${volume * 100}'>
            ${text}
          </prosody>
        </voice>
      </speak>
    `.trim();

    try {
      const url = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'SaathiClient',
        },
        body: ssml,
      });

      if (!response.ok) {
        throw new Error(`Azure TTS status error: HTTP status ${response.status}`);
      }

      const audioData = await response.arrayBuffer();
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      this.audioContext.decodeAudioData(audioData, (buffer) => {
        this.handlers.onStart?.();
        this.activeSource = this.audioContext!.createBufferSource();
        this.activeSource.buffer = buffer;
        this.activeSource.connect(this.audioContext!.destination);
        
        this.activeSource.onended = () => {
          this.handlers.onEnd?.();
          this.activeSource = null;
        };

        this.activeSource.start(0);
      }, (error) => {
        throw new Error(`Failed to decode audio data: ${error.message}`);
      });

    } catch (e: any) {
      this.handlers.onError?.(e);
    }
  }

  async cancel(): Promise<void> {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch (e) {
        // Ignore
      }
      this.activeSource = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }

  async destroy(): Promise<void> {
    await this.cancel();
    this.handlers = {};
  }

  private getDefaultVoice(locale: string): string {
    const voices: Record<string, string> = {
      'en-US': 'en-US-JennyNeural',
      'hi-IN': 'hi-IN-SwaraNeural',
      'te-IN': 'te-IN-ShrutiNeural',
      'ta-IN': 'ta-IN-PallaviNeural',
      'kn-IN': 'kn-IN-SapnaNeural',
      'ml-IN': 'ml-IN-SobhanaNeural',
      'bn-IN': 'bn-IN-TanishaNeural',
      'mr-IN': 'mr-IN-AarohiNeural',
      'gu-IN': 'gu-IN-DhwaniNeural',
    };
    return voices[locale] || 'en-US-JennyNeural';
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
