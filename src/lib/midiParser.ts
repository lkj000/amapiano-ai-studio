// MIDI File Parser
// Parses standard MIDI files (.mid) and converts to DAW format

export interface ParsedMIDINote {
  note: number;
  velocity: number;
  timestamp: number;
  duration: number;
}

export interface ParsedMIDIFile {
  format: number;
  tracks: ParsedMIDINote[][];
  ticksPerBeat: number;
  bpm?: number;
}

/**
 * Parse a MIDI file from a File or ArrayBuffer
 */
export async function parseMIDIFile(file: File | ArrayBuffer): Promise<ParsedMIDIFile> {
  let buffer: ArrayBuffer;
  
  if (file instanceof File) {
    buffer = await file.arrayBuffer();
  } else {
    buffer = file;
  }
  
  const view = new DataView(buffer);
  let offset = 0;
  
  // Read header chunk
  const headerChunkId = readString(view, offset, 4);
  offset += 4;
  
  if (headerChunkId !== 'MThd') {
    throw new Error('Invalid MIDI file: Missing MThd header');
  }
  
  const headerLength = view.getUint32(offset);
  offset += 4;
  
  const format = view.getUint16(offset);
  offset += 2;
  
  const numTracks = view.getUint16(offset);
  offset += 2;
  
  const ticksPerBeat = view.getUint16(offset);
  offset += 2;
  
  // Read track chunks
  const tracks: ParsedMIDINote[][] = [];
  let bpm: number | undefined;
  
  for (let i = 0; i < numTracks; i++) {
    const trackChunkId = readString(view, offset, 4);
    offset += 4;
    
    if (trackChunkId !== 'MTrk') {
      throw new Error(`Invalid MIDI file: Expected MTrk at track ${i}`);
    }
    
    const trackLength = view.getUint32(offset);
    offset += 4;
    
    const trackEnd = offset + trackLength;
    const trackData = parseTrack(view, offset, trackEnd, ticksPerBeat);
    
    if (trackData.notes.length > 0) {
      tracks.push(trackData.notes);
    }
    
    if (trackData.bpm && !bpm) {
      bpm = trackData.bpm;
    }
    
    offset = trackEnd;
  }
  
  return {
    format,
    tracks,
    ticksPerBeat,
    bpm
  };
}

/**
 * Parse a single MIDI track
 */
function parseTrack(view: DataView, start: number, end: number, ticksPerBeat: number): {
  notes: ParsedMIDINote[];
  bpm?: number;
} {
  let offset = start;
  const notes: ParsedMIDINote[] = [];
  const noteOnEvents = new Map<number, { timestamp: number; velocity: number }>();
  
  let currentTime = 0;
  let lastStatus = 0;
  let bpm: number | undefined;
  
  while (offset < end) {
    // Read delta time
    const deltaTime = readVariableLength(view, offset);
    offset += deltaTime.bytesRead;
    currentTime += deltaTime.value;
    
    // Read event
    let status = view.getUint8(offset);
    offset++;
    
    // Handle running status
    if (status < 0x80) {
      status = lastStatus;
      offset--;
    } else {
      lastStatus = status;
    }
    
    const messageType = status & 0xF0;
    const channel = status & 0x0F;
    
    if (messageType === 0x90) {
      // Note On
      const note = view.getUint8(offset);
      offset++;
      const velocity = view.getUint8(offset);
      offset++;
      
      if (velocity > 0) {
        noteOnEvents.set(note, { timestamp: currentTime, velocity });
      } else {
        // Velocity 0 = Note Off
        const noteOn = noteOnEvents.get(note);
        if (noteOn) {
          notes.push({
            note,
            velocity: noteOn.velocity,
            timestamp: noteOn.timestamp,
            duration: currentTime - noteOn.timestamp
          });
          noteOnEvents.delete(note);
        }
      }
    } else if (messageType === 0x80) {
      // Note Off
      const note = view.getUint8(offset);
      offset++;
      offset++; // Skip velocity
      
      const noteOn = noteOnEvents.get(note);
      if (noteOn) {
        notes.push({
          note,
          velocity: noteOn.velocity,
          timestamp: noteOn.timestamp,
          duration: currentTime - noteOn.timestamp
        });
        noteOnEvents.delete(note);
      }
    } else if (messageType === 0xB0) {
      // Control Change
      offset += 2;
    } else if (messageType === 0xC0) {
      // Program Change
      offset += 1;
    } else if (messageType === 0xD0) {
      // Channel Pressure
      offset += 1;
    } else if (messageType === 0xE0) {
      // Pitch Bend
      offset += 2;
    } else if (status === 0xFF) {
      // Meta event
      const metaType = view.getUint8(offset);
      offset++;
      
      const length = readVariableLength(view, offset);
      offset += length.bytesRead;
      
      if (metaType === 0x51 && length.value === 3) {
        // Tempo meta event
        const microsecondsPerBeat = (view.getUint8(offset) << 16) | 
                                   (view.getUint8(offset + 1) << 8) | 
                                   view.getUint8(offset + 2);
        bpm = Math.round(60000000 / microsecondsPerBeat);
      }
      
      offset += length.value;
    } else if (status === 0xF0 || status === 0xF7) {
      // SysEx
      const length = readVariableLength(view, offset);
      offset += length.bytesRead + length.value;
    }
  }
  
  return { notes, bpm };
}

/**
 * Read a variable-length quantity
 */
function readVariableLength(view: DataView, offset: number): { value: number; bytesRead: number } {
  let value = 0;
  let bytesRead = 0;
  let byte: number;
  
  do {
    byte = view.getUint8(offset + bytesRead);
    value = (value << 7) | (byte & 0x7F);
    bytesRead++;
  } while (byte & 0x80);
  
  return { value, bytesRead };
}

/**
 * Read a string from DataView
 */
function readString(view: DataView, offset: number, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(view.getUint8(offset + i));
  }
  return result;
}

/**
 * Convert MIDI ticks to milliseconds
 */
export function ticksToMs(ticks: number, ticksPerBeat: number, bpm: number = 120): number {
  const beatsPerMs = bpm / 60000;
  const msPerTick = 1 / (ticksPerBeat * beatsPerMs);
  return ticks * msPerTick;
}

/**
 * Convert parsed MIDI to DAW MIDI clip format
 */
export function convertToDAWFormat(
  parsedMIDI: ParsedMIDIFile,
  trackIndex: number = 0
): {
  notes: Array<{
    id: string;
    pitch: number;
    velocity: number;
    startTime: number;
    duration: number;
  }>;
  bpm?: number;
} {
  const track = parsedMIDI.tracks[trackIndex] || [];
  const bpm = parsedMIDI.bpm || 120;
  
  // Convert ticks to beats (assuming 4/4 time)
  const notes = track.map((note, index) => {
    const startTimeBeats = note.timestamp / parsedMIDI.ticksPerBeat;
    const durationBeats = note.duration / parsedMIDI.ticksPerBeat;
    
    return {
      id: `note_${Date.now()}_${index}`,
      pitch: note.note,
      velocity: note.velocity,
      startTime: startTimeBeats,
      duration: Math.max(0.25, durationBeats) // Minimum quarter note
    };
  });
  
  return { notes, bpm };
}
