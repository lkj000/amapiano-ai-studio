/**
 * SyntheticIntelligence - AI-powered generation panel
 * Neural Core v3.0 with Standard, Quantum, and Neural modes
 */

import React, { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Cpu, Sparkles, Zap, Waves, Music, Radio,
  Play, Pause, RefreshCw, Download, Settings2, Layers,
  CircleDot, Activity, Gauge, Volume2, Timer, Target,
  ChevronRight, Loader2, Check, AlertCircle
} from 'lucide-react';

type GenerationMode = 'standard' | 'quantum' | 'neural';
type GenerationType = 'melody' | 'drums' | 'bass' | 'chords' | 'full';

interface GenerationParams {
  temperature: number;
  complexity: number;
  humanization: number;
  energy: number;
  variation: number;
}

interface GenerationPreset {
  id: string;
  name: string;
  description: string;
  type: GenerationType;
  params: GenerationParams;
  tags: string[];
}

const GENERATION_PRESETS: GenerationPreset[] = [
  {
    id: 'kabza-groove',
    name: 'Kabza Groove',
    description: 'Deep, hypnotic patterns inspired by Kabza de Small',
    type: 'drums',
    params: { temperature: 0.6, complexity: 70, humanization: 45, energy: 75, variation: 40 },
    tags: ['deep', 'hypnotic', 'log-drum']
  },
  {
    id: 'private-school',
    name: 'Private School Keys',
    description: 'Jazzy chord progressions with soulful voicings',
    type: 'chords',
    params: { temperature: 0.7, complexity: 85, humanization: 60, energy: 50, variation: 55 },
    tags: ['jazzy', 'soulful', 'rhodes']
  },
  {
    id: 'xduppy-energy',
    name: 'Xduppy Energy',
    description: 'High-energy patterns with aggressive syncopation',
    type: 'full',
    params: { temperature: 0.8, complexity: 60, humanization: 30, energy: 95, variation: 70 },
    tags: ['energy', 'aggressive', 'dancefloor']
  },
  {
    id: 'momo-soul',
    name: 'Momo Soul',
    description: 'Warm, organic melodies with subtle variations',
    type: 'melody',
    params: { temperature: 0.5, complexity: 55, humanization: 80, energy: 45, variation: 35 },
    tags: ['warm', 'organic', 'melodic']
  },
];

const MODE_CONFIG = {
  standard: {
    name: 'Standard',
    icon: <Cpu className="h-4 w-4" />,
    description: 'Classic generation algorithms',
    color: 'hsl(var(--muted-foreground))',
    speed: 'Fast',
  },
  quantum: {
    name: 'Quantum',
    icon: <Zap className="h-4 w-4" />,
    description: 'Enhanced probabilistic sampling',
    color: 'hsl(270 75% 65%)',
    speed: 'Medium',
  },
  neural: {
    name: 'Neural',
    icon: <Brain className="h-4 w-4" />,
    description: 'Deep learning powered generation',
    color: 'hsl(var(--primary))',
    speed: 'Premium',
  },
};

interface SyntheticIntelligenceProps {
  onGenerate?: (type: GenerationType, params: GenerationParams) => void;
  onApplyPreset?: (preset: GenerationPreset) => void;
}

