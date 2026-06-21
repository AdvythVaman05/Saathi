export type VoiceProviderType = 'browser' | 'groq';

export interface VoiceEngineConfig {
  preferredProvider: VoiceProviderType;
  lang: string;
  confidenceThreshold: number; // e.g. 0.80
  audioSampleRate?: number; // e.g. 24000
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export type VoiceEngineEvent =
  | { type: 'RECOGNITION_START' }
  | { type: 'RECOGNITION_RESULT'; payload: SpeechRecognitionResult }
  | { type: 'RECOGNITION_ERROR'; payload: { error: string } }
  | { type: 'SYNTHESIS_START' }
  | { type: 'SYNTHESIS_END' }
  | { type: 'SYNTHESIS_ERROR'; payload: { error: string } }
  | { type: 'VAD_SPEECH_START' }
  | { type: 'VAD_SPEECH_END' }
  | { type: 'PROVIDER_CHANGED'; payload: { from: VoiceProviderType; to: VoiceProviderType } };

export interface AudioInputConfig {
  sampleRate: number;
  channelCount: number;
}
export interface AudioOutputConfig {
  voiceName: string;
  speechRate: number;
  speechVolume: number;
}
