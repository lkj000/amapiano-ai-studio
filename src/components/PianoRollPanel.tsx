import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Play, Square, Pencil, Eraser, Scissors } from 'lucide-react';
import type { MidiNote } from '@/types/daw';

export interface PianoRollPanelProps {
  selectedTrack: number | null;
  tracks: any[];
  onClose: () => void;
  onUpdateNotes?: (trackId: string, clipId: string, notes: MidiNote[]) => void;
}

export const PianoRollPanel: React.FC<PianoRollPanelProps> = ({
  selectedTrack,
  tracks,
  onClose
}) => {
  const [tool, setTool] = useState('pencil');
  const [noteLength, setNoteLength] = useState([16]); // 16th notes
  const [velocity, setVelocity] = useState([100]);
  const [zoom, setZoom] = useState([100]);

  const selectedTrackData = tracks.find(t => t.id === selectedTrack);
  
  // Piano keys (C4 to C6)
  const keys = [
    'C6', 'B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5',
    'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'
  ];

  const isBlackKey = (key: string) => key.includes('#');

  return (
    <Card className="w-full h-full border-0 rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Piano Roll - {selectedTrackData?.name || 'No Track Selected'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {!selectedTrack ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Please select a track to edit MIDI notes
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="border-b border-border p-3 flex items-center gap-4">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={tool === 'pencil' ? 'default' : 'outline'}
                  onClick={() => setTool('pencil')}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'eraser' ? 'default' : 'outline'}
                  onClick={() => setTool('eraser')}
                >
                  <Eraser className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'cut' ? 'default' : 'outline'}
                  onClick={() => setTool('cut')}
                >
                  <Scissors className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">Note:</span>
                <Select value={noteLength[0].toString()} onValueChange={(v) => setNoteLength([parseInt(v)])}>
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
                <span className="text-xs">Velocity:</span>
                <div className="w-20">
                  <Slider
                    value={velocity}
                    onValueChange={setVelocity}
                    min={1}
                    max={127}
                    step={1}
                  />
                </div>
                <span className="text-xs w-8">{velocity[0]}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">Zoom:</span>
                <div className="w-20">
                  <Slider
                    value={zoom}
                    onValueChange={setZoom}
                    min={25}
                    max={400}
                    step={25}
                  />
                </div>
                <span className="text-xs">{zoom[0]}%</span>
              </div>

              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="outline">
                  <Play className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <Square className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Piano Roll Grid */}
            <div className="flex h-96">
              {/* Piano Keys */}
              <div className="w-16 border-r border-border bg-muted/20">
                {keys.map((key) => (
                  <div
                    key={key}
                    className={`h-4 border-b border-border/30 flex items-center justify-center text-xs cursor-pointer hover:bg-primary/10 ${
                      isBlackKey(key) ? 'bg-muted text-muted-foreground' : 'bg-background'
                    }`}
                  >
                    {key}
                  </div>
                ))}
              </div>

              {/* Note Grid */}
              <div className="flex-1 overflow-auto">
                <div className="relative">
                  {/* Time ruler */}
                  <div className="h-6 bg-muted border-b border-border flex">
                    {Array.from({ length: 32 }, (_, i) => (
                      <div key={i} className="flex-1 text-xs text-center border-r border-border/30 py-1">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="relative">
                    {keys.map((key, keyIndex) => (
                      <div
                        key={key}
                        className={`h-4 border-b border-border/30 relative ${
                          isBlackKey(key) ? 'bg-muted/30' : 'bg-background'
                        }`}
                      >
                        {/* Grid lines */}
                        {Array.from({ length: 32 }, (_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 border-r border-border/10"
                            style={{ left: `${(i / 32) * 100}%` }}
                          />
                        ))}
                        
                        {/* Sample notes for demo */}
                        {keyIndex < 5 && Math.random() > 0.7 && (
                          <div
                            className="absolute top-0.5 bottom-0.5 bg-primary rounded opacity-80 cursor-pointer hover:opacity-100"
                            style={{
                              left: `${Math.random() * 50}%`,
                              width: `${3 + Math.random() * 10}%`
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};