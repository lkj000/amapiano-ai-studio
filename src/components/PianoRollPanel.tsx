import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Play, Square, Pencil, Eraser, Scissors, Trash2 } from 'lucide-react';
import type { DawTrack, MidiNote } from '@/types/daw';

interface PianoRollPanelProps {
  selectedTrack: DawTrack | null;
  onClose: () => void;
  onUpdateNotes: (trackId: string, clipId: string, notes: MidiNote[]) => void;
  audioContext?: AudioContext;
  onPlayNote?: (pitch: number, velocity?: number, duration?: number) => void;
}

export default function PianoRollPanel({ selectedTrack, onClose, onUpdateNotes, audioContext, onPlayNote }: PianoRollPanelProps) {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [snap, setSnap] = useState(16); // 16th note snap
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Piano keys (C4 to C6)
  const keys = Array.from({ length: 25 }, (_, i) => 84 - i); // MIDI notes 84 down to 60

  const handleAddNote = (pitch: number, startTime: number) => {
    if (!selectedTrack || !selectedTrack.clips[0]) return;

    const newNote: MidiNote = {
      id: `note_${Date.now()}`,
      pitch,
      velocity: 80,
      startTime,
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

  const handleNoteClick = (noteId: string, note: MidiNote) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
    
    // Play the note when clicked
    if (onPlayNote) {
      onPlayNote(note.pitch, note.velocity, 0.3);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedTrack || !selectedTrack.clips[0] || selectedNotes.length === 0) return;

    const updatedNotes = (selectedTrack.clips[0].notes || []).filter(note => !selectedNotes.includes(note.id));
    onUpdateNotes(selectedTrack.id, selectedTrack.clips[0].id, updatedNotes);
    setSelectedNotes([]);
  };

  const handleVelocityChange = (noteId: string, velocity: number) => {
    if (!selectedTrack || !selectedTrack.clips[0]) return;

    const updatedNotes = (selectedTrack.clips[0].notes || []).map(note =>
      note.id === noteId ? { ...note, velocity } : note
    );
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

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Piano Roll - {selectedTrack.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Snap:</span>
              <Select value={snap.toString()} onValueChange={(v) => setSnap(parseInt(v))}>
                <SelectTrigger className="w-20">
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
            <div className="flex items-center gap-2">
              <span className="text-sm">Zoom:</span>
              <div className="w-20">
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={25}
                  max={400}
                  step={25}
                />
              </div>
              <span className="text-sm">{zoom}%</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline">
                <Play className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline">
                <Square className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={handleDeleteSelected} disabled={selectedNotes.length === 0}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                {selectedNotes.length === 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Velocity:</span>
                    <Slider
                      value={[selectedTrack?.clips[0]?.notes?.find(n => n.id === selectedNotes[0])?.velocity || 80]}
                      onValueChange={([value]) => handleVelocityChange(selectedNotes[0], value)}
                      min={1}
                      max={127}
                      step={1}
                      className="w-20"
                    />
                  </div>
                )}
              </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Piano Keys */}
          <div className="w-16 border-r border-border bg-muted/10 overflow-y-auto">
            {keys.map((pitch) => (
              <div
                key={pitch}
                className={`h-6 border-b border-border/30 flex items-center justify-center text-xs cursor-pointer hover:bg-primary/10 ${
                  isBlackKey(pitch) ? 'bg-muted text-muted-foreground' : 'bg-background'
                }`}
                onClick={() => onPlayNote && onPlayNote(pitch, 80, 0.5)}
              >
                {keyToNote(pitch)}
              </div>
            ))}
          </div>

          {/* Note Grid */}
          <div className="flex-1 overflow-auto">
            <div className="relative">
              {/* Time ruler */}
              <div className="h-8 bg-muted/20 border-b border-border flex sticky top-0 z-10">
                {Array.from({ length: 32 }, (_, i) => (
                  <div key={i} className="flex-1 text-xs text-center border-r border-border/30 py-1 text-muted-foreground">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="relative" style={{ width: `${zoom}%` }}>
                {keys.map((pitch) => (
                  <div
                    key={pitch}
                    className={`h-6 border-b border-border/30 relative ${
                      isBlackKey(pitch) ? 'bg-muted/20' : 'bg-background'
                    }`}
                  >
                    {/* Grid lines */}
                    {Array.from({ length: 32 * 4 }, (_, i) => (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r ${i % 4 === 0 ? 'border-border/30' : 'border-border/10'}`}
                        style={{ left: `${(i / (32 * 4)) * 100}%` }}
                      />
                    ))}
                    
                    {/* Click area for adding notes */}
                    <div
                      className="absolute inset-0 cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const startTime = (x / rect.width) * 32;
                        handleAddNote(pitch, Math.round(startTime * snap) / snap);
                      }}
                    />
                    
                    {/* Notes */}
                    {selectedTrack.clips[0]?.notes?.filter(note => note.pitch === pitch).map(note => (
                      <div
                        key={note.id}
                        className={`absolute top-0.5 bottom-0.5 rounded cursor-pointer transition-colors ${
                          selectedNotes.includes(note.id) 
                            ? 'bg-primary/90 ring-2 ring-primary' 
                            : 'bg-primary/70 hover:bg-primary/80'
                        }`}
                        style={{
                          left: `${(note.startTime / 32) * 100}%`,
                          width: `${Math.max((note.duration / 32) * 100, 1)}%`
                        }}
                        onClick={() => handleNoteClick(note.id, note)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}