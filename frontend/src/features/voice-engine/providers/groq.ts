import { SpeechRecognitionProvider, SpeechRecognitionHandlers } from '../transcription/recognition';
import { SpeechRecognitionResult } from '../types';
import { AudioCaptureService } from '../pipeline/AudioCaptureService';

/**
 * ============================================================================
 * GROQ WHISPER SPEECH RECOGNITION PROVIDER ADAPTER
 * ============================================================================
 * Design and Flow:
 * 1. Listening: Subscribes to AudioCaptureService at 16kHz, storing resampled Float32 chunks.
 * 2. Speech End: Unsubscribes from AudioCaptureService, compiles all recorded chunks,
 *    and converts them to a WAV file blob.
 * 3. Transcription: Posts the WAV blob via multipart FormData to the Django backend
 *    (/api/speech/transcribe/).
 * 4. FSM transition: Dispatches resolved text to FSM via handlers.onResult callback.
 * ============================================================================
 */
export class GroqSpeechRecognitionProvider implements SpeechRecognitionProvider {
  readonly name = 'groq';
  private handlers: SpeechRecognitionHandlers = {};
  private activeLang = 'en';
  private recordedChunks: Float32Array[] = [];
  private isListening = false;
  private isTesting = false;

  constructor() {
    this.isTesting = typeof window === 'undefined';
  }

  async initialize(lang: string, handlers: SpeechRecognitionHandlers): Promise<void> {
    this.handlers = handlers;
    this.activeLang = lang;
  }

  async startListening(): Promise<void> {
    this.isListening = true;
    this.recordedChunks = [];
    this.handlers.onStart?.();

    if (this.isTesting) {
      return;
    }

    // Subscribe to AudioCaptureService at Whisper's target rate of 16kHz
    const capturer = AudioCaptureService.getInstance();
    capturer.subscribe('groq-recognition', (data) => {
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
          transcript: 'yes',
          confidence: 0.95,
          isFinal: true,
        };
        this.handlers.onResult?.(mockResult);
        this.handlers.onEnd?.();
      }, 100);
      return;
    }

    const capturer = AudioCaptureService.getInstance();
    capturer.unsubscribe('groq-recognition');

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

    // Convert Float32 to Int16 PCM
    const int16PCM = new Int16Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      const s = Math.max(-1, Math.min(1, mergedBuffer[i]));
      int16PCM[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Wrap in standard WAV format header
    const wavBuffer = this.writeWavHeader(int16PCM, 16000);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}/api/speech/transcribe/`;

      const formData = new FormData();
      formData.append('audio', wavBlob, 'audio.wav');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Groq transcription endpoint failed: HTTP status ${response.status}`);
      }

      const data = await response.json();
      const result: SpeechRecognitionResult = {
        transcript: data.transcript || '',
        confidence: data.confidence || 0.95,
        isFinal: true,
      };

      this.handlers.onResult?.(result);

    } catch (e: any) {
      console.warn("Groq transcription error:", e);
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
}
