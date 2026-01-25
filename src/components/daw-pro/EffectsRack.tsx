/**
 * EffectsRack - Professional effects chain with Amapiano-specific presets
 * Genre-optimized processing chains for authentic production
 */

import React, { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves, Zap, Radio, Gauge, Volume2, CircleDot,
  Sparkles, Music, ChevronDown, ChevronUp, Power,
  RotateCcw, Copy, Download, Loader2
} from 'lucide-react';

interface Effect {
  id: string;
  name: string;
  type: 'eq' | 'compressor' | 'reverb' | 'delay' | 'distortion' | 'filter' | 'chorus' | 'limiter';
  enabled: boolean;
  parameters: Record<string, number>;
  presetName?: string;
}

interface EffectPreset {
  id: string;
  name: string;
  category: 'amapiano' | 'mastering' | 'creative' | 'utility';
  description: string;
  icon: React.ReactNode;
  effects: Omit<Effect, 'id'>[];
  color: string;
}

const AMAPIANO_PRESETS: EffectPreset[] = [
  {
    id: 'log-drum-punch',
    name: 'Log Drum Punch',
    category: 'amapiano',
    description: 'Tight compression + sub enhancement for signature log drum presence',
    icon: <CircleDot className="h-4 w-4" />,
    color: 'hsl(var(--primary))',
    effects: [
      { name: 'Sub Enhancer', type: 'eq', enabled: true, parameters: { lowShelf: 4, lowFreq: 60, midCut: -2, midFreq: 400 }, presetName: 'Log Punch' },
      { name: 'Fast Compressor', type: 'compressor', enabled: true, parameters: { threshold: -18, ratio: 4, attack: 5, release: 50, makeupGain: 3 } },
      { name: 'Tube Saturation', type: 'distortion', enabled: true, parameters: { drive: 15, mix: 30, tone: 60 } },
    ]
  },
  {
    id: 'private-school-pad',
    name: 'Private School Pad',
    category: 'amapiano',
    description: 'Lush reverb + gentle modulation for dreamy chord textures',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'hsl(270 75% 65%)',
    effects: [
      { name: 'High Pass Filter', type: 'filter', enabled: true, parameters: { frequency: 120, resonance: 0, type: 0 } },
      { name: 'Plate Reverb', type: 'reverb', enabled: true, parameters: { size: 75, decay: 3.5, predelay: 25, damping: 40, mix: 35 } },
      { name: 'Stereo Chorus', type: 'chorus', enabled: true, parameters: { rate: 0.5, depth: 40, mix: 25 } },
    ]
  },
  {
    id: 'three-step-groove',
    name: '3-Step Groove',
    category: 'amapiano',
    description: 'Punchy transients + groove-enhancing compression',
    icon: <Zap className="h-4 w-4" />,
    color: 'hsl(160 80% 45%)',
    effects: [
      { name: 'Transient Shaper', type: 'compressor', enabled: true, parameters: { attack: 1, release: 100, threshold: -24, ratio: 6, makeupGain: 4 } },
      { name: 'Groove EQ', type: 'eq', enabled: true, parameters: { lowShelf: 2, lowFreq: 100, highShelf: 3, highFreq: 8000, midCut: -1, midFreq: 800 } },
      { name: 'Room Verb', type: 'reverb', enabled: true, parameters: { size: 25, decay: 0.8, predelay: 10, damping: 60, mix: 15 } },
    ]
  },
  {
    id: 'kabza-bass',
    name: 'Kabza Bass',
    category: 'amapiano',
    description: 'Deep sub treatment with controlled harmonics',
    icon: <Gauge className="h-4 w-4" />,
    color: 'hsl(var(--secondary))',
    effects: [
      { name: 'Low Pass Filter', type: 'filter', enabled: true, parameters: { frequency: 200, resonance: 20, type: 1 } },
      { name: 'Bass Compressor', type: 'compressor', enabled: true, parameters: { threshold: -12, ratio: 3, attack: 20, release: 150, makeupGain: 2 } },
      { name: 'Harmonic Saturator', type: 'distortion', enabled: true, parameters: { drive: 20, mix: 25, tone: 40 } },
    ]
  },
  {
    id: 'vocal-chop-fx',
    name: 'Vocal Chop FX',
    category: 'amapiano',
    description: 'Delay throws + formant shifting for creative vocal processing',
    icon: <Radio className="h-4 w-4" />,
    color: 'hsl(320 80% 60%)',
    effects: [
      { name: 'Ping Pong Delay', type: 'delay', enabled: true, parameters: { time: 375, feedback: 45, mix: 30, lowCut: 200, highCut: 6000 } },
      { name: 'Formant Filter', type: 'filter', enabled: true, parameters: { frequency: 1200, resonance: 50, type: 2 } },
      { name: 'Hall Reverb', type: 'reverb', enabled: true, parameters: { size: 60, decay: 2.5, predelay: 40, damping: 30, mix: 25 } },
    ]
  },
  {
    id: 'master-chain',
    name: 'Amapiano Master',
    category: 'mastering',
    description: 'Complete mastering chain for club-ready loudness',
    icon: <Volume2 className="h-4 w-4" />,
    color: 'hsl(45 96% 64%)',
    effects: [
      { name: 'Master EQ', type: 'eq', enabled: true, parameters: { lowShelf: 1, lowFreq: 80, highShelf: 2, highFreq: 12000, midCut: -0.5, midFreq: 500 } },
      { name: 'Glue Compressor', type: 'compressor', enabled: true, parameters: { threshold: -6, ratio: 2, attack: 30, release: 200, makeupGain: 1 } },
      { name: 'Brickwall Limiter', type: 'limiter', enabled: true, parameters: { ceiling: -0.3, release: 50, lookahead: 5 } },
    ]
  },
];

