import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface AudioTimelineProps {
  duration: number;
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
  onTrimStartChange: (value: number) => void;
  onTrimEndChange: (value: number) => void;
  peaks: number[];
}

export const AudioTimeline = ({
  duration,
  trimStart,
  trimEnd,
  fadeIn,
  fadeOut,
  onTrimStartChange,
  onTrimEndChange,
  peaks
}: AudioTimelineProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = canvas.width;
    const clickPercent = (x / width) * 100;

    const trimStartX = (trimStart / 100) * width;
    const trimEndX = (trimEnd / 100) * width;

    // Check if clicking near markers (within 10px)
    if (Math.abs(x - trimStartX) < 10) {
      setDragging('start');
    } else if (Math.abs(x - trimEndX) < 10) {
      setDragging('end');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / canvasRef.current.width) * 100));

    if (dragging === 'start' && percent < trimEnd) {
      onTrimStartChange(percent);
    } else if (dragging === 'end' && percent > trimStart) {
      onTrimEndChange(percent);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.fillStyle = '#3b82f6';
    const barWidth = width / peaks.length;
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = peak * (height * 0.3);
      const y = (height / 2) - (barHeight / 2);
      ctx.fillRect(x, y, Math.max(barWidth, 1), barHeight);
    });

    // Draw time markers
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#9ca3af';

    const markerCount = 10;
    for (let i = 0; i <= markerCount; i++) {
      const x = (i / markerCount) * width;
      const time = (i / markerCount) * duration;
      
      ctx.beginPath();
      ctx.moveTo(x, height - 20);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      ctx.fillText(formatTime(time), x - 20, height - 5);
    }

    // Draw trim region
    const trimStartX = (trimStart / 100) * width;
    const trimEndX = (trimEnd / 100) * width;
    
    // Inactive regions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, trimStartX, height - 25);
    ctx.fillRect(trimEndX, 0, width - trimEndX, height - 25);

    // Fade regions
    const activeWidth = trimEndX - trimStartX;
    const fadeInWidth = (fadeIn / 100) * activeWidth;
    const fadeOutWidth = (fadeOut / 100) * activeWidth;

    ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.fillRect(trimStartX, 0, fadeInWidth, height - 25);

    ctx.fillStyle = 'rgba(251, 146, 60, 0.3)';
    ctx.fillRect(trimEndX - fadeOutWidth, 0, fadeOutWidth, height - 25);

    // Draw trim markers
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(trimStartX, 0);
    ctx.lineTo(trimStartX, height - 25);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(trimEndX, 0);
    ctx.lineTo(trimEndX, height - 25);
    ctx.stroke();

    // Draw marker handles
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(trimStartX - 4, 0, 8, 15);
    ctx.fillRect(trimEndX - 4, 0, 8, 15);

  }, [peaks, trimStart, trimEnd, fadeIn, fadeOut, duration]);

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Label>Timeline Editor</Label>
        <div className="text-xs text-muted-foreground">
          {formatTime((trimStart / 100) * duration)} → {formatTime((trimEnd / 100) * duration)}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="w-full border border-border rounded-lg cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-destructive" />
          <span>Drag markers to trim</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500/30" />
          <span>Fade In</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500/30" />
          <span>Fade Out</span>
        </div>
      </div>
    </Card>
  );
};
