/**
 * MIDI Exporter for Amapianorize Engine
 * Exports log drum patterns, basslines, and chord progressions as MIDI files
 */

export interface MidiNote {
  pitch: number;
  velocity: number;
  startTime: number; // In beats
  duration: number;  // In beats
}

export interface MidiTrack {
  name: string;
  channel: number;
  notes: MidiNote[];
}

export interface MidiExportOptions {
  bpm: number;
  ticksPerBeat: number;
  tracks: MidiTrack[];
}

// MIDI file constants
const MIDI_HEADER = [0x4D, 0x54, 0x68, 0x64]; // "MThd"
const TRACK_HEADER = [0x4D, 0x54, 0x72, 0x6B]; // "MTrk"

/**
 * Convert a number to variable-length quantity (VLQ)
 */
function toVLQ(value: number): number[] {
  if (value === 0) return [0];
  
  const bytes: number[] = [];
  let v = value;
  
  bytes.unshift(v & 0x7F);
  v >>= 7;
  
  while (v > 0) {
    bytes.unshift((v & 0x7F) | 0x80);
    v >>= 7;
  }
  
  return bytes;
}

/**
 * Convert 32-bit number to big-endian bytes
 */
function uint32BE(value: number): number[] {
  return [
    (value >> 24) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 8) & 0xFF,
    value & 0xFF
  ];
}

/**
 * Convert 16-bit number to big-endian bytes
 */
function uint16BE(value: number): number[] {
  return [
    (value >> 8) & 0xFF,
    value & 0xFF
  ];
}

/**
 * Create tempo meta event
 */
function createTempoEvent(bpm: number): number[] {
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  return [
    0x00, // Delta time
    0xFF, 0x51, 0x03, // Tempo meta event
    (microsecondsPerBeat >> 16) & 0xFF,
    (microsecondsPerBeat >> 8) & 0xFF,
    microsecondsPerBeat & 0xFF
  ];
}

/**
 * Create track name meta event
 */
function createTrackNameEvent(name: string): number[] {
  const nameBytes = Array.from(new TextEncoder().encode(name));
  return [
    0x00, // Delta time
    0xFF, 0x03, // Track name meta event
    nameBytes.length,
    ...nameBytes
  ];
}

/**
 * Create end of track meta event
 */
function createEndOfTrackEvent(): number[] {
  return [0x00, 0xFF, 0x2F, 0x00];
}

/**
 * Generate MIDI track data from notes
 */
function generateTrackData(
  track: MidiTrack,
  ticksPerBeat: number,
  includeTempo: boolean = false,
  bpm: number = 120
): number[] {
  const events: Array<{ tick: number; data: number[] }> = [];
  
  // Add track name
  events.push({
    tick: 0,
    data: createTrackNameEvent(track.name)
  });
  
  // Add tempo if this is the first track
  if (includeTempo) {
    events.push({
      tick: 0,
      data: createTempoEvent(bpm)
    });
  }
  
  // Convert notes to MIDI events
  for (const note of track.notes) {
    const startTick = Math.round(note.startTime * ticksPerBeat);
    const endTick = Math.round((note.startTime + note.duration) * ticksPerBeat);
    const velocity = Math.min(127, Math.max(1, Math.round(note.velocity)));
    
    // Note On
    events.push({
      tick: startTick,
      data: [0x90 | (track.channel & 0x0F), note.pitch, velocity]
    });
    
    // Note Off
    events.push({
      tick: endTick,
      data: [0x80 | (track.channel & 0x0F), note.pitch, 0]
    });
  }
  
  // Sort by tick
  events.sort((a, b) => a.tick - b.tick);
  
  // Convert to delta times
  const trackData: number[] = [];
  let lastTick = 0;
  
  for (const event of events) {
    const deltaTick = event.tick - lastTick;
    trackData.push(...toVLQ(deltaTick));
    
    // Skip delta time in event data if present
    const dataStart = event.data[0] === 0 && event.data[1] === 0xFF ? 1 : 0;
    trackData.push(...event.data.slice(dataStart));
    
    lastTick = event.tick;
  }
  
  // Add end of track
  trackData.push(...createEndOfTrackEvent());
  
  return trackData;
}

/**
 * Export MIDI file as Uint8Array
 */
