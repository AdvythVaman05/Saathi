import { AudioCaptureService } from '../pipeline/AudioCaptureService';

export interface VadHandlers {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBuffer?: Float32Array) => void;
  onError?: (error: Error) => void;
}

/**
 * Voice Activity Detector (VAD) interface.
 * Abstracts local audio capture analysis checking when user speaks.
 */
export interface VoiceActivityDetector {
  initialize(stream: MediaStream | null, handlers: VadHandlers): Promise<void>;
  startDetection(): void;
  stopDetection(): void;
  destroy(): void;
}

export interface WebAudioVadConfig {
  speechThresholdMargin?: number; // Margin above noise floor
  silenceDurationMs?: number;      // Silence duration before cutting off
  smoothingFactor?: number;        // Noise floor adaptation factor alpha
  minThreshold?: number;           // Absolute minimum threshold
  maxThreshold?: number;           // Absolute maximum threshold
  maxListeningDurationMs?: number; // Watchdog timer duration
}

/**
 * WebAudio VAD Implementation.
 * Runs fully on the client side, analyzing Mono Float32 stream chunks from AudioCaptureService.
 */
export class WebAudioVad implements VoiceActivityDetector {
  private handlers: VadHandlers | null = null;
  private isDetecting = false;
  private subscriberId = 'saathi-vad';

  // Configuration thresholds
  private speechThresholdMargin = 0.015;
  private silenceDurationMs = 1500;
  private smoothingFactor = 0.02;
  private minThreshold = 0.005;
  private maxThreshold = 0.5;
  private maxListeningDurationMs = 120000;

  // Running VAD states
  private isSpeechDetected = false;
  private silenceStartTimestamp = 0;
  private noiseFloor = 0.005; // Seed background noise level

  constructor(config?: WebAudioVadConfig) {
    if (config) {
      if (config.speechThresholdMargin !== undefined) this.speechThresholdMargin = config.speechThresholdMargin;
      if (config.silenceDurationMs !== undefined) this.silenceDurationMs = config.silenceDurationMs;
      if (config.smoothingFactor !== undefined) this.smoothingFactor = config.smoothingFactor;
      if (config.minThreshold !== undefined) this.minThreshold = config.minThreshold;
      if (config.maxThreshold !== undefined) this.maxThreshold = config.maxThreshold;
      if (config.maxListeningDurationMs !== undefined) this.maxListeningDurationMs = config.maxListeningDurationMs;
    }
  }

  getMaxListeningDurationMs(): number {
    return this.maxListeningDurationMs;
  }

  async initialize(stream: MediaStream | null, handlers: VadHandlers): Promise<void> {
    this.handlers = handlers;
  }

  /**
   * Sets the initial noise floor level based on calibration.
   * If calibration yields an invalid value, falls back to a conservative default.
   */
  setNoiseFloor(level: number): void {
    if (isNaN(level) || level <= 0 || level > 0.1) {
      console.warn('VAD Calibration: Invalid noise floor determined. Using conservative default.', level);
      this.noiseFloor = 0.01; // Conservative default threshold fallback
    } else {
      this.noiseFloor = level;
    }
  }

  startDetection(): void {
    if (this.isDetecting) return;
    this.isDetecting = true;
    this.isSpeechDetected = false;
    this.silenceStartTimestamp = 0;

    const audioService = AudioCaptureService.getInstance();
    
    // Subscribe to capture callbacks
    audioService.subscribe(this.subscriberId, ({ rawFloat32 }) => {
      if (!this.isDetecting) return;
      this.analyzeChunk(rawFloat32);
    }, 16000);
  }

  stopDetection(): void {
    this.isDetecting = false;
    AudioCaptureService.getInstance().unsubscribe(this.subscriberId);
  }

  destroy(): void {
    this.stopDetection();
    this.handlers = null;
  }

  getIsSpeechDetected(): boolean {
    return this.isSpeechDetected;
  }

  getNoiseFloor(): number {
    return this.noiseFloor;
  }

  private analyzeChunk(buffer: Float32Array): void {
    if (buffer.length === 0) return;

    // 1. Compute RMS Energy (Acoustic Amplitude)
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    // 2. Compute dynamic threshold with safety bounds
    const threshold = Math.min(
      Math.max(this.noiseFloor + this.speechThresholdMargin, this.minThreshold),
      this.maxThreshold
    );

    const now = Date.now();

    // 3. State transition evaluator
    if (rms > threshold) {
      // Speech present
      if (!this.isSpeechDetected) {
        this.isSpeechDetected = true;
        this.handlers?.onSpeechStart?.();
      }
      this.silenceStartTimestamp = 0; // Reset silence counter
    } else {
      // Energy below threshold (silence/ambient room noise)
      // Adaptively update noise floor when user is not speaking
      if (!this.isSpeechDetected) {
        this.noiseFloor = (1 - this.smoothingFactor) * this.noiseFloor + this.smoothingFactor * rms;
      }

      if (this.isSpeechDetected) {
        if (this.silenceStartTimestamp === 0) {
          this.silenceStartTimestamp = now;
        } else if (now - this.silenceStartTimestamp >= this.silenceDurationMs) {
          // Silence duration exceeded -> Speech Stop detected
          this.isSpeechDetected = false;
          this.silenceStartTimestamp = 0;
          this.handlers?.onSpeechEnd?.(buffer);
        }
      }
    }
  }
}
