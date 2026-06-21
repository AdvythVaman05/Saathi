import { VoiceEngineManager } from '../src/features/voice-engine/providers/manager';
import { registerRecognitionProvider, providerRegistry } from '../src/features/voice-engine/providers/registry';
import { SpeechRecognitionProvider } from '../src/features/voice-engine/transcription/recognition';
import { VoiceCommandProcessor } from '../src/features/voice-engine/commands/processor';

// 1. Mock Recognition Adapters
const mockOpenAiProvider: SpeechRecognitionProvider = {
  name: 'openai',
  initialize: async () => {},
  startListening: async () => {},
  stopListening: async () => {},
  destroy: async () => {},
};

const mockAzureProvider: SpeechRecognitionProvider = {
  name: 'azure',
  initialize: async () => {},
  startListening: async () => {},
  stopListening: async () => {},
  destroy: async () => {},
};

const mockBrowserProvider: SpeechRecognitionProvider = {
  name: 'browser',
  initialize: async () => {},
  startListening: async () => {},
  stopListening: async () => {},
  destroy: async () => {},
};

describe('Saathi Voice Engine Abstraction Layer Unit Tests', () => {
  
  beforeAll(() => {
    // Register Mock providers into global registry
    registerRecognitionProvider('openai', mockOpenAiProvider);
    registerRecognitionProvider('azure', mockAzureProvider);
    registerRecognitionProvider('browser', mockBrowserProvider);
  });

  describe('Provider Selection & Fallback Management', () => {
    test('Should initialize with preferred provider', () => {
      const manager = new VoiceEngineManager({
        preferredProvider: 'openai',
        lang: 'en',
        confidenceThreshold: 0.80,
      });

      expect(manager.getActiveProviderName()).toBe('openai');
      expect(manager.getRecognitionProvider().name).toBe('openai');
    });

    test('Should escalate in order: OpenAI -> Azure -> Browser', () => {
      const manager = new VoiceEngineManager({
        preferredProvider: 'openai',
        lang: 'en',
        confidenceThreshold: 0.80,
      });

      // Escalation 1
      const p1 = manager.triggerFallback();
      expect(p1).toBe('azure');
      expect(manager.getRecognitionProvider().name).toBe('azure');

      // Escalation 2
      const p2 = manager.triggerFallback();
      expect(p2).toBe('browser');
      expect(manager.getRecognitionProvider().name).toBe('browser');

      // Escalation 3 (All exhausted)
      expect(() => manager.triggerFallback()).toThrow('All speech providers exhausted. Voice engine failed.');
    });

    test('Should retry transient errors before triggering fallback', () => {
      const manager = new VoiceEngineManager({
        preferredProvider: 'openai',
        lang: 'en',
        confidenceThreshold: 0.80,
      });

      const err = new Error('Transient socket close');
      
      // Retry 1
      const r1 = manager.handleProviderError(err);
      expect(r1.action).toBe('retry');
      expect(r1.delay).toBe(500); // 2^1 * 250 = 500ms

      // Retry 2
      const r2 = manager.handleProviderError(err);
      expect(r2.action).toBe('retry');
      expect(r2.delay).toBe(1000); // 2^2 * 250 = 1000ms

      // Retry 3
      const r3 = manager.handleProviderError(err);
      expect(r3.action).toBe('retry');
      expect(r3.delay).toBe(2000); // 2^3 * 250 = 2000ms

      // Retry 4 (Exhausted retries -> trigger fallback)
      const r4 = manager.handleProviderError(err);
      expect(r4.action).toBe('fallback');
    });

    test('Should immediately trigger fallback on auth failures', () => {
      const manager = new VoiceEngineManager({
        preferredProvider: 'openai',
        lang: 'en',
        confidenceThreshold: 0.80,
      });

      const authErr = new Error('Authentication failed (401)');
      const result = manager.handleProviderError(authErr);
      
      expect(result.action).toBe('fallback'); // No retries for Auth
    });
  });

  describe('Voice Command Processor & Multilingual Matching', () => {
    test('Should parse command from English transcript', () => {
      const processor = new VoiceCommandProcessor('en');
      
      const r1 = processor.processTranscript('say again');
      expect(r1.isCommand).toBe(true);
      expect(r1.commandToken).toBe('repeat');

      const r2 = processor.processTranscript('cane navigation');
      expect(r2.isCommand).toBe(false);
      expect(r2.commandToken).toBeNull();
    });

    test('Should parse commands from Hindi (Devanagari & Latin) transcriptions', () => {
      const processor = new VoiceCommandProcessor('hi');

      // Devanagari
      const r1 = processor.processTranscript('दोहराओ');
      expect(r1.isCommand).toBe(true);
      expect(r1.commandToken).toBe('repeat');

      // Devanagari - skip
      const r2 = processor.processTranscript('छोड़ो');
      expect(r2.isCommand).toBe(true);
      expect(r2.commandToken).toBe('skip');

      // Latin / Transliterated
      const r3 = processor.processTranscript('fir se bolo');
      expect(r3.isCommand).toBe(true);
      expect(r3.commandToken).toBe('repeat');
    });

    test('Should parse commands from Telugu transcriptions', () => {
      const processor = new VoiceCommandProcessor('te');

      const r1 = processor.processTranscript('మళ్ళీ చెప్పు');
      expect(r1.isCommand).toBe(true);
      expect(r1.commandToken).toBe('repeat');

      const r2 = processor.processTranscript('malli cheppu');
      expect(r2.isCommand).toBe(true);
      expect(r2.commandToken).toBe('repeat');
    });
  });

  describe('Shared Audio Pipeline Integration', () => {
    const { Resampler } = require('../src/features/voice-engine/pipeline/Resampler');
    const { PCMEncoder } = require('../src/features/voice-engine/pipeline/PCMEncoder');
    const { AudioCaptureService } = require('../src/features/voice-engine/pipeline/AudioCaptureService');

    test('Resampler should downsample Float32Array streams', () => {
      // Create a 1000 sample 48kHz float array
      const input = new Float32Array(1000).fill(0.5);
      // Downsample to 24kHz (should result in 500 samples)
      const resampled = Resampler.resample(input, 48000, 24000);
      expect(resampled.length).toBe(500);
      expect(resampled[0]).toBe(0.5);
    });

    test('PCMEncoder should convert Float32Array to 16-bit linear PCM', () => {
      const input = new Float32Array([1.0, -1.0, 0.0, 0.5]);
      const encoded = PCMEncoder.encodeTo16BitPCM(input);
      expect(encoded).toBeInstanceOf(Int16Array);
      expect(encoded[0]).toBe(32767);
      expect(encoded[1]).toBe(-32768);
      expect(encoded[2]).toBe(0);
    });

    test('PCMEncoder should pack sequenceId, timestamp, and PCM payload into binary header', () => {
      const pcmPayload = new Int16Array([100, -100]);
      const seqId = 42;
      const timestamp = 1718919281000;
      
      const packedBuffer = PCMEncoder.packPacket(seqId, timestamp, pcmPayload);
      expect(packedBuffer).toBeInstanceOf(ArrayBuffer);
      expect(packedBuffer.byteLength).toBe(12 + pcmPayload.length * 2);

      const view = new DataView(packedBuffer);
      expect(view.getUint32(0, false)).toBe(seqId); // big-endian
      
      const high = view.getUint32(4, false);
      const low = view.getUint32(8, false);
      const decodedTimestamp = high * 0x100000000 + low;
      expect(decodedTimestamp).toBe(timestamp);
      
      expect(view.getInt16(12, false)).toBe(100);
      expect(view.getInt16(14, false)).toBe(-100);
    });

    test('AudioCaptureService should track subscribers as a singleton', () => {
      const capturer = AudioCaptureService.getInstance();
      const callback = () => {};
      
      capturer.subscribe('test-provider', callback, 16000);
      expect(capturer.getActiveSubscribersCount()).toBe(1);
      
      capturer.unsubscribe('test-provider');
      expect(capturer.getActiveSubscribersCount()).toBe(0);
    });
  });

  describe('Concrete Provider Adapters Registration and Mock Failover Execution', () => {
    const { providerRegistry } = require('../src/features/voice-engine/providers/registry');

    test('Registry should contain concrete adapters by default', () => {
      expect(providerRegistry.recognition.openai).toBeDefined();
      expect(providerRegistry.recognition.azure).toBeDefined();
      expect(providerRegistry.recognition.browser).toBeDefined();

      expect(providerRegistry.synthesis.openai).toBeDefined();
      expect(providerRegistry.synthesis.azure).toBeDefined();
      expect(providerRegistry.synthesis.browser).toBeDefined();
    });

    test('Browser adapter recognition should return mock result in Node.js runtime', (done) => {
      const { BrowserSpeechRecognitionProvider } = require('../src/features/voice-engine/providers/browser');
      const browserProvider = new BrowserSpeechRecognitionProvider();
      
      browserProvider.initialize('en', {
        onStart: () => {},
        onResult: (result: any) => {
          expect(result.transcript).toBe('skip');
          expect(result.confidence).toBeGreaterThan(0.80);
          done();
        },
        onError: (err: any) => done(err),
      });

      browserProvider.startListening();
    });

    test('Azure adapter recognition should return mock result in Node.js runtime', (done) => {
      const { AzureSpeechRecognitionProvider } = require('../src/features/voice-engine/providers/azure');
      const azureProvider = new AzureSpeechRecognitionProvider();
      
      azureProvider.initialize('hi', {
        onStart: () => {},
        onResult: (result: any) => {
          expect(result.transcript).toBe('repeat');
          expect(result.confidence).toBe(0.92);
          done();
        },
        onError: (err: any) => done(err),
      });

      azureProvider.startListening();
      azureProvider.stopListening();
    });

    test('OpenAI adapter recognition should return mock result in Node.js runtime', (done) => {
      const { OpenAiSpeechRecognitionProvider } = require('../src/features/voice-engine/providers/openai');
      const openaiProvider = new OpenAiSpeechRecognitionProvider();
      
      openaiProvider.initialize('te', {
        onStart: () => {},
        onResult: (result: any) => {
          expect(result.transcript).toBe('back');
          expect(result.confidence).toBe(0.94);
          done();
        },
        onError: (err: any) => done(err),
      });

      openaiProvider.startListening();
      openaiProvider.stopListening();
    });
  });
});
