/**
 * Agent Mode Toggle Component
 * Switch between Creative and Production modes with seed input
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  Lock, 
  Shuffle, 
  ChevronDown, 
  Copy, 
  Check,
  Dices,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type AgentMode = 'creative' | 'production';

interface AgentModeConfig {
  mode: AgentMode;
  seed?: string;
  variationAmount?: number;
  explorationFactor?: number;
  strictDeterminism?: boolean;
}

interface AgentModeToggleProps {
  onModeChange?: (config: AgentModeConfig) => void;
  initialMode?: AgentMode;
  initialSeed?: string;
  showAdvanced?: boolean;
  compact?: boolean;
}

export function AgentModeToggle({
  onModeChange,
  initialMode = 'creative',
  initialSeed,
  showAdvanced = true,
  compact = false
}: AgentModeToggleProps) {
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [seed, setSeed] = useState(initialSeed || '');
  const [variationAmount, setVariationAmount] = useState(0.3);
  const [explorationFactor, setExplorationFactor] = useState(0.5);
  const [strictDeterminism, setStrictDeterminism] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleModeChange = useCallback((isProduction: boolean) => {
    const newMode: AgentMode = isProduction ? 'production' : 'creative';
    setMode(newMode);
    
    const config: AgentModeConfig = {
      mode: newMode,
      seed: newMode === 'production' ? seed : undefined,
      variationAmount: newMode === 'creative' ? variationAmount : 0,
      explorationFactor: newMode === 'creative' ? explorationFactor : 0,
      strictDeterminism: newMode === 'production' ? strictDeterminism : false
    };
    
    onModeChange?.(config);
    toast.success(`Switched to ${newMode === 'creative' ? 'Creative' : 'Production'} mode`);
  }, [seed, variationAmount, explorationFactor, strictDeterminism, onModeChange]);

  const generateRandomSeed = useCallback(() => {
    const newSeed = `seed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setSeed(newSeed);
    if (mode === 'production') {
      onModeChange?.({
        mode,
        seed: newSeed,
        strictDeterminism
      });
    }
    toast.success('Generated new seed');
  }, [mode, strictDeterminism, onModeChange]);

  const copySeed = useCallback(() => {
    if (seed) {
      navigator.clipboard.writeText(seed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Seed copied to clipboard');
    }
  }, [seed]);

  const handleSeedChange = useCallback((newSeed: string) => {
    setSeed(newSeed);
    if (mode === 'production') {
      onModeChange?.({
        mode,
        seed: newSeed,
        strictDeterminism
      });
    }
  }, [mode, strictDeterminism, onModeChange]);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2">
          {mode === 'creative' ? (
            <Sparkles className="w-4 h-4 text-primary" />
          ) : (
            <Lock className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            {mode === 'creative' ? 'Creative' : 'Production'}
          </span>
        </div>
        <Switch
          checked={mode === 'production'}
          onCheckedChange={handleModeChange}
        />
        {mode === 'production' && seed && (
          <Badge variant="outline" className="text-xs font-mono max-w-[120px] truncate">
            {seed.substring(0, 15)}...
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Agent Mode
          </div>
          <Badge variant={mode === 'creative' ? 'default' : 'secondary'}>
            {mode === 'creative' ? (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Creative
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Production
              </>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          {mode === 'creative' 
            ? 'Explore variations and discover new sounds' 
            : 'Exact reproducibility with locked parameters'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Switch */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-md",
              mode === 'creative' ? "bg-primary/10 text-primary" : "bg-muted"
            )}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-sm">Creative Mode</div>
              <div className="text-xs text-muted-foreground">
                Allow variations
              </div>
            </div>
          </div>
          
          <Switch
            checked={mode === 'production'}
            onCheckedChange={handleModeChange}
          />
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-md",
              mode === 'production' ? "bg-yellow-500/10 text-yellow-500" : "bg-muted"
            )}>
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-sm">Production Mode</div>
              <div className="text-xs text-muted-foreground">
                Exact reproduction
              </div>
            </div>
          </div>
        </div>

        {/* Production Mode: Seed Input */}
        {mode === 'production' && (
          <div className="space-y-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
              <Target className="w-4 h-4" />
              Reproducibility Seed
            </div>
            <div className="flex gap-2">
              <Input
                value={seed}
                onChange={(e) => handleSeedChange(e.target.value)}
                placeholder="Enter seed or generate one..."
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomSeed}
                title="Generate random seed"
              >
                <Dices className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copySeed}
                disabled={!seed}
                title="Copy seed"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use the same seed to recreate identical results across sessions
            </p>
          </div>
        )}

        {/* Creative Mode: Variation Controls */}
        {mode === 'creative' && (
          <div className="space-y-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Shuffle className="w-4 h-4" />
              Variation Settings
            </div>
            
            <div className="space-y-4">
              {/* Variation Amount */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Variation Amount</Label>
                  <span className="text-muted-foreground">{Math.round(variationAmount * 100)}%</span>
                </div>
                <Slider
                  value={[variationAmount]}
                  onValueChange={([v]) => {
                    setVariationAmount(v);
                    onModeChange?.({
                      mode,
                      variationAmount: v,
                      explorationFactor
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
              
              {/* Exploration Factor */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Exploration Factor</Label>
                  <span className="text-muted-foreground">{Math.round(explorationFactor * 100)}%</span>
                </div>
                <Slider
                  value={[explorationFactor]}
                  onValueChange={([v]) => {
                    setExplorationFactor(v);
                    onModeChange?.({
                      mode,
                      variationAmount,
                      explorationFactor: v
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {showAdvanced && (
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                Advanced Settings
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isAdvancedOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              {mode === 'production' && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Strict Determinism</Label>
                    <p className="text-xs text-muted-foreground">
                      Require exact hash match
                    </p>
                  </div>
                  <Switch
                    checked={strictDeterminism}
                    onCheckedChange={(v) => {
                      setStrictDeterminism(v);
                      onModeChange?.({
                        mode,
                        seed,
                        strictDeterminism: v
                      });
                    }}
                  />
                </div>
              )}
              
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                <strong>Mode Details:</strong>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  {mode === 'creative' ? (
                    <>
                      <li>Parameters can drift within configured range</li>
                      <li>Exploration encourages novel outputs</li>
                      <li>Results may vary between runs</li>
                    </>
                  ) : (
                    <>
                      <li>All parameters are locked</li>
                      <li>Seeds ensure exact reproduction</li>
                      <li>Hash verification confirms matches</li>
                    </>
                  )}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentModeToggle;
