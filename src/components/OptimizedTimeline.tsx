import React, { memo, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipContextMenu } from '@/components/ClipContextMenu';
import type { DawTrack, MidiClip, AudioClip, DragState } from '@/types/daw';

type Clip = MidiClip | AudioClip;
import { FixedSizeList as List } from 'react-window';

const TIME_SCALE_DIVISOR = 8;
const TRACK_HEADER_WIDTH_PX = 320;
const MIN_CLIP_WIDTH_PX = 48;

function getMaxTimelineEnd(tracks: DawTrack[]) {
  let maxEnd = 0;
  for (const t of tracks) {
    for (const c of t.clips) {
      maxEnd = Math.max(maxEnd, c.startTime + c.duration);
    }
  }
  return maxEnd;
}

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
  // Keep width in pixels; calc() can go negative and make clips invisible.
  const clipStyle = useMemo(() => {
    const leftPx = (clip.startTime / TIME_SCALE_DIVISOR) * zoom;
    const widthPx = Math.max((clip.duration / TIME_SCALE_DIVISOR) * zoom, MIN_CLIP_WIDTH_PX);
    return {
      left: `${leftPx}px`,
      width: `${widthPx}px`,
    };
  }, [clip.startTime, clip.duration, zoom]);

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
  laneMinWidthPx: number;
  onSelect: (trackId: string) => void;
  onClipUpdate: (trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onClipDuplicate: (clipId: string) => void;
  onClipSplit: (clipId: string, position: number) => void;
  onClipDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
}>(({ track, isSelected, zoom, laneMinWidthPx, onSelect, onClipUpdate, onClipDuplicate, onClipSplit, onClipDelete, onDragStart }) => {
  const handleSelect = useCallback(() => {
    onSelect(track.id);
  }, [onSelect, track.id]);

  const handleClipUpdate = useCallback((clipId: string, updates: { startTime?: number; duration?: number }) => {
    onClipUpdate(track.id, clipId, updates);
  }, [onClipUpdate, track.id]);

  return (
    <div className={`border-b border-border transition-colors duration-200 ${isSelected ? 'bg-accent/20' : 'hover:bg-muted/50'}`}>
      <div className="flex">
        {/* Track header pinned during horizontal scroll */}
        <div className="sticky left-0 z-20 bg-background">
          <Button
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            className="w-80 min-w-80 max-w-80 h-16 justify-start items-start rounded-none border-r px-3 py-2"
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

        {/* Clips area */}
        <div className="flex-1 relative h-16 bg-background/50" style={{ minWidth: laneMinWidthPx }}>
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
  laneMinWidthPx: number;
  onTrackSelect: (trackId: string) => void;
  onClipUpdate: (trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onClipDuplicate: (clipId: string) => void;
  onClipSplit: (clipId: string, position: number) => void;
  onClipDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
}>(({ tracks, selectedTrackId, zoom, laneMinWidthPx, onTrackSelect, onClipUpdate, onClipDuplicate, onClipSplit, onClipDelete, onDragStart }) => {
  const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const track = tracks[index];
    return (
      <div style={style}>
        <TimelineTrack
          track={track}
          isSelected={selectedTrackId === track.id}
          zoom={zoom}
          laneMinWidthPx={laneMinWidthPx}
          onSelect={onTrackSelect}
          onClipUpdate={onClipUpdate}
          onClipDuplicate={onClipDuplicate}
          onClipSplit={onClipSplit}
          onClipDelete={onClipDelete}
          onDragStart={onDragStart}
        />
      </div>
    );
  }, [tracks, selectedTrackId, zoom, laneMinWidthPx, onTrackSelect, onClipUpdate, onClipDuplicate, onClipSplit, onClipDelete, onDragStart]);

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
          laneMinWidthPx={laneMinWidthPx}
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

// Timeline ruler with bar/beat markers
const TimelineRuler = memo<{ zoom: number; laneMinWidthPx: number; bpm?: number }>(({ zoom, laneMinWidthPx, bpm = 120 }) => {
  const markers = useMemo(() => {
    const result: { position: number; label: string; isMajor: boolean }[] = [];
    const totalBeats = Math.ceil((laneMinWidthPx * TIME_SCALE_DIVISOR) / zoom);
    
    for (let beat = 0; beat <= totalBeats; beat += 4) {
      const bar = Math.floor(beat / 4) + 1;
      result.push({
        position: (beat / TIME_SCALE_DIVISOR) * zoom,
        label: `${bar}`,
        isMajor: true
      });
      // Add quarter beat markers
      for (let q = 1; q < 4 && beat + q <= totalBeats; q++) {
        result.push({
          position: ((beat + q) / TIME_SCALE_DIVISOR) * zoom,
          label: '',
          isMajor: false
        });
      }
    }
    return result;
  }, [zoom, laneMinWidthPx]);

  return (
    <div className="flex border-b border-border bg-muted/30 sticky top-0 z-30">
      <div className="w-80 min-w-80 shrink-0 px-3 py-1.5 text-xs font-medium text-muted-foreground border-r bg-background sticky left-0 z-40">
        Timeline
      </div>
      <div className="relative h-6 flex-1" style={{ minWidth: laneMinWidthPx }}>
        {markers.map((marker, i) => (
          <div
            key={i}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: marker.position }}
          >
            <div className={`${marker.isMajor ? 'h-3 w-px bg-muted-foreground/60' : 'h-1.5 w-px bg-muted-foreground/30'}`} />
            {marker.isMajor && (
              <span className="text-[10px] text-muted-foreground/80 mt-0.5">{marker.label}</span>
            )}
          </div>
        ))}
      </div>
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
  const laneMinWidthPx = useMemo(() => {
    const maxEnd = getMaxTimelineEnd(tracks);
    return Math.max(0, (maxEnd / TIME_SCALE_DIVISOR) * zoom + 200);
  }, [tracks, zoom]);

  const playheadPosition = useMemo(() => ({
    left: `${TRACK_HEADER_WIDTH_PX + (currentTime / TIME_SCALE_DIVISOR) * zoom}px`
  }), [currentTime, zoom]);

  return (
    <Card className="relative overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: Math.min(tracks.length * 64 + 150, 800) + 'px' }}>
        <div className="relative min-w-full" style={{ minWidth: `${TRACK_HEADER_WIDTH_PX + laneMinWidthPx}px` }}>
          {/* Timeline ruler with bar markers */}
          <TimelineRuler zoom={zoom} laneMinWidthPx={laneMinWidthPx} />
          
          <VirtualizedTrackList
            tracks={tracks}
            selectedTrackId={selectedTrackId}
            zoom={zoom}
            laneMinWidthPx={laneMinWidthPx}
            onTrackSelect={onTrackSelect}
            onClipUpdate={onClipUpdate}
            onClipDuplicate={onClipDuplicate}
            onClipSplit={onClipSplit}
            onClipDelete={onClipDelete}
            onDragStart={onDragStart}
          />

          {/* Playhead - in the same scrollable coordinate space as the clips */}
          <div
            className={`absolute top-0 w-1 bg-destructive z-20 h-full pointer-events-none shadow-lg ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={playheadPosition}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-destructive" />
          </div>
        </div>
      </div>
    </Card>
  );
});