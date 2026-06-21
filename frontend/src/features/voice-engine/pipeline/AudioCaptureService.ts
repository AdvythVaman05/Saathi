import { Resampler } from './Resampler';
import { PCMEncoder } from './PCMEncoder';

export type AudioStreamCallback = (data: {
  rawFloat32: Float32Array;
  resampledFloat32: Float32Array;
  pcmInt16: Int16Array;
  sequenceId: number;
  timestamp: number;
}) => void;

/**
 * Shared Audio Capture Service.
 * Fulfills:
 * - All microphone access must occur here.
 * - Provider adapters must never directly call getUserMedia.
 * - Provider adapters receive normalized PCM streams only.
 */
export class AudioCaptureService {
  private static instance: AudioCaptureService | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private subscribers = new Map<string, { callback: AudioStreamCallback; targetSampleRate: number }>();
  private isCapturing = false;
  private sequenceId = 0;

  private constructor() {}

  static getInstance(): AudioCaptureService {
    if (!AudioCaptureService.instance) {
      AudioCaptureService.instance = new AudioCaptureService();
    }
    return AudioCaptureService.instance;
  }

  /**
   * Subscribes a listener (e.g. a provider adapter) to the normalized audio stream.
   * Target sample rate must be specified (e.g., 24000 for OpenAI, 16000 for Azure).
   */
  subscribe(id: string, callback: AudioStreamCallback, targetSampleRate: number): void {
    this.subscribers.set(id, { callback, targetSampleRate });
  }

  unsubscribe(id: string): void {
    this.subscribers.delete(id);
    if (this.subscribers.size === 0 && this.isCapturing) {
      this.stopCapture();
    }
  }

  async startCapture(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isCapturing) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // Create script processor to capture chunks (buffer size 4096 is widely supported)
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    const inputSampleRate = this.audioContext.sampleRate;
    
    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.isCapturing) return;
      
      const inputBuffer = event.inputBuffer.getChannelData(0);
      // Make a copy of the buffer because the AudioProcess event buffer is recycled
      const rawFloat32 = new Float32Array(inputBuffer);
      const timestamp = Date.now();
      this.sequenceId++;

      // Dispatch to each subscriber with their specific downsampling rate
      this.subscribers.forEach(({ callback, targetSampleRate }) => {
        const resampledFloat32 = Resampler.resample(rawFloat32, inputSampleRate, targetSampleRate);
        const pcmInt16 = PCMEncoder.encodeTo16BitPCM(resampledFloat32);
        
        callback({
          rawFloat32,
          resampledFloat32,
          pcmInt16,
          sequenceId: this.sequenceId,
          timestamp,
        });
      });
    };

    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
    this.isCapturing = true;
  }

  stopCapture(): void {
    this.isCapturing = false;
    
    if (this.scriptProcessor && this.sourceNode) {
      this.scriptProcessor.disconnect();
      this.sourceNode.disconnect();
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    this.scriptProcessor = null;
    this.sourceNode = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.sequenceId = 0;
  }

  getActiveSubscribersCount(): number {
    return this.subscribers.size;
  }

  getIsCapturing(): boolean {
    return this.isCapturing;
  }
}
