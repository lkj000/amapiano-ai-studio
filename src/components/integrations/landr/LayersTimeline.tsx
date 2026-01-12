/**
 * LayersTimeline Component
 * DAW-style mini-timeline for visualizing generated layers with waveforms
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX,
  ExternalLink
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
  onOpenInDAW?: () => void;
}

const LAYER_COLORS: Record<string, string> = {
  drums: 'hsl(25, 95%, 53%)',     // orange
  bass: 'hsl(280, 87%, 65%)',      // purple  
  harmony: 'hsl(217, 91%, 60%)',   // blue
  texture: 'hsl(142, 71%, 45%)',   // green
  melody: 'hsl(330, 81%, 60%)',    // pink
  original: 'hsl(0, 0%, 60%)',     // gray
};

export const LayersTimeline: React.FC<LayersTimelineProps> = ({
  layers,
  originalTrackUrl,
  originalTrackName = 'Original',
  onLayerVolumeChange,
  onLayerMuteToggle,
  onOpenInDAW
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60); // default 60s
  const [zoom, setZoom] = useState(1);
  const [waveformData, setWaveformData] = useState<Map<string, number[]>>(new Map());
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const playStartTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

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
      
      // Load original track if available
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
      
      // Load each layer
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
      if (maxDuration > 0) setDuration(maxDuration);
      setIsLoadingAudio(false);
    };
    
    loadAudio();
  }, [layers, originalTrackUrl, generatePeaks]);

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
    const labelWidth = 100;
    const timelineHeight = 24;
    
    // Clear
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, width, height);
    
    // Draw time ruler
    ctx.fillStyle = 'hsl(var(--muted))';
    ctx.fillRect(0, 0, width, timelineHeight);
    
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '10px system-ui';
    
    const visibleDuration = duration / zoom;
    const pixelsPerSecond = (width - labelWidth) / visibleDuration;
    const secondsPerMark = Math.ceil(5 / zoom);
    
    for (let t = 0; t <= visibleDuration; t += secondsPerMark) {
      const x = labelWidth + t * pixelsPerSecond;
      ctx.fillText(formatTime(t), x, 15);
      
      ctx.strokeStyle = 'hsl(var(--border))';
      ctx.beginPath();
      ctx.moveTo(x, timelineHeight);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Track list including original + layers
    const allTracks = [
      ...(originalTrackUrl ? [{ id: 'original', name: originalTrackName, type: 'original' as const, muted: false, volume: 100 }] : []),
      ...layers
    ];
    
    // Draw tracks
    allTracks.forEach((track, index) => {
      const y = timelineHeight + index * (trackHeight + trackGap) + trackGap;
      const color = LAYER_COLORS[track.type] || LAYER_COLORS.original;
      
      // Track label background
      ctx.fillStyle = 'hsl(var(--muted) / 0.5)';
      ctx.fillRect(0, y, labelWidth - 4, trackHeight);
      
      // Track label
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '11px system-ui';
      ctx.fillText(track.name.slice(0, 12), 8, y + 20);
      
      // Track type badge
      ctx.fillStyle = color;
      ctx.font = 'bold 9px system-ui';
      ctx.fillText(track.type.toUpperCase(), 8, y + 36);
      
      // Waveform area background
      ctx.fillStyle = track.muted ? 'hsl(var(--muted) / 0.3)' : `${color}20`;
      ctx.fillRect(labelWidth, y, width - labelWidth, trackHeight);
      
      // Draw waveform
      const peaks = waveformData.get(track.id);
      if (peaks && peaks.length > 0) {
        ctx.fillStyle = track.muted ? 'hsl(var(--muted-foreground) / 0.3)' : color;
        
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
    
    // Draw playhead
    const playheadX = labelWidth + (currentTime / visibleDuration) * (width - labelWidth);
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
    // Playhead head
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 10);
    ctx.closePath();
    ctx.fill();
    
  }, [layers, originalTrackUrl, originalTrackName, waveformData, currentTime, zoom, duration, isLoadingAudio]);

  // Playback animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        const ctx = audioContextRef.current;
        if (ctx) {
          const elapsed = ctx.currentTime - playStartTimeRef.current;
          const newTime = pausedAtRef.current + elapsed;
          
          if (newTime >= duration) {
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
  }, [isPlaying, duration]);

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
    
    // Stop any existing sources
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch {}
    });
    audioSourcesRef.current.clear();
    gainNodesRef.current.clear();
    
    // Create and start sources for all layers
    const allTracks = [
      ...(originalTrackUrl ? [{ id: 'original', volume: 100, muted: false }] : []),
      ...layers
    ];
    
    for (const track of allTracks) {
      const buffer = audioBuffersRef.current.get(track.id);
      if (!buffer) continue;
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = track.muted ? 0 : track.volume / 100;
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(0, pausedAtRef.current);
      
      audioSourcesRef.current.set(track.id, source);
      gainNodesRef.current.set(track.id, gainNode);
    }
    
    playStartTimeRef.current = ctx.currentTime;
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
  };

  const handleOpenInDAW = () => {
    if (onOpenInDAW) {
      onOpenInDAW();
    } else {
      // Store layers data for DAW to pick up
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
    const labelWidth = 100;
    
    if (x > labelWidth) {
      const visibleDuration = duration / zoom;
      const newTime = ((x - labelWidth) / (rect.width - labelWidth)) * visibleDuration;
      pausedAtRef.current = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(pausedAtRef.current);
      
      if (isPlaying) {
        // Restart playback from new position
        pausePlayback();
        startPlayback();
      }
    }
  };

  const trackCount = (originalTrackUrl ? 1 : 0) + layers.length;
  const canvasHeight = 24 + trackCount * (50 + 8) + 8;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Timeline Preview</CardTitle>
          <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={isPlaying ? pausePlayback : startPlayback}
              disabled={layers.length === 0 && !originalTrackUrl}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={stopPlayback}
              disabled={!isPlaying && currentTime === 0}
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
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
            style={{ height: `${Math.max(150, canvasHeight)}px` }}
            onClick={handleCanvasClick}
          />
          
          {layers.length === 0 && !originalTrackUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Generate layers to see timeline preview
            </div>
          )}
        </div>
        
        {/* Layer quick controls */}
        {layers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {layers.map(layer => (
              <Button
                key={layer.id}
                variant={layer.muted ? 'ghost' : 'outline'}
                size="sm"
                className={`text-xs ${layer.muted ? 'opacity-50' : ''}`}
                style={{ borderColor: layer.muted ? undefined : LAYER_COLORS[layer.type] }}
                onClick={() => onLayerMuteToggle?.(layer.id)}
              >
                {layer.muted ? <VolumeX className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                {layer.name}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LayersTimeline;
