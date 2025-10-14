import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  Settings,
  Plus,
  Minus,
  Mic,
  Headphones,
  Activity,
  Layers,
  Clock,
  Music,
  BarChart3 // Changed from Waveform to BarChart3
} from "lucide-react";
import { useRealTimeAudio } from "@/hooks/useRealTimeAudio";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import type { DawProjectData, Track, AudioClip } from '@/types/daw';

interface InteractiveDAWProps {
  projectData?: DawProjectData | null;
  onProjectUpdate?: (data: DawProjectData) => void;
  className?: string;
  showAdvancedControls?: boolean;
}

interface TrackState {
  id: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  monitoring: boolean;
}

export const InteractiveDAW: React.FC<InteractiveDAWProps> = ({
  projectData,
  onProjectUpdate,
  className,
  showAdvancedControls = true
}) => {
  // Transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(projectData?.bpm || 118);
  const [masterVolume, setMasterVolume] = useState(projectData?.masterVolume || 0.8);
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(64);

  // Track management
  const [tracks, setTracks] = useState<TrackState[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [trackHeights, setTrackHeights] = useState<Record<string, number>>({});

  // Audio engine
  const { 
    isActive: audioActive, 
    analysisData, 
    startAudio, 
    stopAudio 
  } = useRealTimeAudio({
    enableAnalysis: true,
    bufferSize: 2048
  });

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize tracks from project data
  useEffect(() => {
    if (projectData?.tracks) {
      const trackStates = projectData.tracks.map((track: Track) => ({
        id: track.id,
        volume: track.mixer?.volume || 0.8,
        muted: track.mixer?.isMuted || false,
        solo: track.mixer?.isSolo || false,
        armed: false,
        monitoring: false
      }));
      setTracks(trackStates);
    } else {
      // Create default tracks
      const defaultTracks = [
        { id: 'drums', name: 'Drums', color: '#ff6b6b' },
        { id: 'bass', name: 'Bass', color: '#4ecdc4' },
        { id: 'piano', name: 'Piano', color: '#45b7d1' },
        { id: 'vocals', name: 'Vocals', color: '#f9ca24' }
      ].map(track => ({
        id: track.id,
        volume: 0.8,
        muted: false,
        solo: false,
        armed: false,
        monitoring: false
      }));
      setTracks(defaultTracks);
    }
  }, [projectData]);

  // Transport controls
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      toast.success('Playback stopped');
    } else {
      setIsPlaying(true);
      startTimeRef.current = Date.now() - (currentTime * 1000);
      updateTime();
      toast.success('Playback started');
    }
  }, [isPlaying, currentTime]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    toast.success('Playback stopped');
  }, []);

  const handleRecord = useCallback(async () => {
    if (!isRecording) {
      try {
        await startAudio();
        setIsRecording(true);
        toast.success('Recording started');
      } catch (error) {
        toast.error('Failed to start recording');
      }
    } else {
      stopAudio();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  }, [isRecording, startAudio, stopAudio]);

  // Time update loop
  const updateTime = useCallback(() => {
    if (!isPlaying) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const beatsPerSecond = bpm / 60;
    const currentBeat = elapsed * beatsPerSecond;
    
    // Handle looping
    if (isLooping && currentBeat >= loopEnd) {
      const loopDuration = loopEnd - loopStart;
      const newTime = loopStart + ((currentBeat - loopStart) % loopDuration);
      setCurrentTime(newTime);
      startTimeRef.current = Date.now() - (newTime / beatsPerSecond * 1000);
    } else {
      setCurrentTime(currentBeat);
    }

    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying, bpm, isLooping, loopStart, loopEnd]);

  // Track controls
  const updateTrack = useCallback((trackId: string, updates: Partial<TrackState>) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
  }, []);

  const addTrack = useCallback(() => {
    const newTrackId = `track-${Date.now()}`;
    const newTrack: TrackState = {
      id: newTrackId,
      volume: 0.8,
      muted: false,
      solo: false,
      armed: false,
      monitoring: false
    };
    setTracks(prev => [...prev, newTrack]);
    toast.success('New track added');
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
    if (selectedTrack === trackId) {
      setSelectedTrack(null);
    }
    toast.success('Track removed');
  }, [selectedTrack]);

  // Render timeline
  const renderTimeline = () => {
    const beats = Array.from({ length: 128 }, (_, i) => i);
    const pixelsPerBeat = 40;

    return (
      <div className="relative bg-background/50 h-10 border-b border-border/30">
        <div className="flex h-full">
          {beats.map(beat => {
            const isBar = beat % 4 === 0;
            const isSection = beat % 16 === 0;
            
            return (
              <div
                key={beat}
                className={cn(
                  "border-l flex items-start justify-center pt-1 text-xs transition-colors",
                  isSection && "border-border bg-muted/30",
                  isBar && !isSection && "border-border/50",
                  !isBar && "border-border/20"
                )}
                style={{ width: pixelsPerBeat }}
              >
                {isBar && (
                  <span className={cn(
                    "font-mono text-xs",
                    isSection ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}>
                    {Math.floor(beat / 4) + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Playhead with glow effect */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-glow z-10"
          style={{
            left: currentTime * pixelsPerBeat,
            transition: isPlaying ? 'none' : 'left 0.1s ease-out',
            boxShadow: '0 0 10px hsl(var(--primary) / 0.5)'
          }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
        </div>
        
        {/* Loop markers */}
        {isLooping && (
          <>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-[9]"
              style={{ left: loopStart * pixelsPerBeat }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-green-500 rounded-full" />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[9]"
              style={{ left: loopEnd * pixelsPerBeat }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-red-500 rounded-full" />
            </div>
            <div
              className="absolute top-0 bottom-0 bg-primary/5 border-y border-primary/20"
              style={{
                left: loopStart * pixelsPerBeat,
                width: (loopEnd - loopStart) * pixelsPerBeat
              }}
            />
          </>
        )}
      </div>
    );
  };

  // Render track
  const renderTrack = (track: TrackState, index: number) => {
    const trackHeight = 90;
    const pixelsPerBeat = 40;
    const projectTrack = projectData?.tracks.find(t => t.id === track.id);

    return (
      <div 
        key={track.id} 
        className={cn(
          "border-b border-border/20 hover:bg-accent/5 transition-colors group",
          selectedTrack === track.id && "bg-accent/10"
        )}
      >
        <div 
          className="relative bg-background"
          style={{ height: trackHeight }}
          onClick={() => setSelectedTrack(track.id)}
        >
          {/* Grid */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 128 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "border-l transition-colors",
                  i % 16 === 0 && "border-border/30 bg-muted/10",
                  i % 4 === 0 && i % 16 !== 0 && "border-border/20",
                  i % 4 !== 0 && "border-border/10"
                )}
                style={{ width: pixelsPerBeat }}
              />
            ))}
          </div>

          {/* Audio clips with modern styling */}
          {projectTrack?.clips && projectTrack.clips.length > 0 && (
            <>
              {projectTrack.clips.map((clip, clipIndex) => {
                const clipStart = clip.startTime * pixelsPerBeat;
                const clipWidth = clip.duration * pixelsPerBeat;
                
                return (
                  <div
                    key={clip.id}
                    className={cn(
                      "absolute top-2 bottom-2 rounded-lg overflow-hidden group/clip cursor-pointer",
                      "bg-gradient-primary/20 border-2 border-primary/40 backdrop-blur-sm",
                      "hover:border-primary/60 hover:shadow-glow transition-all",
                      selectedTrack === track.id && "border-primary/60 shadow-sm"
                    )}
                    style={{
                      left: clipStart,
                      width: clipWidth
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                    <div className="relative h-full flex items-center px-3">
                      <BarChart3 className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-xs font-medium truncate">
                        {clip.name || projectTrack.name}
                      </span>
                    </div>
                    {/* Waveform simulation */}
                    <div className="absolute bottom-1 left-2 right-2 flex items-end gap-0.5 h-8 opacity-30">
                      {Array.from({ length: 32 }, (_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary rounded-t"
                          style={{ height: `${20 + Math.random() * 80}%` }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Volume meter for armed tracks */}
          {analysisData && track.armed && (
            <div className="absolute right-3 top-3 bottom-3 w-5 bg-muted/50 rounded-full border border-border/50 overflow-hidden">
              <div
                className="bg-gradient-to-t from-green-500 to-green-400 rounded-full transition-all duration-75"
                style={{
                  height: `${analysisData.volume}%`,
                  marginTop: `${100 - analysisData.volume}%`
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden border-0 shadow-elegant", className)}>
      {/* Modern Transport Bar */}
      <div className="bg-gradient-subtle border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Transport */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <div className="text-sm font-semibold">Professional DAW</div>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={() => {
                  setCurrentTime(Math.max(0, currentTime - 4));
                  startTimeRef.current = Date.now() - (Math.max(0, currentTime - 4) * 1000);
                }}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={handleStop}
              >
                <Square className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="icon"
                className="h-9 w-9 shadow-sm"
                onClick={handlePlay}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={handleRecord}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isRecording ? "bg-white animate-pulse" : "bg-current"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={() => {
                  const nextBar = Math.ceil(currentTime / 4) * 4;
                  setCurrentTime(nextBar);
                  startTimeRef.current = Date.now() - (nextBar * 1000);
                }}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              variant={isLooping ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsLooping(!isLooping)}
            >
              Loop
            </Button>
          </div>

          {/* Center: Time Display */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-md border border-border/50">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">
                {Math.floor(currentTime / 4) + 1}:{String(Math.floor(currentTime % 4) + 1).padStart(2, '0')}
              </span>
            </div>
            
            <Badge variant="secondary" className="font-mono">
              {bpm} BPM
            </Badge>
            
            {audioActive && (
              <Badge variant="default" className="animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-md border border-border/50">
              <span className="text-xs text-muted-foreground">BPM</span>
              <Slider
                value={[bpm]}
                onValueChange={([value]) => setBpm(value)}
                min={60}
                max={200}
                step={1}
                className="w-24"
              />
              <span className="text-xs font-medium w-8">{bpm}</span>
            </div>

            <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-md border border-border/50">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <Slider
                value={[masterVolume * 100]}
                onValueChange={([value]) => setMasterVolume(value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={addTrack} className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Track
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

        {/* Main DAW Interface */}
        <div className="flex">
          {/* Track Controls */}
          <div className="w-48 border-r border-border/30">
            <div className="h-12 border-b border-border/30 bg-muted/20 flex items-center px-3">
              <span className="text-sm font-medium">Tracks</span>
            </div>
            <ScrollArea className="h-[400px]">
              {tracks.map((track, index) => (
                <div key={track.id} className="border-b border-border/30 p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{track.id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTrack(track.id)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Button
                          variant={track.muted ? "default" : "outline"}
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => updateTrack(track.id, { muted: !track.muted })}
                        >
                          Mute
                        </Button>
                        <Button
                          variant={track.solo ? "default" : "outline"}
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => updateTrack(track.id, { solo: !track.solo })}
                        >
                          Solo
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3 h-3" />
                        <Slider
                          value={[track.volume * 100]}
                          onValueChange={([value]) => updateTrack(track.id, { volume: value / 100 })}
                          min={0}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Timeline and Tracks */}
          <div className="flex-1">
            <ScrollArea className="h-[460px]">
              <div ref={timelineRef}>
                {renderTimeline()}
                <div className="relative">
                  {tracks.map((track, index) => renderTrack(track, index))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t border-border/30 p-2 bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Tracks: {tracks.length}</span>
              <span>Sample Rate: 44.1kHz</span>
              <span>Buffer: 2048 samples</span>
            </div>
            <div className="flex items-center gap-2">
              {analysisData && (
                <div className="flex items-center gap-2">
                  <Headphones className="w-3 h-3" />
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${analysisData.volume}%` }}
                    />
                  </div>
                  <span>{Math.round(analysisData.volume)}dB</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};