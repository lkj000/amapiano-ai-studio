import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface OscilloscopeProps {
  width?: number;
  height?: number;
  color?: string;
  parameters?: Array<{ value: number; min: number; max: number }>;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  width = 600,
  height = 200,
  color = 'hsl(var(--primary))',
  parameters = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);
  const [resolvedColor, setResolvedColor] = useState<string>('');

  // Resolve CSS variable to actual color
  useEffect(() => {
    if (canvasRef.current) {
      const computedStyle = getComputedStyle(canvasRef.current);
      const primaryColor = computedStyle.getPropertyValue('--primary').trim();
      if (primaryColor) {
        setResolvedColor(`hsl(${primaryColor})`);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    const draw = () => {
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'hsl(var(--muted) / 0.3)';
      ctx.lineWidth = 0.5;
      
      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Calculate waveform parameters based on plugin parameters
      let frequency = 2;
      let amplitude = 0.4;
      let waveformType = 'sine';

      if (parameters.length > 0) {
        // Map first parameter to frequency
        const normalized = (parameters[0].value - parameters[0].min) / (parameters[0].max - parameters[0].min);
        frequency = 1 + normalized * 4;
      }

      if (parameters.length > 1) {
        // Map second parameter to amplitude
        const normalized = (parameters[1].value - parameters[1].min) / (parameters[1].max - parameters[1].min);
        amplitude = normalized * 0.45;
      }

      // Draw waveform with glow effect
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const drawColor = resolvedColor || '#8b5cf6';

      // Outer glow
      ctx.shadowColor = drawColor;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = drawColor.replace(')', ' / 0.25)').replace('hsl(', 'hsl(');
      drawWave(ctx, width, height, frequency, amplitude, phaseRef.current);

      // Middle glow
      ctx.shadowBlur = 10;
      ctx.strokeStyle = drawColor.replace(')', ' / 0.5)').replace('hsl(', 'hsl(');
      drawWave(ctx, width, height, frequency, amplitude, phaseRef.current);

      // Core line
      ctx.shadowBlur = 5;
      ctx.strokeStyle = drawColor;
      drawWave(ctx, width, height, frequency, amplitude, phaseRef.current);

      phaseRef.current += 0.02;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, color, parameters, resolvedColor]);

  const drawWave = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frequency: number,
    amplitude: number,
    phase: number
  ) => {
    ctx.beginPath();
    const samples = width * 2;
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * width;
      const t = (i / samples) * Math.PI * 2 * frequency + phase;
      
      // Complex waveform with harmonics
      let y = Math.sin(t) * amplitude;
      y += Math.sin(t * 2) * amplitude * 0.3;
      y += Math.sin(t * 3) * amplitude * 0.15;
      
      y = height / 2 + y * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };

  return (
    <Card className="p-4 bg-background/95 backdrop-blur border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-sm font-semibold text-foreground">Live Oscilloscope</span>
      </div>
      <div className="relative rounded-lg overflow-hidden border border-primary/20">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ 
            background: 'hsl(var(--background))',
            imageRendering: 'crisp-edges'
          }}
        />
      </div>
    </Card>
  );
};
