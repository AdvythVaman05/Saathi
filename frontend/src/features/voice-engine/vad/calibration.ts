import { AudioCaptureService } from '../pipeline/AudioCaptureService';

export interface CalibrationOptions {
  durationMs?: number;
}

/**
 * Calibrates the background noise floor by measuring average RMS energy over a period of quiet.
 * Unsubscribes automatically when duration completes.
 */
export async function calibrateNoiseFloor(options?: CalibrationOptions): Promise<number> {
  const durationMs = options?.durationMs || 2000;
  const audioService = AudioCaptureService.getInstance();
  const subscriberId = 'saathi-calibration';
  
  const rmsValues: number[] = [];

  // 1. Subscribe to the microphone capture stream
  audioService.subscribe(subscriberId, ({ rawFloat32 }) => {
    if (rawFloat32.length === 0) return;
    
    // Calculate RMS for this chunk
    let sum = 0;
    for (let i = 0; i < rawFloat32.length; i++) {
      sum += rawFloat32[i] * rawFloat32[i];
    }
    const rms = Math.sqrt(sum / rawFloat32.length);
    rmsValues.push(rms);
  }, 16000);

  // 2. Wait for the calibration duration to elapse
  await new Promise((resolve) => setTimeout(resolve, durationMs));

  // 3. Unsubscribe to release resources
  audioService.unsubscribe(subscriberId);

  // 4. Compute average RMS
  if (rmsValues.length === 0) {
    return NaN; // Indicates failure to collect audio
  }

  const total = rmsValues.reduce((sum, val) => sum + val, 0);
  const averageRms = total / rmsValues.length;

  return averageRms;
}
