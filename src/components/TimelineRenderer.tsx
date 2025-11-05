import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface TimelineTrack {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  originalBPM: number;
  targetBPM: number;
  peaks: number[];
  color?: string;
}

interface TimelineRendererProps {
  tracks: TimelineTrack[];
  projectBPM: number;
  onTrackMove?: (trackId: string, newStartTime: number) => void;
  onTrackRemove?: (trackId: string) => void;
  className?: string;
}

export function TimelineRenderer({
  tracks,
  projectBPM,
  onTrackMove,
  onTrackRemove,
  className
}: TimelineRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [zoom, setZoom] = useState([1]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [draggedTrack, setDraggedTrack] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const pixelsPerSecond = 50 * zoom[0];
  const trackHeight = 80;
  const timelineWidth = 10000; // Large scrollable area

  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw time markers
    ctx.fillStyle = '#404040';
    ctx.font = '12px monospace';
    const secondsPerMarker = zoom[0] < 2 ? 5 : zoom[0] < 5 ? 2 : 1;
    
    for (let i = 0; i < timelineWidth / pixelsPerSecond; i += secondsPerMarker) {
      const x = i * pixelsPerSecond - scrollOffset;
      if (x < 0 || x > width) continue;

      ctx.strokeStyle = i % 10 === 0 ? '#666' : '#333';
      ctx.lineWidth = i % 10 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      if (i % 10 === 0) {
        const minutes = Math.floor(i / 60);
        const seconds = i % 60;
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, x + 4, 16);
      }
    }

    // Draw tracks
    tracks.forEach((track, index) => {
      const y = 40 + index * (trackHeight + 10);
      const x = track.startTime * pixelsPerSecond - scrollOffset;
      const w = track.duration * pixelsPerSecond;

      // Track background
      ctx.fillStyle = track.color || '#1e40af';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y, w, trackHeight);
      ctx.globalAlpha = 1;

      // Track border
      ctx.strokeStyle = track.color || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, trackHeight);

      // Draw waveform
      if (track.peaks && track.peaks.length > 0) {
        ctx.strokeStyle = track.color || '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const peakStep = Math.max(1, Math.floor(track.peaks.length / w));
        for (let i = 0; i < w; i++) {
          const peakIndex = Math.floor((i / w) * track.peaks.length);
          const peak = track.peaks[peakIndex] || 0;
          const waveHeight = peak * (trackHeight * 0.8);
          const waveY = y + trackHeight / 2;
          
          if (i === 0) {
            ctx.moveTo(x + i, waveY);
          } else {
            ctx.lineTo(x + i, waveY - waveHeight / 2);
            ctx.lineTo(x + i, waveY + waveHeight / 2);
          }
        }
        ctx.stroke();
      }

      // Track info
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(track.name, x + 8, y + 20);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(
        `${track.originalBPM}→${track.targetBPM} BPM | ${track.duration.toFixed(1)}s`,
        x + 8,
        y + 40
      );
    });

    // Draw playhead
    const playheadX = playheadPosition * pixelsPerSecond - scrollOffset;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Playhead triangle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playheadX - 8, 0);
    ctx.lineTo(playheadX + 8, 0);
    ctx.lineTo(playheadX, 10);
    ctx.closePath();
    ctx.fill();
  }, [tracks, playheadPosition, scrollOffset, zoom, pixelsPerSecond, timelineWidth, trackHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = Math.max(400, 50 + tracks.length * (trackHeight + 10));

    drawTimeline();
  }, [tracks, playheadPosition, scrollOffset, zoom, drawTimeline, trackHeight]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = null;
    } else {
      setIsPlaying(true);
      startTimeRef.current = Date.now() - playheadPosition * 1000;
      
      const animate = () => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setPlayheadPosition(elapsed);
          
          // Auto-scroll to follow playhead
          const playheadX = elapsed * pixelsPerSecond;
          const canvas = canvasRef.current;
          if (canvas && playheadX - scrollOffset > canvas.width * 0.8) {
            setScrollOffset(playheadX - canvas.width * 0.5);
          }
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }
  }, [isPlaying, playheadPosition, pixelsPerSecond, scrollOffset]);

  const resetPlayhead = useCallback(() => {
    setIsPlaying(false);
    setPlayheadPosition(0);
    setScrollOffset(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = null;
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const time = x / pixelsPerSecond;
    
    setPlayheadPosition(time);
  }, [scrollOffset, pixelsPerSecond]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Zoom
      const newZoom = Math.max(0.5, Math.min(10, zoom[0] + e.deltaY * -0.01));
      setZoom([newZoom]);
    } else {
      // Scroll
      setScrollOffset(prev => Math.max(0, prev + e.deltaY));
    }
  }, [zoom]);

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button size="sm" variant={isPlaying ? "default" : "outline"} onClick={togglePlayback}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={resetPlayhead}>
              <SkipBack className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-mono text-muted-foreground">
              {Math.floor(playheadPosition / 60)}:{(playheadPosition % 60).toFixed(1).padStart(4, '0')}
            </span>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">{projectBPM} BPM</span>
          </div>

          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={zoom}
              onValueChange={setZoom}
              min={0.5}
              max={10}
              step={0.1}
              className="w-32"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-mono min-w-[3rem] text-right">
              {zoom[0].toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            className="w-full cursor-crosshair"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Click timeline to move playhead • Scroll to pan • Ctrl+Scroll to zoom</p>
          <p>• {tracks.length} track{tracks.length !== 1 ? 's' : ''} loaded</p>
        </div>
      </div>
    </Card>
  );
}