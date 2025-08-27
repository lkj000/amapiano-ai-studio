import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MidiNote } from '@/types/daw';

interface VelocityEditorProps {
  notes: MidiNote[];
  selectedNotes: string[];
  onUpdateVelocity: (noteId: string, velocity: number) => void;
}

export default function VelocityEditor({ notes, selectedNotes, onUpdateVelocity }: VelocityEditorProps) {
  const selectedNotesData = notes.filter(note => selectedNotes.includes(note.id));
  
  if (selectedNotesData.length === 0) {
    return null;
  }

  const averageVelocity = selectedNotesData.reduce((sum, note) => sum + note.velocity, 0) / selectedNotesData.length;

  const handleVelocityChange = (newVelocity: number) => {
    selectedNotesData.forEach(note => {
      onUpdateVelocity(note.id, newVelocity);
    });
  };

  return (
    <Card className="w-64">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Velocity Editor ({selectedNotesData.length} note{selectedNotesData.length !== 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-16">Velocity:</span>
            <Slider
              value={[Math.round(averageVelocity)]}
              onValueChange={([value]) => handleVelocityChange(value)}
              min={1}
              max={127}
              step={1}
              className="flex-1"
            />
            <span className="text-xs w-8 text-right">{Math.round(averageVelocity)}</span>
          </div>
        </div>
        
        {/* Individual note velocities for fine control */}
        {selectedNotesData.length > 1 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            <div className="text-xs font-medium text-muted-foreground">Individual Notes:</div>
            {selectedNotesData.map((note, index) => (
              <div key={note.id} className="flex items-center gap-2">
                <span className="text-xs w-12">Note {index + 1}:</span>
                <Slider
                  value={[note.velocity]}
                  onValueChange={([value]) => onUpdateVelocity(note.id, value)}
                  min={1}
                  max={127}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{note.velocity}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}