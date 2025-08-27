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
  const clipStyle = useMemo(() => ({
    left: `${(clip.startTime / 8) * zoom}px`,
    width: `${(clip.duration / 8) * zoom}px`,
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
        <Button
          variant={isSelected ? "default" : "ghost"}
          size="sm"
          className="w-32 h-16 justify-start rounded-none border-r"
          onClick={handleSelect}
        >
          <div className={`w-3 h-3 rounded-full mr-2 ${track.color}`} />
          <div className="text-left">
            <div className="text-sm font-medium">{track.name}</div>
            <div className="text-xs text-muted-foreground">
              {track.type === 'midi' ? (track as any).instrument : 'Audio'}
            </div>
          </div>
        </Button>
        <div className="flex-1 relative h-16 bg-background">
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

  // Only use virtualization for large track counts
  if (tracks.length > 20) {
    return (
      <List
        height={400}
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
  dragState,
  onTrackSelect,
  onClipUpdate,
  onClipDuplicate,
  onClipSplit,
  onClipDelete,
  onDragStart,
  selectedTrackId
}) => {
  const playheadPosition = useMemo(() => ({
    left: `${(currentTime / 8) * zoom}px`
  }), [currentTime, zoom]);

  return (
    <Card className="relative overflow-hidden">
      <div className="overflow-auto max-h-96">
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
      
      {/* Playhead */}
      <div
        className="absolute top-0 w-0.5 bg-red-500 z-10 h-full pointer-events-none transition-all duration-100"
        style={playheadPosition}
      />
    </Card>
  );
});