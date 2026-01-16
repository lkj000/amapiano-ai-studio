import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StudioProject, StemTrack, GeneratedClip } from '../SunoStudioTypes';
import { WaveformVisualizer, MiniWaveform } from './WaveformVisualizer';
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
  GripVertical,
  Plus,
  Music,
  Layers,
  Wand2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface StudioTimelineProps {
  project: StudioProject;
  onSeek: (time: number) => void;
  onZoomChange: (zoom: number) => void;
  onTrackUpdate: (trackId: string, updates: Partial<StemTrack>) => void;
  onClipSelect: (clipId: string) => void;
  selectedClipId: string | null;
  isPlaying: boolean;
  onAddTrack?: () => void;
  onDeleteClip?: (clipId: string) => void;
  onDuplicateClip?: (clipId: string) => void;
  onSplitClip?: (clipId: string, time: number) => void;
}

export function StudioTimeline({
  project,
  onSeek,
  onZoomChange,
  onTrackUpdate,
  onClipSelect,
  selectedClipId,
  isPlaying,
  onAddTrack,
  onDeleteClip,
  onDuplicateClip,
  onSplitClip
}: StudioTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);
  
  const pixelsPerSecond = 50 * project.zoom;
  const totalWidth = Math.max(project.duration * pixelsPerSecond, 1200);
  const trackHeight = 80;
  const clipHeight = 72;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    // Don't seek if clicking on a clip
    if ((e.target as HTMLElement).closest('[data-clip]')) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    const time = x / pixelsPerSecond;
    onSeek(Math.max(0, Math.min(time, project.duration)));
  }, [pixelsPerSecond, project.duration, onSeek, isDragging]);

  const handleTimelineHover = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    setHoveredTime(x / pixelsPerSecond);
  }, [pixelsPerSecond]);

  const handleClipContextMenu = useCallback((e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    setShowContextMenu({ x: e.clientX, y: e.clientY, clipId });
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setShowContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Generate beat markers (every bar based on BPM)
  const generateBeatMarkers = () => {
    const markers = [];
    const secondsPerBeat = 60 / project.bpm;
    const beatsPerBar = parseInt(project.timeSignature.split('/')[0]) || 4;
    const secondsPerBar = secondsPerBeat * beatsPerBar;
    
    // Main bar markers
    for (let bar = 0; bar <= project.duration / secondsPerBar; bar++) {
      const time = bar * secondsPerBar;
      markers.push(
        <div
          key={`bar-${bar}`}
          className="absolute top-0 bottom-0 flex flex-col"
          style={{ left: time * pixelsPerSecond }}
        >
          <div className="h-full w-px bg-muted-foreground/20" />
          <span className="absolute top-1 left-1 text-[9px] text-muted-foreground font-mono">
            {bar + 1}
          </span>
        </div>
      );
      
      // Beat subdivisions (if zoomed in enough)
      if (project.zoom > 0.5) {
        for (let beat = 1; beat < beatsPerBar; beat++) {
          const beatTime = time + (beat * secondsPerBeat);
          if (beatTime > project.duration) break;
          markers.push(
            <div
              key={`beat-${bar}-${beat}`}
              className="absolute top-0 bottom-0 w-px bg-muted-foreground/10"
              style={{ left: beatTime * pixelsPerSecond }}
            />
          );
        }
      }
    }
    
    return markers;
  };

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
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            {formatTime(i)}
          </span>
        </div>
      );
    }
    return markers;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden">
        {/* Timeline Header with Zoom Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Timeline</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-2 py-0.5 rounded">
                {formatTime(project.playheadPosition)}
              </span>
              <span>/</span>
              <span className="font-mono bg-muted px-2 py-0.5 rounded">
                {formatTime(project.duration)}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded text-xs">
              <Music className="h-3 w-3 text-primary" />
              <span>{project.bpm} BPM</span>
              <span className="text-muted-foreground">• {project.timeSignature}</span>
              {project.key && <span className="text-muted-foreground">• {project.key}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {onAddTrack && (
              <Button variant="outline" size="sm" onClick={onAddTrack} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" />
                Add Track
              </Button>
            )}
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2 py-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => onZoomChange(project.zoom / 1.5)}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              <Slider
                value={[project.zoom]}
                min={0.1}
                max={5}
                step={0.1}
                onValueChange={([v]) => onZoomChange(v)}
                className="w-20"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => onZoomChange(project.zoom * 1.5)}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                {Math.round(project.zoom * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Track Headers (Left Panel) */}
          <div className="w-52 flex-shrink-0 border-r bg-muted/10 overflow-y-auto">
            {/* Time ruler space */}
            <div className="h-8 border-b bg-muted/30 flex items-center px-3">
              <span className="text-xs text-muted-foreground">Tracks</span>
            </div>
            
            {/* Stem Track headers */}
            {project.tracks.length > 0 ? (
              project.tracks.map((track) => (
                <div
                  key={track.id}
                  className={cn(
                    "border-b flex items-center gap-2 px-2 group transition-colors",
                    track.muted && "opacity-50"
                  )}
                  style={{ 
                    height: trackHeight,
                    backgroundColor: `${track.color}08`
                  }}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div 
                    className="w-2 h-8 rounded-full" 
                    style={{ backgroundColor: track.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Slider
                        value={[track.volume * 100]}
                        max={100}
                        step={1}
                        className="w-16 h-1"
                        onValueChange={([v]) => onTrackUpdate(track.id, { volume: v / 100 })}
                      />
                      <span className="text-[10px] text-muted-foreground w-7">
                        {Math.round(track.volume * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6", track.muted && "text-destructive bg-destructive/10")}
                          onClick={() => onTrackUpdate(track.id, { muted: !track.muted })}
                        >
                          {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{track.muted ? 'Unmute' : 'Mute'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6", track.solo && "text-primary bg-primary/10")}
                          onClick={() => onTrackUpdate(track.id, { solo: !track.solo })}
                        >
                          <Headphones className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{track.solo ? 'Unsolo' : 'Solo'}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))
            ) : null}

            {/* Clips section */}
            {project.clips.length > 0 && (
              <>
                <div className="h-6 border-b bg-primary/5 flex items-center px-3">
                  <Wand2 className="h-3 w-3 text-primary mr-1.5" />
                  <span className="text-xs font-medium text-primary">Generated</span>
                </div>
                {project.clips.map((clip) => (
                  <div
                    key={clip.id}
                    className={cn(
                      "border-b flex items-center gap-2 px-2 cursor-pointer transition-all group",
                      selectedClipId === clip.id 
                        ? "bg-primary/15 border-l-2 border-l-primary" 
                        : "hover:bg-muted/50"
                    )}
                    style={{ height: clipHeight }}
                    onClick={() => onClipSelect(clip.id)}
                  >
                    {clip.imageUrl ? (
                      <img 
                        src={clip.imageUrl} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Music className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{clip.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatTime(clip.duration)} • {clip.metadata.bpm} BPM
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {clip.metadata.genre}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Empty state */}
            {project.tracks.length === 0 && project.clips.length === 0 && (
              <div className="h-32 flex flex-col items-center justify-center text-center px-4">
                <Music className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Generate a song or upload loops to get started
                </p>
              </div>
            )}
          </div>

          {/* Timeline Area (Right Panel) */}
          <div 
            ref={timelineRef}
            className="flex-1 overflow-auto relative bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:20px_20px]"
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineHover}
            onMouseLeave={() => setHoveredTime(null)}
          >
            {/* Time Ruler */}
            <div 
              className="h-8 border-b bg-muted/40 sticky top-0 z-20 relative"
              style={{ width: totalWidth }}
            >
              {generateTimeMarkers()}
            </div>

            {/* Track Lanes */}
            <div style={{ width: totalWidth, minHeight: '100%' }} className="relative">
              {/* Beat grid overlay */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {generateBeatMarkers()}
              </div>

              {/* Stem tracks with waveforms */}
              {project.tracks.map((track) => (
                <div
                  key={track.id}
                  className={cn(
                    "border-b relative",
                    track.muted && "opacity-40"
                  )}
                  style={{ 
                    height: trackHeight,
                    backgroundColor: `${track.color}05`
                  }}
                >
                  {/* Waveform visualization */}
                  {track.audioUrl && (
                    <div className="absolute inset-2 rounded overflow-hidden">
                      <WaveformVisualizer
                        audioUrl={track.audioUrl}
                        width={totalWidth - 16}
                        height={trackHeight - 16}
                        color={track.color}
                        playheadPosition={project.playheadPosition / project.duration}
                        duration={project.duration}
                        isPlaying={isPlaying}
                      />
                    </div>
                  )}
                  
                  {/* Placeholder waveform if no audio */}
                  {!track.audioUrl && (
                    <div 
                      className="absolute inset-y-4 inset-x-2 rounded-lg opacity-30"
                      style={{ 
                        background: `repeating-linear-gradient(
                          90deg,
                          ${track.color}20 0px,
                          ${track.color}40 2px,
                          ${track.color}20 4px
                        )`
                      }}
                    />
                  )}
                </div>
              ))}

              {/* Generated clips visualization */}
              {project.clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className="border-b relative"
                  style={{ height: clipHeight }}
                  data-clip
                >
                  <div
                    className={cn(
                      "absolute inset-y-1 rounded-xl border-2 transition-all cursor-pointer overflow-hidden group",
                      selectedClipId === clip.id 
                        ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30" 
                        : "border-primary/40 hover:border-primary/70"
                    )}
                    style={{
                      left: 4,
                      width: Math.max(clip.duration * pixelsPerSecond - 8, 80),
                      background: `linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))`
                    }}
                    onClick={() => onClipSelect(clip.id)}
                    onContextMenu={(e) => handleClipContextMenu(e, clip.id)}
                  >
                    {/* Clip waveform preview */}
                    <div className="absolute inset-0 opacity-60">
                      {clip.audioUrl && (
                        <MiniWaveform 
                          audioUrl={clip.audioUrl}
                          width={Math.max(clip.duration * pixelsPerSecond - 8, 80)}
                          height={clipHeight - 8}
                        />
                      )}
                    </div>

                    {/* Clip info overlay */}
                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center gap-2">
                        {clip.imageUrl && (
                          <img 
                            src={clip.imageUrl} 
                            alt="" 
                            className="w-6 h-6 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <span className="text-xs font-medium text-white truncate">{clip.title}</span>
                      </div>
                    </div>

                    {/* Resize handles */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/0 hover:bg-primary/30 transition-colors" />
                    <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/0 hover:bg-primary/30 transition-colors" />

                    {/* Clip actions (on hover) */}
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDuplicateClip && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); onDuplicateClip(clip.id); }}
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      )}
                      {onDeleteClip && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); onDeleteClip(clip.id); }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty clip area if no clips */}
              {project.clips.length === 0 && project.tracks.length === 0 && (
                <div 
                  className="h-32 flex items-center justify-center border-b"
                  style={{ width: totalWidth }}
                >
                  <p className="text-sm text-muted-foreground">
                    Your generated clips and tracks will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{ left: project.playheadPosition * pixelsPerSecond }}
            >
              <div className="w-0.5 h-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              <div className="absolute -top-0 -left-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary" />
            </div>

            {/* Hover indicator */}
            {hoveredTime !== null && (
              <div
                className="absolute top-8 bottom-0 w-px bg-muted-foreground/30 pointer-events-none z-10"
                style={{ left: hoveredTime * pixelsPerSecond }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-popover text-popover-foreground text-xs rounded shadow-lg font-mono">
                  {formatTime(hoveredTime)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Context Menu */}
        {showContextMenu && (
          <div
            className="fixed bg-popover border rounded-lg shadow-lg py-1 z-50"
            style={{ left: showContextMenu.x, top: showContextMenu.y }}
          >
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2"
              onClick={() => { onDuplicateClip?.(showContextMenu.clipId); setShowContextMenu(null); }}
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2"
              onClick={() => { onSplitClip?.(showContextMenu.clipId, project.playheadPosition); setShowContextMenu(null); }}
            >
              <Scissors className="h-3.5 w-3.5" /> Split at Playhead
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
              onClick={() => { onDeleteClip?.(showContextMenu.clipId); setShowContextMenu(null); }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
