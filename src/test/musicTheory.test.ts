import { describe, it, expect } from 'vitest';
import {
  frequencyToMidi,
  midiToNoteName,
  quantizeToScale,
  generateChord,
  detectPitch,
  formatTime,
  NOTE_NAMES,
  SCALES,
  CHORD_PRESETS,
} from '@/lib/audio/musicTheory';

describe('frequencyToMidi', () => {
  it('converts A4 (440Hz) to MIDI 69', () => {
    expect(frequencyToMidi(440)).toBe(69);
  });

  it('converts C4 (261.63Hz) to MIDI 60', () => {
    expect(frequencyToMidi(261.63)).toBe(60);
  });

  it('converts C5 (523.25Hz) to MIDI 72', () => {
    expect(frequencyToMidi(523.25)).toBe(72);
  });
});

describe('midiToNoteName', () => {
  it('converts MIDI 69 to A4', () => {
    expect(midiToNoteName(69)).toBe('A4');
  });

  it('converts MIDI 60 to C4', () => {
    expect(midiToNoteName(60)).toBe('C4');
  });

  it('converts MIDI 61 to C#4', () => {
    expect(midiToNoteName(61)).toBe('C#4');
  });
});

describe('quantizeToScale', () => {
  it('returns original note when key lock is disabled', () => {
    expect(quantizeToScale(61, false, 'C', 'major')).toBe(61);
  });

  it('quantizes C# (1) to C (0) in C major when key lock enabled', () => {
    // C major: C D E F G A B → 0,2,4,5,7,9,11
    const result = quantizeToScale(61, true, 'C', 'major');
    // MIDI 61 = C#4, note-in-octave = 1, closest in C major is 0 (C) or 2 (D)
    // distance to 0 = 1, distance to 2 = 1 → picks first found (C)
    expect(result % 12).toBe(0); // Should snap to C
  });

  it('keeps in-scale notes unchanged in C major', () => {
    // E = midi 64, note-in-octave = 4, which is in C major
    const result = quantizeToScale(64, true, 'C', 'major');
    expect(result).toBe(64);
  });
});

describe('generateChord', () => {
  it('generates major triad from root', () => {
    expect(generateChord(60, 'major')).toEqual([60, 64, 67]);
  });

  it('generates minor triad from root', () => {
    expect(generateChord(60, 'minor')).toEqual([60, 63, 67]);
  });

  it('generates dominant 7th chord', () => {
    expect(generateChord(60, 'dominant7')).toEqual([60, 64, 67, 70]);
  });

  it('returns root only for unknown chord type', () => {
    expect(generateChord(60, 'nonexistent')).toEqual([60]);
  });
});

describe('detectPitch', () => {
  it('returns null for silence', () => {
    const silence = new Float32Array(2048).fill(0);
    expect(detectPitch(silence, 44100)).toBeNull();
  });

  it('detects pitch of a pure sine wave at 440Hz', () => {
    const sampleRate = 44100;
    const freq = 440;
    const data = new Float32Array(4096);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
    }
    const detected = detectPitch(data, sampleRate);
    expect(detected).not.toBeNull();
    // Allow ±5Hz tolerance for autocorrelation
    expect(Math.abs(detected! - freq)).toBeLessThan(5);
  });
});

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('0:00.0');
  });

  it('formats 65.3 seconds', () => {
    expect(formatTime(65.3)).toBe('1:05.3');
  });
});

describe('constants', () => {
  it('has 12 note names', () => {
    expect(NOTE_NAMES).toHaveLength(12);
  });

  it('has standard scale definitions', () => {
    expect(SCALES.major).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(SCALES.minor).toEqual([0, 2, 3, 5, 7, 8, 10]);
  });

  it('has chord presets with correct intervals', () => {
    expect(CHORD_PRESETS.major.intervals).toEqual([0, 4, 7]);
  });
});
