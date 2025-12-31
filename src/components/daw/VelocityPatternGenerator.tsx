import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Activity, Wand2, Play, RotateCcw, Zap, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MidiNote } from '@/types/daw';

// ML-derived velocity patterns for Amapiano
const VELOCITY_PATTERNS = {
  // Log drum patterns
  logDrum: {
    classic: {
      name: 'Classic Log',
      pattern: [100, 65, 85, 70, 95, 68, 82, 72],
      description: 'Traditional log drum accents'
    },
    bounce: {
      name: 'Bounce',
      pattern: [95, 75, 88, 68, 100, 72, 85, 65],
      description: 'Energetic bounce feel'
    },
    subtle: {
      name: 'Subtle',
      pattern: [90, 78, 85, 80, 88, 76, 82, 78],
      description: 'Gentle, consistent dynamics'
    }
  },
  // Hi-hat patterns
  hiHat: {
    driving: {
      name: 'Driving',
      pattern: [100, 50, 80, 55, 95, 52, 78, 58],
      description: 'Strong downbeats, light offbeats'
    },
    shuffle: {
      name: 'Shuffle',
      pattern: [90, 60, 75, 85, 88, 58, 72, 80],
      description: 'Shuffled accent pattern'
    },
    ghost: {
      name: 'Ghost Notes',
      pattern: [85, 35, 65, 40, 82, 38, 62, 42],
      description: 'Prominent ghost notes'
    }
  },
  // Shaker patterns
  shaker: {
    smooth: {
      name: 'Smooth',
      pattern: [80, 70, 75, 72, 78, 68, 74, 70],
      description: 'Even, flowing dynamics'
    },
    accented: {
      name: 'Accented',
      pattern: [95, 60, 85, 65, 92, 58, 82, 62],
      description: 'Strong accent on beats'
    }
  },
  // Piano patterns
  piano: {
    jazzy: {
      name: 'Jazzy',
      pattern: [88, 72, 80, 68, 85, 70, 78, 65],
      description: 'Jazz-influenced dynamics'
    },
    punchy: {
      name: 'Punchy',
      pattern: [100, 65, 90, 60, 95, 62, 88, 58],
      description: 'Strong chord attacks'
    },
    soft: {
      name: 'Soft Touch',
      pattern: [75, 65, 70, 62, 72, 60, 68, 58],
      description: 'Delicate, expressive touch'
    }
  }
};

type InstrumentType = keyof typeof VELOCITY_PATTERNS;
type PatternKey<T extends InstrumentType> = keyof typeof VELOCITY_PATTERNS[T];

interface VelocityPatternGeneratorProps {
  notes: MidiNote[];
  onApplyPattern: (patterneNotes: MidiNote[]) => void;
  onPreview?: (notes: MidiNote[]) => void;
}

