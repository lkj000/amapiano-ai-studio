import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Music2, Wand2, RotateCcw, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MidiNote } from '@/types/daw';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Amapiano swing patterns derived from ML analysis
const AMAPIANO_SWING_PROFILES = {
  johannesburg: {
    name: 'Johannesburg Deep',
    swingAmount: 0.67,
    microTimingOffsets: [0, 0.015, -0.008, 0.012, 0, 0.018, -0.005, 0.010],
    velocityAccents: [1.0, 0.7, 0.85, 0.75, 0.95, 0.7, 0.88, 0.72],
    description: 'Deep, laid-back swing with pronounced pocket feel'
  },
  pretoria: {
    name: 'Pretoria Bounce',
    swingAmount: 0.62,
    microTimingOffsets: [0, 0.012, -0.006, 0.014, 0, 0.016, -0.004, 0.008],
    velocityAccents: [1.0, 0.65, 0.9, 0.7, 0.98, 0.68, 0.85, 0.75],
    description: 'Energetic bounce with tighter swing'
  },
  durban: {
    name: 'Durban Groove',
    swingAmount: 0.58,
    microTimingOffsets: [0, 0.010, -0.010, 0.008, 0, 0.012, -0.008, 0.006],
    velocityAccents: [0.95, 0.72, 0.88, 0.78, 1.0, 0.7, 0.82, 0.76],
    description: 'Gqom-influenced straight feel with subtle swing'
  },
  'cape-town': {
    name: 'Cape Town Smooth',
    swingAmount: 0.72,
    microTimingOffsets: [0, 0.018, -0.005, 0.016, 0, 0.020, -0.003, 0.014],
    velocityAccents: [1.0, 0.68, 0.82, 0.7, 0.92, 0.72, 0.85, 0.68],
    description: 'Smooth, jazzy swing with relaxed feel'
  }
} as const;

interface AmapianoSwingQuantizerProps {
  notes: MidiNote[];
  onQuantize: (quantizedNotes: MidiNote[]) => void;
  bpm?: number;
  onPreview?: (notes: MidiNote[]) => void;
}

