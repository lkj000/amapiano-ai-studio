/**
 * Default Amapiano MIDI Patterns
 * Generates starter clips with authentic patterns for each instrument type
 */

import type { MidiNote, MidiClip } from '@/types/daw';

let noteIdCounter = 0;
function noteId(): string {
  return `note_${Date.now()}_${noteIdCounter++}`;
}

function clipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a default MIDI clip for a given instrument name.
 * Returns a 4-bar (16-beat) clip with an authentic Amapiano pattern.
 */
export function createDefaultAmapianoClip(instrumentName: string): MidiClip {
  const lowerName = instrumentName.toLowerCase();

  if (lowerName.includes('log drum') || lowerName.includes('log_drum')) {
    return createLogDrumClip();
  }
  if (lowerName.includes('piano') || lowerName.includes('keys') || lowerName.includes('chord')) {
    return createPianoClip();
  }
  if (lowerName.includes('bass') || lowerName.includes('sub') || lowerName.includes('808')) {
    return createBassClip();
  }
  if (lowerName.includes('kick')) {
    return createKickClip();
  }
  if (lowerName.includes('snare') || lowerName.includes('clap')) {
    return createSnareClip();
  }
  if (lowerName.includes('hat') || lowerName.includes('hihat')) {
    return createHiHatClip();
  }
  if (lowerName.includes('shaker') || lowerName.includes('shake')) {
    return createShakerClip();
  }
  if (lowerName.includes('sax')) {
    return createSaxMelodyClip();
  }
  if (lowerName.includes('pad') || lowerName.includes('ambient')) {
    return createPadClip();
  }
  if (lowerName.includes('vocal')) {
    return createVocalChopClip();
  }
  if (lowerName.includes('lead') || lowerName.includes('melody')) {
    return createLeadClip();
  }

  // Fallback: simple chord stabs
  return createPianoClip();
}

// ── Instrument-specific patterns ──────────────────────────────

function createLogDrumClip(): MidiClip {
  // Signature Amapiano log drum: syncopated pitched pattern
  // C2=36, D2=38, E2=40, G1=31, A1=33
  const notes: MidiNote[] = [
    { id: noteId(), pitch: 36, velocity: 100, startTime: 0, duration: 0.25 },
    { id: noteId(), pitch: 31, velocity: 85, startTime: 0.75, duration: 0.25 },
    { id: noteId(), pitch: 38, velocity: 90, startTime: 1.5, duration: 0.25 },
    { id: noteId(), pitch: 36, velocity: 95, startTime: 2.5, duration: 0.25 },
    { id: noteId(), pitch: 33, velocity: 80, startTime: 3.5, duration: 0.25 },
    // Bar 2
    { id: noteId(), pitch: 36, velocity: 100, startTime: 4, duration: 0.25 },
    { id: noteId(), pitch: 40, velocity: 85, startTime: 4.75, duration: 0.25 },
    { id: noteId(), pitch: 38, velocity: 90, startTime: 5.5, duration: 0.25 },
    { id: noteId(), pitch: 31, velocity: 95, startTime: 6.5, duration: 0.25 },
    { id: noteId(), pitch: 36, velocity: 85, startTime: 7.5, duration: 0.25 },
    // Bar 3-4 repeat variation
    { id: noteId(), pitch: 36, velocity: 100, startTime: 8, duration: 0.25 },
    { id: noteId(), pitch: 33, velocity: 85, startTime: 8.75, duration: 0.25 },
    { id: noteId(), pitch: 38, velocity: 90, startTime: 9.5, duration: 0.25 },
    { id: noteId(), pitch: 36, velocity: 95, startTime: 10.5, duration: 0.25 },
    { id: noteId(), pitch: 31, velocity: 80, startTime: 11.5, duration: 0.25 },
    { id: noteId(), pitch: 36, velocity: 100, startTime: 12, duration: 0.25 },
    { id: noteId(), pitch: 40, velocity: 85, startTime: 13, duration: 0.25 },
    { id: noteId(), pitch: 38, velocity: 90, startTime: 14, duration: 0.25 },
    { id: noteId(), pitch: 36, velocity: 85, startTime: 15, duration: 0.25 },
  ];
  return { id: clipId(), name: 'Log Drum Pattern', startTime: 0, duration: 16, notes };
}

