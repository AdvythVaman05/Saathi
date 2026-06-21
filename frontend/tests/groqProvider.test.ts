import { GroqSpeechRecognitionProvider } from '../src/features/voice-engine/providers/groq';
import { AudioCaptureService } from '../src/features/voice-engine/pipeline/AudioCaptureService';

// Mock AudioCaptureService singleton
jest.mock('../src/features/voice-engine/pipeline/AudioCaptureService', () => {
  const mockInstance = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    startCapture: jest.fn().mockResolvedValue(undefined),
    stopCapture: jest.fn(),
  };
  return {
    AudioCaptureService: {
      getInstance: () => mockInstance,
    },
  };
});

describe('GroqSpeechRecognitionProvider Unit Tests', () => {
  let provider: GroqSpeechRecognitionProvider;
  let mockCapturer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new GroqSpeechRecognitionProvider();
    mockCapturer = AudioCaptureService.getInstance();
  });

  test('Should initialize with handlers and target language', async () => {
    const mockHandlers = {
      onStart: jest.fn(),
      onResult: jest.fn(),
      onEnd: jest.fn(),
      onError: jest.fn(),
    };

    await provider.initialize('hi', mockHandlers);
    expect(provider.name).toBe('groq');
  });

  test('Should start listening and subscribe to AudioCaptureService at 16kHz', async () => {
    const mockHandlers = {
      onStart: jest.fn(),
      onResult: jest.fn(),
      onEnd: jest.fn(),
    };

    // Override isTesting so we run full logic
    (provider as any).isTesting = false;

    await provider.initialize('en', mockHandlers);
    await provider.startListening();

    expect(mockCapturer.subscribe).toHaveBeenCalledWith(
      'groq-recognition',
      expect.any(Function),
      16000
    );
    expect(mockCapturer.startCapture).toHaveBeenCalled();
    expect(mockHandlers.onStart).toHaveBeenCalled();
  });

  test('Should stop listening, process recorded chunks, post to API, and resolve transcript', async () => {
    const mockHandlers = {
      onStart: jest.fn(),
      onResult: jest.fn(),
      onEnd: jest.fn(),
    };

    (provider as any).isTesting = false;
    await provider.initialize('en', mockHandlers);

    // Mock global fetch
    const mockTranscript = 'Do you have prior experience using voice-first applications?';
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transcript: mockTranscript, confidence: 0.96 }),
    });
    global.fetch = mockFetch as any;

    await provider.startListening();

    // Retrieve the subscribe callback and feed it mock Float32 chunks
    const subscribeCallback = mockCapturer.subscribe.mock.calls[0][1];
    subscribeCallback({
      resampledFloat32: new Float32Array([0.1, -0.2, 0.3]),
      sequenceId: 1,
      timestamp: Date.now(),
    });

    await provider.stopListening();

    expect(mockCapturer.unsubscribe).toHaveBeenCalledWith('groq-recognition');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/speech/transcribe/'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );

    // Check that onResult is called with transcript
    expect(mockHandlers.onResult).toHaveBeenCalledWith({
      transcript: mockTranscript,
      confidence: 0.96,
      isFinal: true,
    });
  });
});
