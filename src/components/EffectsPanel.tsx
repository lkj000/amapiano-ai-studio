import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Settings, Trash2 } from 'lucide-react';
import type { EffectNode } from '@/hooks/useAudioEffects';

interface EffectsPanelProps {
  trackId: string;
  trackName: string;
  effects: EffectNode[];
  onAddEffect: (effectType: EffectNode['type']) => void;
  onRemoveEffect: (effectId: string) => void;
  onUpdateParam: (effectId: string, paramName: string, value: any) => void;
  onClose: () => void;
}

const effectTypes: EffectNode['type'][] = ['EQ', 'Reverb', 'Compressor', 'Delay', 'Distortion'];

export default function EffectsPanel({ 
  trackId, 
  trackName, 
  effects, 
  onAddEffect, 
  onRemoveEffect, 
  onUpdateParam, 
  onClose 
}: EffectsPanelProps) {
  const [selectedEffectType, setSelectedEffectType] = useState<EffectNode['type']>('EQ');

  const renderEffectControls = (effect: EffectNode) => {
    const { type, id, params } = effect;

    switch (type) {
      case 'EQ':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Frequency</span>
              <Slider
                value={[params.frequency || 1000]}
                onValueChange={([value]) => onUpdateParam(id, 'frequency', value)}
                min={20}
                max={20000}
                step={10}
                className="flex-1"
              />
              <span className="text-sm w-16">{params.frequency || 1000}Hz</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Gain</span>
              <Slider
                value={[params.gain || 0]}
                onValueChange={([value]) => onUpdateParam(id, 'gain', value)}
                min={-12}
                max={12}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm w-16">{(params.gain || 0).toFixed(1)}dB</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Q</span>
              <Slider
                value={[params.Q || 1]}
                onValueChange={([value]) => onUpdateParam(id, 'Q', value)}
                min={0.1}
                max={10}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm w-16">{(params.Q || 1).toFixed(1)}</span>
            </div>
          </div>
        );

      case 'Reverb':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Room Size</span>
              <Slider
                value={[params.roomSize || 0.5]}
                onValueChange={([value]) => onUpdateParam(id, 'roomSize', value)}
                min={0}
                max={1}
                step={0.01}
                className="flex-1"
              />
              <span className="text-sm w-16">{((params.roomSize || 0.5) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Wetness</span>
              <Slider
                value={[params.wetness || 0.3]}
                onValueChange={([value]) => onUpdateParam(id, 'wetness', value)}
                min={0}
                max={1}
                step={0.01}
                className="flex-1"
              />
              <span className="text-sm w-16">{((params.wetness || 0.3) * 100).toFixed(0)}%</span>
            </div>
          </div>
        );

      case 'Compressor':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Threshold</span>
              <Slider
                value={[params.threshold || -20]}
                onValueChange={([value]) => onUpdateParam(id, 'threshold', value)}
                min={-40}
                max={0}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-16">{params.threshold || -20}dB</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Ratio</span>
              <Slider
                value={[params.ratio || 8]}
                onValueChange={([value]) => onUpdateParam(id, 'ratio', value)}
                min={1}
                max={20}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm w-16">{(params.ratio || 8).toFixed(1)}:1</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Attack</span>
              <Slider
                value={[params.attack || 0.003]}
                onValueChange={([value]) => onUpdateParam(id, 'attack', value)}
                min={0.001}
                max={1}
                step={0.001}
                className="flex-1"
              />
              <span className="text-sm w-16">{((params.attack || 0.003) * 1000).toFixed(0)}ms</span>
            </div>
          </div>
        );

      case 'Delay':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Time</span>
              <Slider
                value={[params.time || 0.3]}
                onValueChange={([value]) => onUpdateParam(id, 'time', value)}
                min={0.01}
                max={1}
                step={0.01}
                className="flex-1"
              />
              <span className="text-sm w-16">{((params.time || 0.3) * 1000).toFixed(0)}ms</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Feedback</span>
              <Slider
                value={[params.feedback || 0.3]}
                onValueChange={([value]) => onUpdateParam(id, 'feedback', value)}
                min={0}
                max={0.8}
                step={0.01}
                className="flex-1"
              />
              <span className="text-sm w-16">{((params.feedback || 0.3) * 100).toFixed(0)}%</span>
            </div>
          </div>
        );

      case 'Distortion':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Drive</span>
              <Slider
                value={[params.drive || 20]}
                onValueChange={([value]) => onUpdateParam(id, 'drive', value)}
                min={1}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-16">{params.drive || 20}</span>
            </div>
          </div>
        );

      default:
        return <div className="text-sm text-muted-foreground">No controls available</div>;
    }
  };

  return (
    <Card className="fixed right-4 top-4 bottom-4 w-80 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Effects - {trackName}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {/* Add Effect Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Select value={selectedEffectType} onValueChange={setSelectedEffectType as (value: string) => void}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {effectTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={() => onAddEffect(selectedEffectType)}
              className="px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Effects List */}
        <div className="space-y-4">
          {effects.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No effects added yet
            </div>
          ) : (
            effects.map((effect) => (
              <Card key={effect.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{effect.type}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemoveEffect(effect.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderEffectControls(effect)}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}