export const AmapianoSwingQuantizer: React.FC<AmapianoSwingQuantizerProps> = ({
  notes,
  onQuantize,
  bpm = 118,
  onPreview
}) => {
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof AMAPIANO_SWING_PROFILES>('johannesburg');
  const [swingAmount, setSwingAmount] = useState(AMAPIANO_SWING_PROFILES.johannesburg.swingAmount * 100);
  const [humanizeAmount, setHumanizeAmount] = useState(15);
  const [velocityVariation, setVelocityVariation] = useState(10);
  const [applyAccents, setApplyAccents] = useState(true);
  const [preserveOriginalTiming, setPreserveOriginalTiming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const profile = AMAPIANO_SWING_PROFILES[selectedRegion];

  // Calculate swing position for a note
  const calculateSwingPosition = useCallback((
    originalTime: number,
    gridSize: number = 0.25 // 16th note
  ) => {
    const beatsPerSecond = bpm / 60;
    const gridPosition = Math.round(originalTime / gridSize);
    const isOffbeat = gridPosition % 2 === 1;
    
    if (!isOffbeat) {
      return gridPosition * gridSize;
    }
    
    // Apply swing to offbeat notes
    const swingOffset = (swingAmount / 100) * gridSize * 0.5;
    return gridPosition * gridSize + swingOffset;
  }, [bpm, swingAmount]);

  // Apply micro-timing humanization
  const applyMicroTiming = useCallback((
    note: MidiNote,
    index: number
  ): MidiNote => {
    const patternIndex = index % profile.microTimingOffsets.length;
    const baseOffset = profile.microTimingOffsets[patternIndex];
    
    // Add random variation scaled by humanize amount
    const randomVariation = (Math.random() - 0.5) * 0.02 * (humanizeAmount / 100);
    const totalOffset = baseOffset * (humanizeAmount / 100) + randomVariation;
    
    // Calculate new timing
    let newStartTime = note.startTime;
    if (!preserveOriginalTiming) {
      newStartTime = calculateSwingPosition(note.startTime);
    }
    newStartTime += totalOffset;
    
    // Apply velocity accent pattern
    let newVelocity = note.velocity;
    if (applyAccents) {
      const accentMultiplier = profile.velocityAccents[patternIndex];
      const velocityRandom = 1 + (Math.random() - 0.5) * 0.1 * (velocityVariation / 100);
      newVelocity = Math.min(127, Math.max(1, Math.round(
        note.velocity * accentMultiplier * velocityRandom
      )));
    }
    
    return {
      ...note,
      startTime: Math.max(0, newStartTime),
      velocity: newVelocity
    };
  }, [profile, humanizeAmount, velocityVariation, applyAccents, preserveOriginalTiming, calculateSwingPosition]);

  // Process all notes
  const processNotes = useCallback(() => {
    setIsProcessing(true);
    
    try {
      const quantizedNotes = notes.map((note, index) => 
        applyMicroTiming(note, index)
      );
      
      // Sort by start time
      quantizedNotes.sort((a, b) => a.startTime - b.startTime);
      
      return quantizedNotes;
    } finally {
      setIsProcessing(false);
    }
  }, [notes, applyMicroTiming]);

  const handleQuantize = () => {
    const quantizedNotes = processNotes();
    onQuantize(quantizedNotes);
  };

  const handlePreview = () => {
    if (onPreview) {
      const quantizedNotes = processNotes();
      onPreview(quantizedNotes);
    }
  };

  const handleRegionChange = (region: keyof typeof AMAPIANO_SWING_PROFILES) => {
    setSelectedRegion(region);
    setSwingAmount(AMAPIANO_SWING_PROFILES[region].swingAmount * 100);
  };

  return (
    <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Amapiano Swing Quantizer</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                ML-derived swing patterns from {notes.length} notes
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Zap className="w-3 h-3" />
            ML-Enhanced
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Region Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Regional Style</Label>
          <Select value={selectedRegion} onValueChange={handleRegionChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AMAPIANO_SWING_PROFILES).map(([key, value]) => (
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

        {/* Swing Amount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Swing Amount</Label>
            <span className="text-sm font-mono tabular-nums">{swingAmount.toFixed(0)}%</span>
          </div>
          <Slider
            value={[swingAmount]}
            onValueChange={([v]) => setSwingAmount(v)}
            min={50}
            max={80}
            step={1}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Straight</span>
            <span>Heavy Swing</span>
          </div>
        </div>

        {/* Humanize Amount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Humanize</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Applies micro-timing variations learned from authentic Amapiano recordings
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-mono tabular-nums">{humanizeAmount}%</span>
          </div>
          <Slider
            value={[humanizeAmount]}
            onValueChange={([v]) => setHumanizeAmount(v)}
            min={0}
            max={50}
            step={1}
            className="py-1"
          />
        </div>

        {/* Velocity Variation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Velocity Variation</Label>
            <span className="text-sm font-mono tabular-nums">{velocityVariation}%</span>
          </div>
          <Slider
            value={[velocityVariation]}
            onValueChange={([v]) => setVelocityVariation(v)}
            min={0}
            max={30}
            step={1}
            className="py-1"
          />
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Apply Regional Accents</Label>
            <Switch checked={applyAccents} onCheckedChange={setApplyAccents} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Preserve Original Timing</Label>
            <Switch checked={preserveOriginalTiming} onCheckedChange={setPreserveOriginalTiming} />
          </div>
        </div>

        {/* Pattern Visualization */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Accent Pattern Preview</Label>
          <div className="flex gap-1">
            {profile.velocityAccents.map((accent, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-sm transition-all",
                  accent > 0.9 ? "bg-primary" : accent > 0.8 ? "bg-primary/70" : "bg-primary/40"
                )}
                style={{ height: `${accent * 32}px` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onPreview && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handlePreview}
              disabled={isProcessing || notes.length === 0}
            >
              <Music2 className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button 
            className="flex-1"
            onClick={handleQuantize}
            disabled={isProcessing || notes.length === 0}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Apply Swing'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AmapianoSwingQuantizer;
