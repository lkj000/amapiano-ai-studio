import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TimelineClip } from './TimelineClip';
import type { DawTrack, MidiClip, AudioClip } from '@/types/daw';

const TRACK_HEADER_WIDTH_PX = 320;

interface TimelineTrackProps {
  track: DawTrack;
  isSelected: boolean;
  zoom: number;
  laneMinWidthPx: number;
  onSelect: (trackId: string) => void;
  onClipUpdate: (trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onClipDuplicate: (clipId: string) => void;
  onClipSplit: (clipId: string, position: number) => void;
  onClipDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
}

export const TimelineTrack = memo<TimelineTrackProps>(({ 
  track, 
  isSelected, 
  zoom, 
  laneMinWidthPx, 
  onSelect, 
  onClipUpdate, 
  onClipDuplicate, 
  onClipSplit, 
  onClipDelete, 
  onDragStart 
}) => {
  const handleSelect = useCallback(() => {
    onSelect(track.id);
  }, [onSelect, track.id]);

  const handleClipUpdate = useCallback((clipId: string, updates: { startTime?: number; duration?: number }) => {
    onClipUpdate(track.id, clipId, updates);
  }, [onClipUpdate, track.id]);

  return (
    <div 
      className={`flex border-b border-border transition-colors duration-200 ${
        isSelected ? 'bg-accent/20' : 'hover:bg-muted/50'
      }`}
    >
      {/* Pinned track header - stays fixed during horizontal scroll */}
      <div 
        className="sticky left-0 z-20 bg-background shrink-0"
        style={{ width: TRACK_HEADER_WIDTH_PX, minWidth: TRACK_HEADER_WIDTH_PX }}
      >
        <Button
          variant={isSelected ? "default" : "ghost"}
          size="sm"
          className="w-full h-16 justify-start items-start rounded-none border-r px-3 py-2"
          onClick={handleSelect}
        >
          <div className={`w-4 h-4 rounded-full mr-3 mt-0.5 shrink-0 ${track.color}`} />
          <div className="text-left overflow-hidden">
            <div className="text-sm font-medium whitespace-normal leading-tight">
              {track.name}
            </div>
            <div className="text-xs text-muted-foreground whitespace-normal leading-tight mt-0.5">
              {track.type === 'midi' ? (track as any).instrument || 'MIDI' : 'Audio Track'}
            </div>
            <div className="text-[10px] text-muted-foreground/70 mt-0.5">
              {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Button>
      </div>

      {/* Scrollable clips area */}
      <div 
        className="flex-1 relative h-16 bg-background/50" 
        style={{ minWidth: laneMinWidthPx }}
      >
        {track.clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            trackId={track.id}
            zoom={zoom}
            onUpdate={handleClipUpdate}
            onDuplicate={onClipDuplicate}
            onSplit={onClipSplit}
            onDelete={onClipDelete}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
});

TimelineTrack.displayName = 'TimelineTrack';
