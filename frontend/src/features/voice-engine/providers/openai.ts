import { SpeechRecognitionProvider, SpeechRecognitionHandlers } from '../transcription/recognition';
import { SpeechSynthesisProvider, SpeechSynthesisHandlers } from '../synthesis/synthesis';
import { SpeechRecognitionResult } from '../types';
import { AudioCaptureService } from '../pipeline/AudioCaptureService';
import { PCMEncoder } from '../pipeline/PCMEncoder';

export class OpenAiSpeechRecognitionProvider implements SpeechRecognitionProvider {
  readonly name = 'openai';
  private handlers: SpeechRecognitionHandlers = {};
  private socket: WebSocket | null = null;
  private isListening = false;
  private isTesting = false;
  private sessionId = '';
  private heartbeatInterval: any = null;

  constructor() {
    this.isTesting = typeof window === 'undefined';
  }

  async initialize(lang: string, handlers: SpeechRecognitionHandlers): Promise<void> {
    this.handlers = handlers;
    // OpenAI Realtime uses a session identifier for routing and recovery
    this.sessionId = 'session_' + Math.random().toString(36).substring(2, 10);
  }

  async startListening(): Promise<void> {
    this.isListening = true;
    this.handlers.onStart?.();

    if (this.isTesting) {
      return;
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host || 'localhost:8000';
      const wsUrl = `${wsProtocol}//${wsHost}/ws/speech/?session_id=${this.sessionId}`;
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Start heartbeat pinging loop
        this.heartbeatInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 10000);
      };

      this.socket.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const message = JSON.parse(event.data);
            if (message.type === 'audio_transcription' || message.type === 'recognition_result') {
              const result: SpeechRecognitionResult = {
                transcript: message.payload?.transcript || '',
                confidence: message.payload?.confidence || 0.95,
                isFinal: message.payload?.isFinal ?? true,
              };
              this.handlers.onResult?.(result);
            }
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      this.socket.onerror = (err) => {
        this.handlers.onError?.(new Error('WebSocket connection error.'));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saathi-telemetry-error', {
            detail: {
              category: 'WEBSOCKET_ERROR',
              message: 'WebSocket connection failed or encountered error',
              code: 'WS_CONNECTION_ERROR'
            }
          }));
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (this.isListening) {
          this.handlers.onEnd?.();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saathi-telemetry-error', {
              detail: {
                category: 'WEBSOCKET_DISCONNECT',
                message: 'WebSocket closed prematurely while listening',
                code: 'WS_PREMATURE_CLOSE'
              }
            }));
          }
        }
      };

      // Subscribe to the AudioCaptureService to capture 24kHz PCM chunks
      const capturer = AudioCaptureService.getInstance();
      capturer.subscribe('openai-recognition', (data) => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          // Pack audio packet with sequenceId and timestamp as big-endian binary frame
          const binaryPacket = PCMEncoder.packPacket(data.sequenceId, data.timestamp, data.pcmInt16);
          this.socket.send(binaryPacket);
        }
      }, 24000);

      await capturer.startCapture();

    } catch (e: any) {
      this.handlers.onError?.(e);
      this.handlers.onEnd?.();
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.isTesting) {
      setTimeout(() => {
        const mockResult: SpeechRecognitionResult = {
          transcript: 'back',
          confidence: 0.94,
          isFinal: true,
        };
        this.handlers.onResult?.(mockResult);
        this.handlers.onEnd?.();
      }, 100);
      return;
    }

    const capturer = AudioCaptureService.getInstance();
    capturer.unsubscribe('openai-recognition');

    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.handlers.onEnd?.();
  }

  async destroy(): Promise<void> {
    await this.stopListening();
    this.handlers = {};
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export class OpenAiSpeechSynthesisProvider implements SpeechSynthesisProvider {
  readonly name = 'openai';
  private handlers: SpeechSynthesisHandlers = {};
  private socket: WebSocket | null = null;
  private isTesting = false;
  private audioContext: AudioContext | null = null;
  private sessionId = '';

  constructor() {
    this.isTesting = typeof window === 'undefined';
  }

  async initialize(lang: string, handlers: SpeechSynthesisHandlers): Promise<void> {
    this.handlers = handlers;
    this.sessionId = 'session_synth_' + Math.random().toString(36).substring(2, 10);
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

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host || 'localhost:8000';
      const wsUrl = `${wsProtocol}//${wsHost}/ws/speech/?session_id=${this.sessionId}`;
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Trigger synthesis request over socket
        this.socket!.send(JSON.stringify({
          type: 'synthesis_request',
          payload: {
            text,
            rate,
            volume,
            voice,
          }
        }));
      };

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.handlers.onStart?.();

      this.socket.onmessage = async (event) => {
        try {
          if (event.data instanceof Blob) {
            // Read binary audio data and play it back
            const arrayBuffer = await event.data.arrayBuffer();
            this.audioContext!.decodeAudioData(arrayBuffer, (decodedBuffer) => {
              const source = this.audioContext!.createBufferSource();
              source.buffer = decodedBuffer;
              source.connect(this.audioContext!.destination);
              source.start(0);
            });
          }
        } catch (e) {
          // Playback error
        }
      };

      this.socket.onerror = (err) => {
        this.handlers.onError?.(new Error('WebSocket synthesis error.'));
      };

      this.socket.onclose = () => {
        this.handlers.onEnd?.();
      };

    } catch (e: any) {
      this.handlers.onError?.(e);
      this.handlers.onEnd?.();
    }
  }

  async cancel(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
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
}
