import React, { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TimelineRuler, TimelineTrack } from '@/components/timeline';
import type { DawTrack, DragState } from '@/types/daw';

const TIME_SCALE_DIVISOR = 8;
const TRACK_HEADER_WIDTH_PX = 320;
const TRACK_HEIGHT_PX = 64;

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
  // Calculate minimum lane width based on content
  const laneMinWidthPx = useMemo(() => {
    const maxEnd = getMaxTimelineEnd(tracks);
    return Math.max(400, (maxEnd / TIME_SCALE_DIVISOR) * zoom + 200);
  }, [tracks, zoom]);

  // Playhead position in the scrollable coordinate space
  const playheadStyle = useMemo(() => ({
    left: `${TRACK_HEADER_WIDTH_PX + (currentTime / TIME_SCALE_DIVISOR) * zoom}px`
  }), [currentTime, zoom]);

  // Container max height with ruler allowance
  const containerMaxHeight = Math.min(tracks.length * TRACK_HEIGHT_PX + 150, 800);

  return (
    <Card className="relative overflow-hidden">
      <div 
        className="overflow-x-auto overflow-y-auto" 
        style={{ maxHeight: `${containerMaxHeight}px` }}
      >
        <div 
          className="relative min-w-full" 
          style={{ minWidth: `${TRACK_HEADER_WIDTH_PX + laneMinWidthPx}px` }}
        >
          {/* Timeline ruler with bar/beat markers */}
          <TimelineRuler zoom={zoom} laneMinWidthPx={laneMinWidthPx} />
          
          {/* Track list - native scroll (no virtualization for proper sticky support) */}
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

          {/* Playhead - positioned in scrollable coordinate space */}
          <div
            className={`absolute top-0 w-1 bg-destructive z-20 pointer-events-none shadow-lg ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{ ...playheadStyle, height: '100%' }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-destructive" />
          </div>
        </div>
      </div>
    </Card>
  );
});

OptimizedTimeline.displayName = 'OptimizedTimeline';
