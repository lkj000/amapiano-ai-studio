import React from 'react';
import { Track } from '@/types/daw';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TimelineProps {
  tracks: Track[];
}

export function Timeline({ tracks }: TimelineProps) {
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Timeline Header */}
      <div className="h-12 bg-card border-b border-border flex items-center px-4">
        <div className="text-sm font-medium">Timeline</div>
        <Button variant="outline" size="sm" className="ml-auto">
          <Plus className="h-4 w-4 mr-1" />
          Add Track
        </Button>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">No tracks yet</p>
              <p className="text-sm">Add a track to get started</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {tracks.map((track) => (
              <div key={track.id} className="h-16 bg-card border border-border rounded mb-2 flex items-center px-4">
                <div className={`w-4 h-4 rounded mr-3 ${track.color}`} />
                <div className="flex-1">
                  <div className="font-medium">{track.name}</div>
                  <div className="text-xs text-muted-foreground">{track.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}