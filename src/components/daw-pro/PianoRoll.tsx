/**
 * Piano Roll Component
 * MIDI note editor with piano keyboard
 */

import React, { useState, useRef, useCallback } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DAWChannel, DAWPattern, DAWNote } from '@/pages/AmapianoPro';

interface PianoRollProps {
  channel: DAWChannel | undefined;
  pattern: DAWPattern | undefined;
  currentStep: number;
  isPlaying: boolean;
  snap: 'none' | 'step' | 'beat' | 'bar';
  zoom: number;
  rootNote: string;
  scale: string;
  onAddNote: (pitch: number, startStep: number, duration?: number) => void;
  onUpdateNote: (noteId: string, updates: Partial<DAWNote>) => void;
  onDeleteNote: (noteId: string) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [8, 7, 6, 5, 4, 3, 2, 1, 0];
const TOTAL_NOTES = OCTAVES.length * 12;

const isBlackKey = (noteIndex: number) => {
  const n = noteIndex % 12;
  return [1, 3, 6, 8, 10].includes(n);
};

const getNoteName = (midiNote: number) => {
  const octave = Math.floor(midiNote / 12) - 1;
  const note = NOTE_NAMES[midiNote % 12];
  return `${note}${octave}`;
};

const isInScale = (midiNote: number, rootNote: string, scale: string) => {
  const root = NOTE_NAMES.indexOf(rootNote);
  const noteInOctave = (midiNote - root + 12) % 12;
  
  const scales: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    blues: [0, 3, 5, 6, 7, 10],
    pentatonic: [0, 2, 4, 7, 9],
  };
  
  return scales[scale]?.includes(noteInOctave) ?? true;
};

