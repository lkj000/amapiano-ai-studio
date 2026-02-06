import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic } from 'lucide-react';
import { NOTE_NAMES } from '@/lib/audio/musicTheory';

interface PitchVisualizerProps {
  detectedNote: string;
  detectedPitch: number | null;
  audioLevel: number;
  isRecording: boolean;
  midiNoteCount: number;
}

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({
  detectedNote,
  detectedPitch,
  audioLevel,
  isRecording,
  midiNoteCount,
}) => (
  <div className="space-y-4">
    {/* Circular pitch display */}
    <div className="relative aspect-square max-w-sm mx-auto bg-gradient-to-br from-background to-primary/10 rounded-2xl border-2 border-primary/30 p-8">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {detectedNote || '---'}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {detectedPitch ? `${detectedPitch.toFixed(1)} Hz` : 'No signal'}
        </div>
        {isRecording && (
          <Badge variant="outline" className="mt-4 border-destructive text-destructive animate-pulse">
            ● REC {midiNoteCount} notes
          </Badge>
        )}
      </div>
      <div className="absolute inset-0">
        {NOTE_NAMES.map((note, idx) => {
          const angle = (idx / 12) * 2 * Math.PI - Math.PI / 2;
          const radius = 45;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const isActive = detectedNote.startsWith(note);
          return (
            <div
              key={note}
              className={`absolute w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br from-primary to-accent border-primary-foreground scale-110 shadow-lg shadow-primary/50'
                  : 'bg-background/50 border-primary/30 text-muted-foreground'
              }`}
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span className={`text-sm font-bold ${isActive ? 'text-primary-foreground' : ''}`}>{note}</span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Audio level meter */}
    <div className="space-y-2 bg-gradient-to-br from-background to-primary/5 p-4 rounded-xl border border-primary/20">
      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-2 text-muted-foreground font-medium">
          <Mic className={`w-5 h-5 ${audioLevel > 10 ? 'text-green-500 animate-pulse' : ''}`} />
          Live Input Level
        </span>
        <span className={`text-lg font-bold ${
          audioLevel > 50 ? 'text-green-500' : audioLevel > 20 ? 'text-yellow-500' : 'text-muted-foreground'
        }`}>
          {audioLevel.toFixed(0)}%
        </span>
      </div>
      <div className="flex gap-1 h-12 items-end">
        {Array.from({ length: 20 }).map((_, i) => {
          const barThreshold = (i + 1) * 5;
          const isActive = audioLevel >= barThreshold;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t transition-all duration-100 ${
                isActive ? (i < 14 ? 'bg-green-500' : i < 18 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-muted'
              }`}
              style={{ height: `${Math.min(100, (i + 1) * 5)}%`, opacity: isActive ? 1 : 0.3 }}
            />
          );
        })}
      </div>
    </div>
  </div>
);
