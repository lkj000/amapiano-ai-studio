/**
 * Neural Groove Engine Panel
 * FDD micro-timing visualization and control
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Waves, Sparkles, RotateCcw, Zap } from 'lucide-react';
import { 
  NeuralGrooveEngine, 
  GROOVE_PROFILES, 
  GrooveProfile,
  FrequencyBand 
} from '@/lib/audio/NeuralGrooveEngine';

interface GrooveEnginePanelProps {
  bpm: number;
  selectedProfile?: string;
  onProfileChange?: (profileId: string) => void;
  onGrooveChange?: (groove: GrooveProfile) => void;
}

const BAND_LABELS: Record<FrequencyBand, { label: string; range: string; color: string }> = {
  low: { label: 'Sub/Kick', range: '20-200 Hz', color: 'bg-purple-500' },
  lowMid: { label: 'Log Drum', range: '200-800 Hz', color: 'bg-green-500' },
  mid: { label: 'Snare/Vox', range: '800-2.5k Hz', color: 'bg-yellow-500' },
  highMid: { label: 'Hi-Hats', range: '2.5-6k Hz', color: 'bg-blue-500' },
  high: { label: 'Air', range: '6-20k Hz', color: 'bg-pink-500' },
};

export const GrooveEnginePanel: React.FC<GrooveEnginePanelProps> = ({
  bpm,
  selectedProfile = 'quantum',
  onProfileChange,
  onGrooveChange,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [profile, setProfile] = useState(GROOVE_PROFILES[selectedProfile] || GROOVE_PROFILES.quantum);
  
  // Custom offsets
  const [offsets, setOffsets] = useState({
    low: profile.lowBandOffset,
    lowMid: profile.lowMidOffset,
    mid: profile.midOffset,
    highMid: profile.highMidOffset,
    high: profile.highOffset,
  });
  
  const [swing, setSwing] = useState(profile.swingAmount);
  const [humanize, setHumanize] = useState(profile.humanize);
  const [velocityVar, setVelocityVar] = useState(profile.velocityVariation);
  
  const engine = useMemo(() => new NeuralGrooveEngine(profile, bpm), [bpm]);
  
  const handleProfileChange = (profileId: string) => {
    const newProfile = GROOVE_PROFILES[profileId];
    if (newProfile) {
      setProfile(newProfile);
      setOffsets({
        low: newProfile.lowBandOffset,
        lowMid: newProfile.lowMidOffset,
        mid: newProfile.midOffset,
        highMid: newProfile.highMidOffset,
        high: newProfile.highOffset,
      });
      setSwing(newProfile.swingAmount);
      setHumanize(newProfile.humanize);
      setVelocityVar(newProfile.velocityVariation);
      onProfileChange?.(profileId);
    }
  };
  
  const handleOffsetChange = (band: FrequencyBand, value: number) => {
    setOffsets(prev => ({ ...prev, [band]: value }));
    
    const updatedProfile: GrooveProfile = {
      ...profile,
      [`${band}BandOffset`]: value,
    };
    onGrooveChange?.(updatedProfile);
  };
  
  const handleSwingChange = (value: number) => {
    setSwing(value);
    const updatedProfile: GrooveProfile = { ...profile, swingAmount: value };
    onGrooveChange?.(updatedProfile);
  };
  
  const handleHumanizeChange = (value: number) => {
    setHumanize(value);
    const updatedProfile: GrooveProfile = { ...profile, humanize: value };
    onGrooveChange?.(updatedProfile);
  };
  
  const resetToProfile = () => {
    const baseProfile = GROOVE_PROFILES[selectedProfile];
    if (baseProfile) {
      handleProfileChange(selectedProfile);
    }
  };
  
  // Calculate total groove "intensity"
  const grooveIntensity = useMemo(() => {
    const maxOffset = Math.max(...Object.values(offsets).map(Math.abs));
    return Math.min(100, (maxOffset / 15 + swing + humanize) * 33);
  }, [offsets, swing, humanize]);
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Waves className="h-4 w-4" />
          Neural Groove Engine
          <Badge 
            variant={enabled ? 'default' : 'outline'} 
            className="ml-auto"
          >
            {enabled ? 'Active' : 'Bypass'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable FDD Processing</span>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
            
            {/* Profile Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">GROOVE PROFILE</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(GROOVE_PROFILES).map(([id, p]) => (
                  <button
                    key={id}
                    onClick={() => handleProfileChange(id)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all text-xs",
                      profile.name === p.name
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Swing: {Math.round(p.swingAmount * 100)}%
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Groove Intensity Meter */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Groove Intensity</span>
                <span className="font-medium">{Math.round(grooveIntensity)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all rounded-full",
                    grooveIntensity > 70 ? "bg-red-500" : 
                    grooveIntensity > 40 ? "bg-yellow-500" : "bg-green-500"
                  )}
                  style={{ width: `${grooveIntensity}%` }}
                />
              </div>
            </div>
            
            {/* FDD Band Offsets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  FREQUENCY-DEPENDENT DISPLACEMENT
                </span>
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              
              <div className="space-y-3">
                {(Object.entries(BAND_LABELS) as [FrequencyBand, typeof BAND_LABELS[FrequencyBand]][]).map(([band, info]) => (
                  <div key={band} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", info.color)} />
                        <span>{info.label}</span>
                        <span className="text-[10px] text-muted-foreground">{info.range}</span>
                      </div>
                      <span className="font-mono">
                        {offsets[band] > 0 ? '+' : ''}{offsets[band].toFixed(1)}ms
                      </span>
                    </div>
                    <Slider
                      value={[offsets[band] + 15]}
                      min={0}
                      max={30}
                      step={0.5}
                      onValueChange={([v]) => handleOffsetChange(band, v - 15)}
                      disabled={!enabled}
                    />
                  </div>
                ))}
              </div>
              
              {/* Visual Timeline */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-[10px] text-muted-foreground mb-2">Timing Visualization</div>
                <div className="relative h-20">
                  {/* Grid */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-border" />
                  </div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/50" />
                  
                  {/* Band markers */}
                  {(Object.entries(offsets) as [FrequencyBand, number][]).map(([band, offset], i) => {
                    const position = 50 + (offset / 15) * 40;
                    const info = BAND_LABELS[band];
                    return (
                      <div
                        key={band}
                        className={cn(
                          "absolute w-3 h-3 rounded-full transition-all",
                          info.color,
                          !enabled && "opacity-30"
                        )}
                        style={{
                          left: `${position}%`,
                          top: `${15 + i * 15}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    );
                  })}
                  
                  {/* Labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-muted-foreground">
                    <span>-15ms</span>
                    <span>0 (Grid)</span>
                    <span>+15ms</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Global Controls */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-medium text-muted-foreground">GLOBAL GROOVE</span>
              
              {/* Swing */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Swing ({profile.swingGrid})</span>
                  <span>{Math.round(swing * 100)}%</span>
                </div>
                <Slider
                  value={[swing * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => handleSwingChange(v / 100)}
                  disabled={!enabled}
                />
              </div>
              
              {/* Humanize */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Humanize</span>
                  <span>{Math.round(humanize * 100)}%</span>
                </div>
                <Slider
                  value={[humanize * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => handleHumanizeChange(v / 100)}
                  disabled={!enabled}
                />
              </div>
              
              {/* Velocity Variation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Velocity Variation</span>
                  <span>{Math.round(velocityVar * 100)}%</span>
                </div>
                <Slider
                  value={[velocityVar * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setVelocityVar(v / 100)}
                  disabled={!enabled}
                />
              </div>
            </div>
            
            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={resetToProfile}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset to {profile.name}
            </Button>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