function createPianoClip(): MidiClip {
  // Gospel-influenced Amapiano chords: Cm7 → Fm7 → Gm → Eb
  // Cm7: C4(60) Eb4(63) G4(67) Bb4(70)
  // Fm7: F3(53) Ab3(56) C4(60) Eb4(63)
  // Gm:  G3(55) Bb3(58) D4(62)
  // Eb:  Eb3(51) G3(55) Bb3(58)
  const notes: MidiNote[] = [
    // Cm7 - bar 1
    { id: noteId(), pitch: 60, velocity: 80, startTime: 0, duration: 3.5 },
    { id: noteId(), pitch: 63, velocity: 75, startTime: 0, duration: 3.5 },
    { id: noteId(), pitch: 67, velocity: 75, startTime: 0, duration: 3.5 },
    { id: noteId(), pitch: 70, velocity: 70, startTime: 0, duration: 3.5 },
    // Fm7 - bar 2
    { id: noteId(), pitch: 53, velocity: 80, startTime: 4, duration: 3.5 },
    { id: noteId(), pitch: 56, velocity: 75, startTime: 4, duration: 3.5 },
    { id: noteId(), pitch: 60, velocity: 75, startTime: 4, duration: 3.5 },
    { id: noteId(), pitch: 63, velocity: 70, startTime: 4, duration: 3.5 },
    // Gm - bar 3
    { id: noteId(), pitch: 55, velocity: 80, startTime: 8, duration: 3.5 },
    { id: noteId(), pitch: 58, velocity: 75, startTime: 8, duration: 3.5 },
    { id: noteId(), pitch: 62, velocity: 75, startTime: 8, duration: 3.5 },
    // Eb - bar 4
    { id: noteId(), pitch: 51, velocity: 80, startTime: 12, duration: 3.5 },
    { id: noteId(), pitch: 55, velocity: 75, startTime: 12, duration: 3.5 },
    { id: noteId(), pitch: 58, velocity: 75, startTime: 12, duration: 3.5 },
  ];
  return { id: clipId(), name: 'Piano Chords', startTime: 0, duration: 16, notes };
}

function createBassClip(): MidiClip {
  // Deep sub-bass following root notes: C1(24), F1(29), G1(31), Eb1(27)
  const notes: MidiNote[] = [
    { id: noteId(), pitch: 24, velocity: 100, startTime: 0, duration: 1 },
    { id: noteId(), pitch: 24, velocity: 90, startTime: 2, duration: 0.5 },
    { id: noteId(), pitch: 29, velocity: 100, startTime: 4, duration: 1 },
    { id: noteId(), pitch: 29, velocity: 85, startTime: 6, duration: 0.5 },
    { id: noteId(), pitch: 31, velocity: 100, startTime: 8, duration: 1 },
    { id: noteId(), pitch: 31, velocity: 90, startTime: 10, duration: 0.5 },
    { id: noteId(), pitch: 27, velocity: 100, startTime: 12, duration: 1 },
    { id: noteId(), pitch: 27, velocity: 85, startTime: 14, duration: 0.5 },
  ];
  return { id: clipId(), name: 'Bass Line', startTime: 0, duration: 16, notes };
}

function createKickClip(): MidiClip {
  // Four-on-the-floor with slight variation
  const notes: MidiNote[] = [];
  for (let bar = 0; bar < 4; bar++) {
    const offset = bar * 4;
    notes.push({ id: noteId(), pitch: 36, velocity: 110, startTime: offset, duration: 0.25 });
    notes.push({ id: noteId(), pitch: 36, velocity: 100, startTime: offset + 1, duration: 0.25 });
    notes.push({ id: noteId(), pitch: 36, velocity: 105, startTime: offset + 2, duration: 0.25 });
    notes.push({ id: noteId(), pitch: 36, velocity: 100, startTime: offset + 3, duration: 0.25 });
  }
  return { id: clipId(), name: 'Kick Pattern', startTime: 0, duration: 16, notes };
}

function createSnareClip(): MidiClip {
  // Snare on 2 and 4
  const notes: MidiNote[] = [];
  for (let bar = 0; bar < 4; bar++) {
    const offset = bar * 4;
    notes.push({ id: noteId(), pitch: 38, velocity: 95, startTime: offset + 1, duration: 0.25 });
    notes.push({ id: noteId(), pitch: 38, velocity: 100, startTime: offset + 3, duration: 0.25 });
  }
  return { id: clipId(), name: 'Snare Pattern', startTime: 0, duration: 16, notes };
}

function createHiHatClip(): MidiClip {
  // 8th-note hi-hats with velocity variation
  const notes: MidiNote[] = [];
  for (let i = 0; i < 32; i++) {
    notes.push({
      id: noteId(),
      pitch: 42,
      velocity: i % 2 === 0 ? 90 : 65,
      startTime: i * 0.5,
      duration: 0.15,
    });
  }
  return { id: clipId(), name: 'Hi-Hat Pattern', startTime: 0, duration: 16, notes };
}

