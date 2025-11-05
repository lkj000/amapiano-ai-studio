import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogDrumDesigner } from '@/hooks/useLogDrumDesigner';
import { Drum, Sparkles, Plus, Trash2, Play } from 'lucide-react';

interface LogDrumDesignerPanelProps {
  onExport?: (settings: any) => void;
  className?: string;
}

export function LogDrumDesignerPanel({ onExport, className }: LogDrumDesignerPanelProps) {
  const {
    settings,
    selectedPreset,
    isProcessing,
    presets,
    applyPreset,
    updateEnvelope,
    updateCharacter,
    updatePitchEnvelope,
    setBasePitch,
    setTuning,
    addVelocityLayer,
    removeVelocityLayer,
    updateVelocityLayer,
    autoTuneVelocityLayers,
    analyzeCharacter,
    playLogDrumSound
  } = useLogDrumDesigner();

  return (
    <Card className={className}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Drum className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Log Drum Designer</h3>
          <span className="ml-auto text-xs text-muted-foreground">10× faster</span>
        </div>

        <div className="space-y-4">
          {/* Preset Selection */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <Select value={selectedPreset || ''} onValueChange={applyPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select a preset..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map(preset => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tuning System */}
          <div className="space-y-2">
            <Label>Tuning System</Label>
            <Select value={settings.tuning} onValueChange={(v: any) => setTuning(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amapiano">Amapiano (A-based)</SelectItem>
                <SelectItem value="afro">Afro (E-based)</SelectItem>
                <SelectItem value="standard">Standard (C-based)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Base Pitch */}
          <div className="space-y-2">
            <Label>Base Pitch: {settings.basePitch.toFixed(1)}Hz</Label>
            <Slider
              value={[settings.basePitch]}
              onValueChange={(v) => setBasePitch(v[0])}
              min={55}
              max={220}
              step={0.5}
            />
          </div>

          {/* ADSR Envelope */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm font-medium">Envelope</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Attack: {(settings.envelope.attack * 1000).toFixed(0)}ms</Label>
                <Slider
                  value={[settings.envelope.attack * 1000]}
                  onValueChange={(v) => updateEnvelope({ attack: v[0] / 1000 })}
                  max={20}
                  step={0.1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Decay: {(settings.envelope.decay * 1000).toFixed(0)}ms</Label>
                <Slider
                  value={[settings.envelope.decay * 1000]}
                  onValueChange={(v) => updateEnvelope({ decay: v[0] / 1000 })}
                  max={1000}
                  step={10}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sustain: {Math.round(settings.envelope.sustain * 100)}%</Label>
                <Slider
                  value={[settings.envelope.sustain * 100]}
                  onValueChange={(v) => updateEnvelope({ sustain: v[0] / 100 })}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Release: {(settings.envelope.release * 1000).toFixed(0)}ms</Label>
                <Slider
                  value={[settings.envelope.release * 1000]}
                  onValueChange={(v) => updateEnvelope({ release: v[0] / 1000 })}
                  max={1000}
                  step={10}
                />
              </div>
            </div>
          </div>

          {/* Pitch Envelope */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm font-medium">Pitch Envelope</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount: {settings.pitchEnvelope.amount} semitones</Label>
                <Slider
                  value={[settings.pitchEnvelope.amount]}
                  onValueChange={(v) => updatePitchEnvelope({ amount: v[0] })}
                  max={24}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Decay: {(settings.pitchEnvelope.decay * 1000).toFixed(0)}ms</Label>
                <Slider
                  value={[settings.pitchEnvelope.decay * 1000]}
                  onValueChange={(v) => updatePitchEnvelope({ decay: v[0] / 1000 })}
                  max={500}
                  step={10}
                />
              </div>
            </div>
          </div>

          {/* Character Controls */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm font-medium">Character</p>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Woodiness: {Math.round(settings.character.woodiness * 100)}%</Label>
                <Slider
                  value={[settings.character.woodiness * 100]}
                  onValueChange={(v) => updateCharacter({ woodiness: v[0] / 100 })}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Resonance: {Math.round(settings.character.resonance * 100)}%</Label>
                <Slider
                  value={[settings.character.resonance * 100]}
                  onValueChange={(v) => updateCharacter({ resonance: v[0] / 100 })}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dampening: {Math.round(settings.character.dampening * 100)}%</Label>
                <Slider
                  value={[settings.character.dampening * 100]}
                  onValueChange={(v) => updateCharacter({ dampening: v[0] / 100 })}
                  max={100}
                />
              </div>
            </div>

            <div className="p-2 bg-background rounded text-xs text-muted-foreground">
              {analyzeCharacter()}
            </div>
          </div>

          {/* Velocity Layers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Velocity Layers ({settings.velocityLayers.length})</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={autoTuneVelocityLayers}
                  disabled={isProcessing}
                  className="h-7"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addVelocityLayer}
                  className="h-7"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {settings.velocityLayers.map((layer, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Velocity {layer.velocity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVelocityLayer(index)}
                      className="h-5 w-5 p-0"
                      disabled={settings.velocityLayers.length <= 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Label className="text-xs">Velocity</Label>
                      <Slider
                        value={[layer.velocity]}
                        onValueChange={(v) => updateVelocityLayer(index, { velocity: v[0] })}
                        max={127}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Brightness</Label>
                      <Slider
                        value={[layer.brightness * 100]}
                        onValueChange={(v) => updateVelocityLayer(index, { brightness: v[0] / 100 })}
                        max={100}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-4">
          <div>
            <p className="text-xs font-medium mb-2">Features:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• ADSR envelope control</li>
              <li>• Pitch envelope modulation</li>
              <li>• Multi-velocity layering</li>
              <li>• Authentic Amapiano character</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="default"
              onClick={() => playLogDrumSound(100)}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Preview Sound
            </Button>
            <Button 
              variant="outline"
              onClick={() => onExport?.(settings)}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Export Preset
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
