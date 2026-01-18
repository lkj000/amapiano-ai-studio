/**
 * Playlist Component
 * Arrangement view with real-time playhead needle
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, GripVertical, Lock, Unlock } from 'lucide-react';
import type { DAWProject, DAWPattern, PlaylistClip } from '@/pages/AmapianoPro';

interface PlaylistProps {
  project: DAWProject;
  clips: PlaylistClip[];
  patterns: DAWPattern[];
  currentBar: number;
  currentStep: number;
  isPlaying: boolean;
  loopStart: number;
  loopEnd: number;
  zoom: number;
  bpm: number;
  onAddClip: (patternId: string, trackIndex: number, startBar: number) => void;
  onUpdateClip: (clipId: string, updates: Partial<PlaylistClip>) => void;
  onDeleteClip: (clipId: string) => void;
  onLoopChange: (start: number, end: number) => void;
  onSeek: (bar: number, step: number) => void;
}

const TRACK_HEIGHT = 48;
const BAR_WIDTH_BASE = 80;
const TOTAL_TRACKS = 16;
const TOTAL_BARS = 64;
const STEPS_PER_BAR = 16;

export const Playlist: React.FC<PlaylistProps> = ({
  project,
  clips,
  patterns,
  currentBar,
  currentStep,
  isPlaying,
  loopStart,
  loopEnd,
  zoom,
  bpm,
  onAddClip,
  onUpdateClip,
  onDeleteClip,
  onLoopChange,
  onSeek,
}) => {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [draggingPattern, setDraggingPattern] = useState<string | null>(null);
  const [lockedTracks, setLockedTracks] = useState<Set<number>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const barWidth = BAR_WIDTH_BASE * zoom;

  // Calculate precise playhead position based on bar and step
  const getPlayheadPosition = useCallback(() => {
    const stepFraction = currentStep / STEPS_PER_BAR;
    return (currentBar + stepFraction) * barWidth;
  }, [currentBar, currentStep, barWidth]);

  // Auto-scroll to follow playhead during playback
  useEffect(() => {
    if (isPlaying && scrollRef.current && playheadRef.current) {
      const scrollContainer = scrollRef.current;
      const playheadPos = getPlayheadPosition();
      const containerWidth = scrollContainer.clientWidth;
      const currentScroll = scrollContainer.scrollLeft;
      
      // Keep playhead visible with some margin
      const margin = containerWidth * 0.2;
      if (playheadPos < currentScroll + margin) {
        scrollContainer.scrollLeft = Math.max(0, playheadPos - margin);
      } else if (playheadPos > currentScroll + containerWidth - margin) {
        scrollContainer.scrollLeft = playheadPos - containerWidth + margin;
      }
    }
  }, [isPlaying, currentBar, currentStep, getPlayheadPosition]);

  const handleDragStart = useCallback((e: React.DragEvent, patternId: string) => {
    e.dataTransfer.setData('patternId', patternId);
    setDraggingPattern(patternId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const patternId = e.dataTransfer.getData('patternId');
    if (!patternId || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const startBar = Math.floor(x / barWidth);
    const trackIndex = Math.floor(y / TRACK_HEIGHT);

    if (trackIndex >= 0 && trackIndex < TOTAL_TRACKS && !lockedTracks.has(trackIndex)) {
      onAddClip(patternId, trackIndex, startBar);
    }

    setDraggingPattern(null);
  }, [barWidth, lockedTracks, onAddClip]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const toggleTrackLock = useCallback((trackIndex: number) => {
    setLockedTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackIndex)) {
        next.delete(trackIndex);
      } else {
        next.add(trackIndex);
      }
      return next;
    });
  }, []);

  // Handle timeline click for seeking
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedBar = Math.floor(x / barWidth);
    const stepWithinBar = Math.floor((x % barWidth) / (barWidth / STEPS_PER_BAR));
    onSeek(clickedBar, stepWithinBar);
  }, [barWidth, onSeek]);

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Pattern Picker */}
      <div className="h-10 md:h-12 flex items-center gap-1 md:gap-2 px-1 md:px-2 border-b border-border bg-muted/30 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] md:text-xs text-muted-foreground mr-1 md:mr-2 hidden sm:inline">Patterns:</span>
        {patterns.map((pattern) => (
          <div
            key={pattern.id}
            draggable
            onDragStart={(e) => handleDragStart(e, pattern.id)}
            className={cn(
              "flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded cursor-grab active:cursor-grabbing flex-shrink-0",
              "border border-border hover:border-primary/50 transition-colors touch-manipulation"
            )}
            style={{ backgroundColor: `${pattern.color}30` }}
          >
            <div 
              className="w-2 h-2 md:w-3 md:h-3 rounded-sm" 
              style={{ backgroundColor: pattern.color }} 
            />
            <span className="text-[10px] md:text-xs font-medium whitespace-nowrap">{pattern.name}</span>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-6 md:h-7 text-[10px] md:text-xs flex-shrink-0">
          <Plus className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" /> 
          <span className="hidden xs:inline">New</span>
        </Button>
      </div>

      {/* Arrangement Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-20 md:w-32 flex-shrink-0 border-r border-border">
          <ScrollArea className="h-full">
            {/* Timeline Header */}
            <div 
              className="h-5 md:h-6 border-b border-border bg-muted/50 flex items-center px-1 md:px-2"
            >
              <span className="text-[8px] md:text-[10px] text-muted-foreground">Tracks</span>
            </div>
            
            {Array.from({ length: TOTAL_TRACKS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-0.5 md:gap-1 px-1 md:px-2 border-b border-border",
                  lockedTracks.has(i) && "opacity-50"
                )}
                style={{ height: TRACK_HEIGHT }}
              >
                <GripVertical className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground cursor-grab hidden sm:block" />
                <span className="text-[10px] md:text-xs flex-1 truncate">
                  <span className="hidden sm:inline">Track </span>{i + 1}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 md:h-5 md:w-5"
                  onClick={() => toggleTrackLock(i)}
                >
                  {lockedTracks.has(i) ? (
                    <Lock className="h-2 w-2 md:h-3 md:w-3" />
                  ) : (
                    <Unlock className="h-2 w-2 md:h-3 md:w-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div>
            {/* Bar Numbers / Loop Region - Clickable for seeking */}
            <div 
              className="h-5 md:h-6 border-b border-border bg-muted/50 sticky top-0 z-10 flex cursor-pointer"
              onClick={handleTimelineClick}
            >
              {Array.from({ length: TOTAL_BARS }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-center text-[8px] md:text-[10px] border-r border-border relative",
                    i >= loopStart && i < loopEnd && "bg-accent/20",
                    i % 4 === 0 && "font-medium"
                  )}
                  style={{ width: barWidth, minWidth: barWidth }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Track Rows */}
            <div
              ref={gridRef}
              className="relative"
              style={{ 
                width: TOTAL_BARS * barWidth,
                height: TOTAL_TRACKS * TRACK_HEIGHT
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={handleTimelineClick}
            >
              {/* Track Lines */}
              {Array.from({ length: TOTAL_TRACKS }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute left-0 right-0 border-b border-border",
                    i % 2 === 0 ? "bg-muted/10" : "bg-transparent",
                    lockedTracks.has(i) && "bg-muted/30"
                  )}
                  style={{ 
                    top: i * TRACK_HEIGHT, 
                    height: TRACK_HEIGHT 
                  }}
                />
              ))}

              {/* Bar Lines */}
              {Array.from({ length: TOTAL_BARS + 1 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bottom-0 border-l",
                    i % 4 === 0 ? "border-zinc-600" : "border-zinc-700/30"
                  )}
                  style={{ left: i * barWidth }}
                />
              ))}

              {/* Loop Region Highlight */}
              <div
                className="absolute top-0 bottom-0 bg-accent/10 pointer-events-none"
                style={{
                  left: loopStart * barWidth,
                  width: (loopEnd - loopStart) * barWidth,
                }}
              />

              {/* REAL-TIME PLAYHEAD NEEDLE */}
              <div
                ref={playheadRef}
                className={cn(
                  "absolute top-0 bottom-0 z-30 pointer-events-none transition-opacity",
                  isPlaying ? "opacity-100" : "opacity-70"
                )}
                style={{ 
                  left: getPlayheadPosition(),
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Needle Head (Triangle) */}
                <div 
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '8px solid hsl(var(--primary))',
                  }}
                />
                {/* Needle Line */}
                <div 
                  className={cn(
                    "w-0.5 h-full",
                    isPlaying ? "bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.5)]" : "bg-primary/70"
                  )}
                />
                {/* Time Display at Needle */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-1 py-0.5 rounded whitespace-nowrap font-mono">
                  {currentBar + 1}.{Math.floor(currentStep / 4) + 1}.{(currentStep % 4) + 1}
                </div>
              </div>

              {/* Clips */}
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className={cn(
                    "absolute rounded cursor-pointer transition-all",
                    "border-2 hover:brightness-110",
                    selectedClipId === clip.id 
                      ? "ring-2 ring-accent border-accent" 
                      : "border-transparent"
                  )}
                  style={{
                    left: clip.startBar * barWidth + 2,
                    top: clip.trackIndex * TRACK_HEIGHT + 2,
                    width: clip.length * barWidth - 4,
                    height: TRACK_HEIGHT - 4,
                    backgroundColor: clip.color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(clip.id === selectedClipId ? null : clip.id);
                  }}
                  onDoubleClick={() => {
                    console.log('Open pattern:', clip.patternId);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onDeleteClip(clip.id);
                  }}
                >
                  <div className="w-full h-full flex items-center px-2 overflow-hidden">
                    <span className="text-xs font-medium text-background truncate">
                      {clip.name}
                    </span>
                  </div>

                  {/* Waveform/Pattern Preview */}
                  <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="w-full h-full flex items-end gap-px px-1 py-1">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-background/50 rounded-t"
                          style={{ height: `${20 + Math.random() * 60}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
};
