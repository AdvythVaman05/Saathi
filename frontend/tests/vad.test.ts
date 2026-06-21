import { WebAudioVad } from '../src/features/voice-engine/vad/vad';
import { AudioCaptureService } from '../src/features/voice-engine/pipeline/AudioCaptureService';

// Mock the AudioCaptureService singleton
jest.mock('../src/features/voice-engine/pipeline/AudioCaptureService', () => {
  let mockCallback: any = null;
  return {
    AudioCaptureService: {
      getInstance: jest.fn(() => ({
        subscribe: jest.fn((id, callback) => {
          mockCallback = callback;
        }),
        unsubscribe: jest.fn(() => {
          mockCallback = null;
        }),
        getIsCapturing: jest.fn(() => true),
        // Helper to trigger chunk delivery in mock
        _triggerChunk: (rawFloat32: Float32Array) => {
          if (mockCallback) {
            mockCallback({
              rawFloat32,
              resampledFloat32: rawFloat32,
              pcmInt16: new Int16Array(rawFloat32.length),
              sequenceId: 1,
              timestamp: Date.now(),
            });
          }
        }
      })),
    },
  };
});

describe('WebAudio VAD Unit & Integration Tests', () => {
  let mockAudioService: any;

  beforeEach(() => {
    jest.useFakeTimers();
    mockAudioService = AudioCaptureService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('VAD configuration initialization and defaults', () => {
    const vad = new WebAudioVad({
      speechThresholdMargin: 0.02,
      silenceDurationMs: 1000,
    });

    expect(vad.getIsSpeechDetected()).toBe(false);
  });

  test('VAD Calibration Fallback: sets conservative default on invalid input', () => {
    const vad = new WebAudioVad();
    
    // Test invalid negative value
    vad.setNoiseFloor(-0.05);
    expect(vad.getNoiseFloor()).toBe(0.01); // Conservative fallback default

    // Test invalid high value
    vad.setNoiseFloor(0.25);
    expect(vad.getNoiseFloor()).toBe(0.01); // Conservative fallback default

    // Test NaN
    vad.setNoiseFloor(NaN);
    expect(vad.getNoiseFloor()).toBe(0.01);

    // Test valid calibration
    vad.setNoiseFloor(0.003);
    expect(vad.getNoiseFloor()).toBe(0.003);
  });

  test('VAD Speech Start: Transitions to speaking when volume exceeds threshold', async () => {
    const onSpeechStart = jest.fn();
    const onSpeechEnd = jest.fn();

    const vad = new WebAudioVad({
      speechThresholdMargin: 0.01,
      minThreshold: 0.005,
    });
    vad.setNoiseFloor(0.002); // Threshold is 0.012

    await vad.initialize(null, { onSpeechStart, onSpeechEnd });
    vad.startDetection();

    // 1. Send silent buffer (all zeros, RMS = 0)
    const silentBuffer = new Float32Array(512);
    mockAudioService._triggerChunk(silentBuffer);
    expect(vad.getIsSpeechDetected()).toBe(false);
    expect(onSpeechStart).not.toHaveBeenCalled();

    // 2. Send loud buffer (exceeds 0.012 threshold)
    const loudBuffer = new Float32Array(512).fill(0.1); // RMS = 0.1
    mockAudioService._triggerChunk(loudBuffer);
    expect(vad.getIsSpeechDetected()).toBe(true);
    expect(onSpeechStart).toHaveBeenCalledTimes(1);
  });

  test('VAD Speech End: Transitions back to silence after configured silence duration', async () => {
    const onSpeechStart = jest.fn();
    const onSpeechEnd = jest.fn();

    const vad = new WebAudioVad({
      speechThresholdMargin: 0.01,
      silenceDurationMs: 1000,
      minThreshold: 0.005,
    });
    vad.setNoiseFloor(0.002); // Threshold is 0.012

    await vad.initialize(null, { onSpeechStart, onSpeechEnd });
    vad.startDetection();

    // Trigger speech start
    const loudBuffer = new Float32Array(512).fill(0.1);
    mockAudioService._triggerChunk(loudBuffer);
    expect(vad.getIsSpeechDetected()).toBe(true);

    // Send silent buffer, but before silenceDurationMs completes -> should remain speaking
    const silentBuffer = new Float32Array(512);
    mockAudioService._triggerChunk(silentBuffer);
    expect(vad.getIsSpeechDetected()).toBe(true);
    expect(onSpeechEnd).not.toHaveBeenCalled();

    // Fast-forward time by 500ms -> still speaking
    jest.advanceTimersByTime(500);
    mockAudioService._triggerChunk(silentBuffer);
    expect(vad.getIsSpeechDetected()).toBe(true);

    // Fast-forward by another 600ms (total 1100ms > 1000ms threshold) -> triggers speech end!
    jest.advanceTimersByTime(600);
    mockAudioService._triggerChunk(silentBuffer);
    expect(vad.getIsSpeechDetected()).toBe(false);
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  test('VAD Scenario H: Slow speaker with long pauses does not trigger premature speech end', async () => {
    const onSpeechStart = jest.fn();
    const onSpeechEnd = jest.fn();

    // Setup VAD with 2000ms silence tolerance (Scenario H)
    const vad = new WebAudioVad({
      speechThresholdMargin: 0.01,
      silenceDurationMs: 2000,
      minThreshold: 0.005,
    });
    vad.setNoiseFloor(0.002); // Threshold is 0.012

    await vad.initialize(null, { onSpeechStart, onSpeechEnd });
    vad.startDetection();

    // 1. User starts speaking (loud buffer)
    const loudBuffer = new Float32Array(512).fill(0.1);
    mockAudioService._triggerChunk(loudBuffer);
    expect(vad.getIsSpeechDetected()).toBe(true);
    expect(onSpeechStart).toHaveBeenCalledTimes(1);

    // 2. User pauses for 1.5 seconds (less than 2.0s tolerance)
    const silentBuffer = new Float32Array(512);
    mockAudioService._triggerChunk(silentBuffer);
    jest.advanceTimersByTime(1500);
    mockAudioService._triggerChunk(silentBuffer);
    
    // Should NOT trigger premature speech end
    expect(vad.getIsSpeechDetected()).toBe(true);
    expect(onSpeechEnd).not.toHaveBeenCalled();

    // 3. User speaks again
    mockAudioService._triggerChunk(loudBuffer);
    expect(vad.getIsSpeechDetected()).toBe(true);

    // 4. User pauses for another 1.8 seconds (less than 2.0s tolerance)
    mockAudioService._triggerChunk(silentBuffer);
    jest.advanceTimersByTime(1800);
    mockAudioService._triggerChunk(silentBuffer);

    // Still NOT triggered
    expect(vad.getIsSpeechDetected()).toBe(true);
    expect(onSpeechEnd).not.toHaveBeenCalled();

    // 5. User pauses for 2.1 seconds (exceeds 2.0s tolerance)
    jest.advanceTimersByTime(2100);
    mockAudioService._triggerChunk(silentBuffer);

    // Should trigger speech end
    expect(vad.getIsSpeechDetected()).toBe(false);
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  test('VAD maxListeningDurationMs configuration and default value', () => {
    const vadDefault = new WebAudioVad();
    expect(vadDefault.getMaxListeningDurationMs()).toBe(120000);

    const vadConfigured = new WebAudioVad({
      maxListeningDurationMs: 60000,
    });
    expect(vadConfigured.getMaxListeningDurationMs()).toBe(60000);
  });
});
