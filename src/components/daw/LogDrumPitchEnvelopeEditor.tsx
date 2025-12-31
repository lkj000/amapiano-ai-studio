import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Drum, Play, RotateCcw, Save, Zap, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

// ML-derived log drum pitch envelope presets
const LOG_DRUM_PRESETS = {
  classic: {
    name: 'Classic Log Drum',
    startPitch: 180,
    endPitch: 45,
    decayCurve: 'logarithmic' as const,
    decayTime: 0.35,
    attackTime: 0.002,
    overtones: [1.0, 0.3, 0.15],
    description: 'Traditional Amapiano log drum sound'
  },
  deep: {
    name: 'Deep Sub',
    startPitch: 150,
    endPitch: 35,
    decayCurve: 'exponential' as const,
    decayTime: 0.45,
    attackTime: 0.001,
    overtones: [1.0, 0.2, 0.08],
    description: 'Extended low-end for club systems'
  },
  punchy: {
    name: 'Punchy Attack',
    startPitch: 220,
    endPitch: 55,
    decayCurve: 'linear' as const,
    decayTime: 0.25,
    attackTime: 0.0005,
    overtones: [1.0, 0.45, 0.25, 0.1],
    description: 'Aggressive transient with quick decay'
  },
  warm: {
    name: 'Warm Bounce',
    startPitch: 160,
    endPitch: 50,
    decayCurve: 'logarithmic' as const,
    decayTime: 0.38,
    attackTime: 0.003,
    overtones: [1.0, 0.35, 0.18, 0.05],
    description: 'Smooth, rounded log drum character'
  },
  tribal: {
    name: 'Tribal Tone',
    startPitch: 200,
    endPitch: 60,
    decayCurve: 'exponential' as const,
    decayTime: 0.3,
    attackTime: 0.002,
    overtones: [1.0, 0.5, 0.3, 0.15],
    description: 'Organic, percussion-forward sound'
  }
};

interface EnvelopePoint {
  x: number; // 0-1 normalized time
  y: number; // 0-1 normalized pitch
}

interface LogDrumPitchEnvelopeEditorProps {
  onEnvelopeChange?: (envelope: {
    points: EnvelopePoint[];
    startPitch: number;
    endPitch: number;
    decayTime: number;
    attackTime: number;
  }) => void;
  onPreview?: () => void;
  onSave?: (preset: typeof LOG_DRUM_PRESETS[keyof typeof LOG_DRUM_PRESETS]) => void;
}

