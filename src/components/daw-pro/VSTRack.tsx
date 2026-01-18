/**
 * VST Rack Component
 * Plugin host for synthesizers and effects
 */

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Power, Settings, RotateCcw, Save, ChevronDown,
  Waves, Music, Sliders, Volume2
} from 'lucide-react';
import type { DAWChannel } from '@/pages/AmapianoPro';

interface VSTRackProps {
  selectedChannel: DAWChannel | undefined;
  onUpdateChannel: (channelId: string, updates: Partial<DAWChannel>) => void;
}

interface VSTPreset {
  id: string;
  name: string;
  category: string;
}

const VST_PRESETS: Record<string, VSTPreset[]> = {
  toxic: [
    { id: 'blue', name: 'Blue', category: 'Bass' },
    { id: 'smooth-bass', name: 'Smooth Bass', category: 'Bass' },
    { id: 'log-bass', name: 'Log Bass', category: 'Bass' },
    { id: 'sub-808', name: 'Sub 808', category: 'Bass' },
  ],
  purity: [
    { id: 'analog-pad', name: 'Analog Pad', category: 'Pads' },
    { id: 'basic-sign', name: 'Basic Sign Pad', category: 'Pads' },
    { id: 'warm-strings', name: 'Warm Strings', category: 'Pads' },
    { id: 'lush-pad', name: 'Lush Pad', category: 'Pads' },
  ],
  dexed: [
    { id: 'euro', name: 'Euro Lead', category: 'Leads' },
    { id: 'machine', name: 'Machine', category: 'Leads' },
    { id: 'bell', name: 'Bell', category: 'Keys' },
    { id: 'ep', name: 'Electric Piano', category: 'Keys' },
  ],
  nexus: [
    { id: 'sequence', name: 'Sequence', category: 'Arps' },
    { id: 'pluck', name: 'Pluck', category: 'Synth' },
    { id: 'brass', name: 'Brass', category: 'Brass' },
  ],
};

const EFFECTS = [
  { id: 'eq', name: 'Parametric EQ', type: 'eq' },
  { id: 'decapitator', name: 'Decapitator', type: 'distortion' },
  { id: 'reverb', name: 'Reverb', type: 'reverb' },
  { id: 'delay', name: 'Delay', type: 'delay' },
  { id: 'compressor', name: 'Compressor', type: 'dynamics' },
  { id: 'limiter', name: 'Limiter', type: 'dynamics' },
];

export const VSTRack: React.FC<VSTRackProps> = ({
  selectedChannel,
  onUpdateChannel,
}) => {
  const [activeTab, setActiveTab] = useState<'instrument' | 'effects'>('instrument');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [vstEnabled, setVstEnabled] = useState(true);

  // Synth parameters
  const [synthParams, setSynthParams] = useState({
    attack: 0.01,
    decay: 0.3,
    sustain: 0.5,
    release: 0.5,
    cutoff: 0.7,
    resonance: 0.3,
    drive: 0,
    detune: 0,
  });

  if (!selectedChannel) {
    return (
      <div className="h-full flex items-center justify-center bg-card text-muted-foreground p-4">
        <p className="text-center text-sm">
          Select a channel to view its instruments and effects
        </p>
      </div>
    );
  }

  const presets = selectedChannel.instrument 
    ? VST_PRESETS[selectedChannel.instrument] || []
    : [];

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="h-10 flex items-center gap-2 px-3 border-b border-border bg-muted/30">
        <div 
          className="w-3 h-3 rounded-sm" 
          style={{ backgroundColor: selectedChannel.color }} 
        />
        <span className="text-sm font-medium flex-1 truncate">{selectedChannel.name}</span>
        <Button
          variant={vstEnabled ? 'default' : 'ghost'}
          size="icon"
          className="h-6 w-6"
          onClick={() => setVstEnabled(!vstEnabled)}
        >
          <Power className="h-3 w-3" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full h-8 p-0.5 rounded-none border-b border-border">
          <TabsTrigger value="instrument" className="flex-1 h-full text-xs">
            <Music className="h-3 w-3 mr-1" /> Instrument
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex-1 h-full text-xs">
            <Waves className="h-3 w-3 mr-1" /> Effects
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="instrument" className="m-0 p-3">
            {selectedChannel.type === 'synth' ? (
              <div className="space-y-4">
                {/* VST Selection */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Synthesizer</label>
                  <Select value={selectedChannel.instrument || ''}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select VST" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toxic">Toxic Biohazard</SelectItem>
                      <SelectItem value="purity">Purity</SelectItem>
                      <SelectItem value="dexed">Dexed (DX7)</SelectItem>
                      <SelectItem value="nexus">Nexus</SelectItem>
                      <SelectItem value="sylenth">Sylenth1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preset Selection */}
                {presets.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Preset</label>
                    <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select Preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {presets.map(preset => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* ADSR */}
                <div className="space-y-3">
                  <span className="text-xs font-medium">Envelope (ADSR)</span>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {(['attack', 'decay', 'sustain', 'release'] as const).map(param => (
                      <div key={param} className="text-center">
                        <div className="h-20 flex items-end justify-center mb-1">
                          <Slider
                            value={[synthParams[param] * 100]}
                            max={100}
                            step={1}
                            orientation="vertical"
                            className="h-full"
                            onValueChange={([v]) => setSynthParams(prev => ({ ...prev, [param]: v / 100 }))}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">{param[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filter */}
                <div className="space-y-3">
                  <span className="text-xs font-medium">Filter</span>
                  
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Cutoff</span>
                      <span>{Math.round(synthParams.cutoff * 100)}%</span>
                    </div>
                    <Slider
                      value={[synthParams.cutoff * 100]}
                      max={100}
                      onValueChange={([v]) => setSynthParams(prev => ({ ...prev, cutoff: v / 100 }))}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Resonance</span>
                      <span>{Math.round(synthParams.resonance * 100)}%</span>
                    </div>
                    <Slider
                      value={[synthParams.resonance * 100]}
                      max={100}
                      onValueChange={([v]) => setSynthParams(prev => ({ ...prev, resonance: v / 100 }))}
                    />
                  </div>
                </div>

                {/* Additional */}
                <div className="space-y-3">
                  <span className="text-xs font-medium">Modulation</span>
                  
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Drive</span>
                      <span>{Math.round(synthParams.drive * 100)}%</span>
                    </div>
                    <Slider
                      value={[synthParams.drive * 100]}
                      max={100}
                      onValueChange={([v]) => setSynthParams(prev => ({ ...prev, drive: v / 100 }))}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Detune</span>
                      <span>{synthParams.detune} cents</span>
                    </div>
                    <Slider
                      value={[synthParams.detune + 50]}
                      max={100}
                      onValueChange={([v]) => setSynthParams(prev => ({ ...prev, detune: v - 50 }))}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Save className="h-3 w-3 mr-1" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Sliders className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sampler channel</p>
                <p className="text-xs">Load samples from the browser</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="effects" className="m-0 p-3">
            <div className="space-y-2">
              <span className="text-xs font-medium block mb-3">Effect Chain</span>
              
              {EFFECTS.map((effect, index) => (
                <div
                  key={effect.id}
                  className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border"
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Power className="h-3 w-3" />
                  </Button>
                  <span className="text-xs flex-1">{effect.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" size="sm" className="w-full mt-3">
                <ChevronDown className="h-3 w-3 mr-1" /> Add Effect
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
