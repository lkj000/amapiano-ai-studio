import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Play, Square, Pencil, Eraser, Scissors, Trash2, Copy, ClipboardPaste, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DawTrack, MidiNote } from '@/types/daw';

interface PianoRollPanelProps {
  selectedTrack: DawTrack | null;
  onClose: () => void;
  onUpdateNotes: (trackId: string, clipId: string, notes: MidiNote[]) => void;
  audioContext?: AudioContext;
  onPlayNote?: (pitch: number, velocity?: number, duration?: number) => void;
  onPlay?: () => void;
  onStop?: () => void;
  isPlaying?: boolean;
}

export default function PianoRollPanel({ selectedTrack, onClose, onUpdateNotes, audioContext, onPlayNote, onPlay, onStop, isPlaying }: PianoRollPanelProps) {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [snap, setSnap] = useState(16); // 16th note snap
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'left' | 'right' | null>(null);
  const [clipboard, setClipboard] = useState<MidiNote[]>([]);
  const [tool, setTool] = useState<'select' | 'pencil' | 'eraser'>('select');

  // Piano keys (C4 to C6)
  const keys = Array.from({ length: 25 }, (_, i) => 84 - i); // MIDI notes 84 down to 60

  const snapToGrid = (time: number) => {
    const snapValue = 1 / (snap / 4); // Convert snap to beat fractions
    return Math.round(time / snapValue) * snapValue;
  };

  const handleNoteMouseDown = useCallback((noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isNearLeftEdge = e.clientX - rect.left < 8;
    const isNearRightEdge = rect.right - e.clientX < 8;
    
    if (tool === 'eraser') {
      handleDeleteNote(noteId);
      return;
    }
    
    if (isNearLeftEdge || isNearRightEdge) {
      setIsResizing(true);
      setResizeDirection(isNearLeftEdge ? 'left' : 'right');
      setDraggedNote(noteId);
    } else {
      setIsDragging(true);
      setDraggedNote(noteId);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
    
    if (!selectedNotes.includes(noteId)) {
      if (e.ctrlKey || e.metaKey) {
        setSelectedNotes(prev => [...prev, noteId]);
      } else {
        setSelectedNotes([noteId]);
      }
    }
    
    // Play note for feedback
    if (onPlayNote && midiClip && 'notes' in midiClip) {
      const note = clipNotes.find((n: MidiNote) => n.id === noteId);
      if (note) {
        onPlayNote(note.pitch, note.velocity, 0.3);
      }
    }
  }, [tool, selectedNotes, selectedTrack, onPlayNote]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!dragStart || !draggedNote || !selectedTrack?.clips[0]) return;
    
    const clip = selectedTrack.clips[0];
    if (!('notes' in clip)) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Calculate time and pitch changes
    const timeChange = (deltaX / (zoom / 100)) / 32; // Adjust for zoom
    const pitchChange = Math.round(deltaY / -24); // Each piano key is ~24px
    
    const updatedNotes = (clip.notes || []).map(note => {
      if (selectedNotes.includes(note.id)) {
        if (isResizing) {
          const snappedTimeChange = snapToGrid(timeChange);
          if (resizeDirection === 'left') {
            const newStartTime = Math.max(0, note.startTime + snappedTimeChange);
            const newDuration = note.duration - snappedTimeChange;
            return newDuration > 0.1 ? { ...note, startTime: newStartTime, duration: newDuration } : note;
          } else {
            const newDuration = Math.max(0.1, note.duration + snappedTimeChange);
            return { ...note, duration: newDuration };
          }
        } else {
          return {
            ...note,
            startTime: Math.max(0, snapToGrid(note.startTime + timeChange)),
            pitch: Math.max(21, Math.min(108, note.pitch + pitchChange))
          };
        }
      }
      return note;
    });
    
    onUpdateNotes(selectedTrack.id, clip.id, updatedNotes);
  }, [isDragging, isResizing, dragStart, draggedNote, selectedTrack, selectedNotes, zoom, snap, resizeDirection, onUpdateNotes]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedNote(null);
    setDragStart(null);
    setResizeDirection(null);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleDeleteNote = (noteId: string) => {
    if (!selectedTrack?.clips[0]) return;
    const clip = selectedTrack.clips[0];
    if ('notes' in clip) {
      const updatedNotes = (clip.notes || []).filter(note => note.id !== noteId);
      onUpdateNotes(selectedTrack.id, clip.id, updatedNotes);
      setSelectedNotes(prev => prev.filter(id => id !== noteId));
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedTrack?.clips[0] || selectedNotes.length === 0) return;
    const clip = selectedTrack.clips[0];
    if ('notes' in clip) {
      const updatedNotes = (clip.notes || []).filter(note => !selectedNotes.includes(note.id));
      onUpdateNotes(selectedTrack.id, clip.id, updatedNotes);
    }
    setSelectedNotes([]);
  };

  const handleCopyNotes = () => {
    if (!selectedTrack?.clips[0] || selectedNotes.length === 0) return;
    const clip = selectedTrack.clips[0];
    if ('notes' in clip) {
      const notesToCopy = (clip.notes || []).filter(note => selectedNotes.includes(note.id));
      setClipboard(notesToCopy);
    }
  };

  const handlePasteNotes = () => {
    if (!selectedTrack?.clips[0] || clipboard.length === 0) return;
    const clip = selectedTrack.clips[0];
    if ('notes' in clip) {
      const pastedNotes = clipboard.map(note => ({
        ...note,
        id: `note_${Date.now()}_${Math.random()}`,
        startTime: note.startTime + 4 // Offset by 1 bar
      }));
      const updatedNotes = [...(clip.notes || []), ...pastedNotes];
      onUpdateNotes(selectedTrack.id, clip.id, updatedNotes);
    }
  };

  const handleVelocityChange = (noteId: string, velocity: number) => {
    if (!selectedTrack?.clips[0]) return;
    const clip = selectedTrack.clips[0];
    if ('notes' in clip) {
      const updatedNotes = (clip.notes || []).map(note =>
        note.id === noteId ? { ...note, velocity } : note
      );
      onUpdateNotes(selectedTrack.id, clip.id, updatedNotes);
    }
  };

  const handleAddNote = (pitch: number, startTime: number) => {
    if (!selectedTrack?.clips[0] || tool !== 'pencil') return;

    const newNote: MidiNote = {
      id: `note_${Date.now()}`,
      pitch,
      velocity: 80,
      startTime: snapToGrid(startTime),
      duration: 1,
    };

    // Play the note for immediate feedback
    if (onPlayNote) {
      onPlayNote(pitch, 80, 0.5);
    }

    const clip = selectedTrack.clips[0] as any;
    const updatedNotes = [...(clip.notes || []), newNote];
    onUpdateNotes(selectedTrack.id, selectedTrack.clips[0].id, updatedNotes);
  };

  const keyToNote = (pitch: number) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const note = noteNames[pitch % 12];
    return `${note}${octave}`;
  };

  const isBlackKey = (pitch: number) => {
    const noteIndex = pitch % 12;
    return [1, 3, 6, 8, 10].includes(noteIndex);
  };

  if (!selectedTrack || selectedTrack.type !== 'midi') {
    return (
      <Card className="fixed inset-4 z-50 bg-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Piano Roll</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Please select a MIDI track to edit notes
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the first MIDI clip with notes
  const midiClip = selectedTrack.clips?.[0];
  const clipNotes = midiClip && 'notes' in midiClip ? (midiClip.notes || []) : [];

  console.log('PianoRoll: selectedTrack', selectedTrack);
  console.log('PianoRoll: midiClip', midiClip);
  console.log('PianoRoll: clipNotes', clipNotes);

  return (
    <Card className="fixed inset-4 z-50 bg-background shadow-elegant border-0 flex flex-col">
      {/* Modern Header */}
      <div className="bg-gradient-subtle border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold">
                Piano Roll
              </CardTitle>
              <div className="text-xs text-muted-foreground">{selectedTrack.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tools Section */}
            <div className="flex items-center gap-2 bg-background/50 px-2.5 py-1.5 rounded-md border border-border/50">
              <Button 
                size="sm" 
                variant={tool === 'select' ? 'default' : 'ghost'}
                className="h-7 px-2.5"
                onClick={() => setTool('select')}
              >
                Select
              </Button>
              <Button 
                size="sm" 
                variant={tool === 'pencil' ? 'default' : 'ghost'}
                className="h-7 w-7 p-0"
                onClick={() => setTool('pencil')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant={tool === 'eraser' ? 'default' : 'ghost'}
                className="h-7 w-7 p-0"
                onClick={() => setTool('eraser')}
              >
                <Eraser className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Grid Settings */}
            <div className="flex items-center gap-2 bg-background/50 px-2.5 py-1.5 rounded-md border border-border/50">
              <span className="text-xs text-muted-foreground">Snap:</span>
              <Select value={snap.toString()} onValueChange={(v) => setSnap(parseInt(v))}>
                <SelectTrigger className="w-16 h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">1/4</SelectItem>
                  <SelectItem value="8">1/8</SelectItem>
                  <SelectItem value="16">1/16</SelectItem>
                  <SelectItem value="32">1/32</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-2 bg-background/50 px-2.5 py-1.5 rounded-md border border-border/50">
              <span className="text-xs text-muted-foreground">Zoom:</span>
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={25}
                max={400}
                step={25}
                className="w-20"
              />
              <span className="text-xs font-medium w-10">{zoom}%</span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Transport */}
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant={isPlaying ? "default" : "outline"}
                className="h-8 w-8 p-0"
                onClick={() => onPlay?.()}
                disabled={!onPlay}
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onStop?.()}
                disabled={!onStop}
              >
                <Square className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Edit Tools */}
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0"
                onClick={handleCopyNotes} 
                disabled={selectedNotes.length === 0}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 w-8 p-0" 
                onClick={handlePasteNotes} 
                disabled={clipboard.length === 0}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8"
                onClick={handleDeleteSelected} 
                disabled={selectedNotes.length === 0}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            </div>

            {/* Velocity Editor */}
            {selectedNotes.length === 1 && clipNotes.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2 bg-background/50 px-2.5 py-1.5 rounded-md border border-border/50">
                  <span className="text-xs text-muted-foreground">Velocity:</span>
                  <Slider
                    value={[clipNotes.find((n: MidiNote) => n.id === selectedNotes[0])?.velocity || 80]}
                    onValueChange={([value]) => handleVelocityChange(selectedNotes[0], value)}
                    min={1}
                    max={127}
                    step={1}
                    className="w-20"
                  />
                  <span className="text-xs font-medium w-8">
                    {clipNotes.find((n: MidiNote) => n.id === selectedNotes[0])?.velocity || 80}
                  </span>
                </div>
              </>
            )}

            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-0 overflow-hidden flex flex-col">
        <div className="flex h-full">
          {/* Piano Keys Sidebar */}
          <div className="w-20 border-r border-border/50 bg-muted/10 overflow-y-auto flex-shrink-0">
            {keys.map((pitch) => {
              const isBlack = isBlackKey(pitch);
              return (
                <div
                  key={pitch}
                  className={cn(
                    "h-6 border-b border-border/20 flex items-center justify-center text-xs cursor-pointer transition-colors",
                    "hover:bg-primary/10 active:bg-primary/20",
                    isBlack 
                      ? 'bg-muted/50 text-muted-foreground font-medium' 
                      : 'bg-background/50'
                  )}
                  onClick={() => onPlayNote && onPlayNote(pitch, 80, 0.5)}
                >
                  <span className="text-[10px]">{keyToNote(pitch)}</span>
                </div>
              );
            })}
          </div>

          {/* Note Grid Area */}
          <div className="flex-1 overflow-auto bg-background/30">
            <div className="relative">
              {/* Time Ruler */}
              <div className="h-9 bg-gradient-subtle border-b border-border/50 flex sticky top-0 z-10">
                {Array.from({ length: 32 }, (_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 text-xs text-center border-r py-2 font-mono transition-colors",
                      i % 4 === 0 ? "border-border/40 font-semibold text-foreground" : "border-border/20 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Grid with Notes */}
              <div className="relative" style={{ width: `${zoom}%` }}>
                {keys.map((pitch) => {
                  const isBlack = isBlackKey(pitch);
                  return (
                    <div
                      key={pitch}
                      className={cn(
                        "h-6 border-b border-border/20 relative transition-colors",
                        isBlack ? 'bg-muted/10' : 'bg-background/50',
                        'hover:bg-accent/5'
                      )}
                    >
                      {/* Grid Lines */}
                      {Array.from({ length: 32 * 4 }, (_, i) => {
                        const isBar = i % 16 === 0;
                        const isBeat = i % 4 === 0;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "absolute top-0 bottom-0 border-r",
                              isBar && "border-border/40",
                              isBeat && !isBar && "border-border/25",
                              !isBeat && "border-border/10"
                            )}
                            style={{ left: `${(i / (32 * 4)) * 100}%` }}
                          />
                        );
                      })}
                      
                      {/* Click Area */}
                      <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={(e) => {
                          if (tool === 'pencil') {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const startTime = (x / rect.width) * 32;
                            handleAddNote(pitch, startTime);
                          }
                        }}
                      />
                      
                      {/* MIDI Notes */}
                      {clipNotes.filter((note: MidiNote) => note.pitch === pitch).map((note: MidiNote) => (
                        <div
                          key={note.id}
                          className={cn(
                            "absolute top-0.5 bottom-0.5 rounded-md cursor-pointer transition-all",
                            "bg-gradient-primary/70 border border-primary/40 backdrop-blur-sm",
                            selectedNotes.includes(note.id) 
                              ? 'ring-2 ring-primary shadow-glow bg-gradient-primary/90' 
                              : 'hover:bg-gradient-primary/80 hover:border-primary/60',
                            isResizing ? 'cursor-ew-resize' : 'cursor-move'
                          )}
                          style={{
                            left: `${(note.startTime / 32) * 100}%`,
                            width: `${Math.max((note.duration / 32) * 100, 1)}%`,
                            opacity: note.velocity / 127 * 0.5 + 0.5
                          }}
                          onMouseDown={(e) => handleNoteMouseDown(note.id, e)}
                        >
                          {/* Resize Handles */}
                          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 hover:opacity-100 bg-primary/30 rounded-l-md transition-opacity" />
                          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 hover:opacity-100 bg-primary/30 rounded-r-md transition-opacity" />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}