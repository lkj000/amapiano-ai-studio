/**
 * SI Panel - Synthetic Intelligence control panel
 * Left sidebar with sub-genre, mood, key, duration, cloud save controls
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Activity,
  Cloud,
  Timer,
  Loader2,
  Zap,
  Brain,
} from 'lucide-react';

interface SIPanelProps {
  onGenerate?: (params: GenerationParams) => void;
  isGenerating?: boolean;
  generationProgress?: number;
  queuePosition?: number;
}

interface GenerationParams {
  subGenre: string;
  mood: string;
  key: string;
  duration: number;
  saveToCloud: boolean;
}

const SUB_GENRES = [
  'Private School',
  'Kabza Style',
  '3-Step',
  'Vocal House',
  'Deep Amapiano',
  'Piano Hub',
  'Yanos Classic',
];

const MOODS = [
  'Groovy',
  'Energetic',
  'Melancholic',
  'Uplifting',
  'Dark',
  'Euphoric',
  'Chill',
];

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SIPanel: React.FC<SIPanelProps> = ({
  onGenerate,
  isGenerating = false,
  generationProgress = 0,
  queuePosition = 0,
}) => {
  const [subGenre, setSubGenre] = useState('Private School');
  const [mood, setMood] = useState('Groovy');
  const [musicKey, setMusicKey] = useState('C');
  const [duration, setDuration] = useState(30);
  const [saveToCloud, setSaveToCloud] = useState(true);

  const handleGenerate = () => {
    onGenerate?.({
      subGenre,
      mood,
      key: musicKey,
      duration,
      saveToCloud,
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card to-background">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Synthetic Intelligence
            </h3>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-muted-foreground">Neural Core Active • v3.0</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Sub-genre */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sub-genre</Label>
            <Select value={subGenre} onValueChange={setSubGenre}>
              <SelectTrigger className="h-9 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUB_GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mood & Key Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="h-9 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Key</Label>
              <Select value={musicKey} onValueChange={setMusicKey}>
                <SelectTrigger className="h-9 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Duration
              </Label>
              <Badge variant="secondary" className="text-[10px]">{duration}s</Badge>
            </div>
            <Slider
              value={[duration]}
              min={15}
              max={180}
              step={15}
              onValueChange={([v]) => setDuration(v)}
              className="py-2"
            />
          </div>

          {/* Save to Cloud */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Save to Cloud</span>
            </div>
            <Switch
              checked={saveToCloud}
              onCheckedChange={setSaveToCloud}
            />
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary">Generating with AI...</span>
                <span className="text-xs font-mono text-primary">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-1" />
              {queuePosition > 0 && (
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                  Request queued (position {queuePosition})
                </Badge>
              )}
            </div>
          )}

          {/* Generate Button */}
          <Button
            className="w-full h-10 gap-2 bg-gradient-to-r from-primary to-primary/80"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SI Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            SI Core v3.0
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            Neural
          </Badge>
        </div>
      </div>
    </div>
  );
};
