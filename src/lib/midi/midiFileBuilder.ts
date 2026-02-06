/**
 * MIDI File Builder
 * Creates standard .mid files from recorded MIDI note data.
 */

export interface MIDINote {
  note: number;
  velocity: number;
  timestamp: number;
  duration?: number;
}

function encodeVariableLength(value: number): number[] {
  const bytes: number[] = [];
  bytes.push(value & 0x7f);

  let v = value >> 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }

  return bytes;
}

function intToBytes(value: number, numBytes: number): number[] {
  const bytes: number[] = [];
  for (let i = numBytes - 1; i >= 0; i--) {
    bytes.push((value >> (i * 8)) & 0xff);
  }
  return bytes;
}

export function createMIDIFile(notes: MIDINote[]): Uint8Array {
  const header = [
    0x4d, 0x54, 0x68, 0x64, // MThd
    0x00, 0x00, 0x00, 0x06, // Chunk length
    0x00, 0x00,             // Format 0
    0x00, 0x01,             // 1 track
    0x00, 0x60,             // 96 ticks/quarter note
  ];

  const trackEvents: number[] = [];
  let lastTime = 0;

  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  sortedNotes.forEach((note, idx) => {
    const deltaTime = idx === 0 ? 0 : Math.max(0, note.timestamp - lastTime);
    const deltaTicks = Math.floor(deltaTime / 10);

    trackEvents.push(...encodeVariableLength(deltaTicks));
    trackEvents.push(0x90, note.note, note.velocity);

    const duration = note.duration || 200;
    const durationTicks = Math.floor(duration / 10);
    trackEvents.push(...encodeVariableLength(durationTicks));
    trackEvents.push(0x80, note.note, 0);

    lastTime = note.timestamp;
  });

  // End of track
  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // MTrk
    ...intToBytes(trackEvents.length, 4),
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
}

export function downloadMIDIFile(notes: MIDINote[], filename?: string): void {
  const midiData = createMIDIFile(notes);
  const blob = new Blob([midiData.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `voice-to-midi-${Date.now()}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
