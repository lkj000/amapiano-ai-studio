import React, { memo, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipContextMenu } from '@/components/ClipContextMenu';
import type { DawTrack, MidiClip, AudioClip, DragState } from '@/types/daw';

type Clip = MidiClip | AudioClip;
import { FixedSizeList as List } from 'react-window';

interface OptimizedTimelineProps {
  tracks: DawTrack[];
  zoom: number;
  currentTime: number;
  isPlaying?: boolean;
  dragState: DragState;
  onTrackSelect: (trackId: string) => void;
  onClipUpdate: (trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onClipDuplicate: (clipId: string) => void;
  onClipSplit: (clipId: string, position: number) => void;
  onClipDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
  selectedTrackId: string | null;
}

const TimelineClip = memo<{
  clip: Clip;
  trackId: string;
  zoom: number;
  onUpdate: (clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onDuplicate: (clipId: string) => void;
  onSplit: (clipId: string, position: number) => void;
  onDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
}>(({ clip, trackId, zoom, onUpdate, onDuplicate, onSplit, onDelete, onDragStart }) => {
  // Increased base multiplier for wider clips - multiply zoom by 3x for better visibility
  const clipStyle = useMemo(() => ({
    left: `${(clip.startTime / 8) * zoom * 3}px`,
    width: `${Math.max((clip.duration / 8) * zoom * 3, 120)}px`, // Minimum 120px width
  }), [clip.startTime, clip.duration, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(e, trackId, clip.id);
  }, [onDragStart, trackId, clip.id]);

  const handleUpdate = useCallback((updates: { startTime?: number; duration?: number }) => {
    onUpdate(clip.id, updates);
  }, [onUpdate, clip.id]);

  return (
    <ClipContextMenu 
      clip={clip}
      onDuplicate={onDuplicate}
      onSplit={onSplit}
      onDelete={onDelete}
    >
      <div
        className={`absolute h-8 rounded-md cursor-move select-none transition-all duration-150 ${
          'notes' in clip ? 'bg-primary/80 border-primary' : 'bg-accent/80 border-accent'
        } border-2 flex items-center px-2 hover:brightness-110 active:scale-95`}
        style={clipStyle}
        onMouseDown={handleMouseDown}
      >
        <span className="text-xs font-medium text-primary-foreground truncate">
          {clip.name}
        </span>
      </div>
    </ClipContextMenu>
  );
});

const TimelineTrack = memo<{
  track: DawTrack;
  isSelected: boolean;
  zoom: number;
  onSelect: (trackId: string) => void;
  onClipUpdate: (trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onClipDuplicate: (clipId: string) => void;
  onClipSplit: (clipId: string, position: number) => void;
  onClipDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
}>(({ track, isSelected, zoom, onSelect, onClipUpdate, onClipDuplicate, onClipSplit, onClipDelete, onDragStart }) => {
  const handleSelect = useCallback(() => {
    onSelect(track.id);
  }, [onSelect, track.id]);

  const handleClipUpdate = useCallback((clipId: string, updates: { startTime?: number; duration?: number }) => {
    onClipUpdate(track.id, clipId, updates);
  }, [onClipUpdate, track.id]);

  return (
    <div className={`border-b border-border transition-colors duration-200 ${isSelected ? 'bg-accent/20' : 'hover:bg-muted/50'}`}>
      <div className="flex">
        {/* Track Header - wider to show full info */}
        <Button
          variant={isSelected ? "default" : "ghost"}
          size="sm"
          className="min-w-[200px] w-[200px] h-16 justify-start rounded-none border-r px-3 shrink-0"
          onClick={handleSelect}
        >
          <div className={`w-4 h-4 rounded-full mr-3 shrink-0 ${track.color}`} />
          <div className="text-left overflow-hidden">
            <div className="text-sm font-medium truncate">{track.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {track.type === 'midi' ? (track as any).instrument || 'MIDI' : 'Audio Track'}
            </div>
            <div className="text-[10px] text-muted-foreground/70">
              {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Button>
        {/* Clips area */}
        <div className="flex-1 relative h-16 bg-background/50 min-w-[600px]">
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
    </div>
  );
});

const VirtualizedTrackList = memo<{
  tracks: DawTrack[];
  selectedTrackId: string | null;
  zoom: number;
  onTrackSelect: (trackId: string) => void;
  onClipUpdate: (trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onClipDuplicate: (clipId: string) => void;
  onClipSplit: (clipId: string, position: number) => void;
  onClipDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
}>(({ tracks, selectedTrackId, zoom, onTrackSelect, onClipUpdate, onClipDuplicate, onClipSplit, onClipDelete, onDragStart }) => {
  const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const track = tracks[index];
    return (
      <div style={style}>
        <TimelineTrack
          track={track}
          isSelected={selectedTrackId === track.id}
          zoom={zoom}
          onSelect={onTrackSelect}
          onClipUpdate={onClipUpdate}
          onClipDuplicate={onClipDuplicate}
          onClipSplit={onClipSplit}
          onClipDelete={onClipDelete}
          onDragStart={onDragStart}
        />
      </div>
    );
  }, [tracks, selectedTrackId, zoom, onTrackSelect, onClipUpdate, onClipDuplicate, onClipSplit, onClipDelete, onDragStart]);

  // Use virtualization for performance with unlimited tracks
  if (tracks.length > 10) {
    return (
      <List
        height={Math.min(tracks.length * 64, 600)}
        itemCount={tracks.length}
        itemSize={64}
        width="100%"
      >
        {ItemRenderer}
      </List>
    );
  }

  return (
    <div>
      {tracks.map((track) => (
        <TimelineTrack
          key={track.id}
          track={track}
          isSelected={selectedTrackId === track.id}
          zoom={zoom}
          onSelect={onTrackSelect}
          onClipUpdate={onClipUpdate}
          onClipDuplicate={onClipDuplicate}
          onClipSplit={onClipSplit}
          onClipDelete={onClipDelete}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  );
});

export const OptimizedTimeline: React.FC<OptimizedTimelineProps> = memo(({
  tracks,
  zoom,
  currentTime,
  isPlaying = false,
  dragState,
  onTrackSelect,
  onClipUpdate,
  onClipDuplicate,
  onClipSplit,
  onClipDelete,
  onDragStart,
  selectedTrackId
}) => {
  // Calculate playhead position - offset by track header width (200px), match the 3x zoom multiplier
  const playheadPosition = useMemo(() => ({
    left: `${200 + (currentTime / 8) * zoom * 3}px`
  }), [currentTime, zoom]);

  return (
    <Card className="relative overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: Math.min(tracks.length * 64 + 100, 800) + 'px' }}>
        <VirtualizedTrackList
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          zoom={zoom}
          onTrackSelect={onTrackSelect}
          onClipUpdate={onClipUpdate}
          onClipDuplicate={onClipDuplicate}
          onClipSplit={onClipSplit}
          onClipDelete={onClipDelete}
          onDragStart={onDragStart}
        />
      </div>
      
      {/* Playhead - always visible, animated during playback */}
      <div
        className={`absolute top-0 w-1 bg-destructive z-20 h-full pointer-events-none shadow-lg ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={playheadPosition}
      >
        {/* Playhead triangle indicator */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-destructive" />
      </div>
    </Card>
  );
});