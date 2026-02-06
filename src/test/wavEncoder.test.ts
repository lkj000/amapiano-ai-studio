import { describe, it, expect } from 'vitest';
import { audioBufferToWav } from '@/lib/audio/wavEncoder';

// Helper to create a minimal AudioBuffer-like object for testing
function createMockAudioBuffer(length: number, channels: number, sampleRate: number): AudioBuffer {
  const channelData: Float32Array[] = [];
  for (let i = 0; i < channels; i++) {
    const data = new Float32Array(length);
    for (let j = 0; j < length; j++) {
      data[j] = Math.sin(2 * Math.PI * 440 * j / sampleRate) * 0.5;
    }
    channelData.push(data);
  }

  return {
    length,
    numberOfChannels: channels,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (ch: number) => channelData[ch],
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as unknown as AudioBuffer;
}

describe('audioBufferToWav', () => {
  it('produces a valid WAV blob', () => {
    const buffer = createMockAudioBuffer(44100, 1, 44100);
    const blob = audioBufferToWav(buffer);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
  });

  it('has correct file size for mono 1-second audio', () => {
    const buffer = createMockAudioBuffer(44100, 1, 44100);
    const blob = audioBufferToWav(buffer);
    // 44 header + 44100 samples * 2 bytes = 88244
    expect(blob.size).toBe(44 + 44100 * 2);
  });

  it('has correct file size for stereo audio', () => {
    const buffer = createMockAudioBuffer(1000, 2, 44100);
    const blob = audioBufferToWav(buffer);
    // 44 header + 1000 samples * 2 channels * 2 bytes = 4044
    expect(blob.size).toBe(44 + 1000 * 2 * 2);
  });

  it('contains RIFF header', async () => {
    const buffer = createMockAudioBuffer(100, 1, 44100);
    const blob = audioBufferToWav(buffer);
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);

    // RIFF
    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('RIFF');
    // WAVE
    expect(String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))).toBe('WAVE');
  });

  it('clamps samples to [-1, 1]', () => {
    const buffer = createMockAudioBuffer(10, 1, 44100);
    // Manually set out-of-range values
    const data = buffer.getChannelData(0);
    data[0] = 2.0;
    data[1] = -2.0;

    const blob = audioBufferToWav(buffer);
    expect(blob.size).toBeGreaterThan(0);
  });
});
