import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  playheadPosition?: number; // 0-1
  onSeek?: (position: number) => void;
  isPlaying?: boolean;
  showTimeline?: boolean;
  duration?: number;
  className?: string;
}

export function WaveformVisualizer({
  audioUrl,
  audioBuffer,
  width,
  height,
  color = 'hsl(var(--primary))',
  backgroundColor = 'transparent',
  playheadPosition = 0,
  onSeek,
  isPlaying = false,
  showTimeline = false,
  duration = 0,
  className
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Extract waveform data from audio
  useEffect(() => {
    const extractWaveform = async () => {
      if (!audioUrl && !audioBuffer) return;
      
      setIsLoading(true);
      
      try {
        let buffer: AudioBuffer;
        
        if (audioBuffer) {
          buffer = audioBuffer;
        } else if (audioUrl) {
          const audioContext = new AudioContext();
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          buffer = await audioContext.decodeAudioData(arrayBuffer);
        } else {
          return;
        }

        const rawData = buffer.getChannelData(0);
        const samples = Math.min(width, 500);
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize
        const maxValue = Math.max(...filteredData);
        const normalizedData = filteredData.map(v => v / maxValue);
        
        setWaveformData(normalizedData);
      } catch (error) {
        console.error('Error extracting waveform:', error);
        // Show flat line on error — no fake random data
        setWaveformData(Array.from(new Float32Array(100)));
      } finally {
        setIsLoading(false);
      }
    };

    extractWaveform();
  }, [audioUrl, audioBuffer, width]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const barWidth = width / waveformData.length;
    const centerY = height / 2;

    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height * 0.8;
      
      // Determine if this bar is before or after the playhead
      const normalizedIndex = index / waveformData.length;
      const isPast = normalizedIndex <= playheadPosition;
      
      // Set color based on playback position
      if (isPast) {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = `${color}40`;
      }

      // Draw bar (centered)
      const barX = x + barWidth * 0.1;
      const actualBarWidth = barWidth * 0.8;
      
      ctx.beginPath();
      ctx.roundRect(barX, centerY - barHeight / 2, actualBarWidth, barHeight, 1);
      ctx.fill();
    });

    // Draw playhead
    if (playheadPosition > 0) {
      const playheadX = playheadPosition * width;
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fillRect(playheadX - 1, 0, 2, height);
    }

    // Draw hover indicator
    if (isHovering) {
      const hoverX = hoverPosition * width;
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.fillRect(hoverX - 0.5, 0, 1, height);
    }
  }, [waveformData, width, height, color, backgroundColor, playheadPosition, isHovering, hoverPosition]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !onSeek) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = x / width;
    onSeek(Math.max(0, Math.min(1, position)));
  }, [width, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverPosition(x / width);
  }, [width]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative", className)}
      style={{ width, height }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded">
          <div className="flex gap-1 items-center">
            {[10, 20, 16, 24, 12].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-primary animate-pulse rounded"
                style={{
                  height: h,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width, height }}
          className="cursor-pointer"
        />
      )}

      {/* Timeline */}
      {showTimeline && duration > 0 && (
        <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[10px] text-muted-foreground px-1">
          <span>{formatTime(0)}</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      {/* Hover time indicator */}
      {isHovering && duration > 0 && (
        <div 
          className="absolute top-0 px-1.5 py-0.5 bg-popover text-popover-foreground text-xs rounded shadow-lg pointer-events-none"
          style={{ left: hoverPosition * width - 20 }}
        >
          {formatTime(hoverPosition * duration)}
        </div>
      )}
    </div>
  );
}

// Mini waveform for clip thumbnails
interface MiniWaveformProps {
  audioUrl?: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function MiniWaveform({ 
  audioUrl, 
  width = 100, 
  height = 24, 
  color = 'hsl(var(--primary))',
  className 
}: MiniWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData] = useState<number[]>(() =>
    Array.from(new Float32Array(30))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    const barWidth = width / waveformData.length;
    const centerY = height / 2;

    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height;
      
      ctx.fillStyle = `${color}80`;
      const barX = x + barWidth * 0.15;
      const actualBarWidth = barWidth * 0.7;
      
      ctx.beginPath();
      ctx.roundRect(barX, centerY - barHeight / 2, actualBarWidth, barHeight, 1);
      ctx.fill();
    });
  }, [waveformData, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={className}
    />
  );
}