export const PianoRoll: React.FC<PianoRollProps> = ({
  channel,
  pattern,
  currentStep,
  isPlaying,
  snap,
  zoom,
  rootNote,
  scale,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ pitch: number; step: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const stepWidth = 24 * zoom;
  const noteHeight = 16;
  const totalSteps = pattern?.length || 16;
  const pianoWidth = 60;

  const handleMouseDown = useCallback((e: React.MouseEvent, midiNote: number) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const step = Math.floor(x / stepWidth);
    
    if (step >= 0 && step < totalSteps) {
      setIsDrawing(true);
      setDrawStart({ pitch: midiNote, step });
    }
  }, [stepWidth, totalSteps]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !gridRef.current) {
      setIsDrawing(false);
      setDrawStart(null);
      return;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let endStep = Math.floor(x / stepWidth);
    endStep = Math.max(drawStart.step, endStep);
    
    const duration = Math.max(1, endStep - drawStart.step + 1);
    onAddNote(drawStart.pitch, drawStart.step, duration);
    
    setIsDrawing(false);
    setDrawStart(null);
  }, [isDrawing, drawStart, stepWidth, onAddNote]);

  const handleNoteClick = useCallback((e: React.MouseEvent, note: DAWNote) => {
    e.stopPropagation();
    if (e.button === 2) {
      onDeleteNote(note.id);
    } else {
      setSelectedNoteId(note.id === selectedNoteId ? null : note.id);
    }
  }, [selectedNoteId, onDeleteNote]);

  if (!channel) {
    return (
      <div className="h-full flex items-center justify-center bg-card text-muted-foreground">
        <p>Select a channel to edit in the Piano Roll</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="h-8 flex items-center px-3 border-b border-border bg-muted/30">
        <div 
          className="w-3 h-3 rounded-sm mr-2" 
          style={{ backgroundColor: channel.color }} 
        />
        <span className="text-sm font-medium">{channel.name}</span>
        <span className="text-xs text-muted-foreground ml-2">
          {channel.notes.length} notes
        </span>
      </div>

      {/* Piano Roll Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Piano Keys */}
        <div className="flex-shrink-0 border-r border-border" style={{ width: pianoWidth }}>
          <ScrollArea className="h-full">
            <div style={{ height: TOTAL_NOTES * noteHeight }}>
              {OCTAVES.flatMap((octave) =>
                Array.from({ length: 12 }, (_, i) => 11 - i).map((noteInOctave) => {
                  const midiNote = octave * 12 + noteInOctave;
                  const black = isBlackKey(noteInOctave);
                  const inScale = isInScale(midiNote, rootNote, scale);
                  
                  return (
                    <div
                      key={midiNote}
                      className={cn(
                        "flex items-center justify-end pr-2 text-[10px] border-b border-border cursor-pointer",
                        black ? "bg-zinc-800 text-zinc-400" : "bg-zinc-700 text-zinc-200",
                        !inScale && "opacity-40",
                        noteInOctave === 0 && "border-b-2 border-b-zinc-500"
                      )}
                      style={{ height: noteHeight, width: pianoWidth }}
                      onClick={() => {
                        // Play preview note
                        console.log('Play note:', getNoteName(midiNote));
                      }}
                    >
                      {NOTE_NAMES[noteInOctave % 12]}{octave}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1">
          <div
            ref={gridRef}
            className="relative"
            style={{ 
              width: totalSteps * stepWidth, 
              height: TOTAL_NOTES * noteHeight,
              minWidth: '100%'
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDrawing(false);
              setDrawStart(null);
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Grid Lines */}
            {OCTAVES.flatMap((octave) =>
              Array.from({ length: 12 }, (_, i) => 11 - i).map((noteInOctave) => {
                const midiNote = octave * 12 + noteInOctave;
                const black = isBlackKey(noteInOctave);
                const inScale = isInScale(midiNote, rootNote, scale);
                const rowIndex = (8 - octave) * 12 + (11 - noteInOctave);
                
                return (
                  <div
                    key={midiNote}
                    className={cn(
                      "absolute left-0 right-0 border-b border-border",
                      black ? "bg-zinc-900/50" : "bg-zinc-800/30",
                      inScale && !black && "bg-primary/5",
                      noteInOctave === 0 && "border-b-2 border-b-zinc-600"
                    )}
                    style={{ 
                      top: rowIndex * noteHeight, 
                      height: noteHeight 
                    }}
                    onMouseDown={(e) => handleMouseDown(e, midiNote)}
                  />
                );
              })
            )}

            {/* Beat Lines */}
            {Array.from({ length: totalSteps + 1 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute top-0 bottom-0 border-l",
                  i % 4 === 0 ? "border-zinc-500" : "border-zinc-700/50"
                )}
                style={{ left: i * stepWidth }}
              />
            ))}

            {/* Playhead */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent z-20 pointer-events-none"
                style={{ left: currentStep * stepWidth + stepWidth / 2 }}
              />
            )}

            {/* Notes */}
            {channel.notes.map((note) => {
              const rowIndex = (8 * 12 + 11) - note.pitch;
              
              return (
                <div
                  key={note.id}
                  className={cn(
                    "absolute rounded-sm cursor-pointer transition-all border-2",
                    selectedNoteId === note.id 
                      ? "ring-2 ring-accent border-accent" 
                      : "border-transparent hover:border-accent/50"
                  )}
                  style={{
                    left: note.startStep * stepWidth + 1,
                    top: rowIndex * noteHeight + 1,
                    width: note.duration * stepWidth - 2,
                    height: noteHeight - 2,
                    backgroundColor: channel.color,
                    opacity: note.velocity,
                  }}
                  onClick={(e) => handleNoteClick(e, note)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onDeleteNote(note.id);
                  }}
                >
                  <div className="w-full h-full flex items-center px-1">
                    <span className="text-[8px] text-background font-medium truncate">
                      {getNoteName(note.pitch)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Drawing Preview */}
            {isDrawing && drawStart && (
              <div
                className="absolute rounded-sm opacity-50 pointer-events-none"
                style={{
                  left: drawStart.step * stepWidth + 1,
                  top: ((8 * 12 + 11) - drawStart.pitch) * noteHeight + 1,
                  width: stepWidth - 2,
                  height: noteHeight - 2,
                  backgroundColor: channel.color,
                }}
              />
            )}
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
};
