import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StudioProject, StemTrack, GeneratedClip } from '../SunoStudioTypes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Volume2, 
  VolumeX, 
  Headphones,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Scissors,
  Copy,
  Trash2,
  GripVertical
} from 'lucide-react';

interface StudioTimelineProps {
  project: StudioProject;
  onSeek: (time: number) => void;
  onZoomChange: (zoom: number) => void;
  onTrackUpdate: (trackId: string, updates: Partial<StemTrack>) => void;
  onClipSelect: (clipId: string) => void;
  selectedClipId: string | null;
  isPlaying: boolean;
}

export function StudioTimeline({
  project,
  onSeek,
  onZoomChange,
  onTrackUpdate,
  onClipSelect,
  selectedClipId,
  isPlaying
}: StudioTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  
  const pixelsPerSecond = 50 * project.zoom;
  const totalWidth = Math.max(project.duration * pixelsPerSecond, 1000);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    const time = x / pixelsPerSecond;
    onSeek(Math.max(0, Math.min(time, project.duration)));
  }, [pixelsPerSecond, project.duration, onSeek]);

  const handleTimelineHover = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    setHoveredTime(x / pixelsPerSecond);
  }, [pixelsPerSecond]);

  // Generate time markers
  const generateTimeMarkers = () => {
    const markers = [];
    const interval = project.zoom < 0.5 ? 10 : project.zoom < 1 ? 5 : 1;
    
    for (let i = 0; i <= project.duration; i += interval) {
      markers.push(
        <div
          key={i}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: i * pixelsPerSecond }}
        >
          <div className="h-3 w-px bg-muted-foreground/30" />
          <span className="text-[10px] text-muted-foreground mt-1">
            {formatTime(i)}
          </span>
        </div>
      );
    }
    return markers;
  };

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden">
      {/* Timeline Header with Zoom Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Timeline</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(project.playheadPosition)} / {formatTime(project.duration)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => onZoomChange(project.zoom / 1.5)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            value={[project.zoom]}
            min={0.1}
            max={5}
            step={0.1}
            onValueChange={([v]) => onZoomChange(v)}
            className="w-24"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => onZoomChange(project.zoom * 1.5)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12">
            {Math.round(project.zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track Headers (Left Panel) */}
        <div className="w-48 flex-shrink-0 border-r bg-muted/20 overflow-y-auto">
          {/* Time ruler space */}
          <div className="h-8 border-b bg-muted/30" />
          
          {/* Track headers */}
          {project.tracks.length > 0 ? (
            project.tracks.map((track) => (
              <div
                key={track.id}
                className="h-20 border-b flex items-center gap-2 px-2"
                style={{ backgroundColor: `${track.color}10` }}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: track.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6", track.muted && "text-destructive")}
                    onClick={() => onTrackUpdate(track.id, { muted: !track.muted })}
                  >
                    {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6", track.solo && "text-primary")}
                    onClick={() => onTrackUpdate(track.id, { solo: !track.solo })}
                  >
                    <Headphones className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-20 border-b flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No stems yet</p>
            </div>
          )}

          {/* Clips section header */}
          {project.clips.length > 0 && (
            <div className="h-8 border-b bg-primary/10 flex items-center px-2">
              <span className="text-xs font-medium text-primary">Generated Clips</span>
            </div>
          )}
          
          {project.clips.map((clip) => (
            <div
              key={clip.id}
              className={cn(
                "h-16 border-b flex items-center gap-2 px-2 cursor-pointer transition-colors",
                selectedClipId === clip.id && "bg-primary/20"
              )}
              onClick={() => onClipSelect(clip.id)}
            >
              {clip.imageUrl && (
                <img 
                  src={clip.imageUrl} 
                  alt="" 
                  className="w-10 h-10 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{clip.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(clip.duration)} • {clip.metadata.bpm} BPM
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Area (Right Panel) */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-auto relative"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineHover}
          onMouseLeave={() => setHoveredTime(null)}
        >
          {/* Time Ruler */}
          <div 
            className="h-8 border-b bg-muted/30 sticky top-0 z-10 relative"
            style={{ width: totalWidth }}
          >
            {generateTimeMarkers()}
          </div>

          {/* Track Lanes */}
          <div style={{ width: totalWidth, minHeight: '100%' }}>
            {project.tracks.length > 0 ? (
              project.tracks.map((track) => (
                <div
                  key={track.id}
                  className="h-20 border-b relative"
                  style={{ backgroundColor: `${track.color}05` }}
                >
                  {/* Waveform placeholder */}
                  <div 
                    className="absolute inset-y-2 rounded opacity-50"
                    style={{ 
                      left: 0,
                      right: 0,
                      background: `linear-gradient(90deg, ${track.color}40 0%, ${track.color}20 50%, ${track.color}40 100%)`
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="h-20 border-b flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Generate a song and separate stems to see tracks here
                </p>
              </div>
            )}

            {/* Clips visualization */}
            {project.clips.map((clip) => (
              <div
                key={clip.id}
                className="h-16 border-b relative"
              >
                <div
                  className={cn(
                    "absolute inset-y-1 rounded-lg border-2 transition-all cursor-pointer",
                    selectedClipId === clip.id 
                      ? "border-primary bg-primary/20" 
                      : "border-primary/30 bg-primary/10 hover:bg-primary/15"
                  )}
                  style={{
                    left: 0,
                    width: clip.duration * pixelsPerSecond
                  }}
                  onClick={() => onClipSelect(clip.id)}
                >
                  <div className="absolute inset-x-2 inset-y-1 flex items-center gap-2 overflow-hidden">
                    {clip.imageUrl && (
                      <img 
                        src={clip.imageUrl} 
                        alt="" 
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <span className="text-xs font-medium truncate">{clip.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
            style={{ 
              left: project.playheadPosition * pixelsPerSecond,
              boxShadow: '0 0 8px hsl(var(--primary))'
            }}
          >
            <div className="absolute -top-0 -left-2 w-4 h-4 bg-primary rotate-45" />
          </div>

          {/* Hover indicator */}
          {hoveredTime !== null && (
            <div
              className="absolute top-8 bottom-0 w-px bg-muted-foreground/30 pointer-events-none z-10"
              style={{ left: hoveredTime * pixelsPerSecond }}
            >
              <div className="absolute -top-6 -left-8 px-2 py-0.5 bg-popover text-popover-foreground text-xs rounded shadow-lg">
                {formatTime(hoveredTime)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