function createShakerClip(): MidiClip {
  // Offbeat shaker groove
  const notes: MidiNote[] = [];
  for (let i = 0; i < 32; i++) {
    if (i % 2 === 1) {
      notes.push({
        id: noteId(),
        pitch: 42,
        velocity: 70 + Math.floor(Math.random() * 20),
        startTime: i * 0.5,
        duration: 0.1,
      });
    }
  }
  return { id: clipId(), name: 'Shaker Groove', startTime: 0, duration: 16, notes };
}

function createPadClip(): MidiClip {
  // Long sustained pad chords
  const notes: MidiNote[] = [
    { id: noteId(), pitch: 60, velocity: 60, startTime: 0, duration: 8 },
    { id: noteId(), pitch: 63, velocity: 55, startTime: 0, duration: 8 },
    { id: noteId(), pitch: 67, velocity: 55, startTime: 0, duration: 8 },
    { id: noteId(), pitch: 55, velocity: 60, startTime: 8, duration: 8 },
    { id: noteId(), pitch: 58, velocity: 55, startTime: 8, duration: 8 },
    { id: noteId(), pitch: 62, velocity: 55, startTime: 8, duration: 8 },
  ];
  return { id: clipId(), name: 'Pad Atmosphere', startTime: 0, duration: 16, notes };
}

function createLeadClip(): MidiClip {
  // Simple melodic phrase in C minor
  const notes: MidiNote[] = [
    { id: noteId(), pitch: 72, velocity: 90, startTime: 0, duration: 0.5 },
    { id: noteId(), pitch: 75, velocity: 85, startTime: 1, duration: 0.5 },
    { id: noteId(), pitch: 72, velocity: 80, startTime: 2, duration: 0.5 },
    { id: noteId(), pitch: 70, velocity: 85, startTime: 3, duration: 1 },
    { id: noteId(), pitch: 67, velocity: 90, startTime: 5, duration: 0.5 },
    { id: noteId(), pitch: 70, velocity: 85, startTime: 6, duration: 0.5 },
    { id: noteId(), pitch: 72, velocity: 80, startTime: 7, duration: 1 },
  ];
  return { id: clipId(), name: 'Lead Melody', startTime: 0, duration: 16, notes };
}

function createSaxMelodyClip(): MidiClip {
  // Private School sax-style melody
  const notes: MidiNote[] = [
    { id: noteId(), pitch: 65, velocity: 85, startTime: 0, duration: 1 },
    { id: noteId(), pitch: 67, velocity: 80, startTime: 1.5, duration: 0.75 },
    { id: noteId(), pitch: 70, velocity: 90, startTime: 3, duration: 1.5 },
    { id: noteId(), pitch: 67, velocity: 75, startTime: 5, duration: 0.5 },
    { id: noteId(), pitch: 65, velocity: 85, startTime: 6, duration: 1 },
    { id: noteId(), pitch: 63, velocity: 80, startTime: 7.5, duration: 1.5 },
    { id: noteId(), pitch: 60, velocity: 90, startTime: 10, duration: 2 },
    { id: noteId(), pitch: 63, velocity: 80, startTime: 13, duration: 1 },
    { id: noteId(), pitch: 65, velocity: 85, startTime: 14.5, duration: 1.5 },
  ];
  return { id: clipId(), name: 'Sax Melody', startTime: 0, duration: 16, notes };
}

function createVocalChopClip(): MidiClip {
  // Rhythmic vocal chop pattern
  const notes: MidiNote[] = [
    { id: noteId(), pitch: 60, velocity: 90, startTime: 0, duration: 0.25 },
    { id: noteId(), pitch: 64, velocity: 85, startTime: 0.75, duration: 0.25 },
    { id: noteId(), pitch: 60, velocity: 80, startTime: 1.5, duration: 0.25 },
    { id: noteId(), pitch: 67, velocity: 90, startTime: 2, duration: 0.5 },
    { id: noteId(), pitch: 60, velocity: 85, startTime: 4, duration: 0.25 },
    { id: noteId(), pitch: 64, velocity: 80, startTime: 4.75, duration: 0.25 },
    { id: noteId(), pitch: 65, velocity: 90, startTime: 5.5, duration: 0.5 },
    { id: noteId(), pitch: 60, velocity: 85, startTime: 6.5, duration: 0.25 },
  ];
  return { id: clipId(), name: 'Vocal Chops', startTime: 0, duration: 16, notes };
}