const EFFECT_ICONS: Record<string, React.ReactNode> = {
  eq: <Waves className="h-3.5 w-3.5" />,
  compressor: <Gauge className="h-3.5 w-3.5" />,
  reverb: <Sparkles className="h-3.5 w-3.5" />,
  delay: <Radio className="h-3.5 w-3.5" />,
  distortion: <Zap className="h-3.5 w-3.5" />,
  filter: <Music className="h-3.5 w-3.5" />,
  chorus: <Waves className="h-3.5 w-3.5" />,
  limiter: <Volume2 className="h-3.5 w-3.5" />,
};

interface EffectsRackProps {
  channelId?: string;
  channelName?: string;
  onApplyPreset?: (preset: EffectPreset) => void;
}

export const EffectsRack: React.FC<EffectsRackProps> = ({
  channelId,
  channelName = 'Master',
  onApplyPreset,
}) => {
  const [activeEffects, setActiveEffects] = useState<Effect[]>([]);
  const [expandedEffects, setExpandedEffects] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'amapiano' | 'mastering' | 'creative'>('all');

  const filteredPresets = selectedCategory === 'all' 
    ? AMAPIANO_PRESETS 
    : AMAPIANO_PRESETS.filter(p => p.category === selectedCategory);

  const handleApplyPreset = useCallback((preset: EffectPreset) => {
    setIsProcessing(true);
    
    // Simulate processing delay for visual feedback
    setTimeout(() => {
      const newEffects: Effect[] = preset.effects.map((e, i) => ({
        ...e,
        id: `${preset.id}-${i}-${Date.now()}`,
      }));
      setActiveEffects(newEffects);
      setExpandedEffects(new Set([newEffects[0]?.id]));
      setIsProcessing(false);
      onApplyPreset?.(preset);
    }, 300);
  }, [onApplyPreset]);

  const toggleEffect = useCallback((effectId: string) => {
    setActiveEffects(prev => prev.map(e => 
      e.id === effectId ? { ...e, enabled: !e.enabled } : e
    ));
  }, []);

  const toggleExpanded = useCallback((effectId: string) => {
    setExpandedEffects(prev => {
      const next = new Set(prev);
      if (next.has(effectId)) next.delete(effectId);
      else next.add(effectId);
      return next;
    });
  }, []);

  const updateParameter = useCallback((effectId: string, param: string, value: number) => {
    setActiveEffects(prev => prev.map(e => 
      e.id === effectId ? { ...e, parameters: { ...e.parameters, [param]: value } } : e
    ));
  }, []);

  const removeEffect = useCallback((effectId: string) => {
    setActiveEffects(prev => prev.filter(e => e.id !== effectId));
  }, []);

  const clearAll = useCallback(() => {
    setActiveEffects([]);
    setExpandedEffects(new Set());
  }, []);

  const renderParameterControl = (effectId: string, param: string, value: number) => {
    const displayName = param.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return (
      <div key={param} className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{displayName}</span>
          <span className="text-[10px] font-mono text-primary">{value.toFixed(1)}</span>
        </div>
        <Slider
          value={[value]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={([v]) => updateParameter(effectId, param, v)}
          className="h-1.5"
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card to-card/80 border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Waves className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Effects Rack</h3>
              <p className="text-[10px] text-muted-foreground">{channelName}</p>
            </div>
          </div>
          {activeEffects.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={clearAll}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-1">
          {(['all', 'amapiano', 'mastering'] as const).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-6 text-[10px] flex-1",
                selectedCategory === cat && "bg-primary text-primary-foreground"
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="presets" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full h-8 p-0.5 rounded-none border-b border-border bg-muted/30">
          <TabsTrigger value="presets" className="flex-1 h-full text-[10px]">
            Presets
          </TabsTrigger>
          <TabsTrigger value="chain" className="flex-1 h-full text-[10px]">
            Chain ({activeEffects.length})
          </TabsTrigger>
        </TabsList>

        {/* Presets Tab */}
        <TabsContent value="presets" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {filteredPresets.map((preset) => (
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
                  onClick={() => handleApplyPreset(preset)}
                >
                  <div className="flex items-start gap-2.5">
                    <div 
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${preset.color}, ${preset.color}80)`,
                      }}
                    >
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{preset.name}</span>
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 shrink-0">
                          {preset.effects.length} FX
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {preset.description}
                      </p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {preset.effects.map((e, i) => (
                          <span 
                            key={i}
                            className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                          >
                            {e.name}
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

        {/* Active Chain Tab */}
        <TabsContent value="chain" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1.5">
              {isProcessing && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-xs text-muted-foreground">Loading effects...</span>
                </div>
              )}

              {!isProcessing && activeEffects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Waves className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No effects loaded</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Select a preset to get started
                  </p>
                </div>
              )}

              <AnimatePresence>
                {activeEffects.map((effect, index) => {
                  const isExpanded = expandedEffects.has(effect.id);
                  return (
                    <motion.div
                      key={effect.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "rounded-lg border overflow-hidden transition-colors",
                        effect.enabled 
                          ? "bg-card border-border" 
                          : "bg-muted/30 border-muted opacity-60"
                      )}
                    >
                      {/* Effect Header */}
                      <div 
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/30"
                        onClick={() => toggleExpanded(effect.id)}
                      >
                        <div className={cn(
                          "h-6 w-6 rounded flex items-center justify-center text-muted-foreground",
                          effect.enabled && "text-primary"
                        )}>
                          {EFFECT_ICONS[effect.type]}
                        </div>
                        <span className="text-xs font-medium flex-1">{effect.name}</span>
                        <Switch
                          checked={effect.enabled}
                          onCheckedChange={() => toggleEffect(effect.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="scale-75"
                        />
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>

                      {/* Effect Parameters */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-2 pt-0 space-y-2 border-t border-border/50">
                              {Object.entries(effect.parameters).map(([param, value]) =>
                                renderParameterControl(effect.id, param, value)
                              )}
                              <div className="flex gap-1 pt-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 flex-1 text-[10px]"
                                  onClick={() => removeEffect(effect.id)}
                                >
                                  Remove
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-[10px]"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      {activeEffects.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/20">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-7 text-[10px] hover:bg-primary hover:text-primary-foreground"
          >
            <Download className="h-3 w-3 mr-1.5" />
            Save as Preset
          </Button>
        </div>
      )}
    </div>
  );
};
