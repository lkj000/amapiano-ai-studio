import { describe, it, expect } from 'vitest';
import { createMIDIFile, type MIDINote } from '@/lib/midi/midiFileBuilder';

describe('createMIDIFile', () => {
  it('creates valid MIDI header', () => {
    const notes: MIDINote[] = [{ note: 60, velocity: 100, timestamp: 0, duration: 200 }];
    const data = createMIDIFile(notes);

    // MThd
    expect(data[0]).toBe(0x4d);
    expect(data[1]).toBe(0x54);
    expect(data[2]).toBe(0x68);
    expect(data[3]).toBe(0x64);

    // Chunk length = 6
    expect(data[7]).toBe(6);

    // Format 0, 1 track
    expect(data[9]).toBe(0);
    expect(data[11]).toBe(1);
  });

  it('contains MTrk chunk', () => {
    const notes: MIDINote[] = [{ note: 60, velocity: 100, timestamp: 0 }];
    const data = createMIDIFile(notes);

    // MTrk at byte 14
    expect(data[14]).toBe(0x4d);
    expect(data[15]).toBe(0x54);
    expect(data[16]).toBe(0x72);
    expect(data[17]).toBe(0x6b);
  });

  it('includes note-on and note-off events', () => {
    const notes: MIDINote[] = [{ note: 64, velocity: 80, timestamp: 0, duration: 100 }];
    const data = createMIDIFile(notes);
    const bytes = Array.from(data);

    // Should contain note-on (0x90) and note-off (0x80)
    expect(bytes).toContain(0x90);
    expect(bytes).toContain(0x80);
    // Should contain the note number 64
    expect(bytes.filter(b => b === 64).length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty notes array', () => {
    const data = createMIDIFile([]);
    // Should still produce valid header + track with just end-of-track
    expect(data.length).toBeGreaterThan(18); // header(14) + track header(4+4) + EOT(4)
  });

  it('sorts notes by timestamp', () => {
    const notes: MIDINote[] = [
      { note: 72, velocity: 100, timestamp: 500 },
      { note: 60, velocity: 100, timestamp: 0 },
      { note: 67, velocity: 100, timestamp: 250 },
    ];
    const data = createMIDIFile(notes);
    // Should not throw and should produce valid output
    expect(data.length).toBeGreaterThan(20);
  });

  it('returns Uint8Array', () => {
    const data = createMIDIFile([{ note: 60, velocity: 100, timestamp: 0 }]);
    expect(data).toBeInstanceOf(Uint8Array);
  });
});
