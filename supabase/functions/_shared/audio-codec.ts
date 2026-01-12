/**
 * Audio Codec Utilities for Server-Side Processing
 * Handles WAV parsing and encoding
 */

export interface WavHeader {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataSize: number;
  dataOffset: number;
}

/**
 * Parse WAV file header
 */
export function parseWavHeader(buffer: ArrayBuffer): WavHeader | null {
  const view = new DataView(buffer);
  
  // Check RIFF header
  const riff = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)
  );
  if (riff !== 'RIFF') return null;
  
  // Check WAVE format
  const wave = String.fromCharCode(
    view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)
  );
  if (wave !== 'WAVE') return null;
  
  // Find fmt chunk
  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataSize = 0;
  let dataOffset = 0;
  
  while (offset < buffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset), view.getUint8(offset + 1),
      view.getUint8(offset + 2), view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);
    
    if (chunkId === 'fmt ') {
      channels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
      dataOffset = offset + 8;
      break;
    }
    
    offset += 8 + chunkSize;
    // Ensure chunk alignment
    if (chunkSize % 2 === 1) offset++;
  }
  
  if (sampleRate === 0 || dataOffset === 0) return null;
  
  return { sampleRate, channels, bitsPerSample, dataSize, dataOffset };
}

/**
 * Decode WAV audio data to Float32Array
 */
export function decodeWavToFloat32(
  buffer: ArrayBuffer,
  header: WavHeader
): Float32Array {
  const view = new DataView(buffer);
  const bytesPerSample = header.bitsPerSample / 8;
  const numSamples = header.dataSize / bytesPerSample;
  
  const samples = new Float32Array(numSamples);
  let offset = header.dataOffset;
  
  for (let i = 0; i < numSamples; i++) {
    let sample: number;
    
    switch (header.bitsPerSample) {
      case 8:
        // 8-bit unsigned
        sample = (view.getUint8(offset) - 128) / 128;
        break;
      case 16:
        // 16-bit signed
        sample = view.getInt16(offset, true) / 32768;
        break;
      case 24:
        // 24-bit signed
        const b0 = view.getUint8(offset);
        const b1 = view.getUint8(offset + 1);
        const b2 = view.getInt8(offset + 2);
        sample = ((b2 << 16) | (b1 << 8) | b0) / 8388608;
        break;
      case 32:
        // 32-bit float or int
        sample = view.getFloat32(offset, true);
        // Clamp to -1, 1 if not float format
        if (sample < -1 || sample > 1) {
          sample = view.getInt32(offset, true) / 2147483648;
        }
        break;
      default:
        sample = 0;
    }
    
    samples[i] = sample;
    offset += bytesPerSample;
  }
  
  return samples;
}

/**
 * Encode Float32Array to WAV buffer
 */
export function encodeFloat32ToWav(
  samples: Float32Array,
  sampleRate: number,
  channels: number,
  bitsPerSample: number = 24
): ArrayBuffer {
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples.length * bytesPerSample;
  const bufferSize = 44 + dataSize;
  
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, bitsPerSample === 32 ? 3 : 1, true); // Audio format (3 = float, 1 = PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true); // Byte rate
  view.setUint16(32, channels * bytesPerSample, true); // Block align
  view.setUint16(34, bitsPerSample, true);
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    
    switch (bitsPerSample) {
      case 16:
        view.setInt16(offset, Math.round(sample * 32767), true);
        break;
      case 24:
        const value24 = Math.round(sample * 8388607);
        view.setUint8(offset, value24 & 0xFF);
        view.setUint8(offset + 1, (value24 >> 8) & 0xFF);
        view.setInt8(offset + 2, (value24 >> 16) & 0xFF);
        break;
      case 32:
        view.setFloat32(offset, sample, true);
        break;
    }
    
    offset += bytesPerSample;
  }
  
  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Convert base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Create a simple WAV test tone for testing
 */
export function createTestTone(
  frequency: number = 440,
  duration: number = 1,
  sampleRate: number = 44100
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples * 2); // Stereo
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = 0.5 * Math.sin(2 * Math.PI * frequency * t);
    samples[i * 2] = sample;     // Left
    samples[i * 2 + 1] = sample; // Right
  }
  
  return samples;
}
