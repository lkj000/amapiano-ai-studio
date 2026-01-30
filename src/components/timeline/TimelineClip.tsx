import React, { memo, useMemo, useCallback } from 'react';
import { ClipContextMenu } from '@/components/ClipContextMenu';
import type { MidiClip, AudioClip } from '@/types/daw';

type Clip = MidiClip | AudioClip;

const TIME_SCALE_DIVISOR = 8;
const MIN_CLIP_WIDTH_PX = 48;

interface TimelineClipProps {
  clip: Clip;
  trackId: string;
  zoom: number;
  onUpdate: (clipId: string, updates: { startTime?: number; duration?: number }) => void;
  onDuplicate: (clipId: string) => void;
  onSplit: (clipId: string, position: number) => void;
  onDelete: (clipId: string) => void;
  onDragStart: (e: React.MouseEvent, trackId: string, clipId: string) => void;
}

export const TimelineClip = memo<TimelineClipProps>(({ 
  clip, 
  trackId, 
  zoom, 
  onUpdate, 
  onDuplicate, 
  onSplit, 
  onDelete, 
  onDragStart 
}) => {
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

  const isMidiClip = 'notes' in clip;

  return (
    <ClipContextMenu 
      clip={clip}
      onDuplicate={onDuplicate}
      onSplit={onSplit}
      onDelete={onDelete}
    >
      <div
        className={`absolute top-2 h-8 rounded-md cursor-move select-none transition-all duration-150 ${
          isMidiClip ? 'bg-primary/80 border-primary' : 'bg-accent/80 border-accent'
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

TimelineClip.displayName = 'TimelineClip';
