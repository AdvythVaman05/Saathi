/**
 * Converts Float32Array audio samples into 16-bit linear PCM and structures packets with header metadata.
 */
export class PCMEncoder {
  /**
   * Converts Float32Array samples (-1.0 to 1.0) to 16-bit linear PCM (Int16Array).
   */
  static encodeTo16BitPCM(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamp values between -1.0 and 1.0 to prevent clipping
      const s = Math.max(-1, Math.min(1, buffer[i]));
      buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buf;
  }

  /**
   * Encodes PCM packets with sequence metadata as a binary ArrayBuffer:
   * - Bytes 0-3: sequenceId (32-bit unsigned int, big-endian)
   * - Bytes 4-11: timestamp (64-bit unsigned int, big-endian)
   * - Bytes 12+: payload (raw 16-bit PCM bytes)
   */
  static packPacket(sequenceId: number, timestamp: number, pcmData: Int16Array): ArrayBuffer {
    const headerBuffer = new ArrayBuffer(12 + pcmData.length * 2);
    const view = new DataView(headerBuffer);
    
    // 32-bit unsigned integer sequenceId
    view.setUint32(0, sequenceId, false); // false = big-endian
    
    // 64-bit unsigned integer timestamp (milliseconds)
    const high = Math.floor(timestamp / 0x100000000);
    const low = timestamp % 0x100000000;
    view.setUint32(4, high, false);
    view.setUint32(8, low, false);
    
    // Write PCM payload
    for (let i = 0; i < pcmData.length; i++) {
      view.setInt16(12 + i * 2, pcmData[i], false); // big-endian PCM
    }
    
    return headerBuffer;
  }
}