export const SyntheticIntelligence: React.FC<SyntheticIntelligenceProps> = ({
  onGenerate,
  onApplyPreset,
}) => {
  const [mode, setMode] = useState<GenerationMode>('neural');
  const [type, setType] = useState<GenerationType>('drums');
  const [params, setParams] = useState<GenerationParams>({
    temperature: 0.7,
    complexity: 60,
    humanization: 50,
    energy: 70,
    variation: 45,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastGeneration, setLastGeneration] = useState<{ type: string; success: boolean } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setProgress(0);
    setLastGeneration(null);

    // Simulate generation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setLastGeneration({ type, success: true });
          onGenerate?.(type, params);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  }, [type, params, onGenerate]);

  const handlePresetSelect = useCallback((preset: GenerationPreset) => {
    setType(preset.type);
    setParams(preset.params);
    onApplyPreset?.(preset);
  }, [onApplyPreset]);

  const updateParam = useCallback((key: keyof GenerationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card via-card/95 to-card/80">
      {/* Header with Neural Core branding */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <motion.div
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Synthetic Intelligence</h3>
              <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 text-primary border-primary/30">
                Neural Core v3.0
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">AI-Powered Music Generation</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          {(Object.keys(MODE_CONFIG) as GenerationMode[]).map((m) => {
            const config = MODE_CONFIG[m];
            const isActive = mode === m;
            return (
              <Button
                key={m}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all",
                  isActive && "bg-card shadow-sm"
                )}
                style={isActive ? { color: config.color } : undefined}
                onClick={() => setMode(m)}
              >
                {config.icon}
                <span className="hidden sm:inline">{config.name}</span>
                {isActive && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 h-4 px-1 text-[8px]"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    {config.speed}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <Tabs defaultValue="generate" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full h-8 p-0.5 rounded-none border-b border-border bg-muted/30">
          <TabsTrigger value="generate" className="flex-1 h-full text-[10px]">
            <Sparkles className="h-3 w-3 mr-1" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex-1 h-full text-[10px]">
            <Layers className="h-3 w-3 mr-1" />
            Presets
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Generation Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Generation Type
                </label>
                <Select value={type} onValueChange={(v) => setType(v as GenerationType)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="melody">
                      <div className="flex items-center gap-2">
                        <Music className="h-3.5 w-3.5 text-primary" />
                        <span>Melody</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="drums">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-3.5 w-3.5 text-secondary" />
                        <span>Drums & Percussion</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bass">
                      <div className="flex items-center gap-2">
                        <Waves className="h-3.5 w-3.5 text-accent" />
                        <span>Bass & Log Drums</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="chords">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>Chords & Harmony</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-secondary" />
                        <span>Full Arrangement</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Main Parameters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Parameters
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[9px]"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Less' : 'More'}
                    <ChevronRight className={cn(
                      "h-3 w-3 ml-1 transition-transform",
                      showAdvanced && "rotate-90"
                    )} />
                  </Button>
                </div>

                {/* Temperature */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px]">Temperature</span>
                    </div>
                    <span className="text-[10px] font-mono text-primary">{params.temperature.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[params.temperature * 100]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([v]) => updateParam('temperature', v / 100)}
                    className="h-2"
                  />
                  <p className="text-[9px] text-muted-foreground/70">
                    Higher = more creative, lower = more predictable
                  </p>
                </div>

                {/* Complexity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px]">Complexity</span>
                    </div>
                    <span className="text-[10px] font-mono text-primary">{params.complexity}%</span>
                  </div>
                  <Slider
                    value={[params.complexity]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([v]) => updateParam('complexity', v)}
                    className="h-2"
                  />
                </div>

                {/* Energy */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px]">Energy</span>
                    </div>
                    <span className="text-[10px] font-mono text-primary">{params.energy}%</span>
                  </div>
                  <Slider
                    value={[params.energy]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([v]) => updateParam('energy', v)}
                    className="h-2"
                  />
                </div>

                {/* Advanced Parameters */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {/* Humanization */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Timer className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px]">Humanization</span>
                          </div>
                          <span className="text-[10px] font-mono text-primary">{params.humanization}%</span>
                        </div>
                        <Slider
                          value={[params.humanization]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={([v]) => updateParam('humanization', v)}
                          className="h-2"
                        />
                      </div>

                      {/* Variation */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <RefreshCw className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px]">Variation</span>
                          </div>
                          <span className="text-[10px] font-mono text-primary">{params.variation}%</span>
                        </div>
                        <Slider
                          value={[params.variation]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={([v]) => updateParam('variation', v)}
                          className="h-2"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Generation Progress */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs">Generating {type}...</span>
                    </div>
                    <span className="text-xs font-mono text-primary">{Math.min(100, Math.round(progress))}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </motion.div>
              )}

              {/* Last Generation Status */}
              {lastGeneration && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg border flex items-center gap-2",
                    lastGeneration.success 
                      ? "bg-success/5 border-success/20" 
                      : "bg-destructive/5 border-destructive/20"
                  )}
                >
                  {lastGeneration.success ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-xs">
                    {lastGeneration.success 
                      ? `${lastGeneration.type} generated successfully` 
                      : 'Generation failed'}
                  </span>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {GENERATION_PRESETS.map((preset) => (
                <motion.div
                  key={preset.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                    "bg-gradient-to-br from-card/80 to-muted/20",
                    "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
                    "group"
                  )}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                      {preset.type === 'drums' && <CircleDot className="h-4 w-4 text-primary" />}
                      {preset.type === 'melody' && <Music className="h-4 w-4 text-primary" />}
                      {preset.type === 'chords' && <Layers className="h-4 w-4 text-primary" />}
                      {preset.type === 'bass' && <Waves className="h-4 w-4 text-primary" />}
                      {preset.type === 'full' && <Target className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{preset.name}</span>
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                          {preset.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {preset.description}
                      </p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {preset.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <div className="p-3 border-t border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <Button
          className={cn(
            "w-full h-10 font-medium text-sm gap-2",
            "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
            "shadow-lg shadow-primary/20"
          )}
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate {type.charAt(0).toUpperCase() + type.slice(1)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