export const LogDrumPitchEnvelopeEditor: React.FC<LogDrumPitchEnvelopeEditorProps> = ({
  onEnvelopeChange,
  onPreview,
  onSave
}) => {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof LOG_DRUM_PRESETS>('classic');
  const [startPitch, setStartPitch] = useState(LOG_DRUM_PRESETS.classic.startPitch);
  const [endPitch, setEndPitch] = useState(LOG_DRUM_PRESETS.classic.endPitch);
  const [decayTime, setDecayTime] = useState(LOG_DRUM_PRESETS.classic.decayTime);
  const [attackTime, setAttackTime] = useState(LOG_DRUM_PRESETS.classic.attackTime);
  const [decayCurve, setDecayCurve] = useState<'linear' | 'logarithmic' | 'exponential'>(
    LOG_DRUM_PRESETS.classic.decayCurve
  );
  const [envelopePoints, setEnvelopePoints] = useState<EnvelopePoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate envelope points from current settings
  const generateEnvelopePoints = useCallback(() => {
    const points: EnvelopePoint[] = [];
    const numPoints = 50;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      let y: number;
      
      if (t < attackTime / decayTime) {
        // Attack phase - quick rise
        y = t / (attackTime / decayTime);
      } else {
        // Decay phase
        const decayT = (t - attackTime / decayTime) / (1 - attackTime / decayTime);
        
        switch (decayCurve) {
          case 'logarithmic':
            y = 1 - Math.log(1 + decayT * 9) / Math.log(10);
            break;
          case 'exponential':
            y = Math.exp(-decayT * 4);
            break;
          case 'linear':
          default:
            y = 1 - decayT;
        }
      }
      
      points.push({ x: t, y: Math.max(0, Math.min(1, y)) });
    }
    
    return points;
  }, [attackTime, decayTime, decayCurve]);

  // Draw envelope on canvas
  const drawEnvelope = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'hsl(var(--border) / 0.3)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (time)
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - padding * 2);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    // Horizontal grid lines (pitch)
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * (height - padding * 2);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw envelope curve
    const points = envelopePoints.length > 0 ? envelopePoints : generateEnvelopePoints();
    
    ctx.beginPath();
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    points.forEach((point, i) => {
      const x = padding + point.x * (width - padding * 2);
      const y = height - padding - point.y * (height - padding * 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw filled area
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'hsl(var(--primary) / 0.3)');
    gradient.addColorStop(1, 'hsl(var(--primary) / 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw pitch labels
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${startPitch}Hz`, padding - 5, padding + 10);
    ctx.fillText(`${endPitch}Hz`, padding - 5, height - padding);
    
    // Draw time labels
    ctx.textAlign = 'center';
    ctx.fillText('0ms', padding, height - 5);
    ctx.fillText(`${Math.round(decayTime * 1000)}ms`, width - padding, height - 5);
  }, [envelopePoints, generateEnvelopePoints, startPitch, endPitch, decayTime]);

  // Update envelope when settings change
  useEffect(() => {
    const points = generateEnvelopePoints();
    setEnvelopePoints(points);
  }, [generateEnvelopePoints]);

  // Draw envelope when points change
  useEffect(() => {
    drawEnvelope();
  }, [drawEnvelope]);

  // Resize canvas on mount
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = 200;
      drawEnvelope();
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [drawEnvelope]);

  const handlePresetChange = (preset: keyof typeof LOG_DRUM_PRESETS) => {
    setSelectedPreset(preset);
    const p = LOG_DRUM_PRESETS[preset];
    setStartPitch(p.startPitch);
    setEndPitch(p.endPitch);
    setDecayTime(p.decayTime);
    setAttackTime(p.attackTime);
    setDecayCurve(p.decayCurve);
  };

  const handleReset = () => {
    handlePresetChange(selectedPreset);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        name: 'Custom',
        startPitch,
        endPitch,
        decayCurve,
        decayTime,
        attackTime,
        overtones: LOG_DRUM_PRESETS[selectedPreset].overtones,
        description: 'Custom log drum envelope'
      });
    }
  };

  const preset = LOG_DRUM_PRESETS[selectedPreset];

  return (
    <Card className="bg-gradient-to-br from-background via-background to-orange-500/5 border-orange-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Drum className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Log Drum Pitch Envelope</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Shape the characteristic pitch sweep
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-600">
            <Zap className="w-3 h-3" />
            ML-Derived
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preset Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preset</Label>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOG_DRUM_PRESETS).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span>{value.name}</span>
                    <span className="text-xs text-muted-foreground">{value.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Envelope Visualization */}
        <div 
          ref={containerRef}
          className="relative bg-muted/20 rounded-lg border border-border/50 overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: 200 }}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="outline" className="text-[10px]">
              Start: {startPitch}Hz
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              End: {endPitch}Hz
            </Badge>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Pitch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Start Pitch</Label>
              <span className="text-xs font-mono">{startPitch}Hz</span>
            </div>
            <Slider
              value={[startPitch]}
              onValueChange={([v]) => setStartPitch(v)}
              min={100}
              max={300}
              step={5}
            />
          </div>

          {/* End Pitch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">End Pitch</Label>
              <span className="text-xs font-mono">{endPitch}Hz</span>
            </div>
            <Slider
              value={[endPitch]}
              onValueChange={([v]) => setEndPitch(v)}
              min={30}
              max={100}
              step={5}
            />
          </div>

          {/* Decay Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Decay Time</Label>
              <span className="text-xs font-mono">{Math.round(decayTime * 1000)}ms</span>
            </div>
            <Slider
              value={[decayTime * 1000]}
              onValueChange={([v]) => setDecayTime(v / 1000)}
              min={150}
              max={600}
              step={10}
            />
          </div>

          {/* Attack Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Attack Time</Label>
              <span className="text-xs font-mono">{Math.round(attackTime * 1000)}ms</span>
            </div>
            <Slider
              value={[attackTime * 1000]}
              onValueChange={([v]) => setAttackTime(v / 1000)}
              min={0.5}
              max={10}
              step={0.5}
            />
          </div>
        </div>

        {/* Curve Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Decay Curve</Label>
          <div className="flex gap-2">
            {(['linear', 'logarithmic', 'exponential'] as const).map((curve) => (
              <Button
                key={curve}
                variant={decayCurve === curve ? 'default' : 'outline'}
                size="sm"
                className="flex-1 capitalize"
                onClick={() => setDecayCurve(curve)}
              >
                {curve}
              </Button>
            ))}
          </div>
        </div>

        {/* Overtone Display */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Harmonic Structure</Label>
          <div className="flex gap-2 items-end h-12">
            {preset.overtones.map((level, i) => (
              <div
                key={i}
                className="flex-1 bg-orange-500/60 rounded-t transition-all"
                style={{ height: `${level * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Fundamental</span>
            <span>2nd</span>
            <span>3rd</span>
            {preset.overtones.length > 3 && <span>4th</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          {onPreview && (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={onPreview}
            >
              <Play className="w-4 h-4 mr-1" />
              Preview
            </Button>
          )}
          <Button 
            size="sm"
            className="flex-1"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Envelope
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogDrumPitchEnvelopeEditor;
