/**
 * LayersTimeline Component
 * DAW-style mini-timeline with full transport, BPM, time signature, waveform, solo/mute
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX,
  ExternalLink,
  Grid3X3,
  Headphones,
  SkipBack,
  SkipForward,
  Repeat,
  Music
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface TimelineLayer {
  id: string;
  type: 'drums' | 'bass' | 'harmony' | 'texture' | 'melody';
  name: string;
  audioUrl: string;
  volume: number;
  muted: boolean;
  solo?: boolean;
  color: string;
  waveformPeaks?: number[];
  duration?: number;
}

interface LayersTimelineProps {
  layers: TimelineLayer[];
  originalTrackUrl?: string | null;
  originalTrackName?: string;
  onLayerVolumeChange?: (layerId: string, volume: number) => void;
  onLayerMuteToggle?: (layerId: string) => void;
  onLayerSoloToggle?: (layerId: string) => void;
  onOpenInDAW?: () => void;
}

const LAYER_COLORS: Record<string, string> = {
  drums: 'hsl(25, 95%, 53%)',
  bass: 'hsl(280, 87%, 65%)',
  harmony: 'hsl(217, 91%, 60%)',
  texture: 'hsl(142, 71%, 45%)',
  melody: 'hsl(330, 81%, 60%)',
  original: 'hsl(0, 0%, 60%)',
};

export const LayersTimeline: React.FC<LayersTimelineProps> = ({
  layers,
  originalTrackUrl,
  originalTrackName = 'Original',
  onLayerVolumeChange,
  onLayerMuteToggle,
  onLayerSoloToggle,
  onOpenInDAW
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const metronomeRef = useRef<OscillatorNode | null>(null);
  const metronomeGainRef = useRef<GainNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [zoom, setZoom] = useState(1);
  const [waveformData, setWaveformData] = useState<Map<string, number[]>>(new Map());
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Enhanced DAW features
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState<[number, number]>([4, 4]);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(8);
  const [soloTracks, setSoloTracks] = useState<Set<string>>(new Set());
  
  const playStartTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const lastBeatRef = useRef<number>(-1);

  // Calculate bars and beats
  const beatsPerBar = timeSignature[0];
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * beatsPerBar;
  const currentBeat = Math.floor(currentTime / secondsPerBeat) + 1;
  const currentBar = Math.floor(currentTime / secondsPerBar) + 1;
  const beatInBar = ((currentBeat - 1) % beatsPerBar) + 1;

  // Generate waveform peaks from audio buffer
  const generatePeaks = useCallback((buffer: AudioBuffer, samples: number = 200): number[] => {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const peaks: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const abs = Math.abs(channelData[start + j] || 0);
        if (abs > max) max = abs;
      }
      peaks.push(max);
    }
    
    return peaks;
  }, []);

  // Load audio and generate waveforms
  useEffect(() => {
    const loadAudio = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      const newWaveformData = new Map<string, number[]>();
      let maxDuration = 0;
      
      setIsLoadingAudio(true);
      
      if (originalTrackUrl) {
        try {
          const response = await fetch(originalTrackUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          
          audioBuffersRef.current.set('original', audioBuffer);
          newWaveformData.set('original', generatePeaks(audioBuffer));
          maxDuration = Math.max(maxDuration, audioBuffer.duration);
        } catch (error) {
          console.error('Failed to load original track:', error);
        }
      }
      
      for (const layer of layers) {
        if (!layer.audioUrl) continue;
        
        try {
          const response = await fetch(layer.audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          
          audioBuffersRef.current.set(layer.id, audioBuffer);
          newWaveformData.set(layer.id, generatePeaks(audioBuffer));
          maxDuration = Math.max(maxDuration, audioBuffer.duration);
        } catch (error) {
          console.error(`Failed to load layer ${layer.id}:`, error);
        }
      }
      
      setWaveformData(newWaveformData);
      if (maxDuration > 0) {
        setDuration(maxDuration);
        setLoopEnd(Math.min(8, Math.floor(maxDuration / secondsPerBar)));
      }
      setIsLoadingAudio(false);
    };
    
    loadAudio();
  }, [layers, originalTrackUrl, generatePeaks, secondsPerBar]);

  // Metronome click
  const playMetronomeClick = useCallback((isDownbeat: boolean) => {
    if (!audioContextRef.current || !metronomeEnabled) return;
    
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.value = isDownbeat ? 1000 : 800;
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, [metronomeEnabled]);

  // Draw timeline and waveforms
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const trackHeight = 50;
    const trackGap = 8;
    const labelWidth = 120;
    const timelineHeight = 32;
    
    // Clear
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, width, height);
    
    // Draw time ruler with beat grid
    ctx.fillStyle = 'hsl(var(--muted))';
    ctx.fillRect(0, 0, width, timelineHeight);
    
    const visibleDuration = duration / zoom;
    const pixelsPerSecond = (width - labelWidth) / visibleDuration;
    
    // Draw beat/bar grid
    if (snapToGrid) {
      ctx.strokeStyle = 'hsl(var(--border) / 0.3)';
      ctx.lineWidth = 0.5;
      
      // Beat lines
      for (let beat = 0; beat * secondsPerBeat <= visibleDuration; beat++) {
        const x = labelWidth + beat * secondsPerBeat * pixelsPerSecond;
        const isDownbeat = beat % beatsPerBar === 0;
        
        if (isDownbeat) {
          ctx.strokeStyle = 'hsl(var(--border) / 0.6)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'hsl(var(--border) / 0.3)';
          ctx.lineWidth = 0.5;
        }
        
        ctx.beginPath();
        ctx.moveTo(x, timelineHeight);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
    
    // Bar numbers and time markers
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.font = 'bold 10px system-ui';
    
    for (let bar = 0; bar * secondsPerBar <= visibleDuration; bar++) {
      const x = labelWidth + bar * secondsPerBar * pixelsPerSecond;
      ctx.fillText(`${bar + 1}`, x + 4, 12);
      
      // Time below bar number
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.font = '9px system-ui';
      ctx.fillText(formatTime(bar * secondsPerBar), x + 4, 24);
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = 'bold 10px system-ui';
    }
    
    // Loop region
    if (isLooping) {
      const loopStartX = labelWidth + loopStart * secondsPerBar * pixelsPerSecond;
      const loopEndX = labelWidth + loopEnd * secondsPerBar * pixelsPerSecond;
      
      ctx.fillStyle = 'hsl(var(--primary) / 0.1)';
      ctx.fillRect(loopStartX, timelineHeight, loopEndX - loopStartX, height - timelineHeight);
      
      ctx.strokeStyle = 'hsl(var(--primary) / 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(loopStartX, timelineHeight, loopEndX - loopStartX, height - timelineHeight);
      ctx.setLineDash([]);
    }
    
    // Track list
    const allTracks = [
      ...(originalTrackUrl ? [{ id: 'original', name: originalTrackName, type: 'original' as const, muted: false, solo: false, volume: 100 }] : []),
      ...layers
    ];
    
    // Check if any track is soloed
    const hasSoloedTrack = allTracks.some(t => soloTracks.has(t.id));
    
    // Draw tracks
    allTracks.forEach((track, index) => {
      const y = timelineHeight + index * (trackHeight + trackGap) + trackGap;
      const color = LAYER_COLORS[track.type] || LAYER_COLORS.original;
      const isSoloed = soloTracks.has(track.id);
      const isMuted = track.muted || (hasSoloedTrack && !isSoloed);
      
      // Track label background
      ctx.fillStyle = 'hsl(var(--muted) / 0.5)';
      ctx.fillRect(0, y, labelWidth - 4, trackHeight);
      
      // Solo indicator
      if (isSoloed) {
        ctx.fillStyle = 'hsl(45, 93%, 47%)';
        ctx.fillRect(0, y, 3, trackHeight);
      }
      
      // Track label
      ctx.fillStyle = isMuted ? 'hsl(var(--muted-foreground) / 0.5)' : 'hsl(var(--foreground))';
      ctx.font = '11px system-ui';
      ctx.fillText(track.name.slice(0, 14), 8, y + 20);
      
      // Track type badge
      ctx.fillStyle = isMuted ? `${color}50` : color;
      ctx.font = 'bold 9px system-ui';
      ctx.fillText(track.type.toUpperCase(), 8, y + 36);
      
      // M/S indicators
      ctx.font = 'bold 9px system-ui';
      if (track.muted) {
        ctx.fillStyle = 'hsl(0, 70%, 50%)';
        ctx.fillText('M', labelWidth - 32, y + 20);
      }
      if (isSoloed) {
        ctx.fillStyle = 'hsl(45, 93%, 47%)';
        ctx.fillText('S', labelWidth - 18, y + 20);
      }
      
      // Waveform area background
      ctx.fillStyle = isMuted ? 'hsl(var(--muted) / 0.3)' : `${color}20`;
      ctx.fillRect(labelWidth, y, width - labelWidth, trackHeight);
      
      // Draw waveform
      const peaks = waveformData.get(track.id);
      if (peaks && peaks.length > 0) {
        ctx.fillStyle = isMuted ? 'hsl(var(--muted-foreground) / 0.3)' : color;
        
        const waveformWidth = width - labelWidth;
        const barWidth = waveformWidth / peaks.length;
        const centerY = y + trackHeight / 2;
        const maxBarHeight = (trackHeight / 2) * 0.8;
        
        peaks.forEach((peak, i) => {
          const barHeight = peak * maxBarHeight * (track.volume / 100);
          const x = labelWidth + i * barWidth;
          
          ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
        });
      } else if (!isLoadingAudio) {
        // Placeholder bars
        ctx.fillStyle = `${color}40`;
        const barCount = 50;
        const barWidth = (width - labelWidth) / barCount;
        for (let i = 0; i < barCount; i++) {
          const barHeight = (Math.sin(i * 0.3) * 0.5 + 0.5) * 15 + 5;
          ctx.fillRect(
            labelWidth + i * barWidth + 1,
            y + (trackHeight - barHeight) / 2,
            barWidth - 2,
            barHeight
          );
        }
      }
    });
    
    // Draw playhead with arrow
    const playheadX = labelWidth + (currentTime / visibleDuration) * (width - labelWidth);
    
    // Playhead line
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
    // Playhead arrow/triangle
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.beginPath();
    ctx.moveTo(playheadX - 8, 0);
    ctx.lineTo(playheadX + 8, 0);
    ctx.lineTo(playheadX, 14);
    ctx.closePath();
    ctx.fill();
    
    // Time display on playhead
    ctx.fillStyle = 'hsl(var(--primary-foreground))';
    ctx.font = 'bold 8px system-ui';
    const timeText = `${currentBar}.${beatInBar}`;
    ctx.fillText(timeText, playheadX - ctx.measureText(timeText).width / 2, 10);
    
  }, [layers, originalTrackUrl, originalTrackName, waveformData, currentTime, zoom, duration, isLoadingAudio, snapToGrid, bpm, timeSignature, secondsPerBeat, secondsPerBar, beatsPerBar, isLooping, loopStart, loopEnd, soloTracks, currentBar, beatInBar]);

  // Playback animation loop with metronome
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        const ctx = audioContextRef.current;
        if (ctx) {
          const elapsed = ctx.currentTime - playStartTimeRef.current;
          let newTime = pausedAtRef.current + elapsed;
          
          // Handle looping
          if (isLooping) {
            const loopStartTime = loopStart * secondsPerBar;
            const loopEndTime = loopEnd * secondsPerBar;
            
            if (newTime >= loopEndTime) {
              newTime = loopStartTime + (newTime - loopEndTime) % (loopEndTime - loopStartTime);
              pausedAtRef.current = newTime;
              playStartTimeRef.current = ctx.currentTime;
            }
          }
          
          // Metronome
          const currentBeatNum = Math.floor(newTime / secondsPerBeat);
          if (metronomeEnabled && currentBeatNum !== lastBeatRef.current) {
            lastBeatRef.current = currentBeatNum;
            const isDownbeat = currentBeatNum % beatsPerBar === 0;
            playMetronomeClick(isDownbeat);
          }
          
          if (newTime >= duration && !isLooping) {
            stopPlayback();
            setCurrentTime(0);
          } else {
            setCurrentTime(newTime);
          }
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, duration, isLooping, loopStart, loopEnd, secondsPerBar, secondsPerBeat, beatsPerBar, metronomeEnabled, playMetronomeClick]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startPlayback = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch {}
    });
    audioSourcesRef.current.clear();
    gainNodesRef.current.clear();
    
    const allTracks = [
      ...(originalTrackUrl ? [{ id: 'original', volume: 100, muted: false, solo: false }] : []),
      ...layers
    ];
    
    const hasSoloedTrack = allTracks.some(t => soloTracks.has(t.id));
    
    for (const track of allTracks) {
      const buffer = audioBuffersRef.current.get(track.id);
      if (!buffer) continue;
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = ctx.createGain();
      const isSoloed = soloTracks.has(track.id);
      const isMuted = track.muted || (hasSoloedTrack && !isSoloed);
      
      gainNode.gain.value = isMuted ? 0 : track.volume / 100;
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(0, pausedAtRef.current);
      
      audioSourcesRef.current.set(track.id, source);
      gainNodesRef.current.set(track.id, gainNode);
    }
    
    playStartTimeRef.current = ctx.currentTime;
    lastBeatRef.current = -1;
    setIsPlaying(true);
  };

  const pausePlayback = () => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch {}
    });
    audioSourcesRef.current.clear();
    
    pausedAtRef.current = currentTime;
    setIsPlaying(false);
  };

  const stopPlayback = () => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch {}
    });
    audioSourcesRef.current.clear();
    
    pausedAtRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    lastBeatRef.current = -1;
  };

  const skipToStart = () => {
    pausedAtRef.current = isLooping ? loopStart * secondsPerBar : 0;
    setCurrentTime(pausedAtRef.current);
    if (isPlaying) {
      pausePlayback();
      startPlayback();
    }
  };

  const skipToEnd = () => {
    pausedAtRef.current = isLooping ? loopEnd * secondsPerBar : duration;
    setCurrentTime(pausedAtRef.current);
    if (isPlaying) {
      pausePlayback();
      startPlayback();
    }
  };

  const handleOpenInDAW = () => {
    if (onOpenInDAW) {
      onOpenInDAW();
    } else {
      const dawImportData = {
        layers: layers.map(l => ({
          name: l.name,
          type: l.type,
          audioUrl: l.audioUrl,
          color: LAYER_COLORS[l.type]
        })),
        originalTrack: originalTrackUrl ? {
          name: originalTrackName,
          audioUrl: originalTrackUrl
        } : null,
        bpm,
        timeSignature,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pendingLayersImport', JSON.stringify(dawImportData));
      toast.success('Layers prepared for DAW import');
      navigate('/daw');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const labelWidth = 120;
    
    if (x > labelWidth) {
      const visibleDuration = duration / zoom;
      let newTime = ((x - labelWidth) / (rect.width - labelWidth)) * visibleDuration;
      
      // Snap to grid
      if (snapToGrid) {
        newTime = Math.round(newTime / secondsPerBeat) * secondsPerBeat;
      }
      
      pausedAtRef.current = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(pausedAtRef.current);
      
      if (isPlaying) {
        pausePlayback();
        startPlayback();
      }
    }
  };

  const toggleSolo = (trackId: string) => {
    setSoloTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
    onLayerSoloToggle?.(trackId);
  };

  const trackCount = (originalTrackUrl ? 1 : 0) + layers.length;
  const canvasHeight = 32 + trackCount * (50 + 8) + 8;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Timeline Preview</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* BPM & Time Signature Display */}
            <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
              <Music className="w-3 h-3 text-muted-foreground" />
              <Input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Math.max(40, Math.min(300, parseInt(e.target.value) || 120)))}
                className="w-14 h-6 text-xs text-center p-0 border-0 bg-transparent"
              />
              <span className="text-xs text-muted-foreground">BPM</span>
            </div>
            
            <Badge variant="outline" className="text-xs font-mono">
              {timeSignature[0]}/{timeSignature[1]}
            </Badge>
            
            <Badge variant="secondary" className="text-xs font-mono">
              Bar {currentBar} • Beat {beatInBar}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInDAW}
              disabled={layers.length === 0}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in DAW
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transport controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Main transport */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={skipToStart}
              className="h-8 w-8"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={stopPlayback}
              disabled={!isPlaying && currentTime === 0}
              className="h-8 w-8"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="icon"
              onClick={isPlaying ? pausePlayback : startPlayback}
              disabled={layers.length === 0 && !originalTrackUrl}
              className="h-10 w-10"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={skipToEnd}
              className="h-8 w-8"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Loop control */}
          <Button
            variant={isLooping ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsLooping(!isLooping)}
            className="h-8"
          >
            <Repeat className="w-4 h-4 mr-1" />
            Loop
          </Button>
          
          {/* Metronome */}
          <Button
            variant={metronomeEnabled ? "default" : "ghost"}
            size="sm"
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className="h-8"
          >
            <Headphones className="w-4 h-4 mr-1" />
            Click
          </Button>
          
          {/* Snap to grid */}
          <Button
            variant={snapToGrid ? "default" : "ghost"}
            size="sm"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className="h-8"
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Snap
          </Button>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="h-8 w-8"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {(zoom * 100).toFixed(0)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(z => Math.min(4, z + 0.25))}
              className="h-8 w-8"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          {isLoadingAudio && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Loading audio...
            </span>
          )}
        </div>
        
        {/* Timeline canvas */}
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
          <canvas
            ref={canvasRef}
            className="w-full cursor-pointer"
            style={{ height: `${Math.max(180, canvasHeight)}px` }}
            onClick={handleCanvasClick}
          />
          
          {layers.length === 0 && !originalTrackUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Generate layers to see timeline preview
            </div>
          )}
        </div>
        
        {/* Layer quick controls with solo/mute */}
        {layers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {layers.map(layer => (
              <div key={layer.id} className="flex items-center gap-1">
                <Button
                  variant={layer.muted ? 'destructive' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs font-bold"
                  onClick={() => onLayerMuteToggle?.(layer.id)}
                  title="Mute"
                >
                  M
                </Button>
                <Button
                  variant={soloTracks.has(layer.id) ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs font-bold"
                  style={soloTracks.has(layer.id) ? { backgroundColor: 'hsl(45, 93%, 47%)' } : undefined}
                  onClick={() => toggleSolo(layer.id)}
                  title="Solo"
                >
                  S
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs ${layer.muted ? 'opacity-50' : ''}`}
                  style={{ borderColor: layer.muted ? undefined : LAYER_COLORS[layer.type] }}
                >
                  {layer.muted ? <VolumeX className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                  {layer.name}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LayersTimeline;
