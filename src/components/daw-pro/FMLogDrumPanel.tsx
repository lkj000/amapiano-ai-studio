/**
 * FM Log Drum Panel
 * 4-Operator FM synthesizer with velocity-to-grit mapping
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Drum, Waves, Zap, Volume2, Play, 
  RotateCcw, Save, Settings2
} from 'lucide-react';
import { 
  FMLogDrumSynth, 
  LOG_DRUM_PATCHES, 
  LogDrumPatch 
} from '@/lib/audio/FMLogDrumSynth';
import * as Tone from 'tone';

interface FMLogDrumPanelProps {
  onPatchChange?: (patchName: string) => void;
}

export const FMLogDrumPanel: React.FC<FMLogDrumPanelProps> = ({
  onPatchChange,
}) => {
  const [selectedPatch, setSelectedPatch] = useState('quantum');
  const [isInitialized, setIsInitialized] = useState(false);
  const synthRef = useRef<FMLogDrumSynth | null>(null);
  
  // Editable parameters
  const [params, setParams] = useState({
    fundamental: 55,
    pitchDecay: 0.85,
    pitchAmount: 24,
    distortion: 0.7,
    velocityToGrit: 0.5,
    velocityToPitch: 0.3,
    attack: 0.001,
    decay: 0.3,
    op2Ratio: 2.01,
    op2Level: 0.6,
    op3Ratio: 3.5,
    op3Level: 0.3,
    subLevel: 0.8,
  });
  
  // Initialize synth
  useEffect(() => {
    const initAudio = async () => {
      await Tone.start();
      synthRef.current = new FMLogDrumSynth(LOG_DRUM_PATCHES[selectedPatch]);
      synthRef.current.toDestination();
      setIsInitialized(true);
      
      // Load patch parameters
      const patch = LOG_DRUM_PATCHES[selectedPatch];
      setParams({
        fundamental: patch.fundamental,
        pitchDecay: patch.pitchEnvelope.decay,
        pitchAmount: patch.pitchEnvelope.amount,
        distortion: patch.distortion,
        velocityToGrit: patch.velocityToGrit,
        velocityToPitch: patch.velocityToPitch,
        attack: patch.operators[0].envelope.attack,
        decay: patch.operators[0].envelope.decay,
        op2Ratio: patch.operators[1].ratio,
        op2Level: patch.operators[1].level,
        op3Ratio: patch.operators[2].ratio,
        op3Level: patch.operators[2].level,
        subLevel: patch.operators[3].level,
      });
    };
    
    initAudio();
    
    return () => {
      synthRef.current?.dispose();
    };
  }, []);
  
  const handlePatchChange = (patchName: string) => {
    setSelectedPatch(patchName);
    synthRef.current?.setPatch(patchName);
    
    const patch = LOG_DRUM_PATCHES[patchName];
    setParams({
      fundamental: patch.fundamental,
      pitchDecay: patch.pitchEnvelope.decay,
      pitchAmount: patch.pitchEnvelope.amount,
      distortion: patch.distortion,
      velocityToGrit: patch.velocityToGrit,
      velocityToPitch: patch.velocityToPitch,
      attack: patch.operators[0].envelope.attack,
      decay: patch.operators[0].envelope.decay,
      op2Ratio: patch.operators[1].ratio,
      op2Level: patch.operators[1].level,
      op3Ratio: patch.operators[2].ratio,
      op3Level: patch.operators[2].level,
      subLevel: patch.operators[3].level,
    });
    
    onPatchChange?.(patchName);
  };
  
  const triggerNote = (velocity: number = 0.8) => {
    if (!isInitialized || !synthRef.current) return;
    synthRef.current.trigger(`C2`, velocity);
  };
  
  const triggerOctaveJump = () => {
    if (!isInitialized || !synthRef.current) return;
    synthRef.current.triggerWithOctaveJump('C2', 0.9, true);
  };
  
  const triggerQuantumRoll = () => {
    if (!isInitialized || !synthRef.current) return;
    synthRef.current.playQuantumRoll('C2', 4, 0.2);
  };
  
  const updateDistortion = (value: number) => {
    setParams(p => ({ ...p, distortion: value }));
    synthRef.current?.setDistortion(value);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Drum className="h-4 w-4" />
          FM Log Drum Synth
          <Badge variant="outline" className="ml-auto">
            4-OP FM
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Patch Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">PATCH</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LOG_DRUM_PATCHES).map(([id, patch]) => (
                  <button
                    key={id}
                    onClick={() => handlePatchChange(id)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all text-xs",
                      selectedPatch === id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{patch.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {Math.round(patch.distortion * 100)}% grit
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => triggerNote(0.6)}
              >
                <Play className="h-3 w-3 mr-1" />
                Soft
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => triggerNote(0.9)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Hard
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={triggerOctaveJump}
              >
                <Waves className="h-3 w-3 mr-1" />
                Jump
              </Button>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={triggerQuantumRoll}
            >
              <Drum className="h-3 w-3 mr-1" />
              Quantum Roll (4 hits)
            </Button>
            
            <Tabs defaultValue="sound" className="w-full">
              <TabsList className="w-full h-8">
                <TabsTrigger value="sound" className="flex-1 text-xs">Sound</TabsTrigger>
                <TabsTrigger value="fm" className="flex-1 text-xs">FM Operators</TabsTrigger>
                <TabsTrigger value="velocity" className="flex-1 text-xs">Velocity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sound" className="space-y-4 mt-4">
                {/* Fundamental */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fundamental</span>
                    <span>{params.fundamental} Hz</span>
                  </div>
                  <Slider
                    value={[params.fundamental]}
                    min={30}
                    max={100}
                    step={1}
                    onValueChange={([v]) => setParams(p => ({ ...p, fundamental: v }))}
                  />
                </div>
                
                {/* Pitch Envelope */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pitch Drop</span>
                    <span>{params.pitchAmount} st</span>
                  </div>
                  <Slider
                    value={[params.pitchAmount]}
                    min={0}
                    max={48}
                    step={1}
                    onValueChange={([v]) => setParams(p => ({ ...p, pitchAmount: v }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pitch Decay</span>
                    <span>{Math.round(params.pitchDecay * 1000)} ms</span>
                  </div>
                  <Slider
                    value={[params.pitchDecay * 100]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={([v]) => setParams(p => ({ ...p, pitchDecay: v / 100 }))}
                  />
                </div>
                
                {/* Distortion/Grit */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Distortion (Grit)</span>
                    <span>{Math.round(params.distortion * 100)}%</span>
                  </div>
                  <Slider
                    value={[params.distortion * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => updateDistortion(v / 100)}
                  />
                </div>
                
                {/* Amp Envelope */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Decay</span>
                    <span>{Math.round(params.decay * 1000)} ms</span>
                  </div>
                  <Slider
                    value={[params.decay * 100]}
                    min={5}
                    max={100}
                    step={1}
                    onValueChange={([v]) => setParams(p => ({ ...p, decay: v / 100 }))}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="fm" className="space-y-4 mt-4">
                {/* Operator 2 */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <span className="text-xs font-medium">Operator 2 (Modulator)</span>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ratio</span>
                      <span>{params.op2Ratio.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[params.op2Ratio * 10]}
                      min={5}
                      max={80}
                      step={1}
                      onValueChange={([v]) => setParams(p => ({ ...p, op2Ratio: v / 10 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Level</span>
                      <span>{Math.round(params.op2Level * 100)}%</span>
                    </div>
                    <Slider
                      value={[params.op2Level * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => setParams(p => ({ ...p, op2Level: v / 100 }))}
                    />
                  </div>
                </div>
                
                {/* Operator 3 */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <span className="text-xs font-medium">Operator 3 (Harmonics)</span>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ratio</span>
                      <span>{params.op3Ratio.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[params.op3Ratio * 10]}
                      min={10}
                      max={100}
                      step={1}
                      onValueChange={([v]) => setParams(p => ({ ...p, op3Ratio: v / 10 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Level</span>
                      <span>{Math.round(params.op3Level * 100)}%</span>
                    </div>
                    <Slider
                      value={[params.op3Level * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => setParams(p => ({ ...p, op3Level: v / 100 }))}
                    />
                  </div>
                </div>
                
                {/* Sub Operator */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <span className="text-xs font-medium">Sub Oscillator</span>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Level</span>
                      <span>{Math.round(params.subLevel * 100)}%</span>
                    </div>
                    <Slider
                      value={[params.subLevel * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => setParams(p => ({ ...p, subLevel: v / 100 }))}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="velocity" className="space-y-4 mt-4">
                {/* Velocity to Grit */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Velocity → Grit</span>
                    <span>{Math.round(params.velocityToGrit * 100)}%</span>
                  </div>
                  <Slider
                    value={[params.velocityToGrit * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => setParams(p => ({ ...p, velocityToGrit: v / 100 }))}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    How much velocity affects distortion amount
                  </p>
                </div>
                
                {/* Velocity to Pitch */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Velocity → Pitch</span>
                    <span>{Math.round(params.velocityToPitch * 100)}%</span>
                  </div>
                  <Slider
                    value={[params.velocityToPitch * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => setParams(p => ({ ...p, velocityToPitch: v / 100 }))}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    How much velocity affects pitch envelope depth
                  </p>
                </div>
                
                {/* Velocity Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-medium">Test Velocities</span>
                  <div className="flex gap-1">
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map(vel => (
                      <Button
                        key={vel}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-12"
                        onClick={() => triggerNote(vel)}
                      >
                        <div className="text-center">
                          <div className="text-xs font-medium">{Math.round(vel * 127)}</div>
                          <div className="text-[10px] text-muted-foreground">{Math.round(vel * 100)}%</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handlePatchChange(selectedPatch)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  // Export current patch settings
                  const patchData = {
                    name: `Custom_${selectedPatch}`,
                    ...params,
                    timestamp: Date.now()
                  };
                  const blob = new Blob([JSON.stringify(patchData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `fm-logdrum-patch-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Save className="h-3 w-3 mr-1" />
                Save Patch
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