export function exportMidi(options: MidiExportOptions): Uint8Array {
  const { bpm, ticksPerBeat, tracks } = options;
  
  // MIDI header
  const headerChunk: number[] = [
    ...MIDI_HEADER,
    ...uint32BE(6), // Header length
    ...uint16BE(1), // Format type 1 (multiple tracks)
    ...uint16BE(tracks.length),
    ...uint16BE(ticksPerBeat)
  ];
  
  // Generate track chunks
  const trackChunks: number[] = [];
  
  for (let i = 0; i < tracks.length; i++) {
    const trackData = generateTrackData(tracks[i], ticksPerBeat, i === 0, bpm);
    trackChunks.push(
      ...TRACK_HEADER,
      ...uint32BE(trackData.length),
      ...trackData
    );
  }
  
  return new Uint8Array([...headerChunk, ...trackChunks]);
}

/**
 * Download MIDI file
 */
export function downloadMidi(data: Uint8Array, filename: string): void {
  const blob = new Blob([data], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mid') ? filename : `${filename}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// Amapiano-specific MIDI generation functions
// ============================================

/**
 * Generate log drum MIDI pattern
 */
export function generateLogDrumMidi(
  bars: number = 4,
  pattern: 'basic' | 'syncopated' | 'dense' = 'basic',
  bpm: number = 115
): MidiTrack {
  const notes: MidiNote[] = [];
  const stepsPerBar = 16;
  const totalSteps = bars * stepsPerBar;
  
  // Log drum patterns (Euclidean-inspired)
  const patterns = {
    basic: [0, 4, 8, 12], // 4-on-floor with log drum character
    syncopated: [0, 3, 6, 10, 14], // Syncopated amapiano feel
    dense: [0, 2, 4, 6, 8, 10, 12, 14] // Dense log drum
  };
  
  const stepPattern = patterns[pattern];
  const basePitch = 36; // C1 - typical log drum pitch
  
  for (let bar = 0; bar < bars; bar++) {
    for (const step of stepPattern) {
      const startTime = (bar * 4) + (step / 4);
      const velocity = step === 0 ? 110 : 90; // Accent on beat 1
      
      notes.push({
        pitch: basePitch,
        velocity,
        startTime,
        duration: 0.25
      });
    }
  }
  
  return {
    name: 'Log Drum',
    channel: 9, // Drum channel
    notes
  };
}

/**
 * Generate bassline MIDI pattern
 */
export function generateBasslineMidi(
  bars: number = 4,
  key: string = 'Cm',
  style: 'walking' | 'pumping' | 'minimal' = 'pumping'
): MidiTrack {
  const notes: MidiNote[] = [];
  
  // Key mapping (simplified)
  const keyRoots: Record<string, number> = {
    'C': 36, 'Cm': 36, 'D': 38, 'Dm': 38,
    'E': 40, 'Em': 40, 'F': 41, 'Fm': 41,
    'G': 43, 'Gm': 43, 'A': 45, 'Am': 45,
    'B': 47, 'Bm': 47
  };
  
  const root = keyRoots[key] || 36;
  const isMinor = key.includes('m');
  
  // Common amapiano bass patterns
  const fifth = root + 7;
  const third = root + (isMinor ? 3 : 4);
  
  for (let bar = 0; bar < bars; bar++) {
    const barStart = bar * 4;
    
    if (style === 'pumping') {
      // Pumping 8th note bass
      for (let i = 0; i < 8; i++) {
        const pitch = i % 4 === 0 ? root : (i % 2 === 0 ? fifth : root);
        notes.push({
          pitch,
          velocity: i % 2 === 0 ? 100 : 75,
          startTime: barStart + (i * 0.5),
          duration: 0.4
        });
      }
    } else if (style === 'walking') {
      // Walking bass
      const progression = [root, third, fifth, third];
      for (let i = 0; i < 4; i++) {
        notes.push({
          pitch: progression[i],
          velocity: 95,
          startTime: barStart + i,
          duration: 0.9
        });
      }
    } else {
      // Minimal - just root on beat 1 and 3
      notes.push({
        pitch: root,
        velocity: 100,
        startTime: barStart,
        duration: 1.5
      });
      notes.push({
        pitch: root,
        velocity: 85,
        startTime: barStart + 2,
        duration: 1.5
      });
    }
  }
  
  return {
    name: 'Bass',
    channel: 0,
    notes
  };
}

/**
 * Generate chord progression MIDI
 */
export function generateChordProgressionMidi(
  bars: number = 4,
  key: string = 'Cm',
  voicing: 'basic' | 'extended' | 'jazzy' = 'basic'
): MidiTrack {
  const notes: MidiNote[] = [];
  
  // Key mapping
  const keyRoots: Record<string, number> = {
    'C': 60, 'Cm': 60, 'D': 62, 'Dm': 62,
    'E': 64, 'Em': 64, 'F': 65, 'Fm': 65,
    'G': 67, 'Gm': 67, 'A': 69, 'Am': 69,
    'B': 71, 'Bm': 71
  };
  
  const root = keyRoots[key] || 60;
  const isMinor = key.includes('m');
  
  // Chord voicings
  const chordIntervals = {
    basic: isMinor ? [0, 3, 7] : [0, 4, 7],
    extended: isMinor ? [0, 3, 7, 10] : [0, 4, 7, 11],
    jazzy: isMinor ? [0, 3, 7, 10, 14] : [0, 4, 7, 11, 14]
  };
  
  // Common amapiano progressions (intervals from root)
  const progressions = {
    minor: [0, 5, 3, 7], // i - IV - iv - v (simplified)
    major: [0, 5, 7, 3]
  };
  
  const progression = isMinor ? progressions.minor : progressions.major;
  const intervals = chordIntervals[voicing];
  
  for (let bar = 0; bar < bars; bar++) {
    const chordRoot = root + progression[bar % 4];
    const barStart = bar * 4;
    
    // Play chord on beat 1 and ghost on 3
    for (const interval of intervals) {
      notes.push({
        pitch: chordRoot + interval,
        velocity: 75,
        startTime: barStart,
        duration: 1.8
      });
    }
    
    // Softer voicing on beat 3
    for (const interval of intervals.slice(0, 3)) {
      notes.push({
        pitch: chordRoot + interval + 12, // Octave up
        velocity: 55,
        startTime: barStart + 2,
        duration: 1.5
      });
    }
  }
  
  return {
    name: 'Piano Chords',
    channel: 1,
    notes
  };
}

/**
 * Generate percussion MIDI (shakers, hi-hats)
 */
export function generatePercussionMidi(
  bars: number = 4,
  density: 'sparse' | 'medium' | 'dense' = 'medium'
): MidiTrack {
  const notes: MidiNote[] = [];
  const stepsPerBar = 16;
  
  // GM drum map
  const SHAKER = 70;
  const HIHAT_CLOSED = 42;
  const HIHAT_OPEN = 46;
  
  const densityPatterns = {
    sparse: [0, 4, 8, 12],
    medium: [0, 2, 4, 6, 8, 10, 12, 14],
    dense: Array.from({ length: 16 }, (_, i) => i)
  };
  
  const pattern = densityPatterns[density];
  
  for (let bar = 0; bar < bars; bar++) {
    for (const step of pattern) {
      const startTime = (bar * 4) + (step / 4);
      const isDownbeat = step % 4 === 0;
      const isOffbeat = step % 2 === 1;
      
      // Shaker on most steps
      notes.push({
        pitch: SHAKER,
        velocity: isDownbeat ? 80 : isOffbeat ? 50 : 65,
        startTime,
        duration: 0.1
      });
      
      // Hi-hat pattern
      if (step % 2 === 0) {
        notes.push({
          pitch: step % 8 === 0 ? HIHAT_OPEN : HIHAT_CLOSED,
          velocity: step % 4 === 0 ? 85 : 60,
          startTime,
          duration: step % 8 === 0 ? 0.3 : 0.1
        });
      }
    }
  }
  
  return {
    name: 'Percussion',
    channel: 9,
    notes
  };
}

/**
 * Export complete Amapiano MIDI template
 */
export function exportAmapianorizerMidi(options: {
  bars?: number;
  bpm?: number;
  key?: string;
  includeLogDrum?: boolean;
  includeBassline?: boolean;
  includeChords?: boolean;
  includePercussion?: boolean;
  logDrumPattern?: 'basic' | 'syncopated' | 'dense';
  bassStyle?: 'walking' | 'pumping' | 'minimal';
  chordVoicing?: 'basic' | 'extended' | 'jazzy';
  percussionDensity?: 'sparse' | 'medium' | 'dense';
}): Uint8Array {
  const {
    bars = 4,
    bpm = 115,
    key = 'Cm',
    includeLogDrum = true,
    includeBassline = true,
    includeChords = true,
    includePercussion = true,
    logDrumPattern = 'syncopated',
    bassStyle = 'pumping',
    chordVoicing = 'extended',
    percussionDensity = 'medium'
  } = options;
  
  const tracks: MidiTrack[] = [];
  
  if (includeLogDrum) {
    tracks.push(generateLogDrumMidi(bars, logDrumPattern, bpm));
  }
  
  if (includeBassline) {
    tracks.push(generateBasslineMidi(bars, key, bassStyle));
  }
  
  if (includeChords) {
    tracks.push(generateChordProgressionMidi(bars, key, chordVoicing));
  }
  
  if (includePercussion) {
    tracks.push(generatePercussionMidi(bars, percussionDensity));
  }
  
  return exportMidi({
    bpm,
    ticksPerBeat: 480,
    tracks
  });
}
