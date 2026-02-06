/**
 * Music Theory Utilities
 * Shared constants and functions for pitch, scale, and chord operations.
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

export const CHORD_PRESETS: Record<string, { name: string; intervals: number[] }> = {
  major: { name: 'Major', intervals: [0, 4, 7] },
  minor: { name: 'Minor', intervals: [0, 3, 7] },
  dominant7: { name: 'Dom7', intervals: [0, 4, 7, 10] },
};

export function frequencyToMidi(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

export function quantizeToScale(
  midiNote: number,
  keyLockEnabled: boolean,
  selectedKey: string,
  selectedScale: string
): number {
  if (!keyLockEnabled) return midiNote;

  const keyOffset = NOTE_NAMES.indexOf(selectedKey as typeof NOTE_NAMES[number]);
  const scaleIntervals = SCALES[selectedScale] || SCALES.major;
  const noteInOctave = midiNote % 12;
  const octave = Math.floor(midiNote / 12);

  let closestNote = noteInOctave;
  let minDistance = 12;

  for (const interval of scaleIntervals) {
    const scaleNote = (keyOffset + interval) % 12;
    const distance = Math.abs(noteInOctave - scaleNote);
    if (distance < minDistance) {
      minDistance = distance;
      closestNote = scaleNote;
    }
  }

  return octave * 12 + closestNote;
}

export function generateChord(rootNote: number, chordType: string): number[] {
  const preset = CHORD_PRESETS[chordType];
  if (!preset) return [rootNote];
  return preset.intervals.map(interval => rootNote + interval);
}

export function detectPitch(dataArray: Float32Array, sampleRate: number): number | null {
  let maxCorrelation = 0;
  let maxLag = 0;
  const minLag = Math.floor(sampleRate / 1000);
  const maxLagLimit = Math.floor(sampleRate / 50);

  for (let lag = minLag; lag < maxLagLimit; lag++) {
    let correlation = 0;
    for (let i = 0; i < dataArray.length - lag; i++) {
      correlation += dataArray[i] * dataArray[i + lag];
    }
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      maxLag = lag;
    }
  }

  if (maxCorrelation < 0.001) return null;

  const frequency = sampleRate / maxLag;
  return frequency > 50 && frequency < 1000 ? frequency : null;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}