export const VelocityPatternGenerator: React.FC<VelocityPatternGeneratorProps> = ({
  notes,
  onApplyPattern,
  onPreview
}) => {
  const [instrument, setInstrument] = useState<InstrumentType>('logDrum');
  const [pattern, setPattern] = useState<string>('classic');
  const [intensity, setIntensity] = useState(100);
  const [humanize, setHumanize] = useState(10);
  const [preserveExisting, setPreserveExisting] = useState(false);
  const [customPattern, setCustomPattern] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Get current pattern
  const currentPatterns = VELOCITY_PATTERNS[instrument] as Record<string, { name: string; pattern: number[]; description: string }>;
  const currentPatternData = currentPatterns[pattern];
  const activePattern = customPattern.length > 0 ? customPattern : currentPatternData?.pattern || [];

  // Apply pattern to notes
  const applyPatternToNotes = useCallback(() => {
    if (!activePattern.length || !notes.length) return notes;

    return notes.map((note, index) => {
      const patternIndex = index % activePattern.length;
      let baseVelocity = activePattern[patternIndex];
      
      // Scale by intensity
      baseVelocity = baseVelocity * (intensity / 100);
      
      // Add humanization
      if (humanize > 0) {
        const variation = (Math.random() - 0.5) * 2 * humanize;
        baseVelocity += variation;
      }
      
      // Blend with existing if preserving
      if (preserveExisting) {
        baseVelocity = (baseVelocity + note.velocity) / 2;
      }
      
      return {
        ...note,
        velocity: Math.max(1, Math.min(127, Math.round(baseVelocity)))
      };
    });
  }, [notes, activePattern, intensity, humanize, preserveExisting]);

  const handleApply = () => {
    const patternedNotes = applyPatternToNotes();
    onApplyPattern(patternedNotes);
  };

  const handlePreview = () => {
    if (onPreview) {
      const patternedNotes = applyPatternToNotes();
      onPreview(patternedNotes);
    }
  };

  const handleRandomize = () => {
    const randomPattern = Array.from({ length: 8 }, () => 
      Math.round(50 + Math.random() * 50)
    );
    setCustomPattern(randomPattern);
  };

  const handlePatternBarClick = (index: number, e: React.MouseEvent) => {
    if (!isEditing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const newValue = Math.round((1 - y / height) * 127);
    
    const newPattern = [...activePattern];
    newPattern[index] = Math.max(1, Math.min(127, newValue));
    setCustomPattern(newPattern);
  };

  const handleInstrumentChange = (value: InstrumentType) => {
    setInstrument(value);
    const firstPattern = Object.keys(VELOCITY_PATTERNS[value])[0];
    setPattern(firstPattern);
    setCustomPattern([]);
  };

  return (
    <Card className="bg-gradient-to-br from-background via-background to-green-500/5 border-green-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Velocity Pattern Generator</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apply ML-derived dynamics to {notes.length} notes
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600">
            <Zap className="w-3 h-3" />
            ML-Patterns
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Instrument & Pattern Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm">Instrument</Label>
            <Select value={instrument} onValueChange={handleInstrumentChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="logDrum">Log Drum</SelectItem>
                <SelectItem value="hiHat">Hi-Hat</SelectItem>
                <SelectItem value="shaker">Shaker</SelectItem>
                <SelectItem value="piano">Piano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Pattern</Label>
            <Select 
              value={pattern} 
              onValueChange={(v) => {
                setPattern(v);
                setCustomPattern([]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currentPatterns).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pattern Description */}
        {currentPatternData && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            {currentPatternData.description}
          </p>
        )}

        {/* Visual Pattern Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Pattern Visualization</Label>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRandomize}
              >
                <Shuffle className="w-3 h-3 mr-1" />
                Random
              </Button>
              <Button 
                variant={isEditing ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            </div>
          </div>
          
          <div 
            className={cn(
              "flex gap-1 h-24 p-2 bg-muted/20 rounded-lg border transition-colors",
              isEditing ? "border-green-500/50 cursor-pointer" : "border-border/50"
            )}
          >
            {activePattern.map((velocity, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end cursor-pointer"
                onClick={(e) => handlePatternBarClick(i, e)}
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    isEditing ? "bg-green-500" : "bg-green-500/70",
                    "hover:bg-green-400"
                  )}
                  style={{ height: `${(velocity / 127) * 100}%` }}
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-[10px] text-muted-foreground px-2">
            {activePattern.map((v, i) => (
              <span key={i} className="tabular-nums">{v}</span>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Pattern Intensity</Label>
            <span className="text-sm font-mono tabular-nums">{intensity}%</span>
          </div>
          <Slider
            value={[intensity]}
            onValueChange={([v]) => setIntensity(v)}
            min={50}
            max={150}
            step={5}
          />
        </div>

        {/* Humanize */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Humanize Amount</Label>
            <span className="text-sm font-mono tabular-nums">{humanize}%</span>
          </div>
          <Slider
            value={[humanize]}
            onValueChange={([v]) => setHumanize(v)}
            min={0}
            max={30}
            step={1}
          />
        </div>

        {/* Options */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Switch 
              id="preserve" 
              checked={preserveExisting} 
              onCheckedChange={setPreserveExisting} 
            />
            <Label htmlFor="preserve" className="text-sm cursor-pointer">
              Blend with existing velocities
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCustomPattern([])}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          {onPreview && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handlePreview}
              disabled={notes.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button 
            className="flex-1"
            onClick={handleApply}
            disabled={notes.length === 0}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Apply Pattern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VelocityPatternGenerator;
