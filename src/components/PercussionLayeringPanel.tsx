import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePercussionLayering } from '@/hooks/usePercussionLayering';
import { Sparkles, Plus, Trash2, Download, Music } from 'lucide-react';

interface PercussionLayeringPanelProps {
  onExport?: (layers: any[]) => void;
  className?: string;
}

export function PercussionLayeringPanel({ onExport, className }: PercussionLayeringPanelProps) {
  const [density, setDensity] = useState([5]);
  const [energy, setEnergy] = useState([7]);
  const [groove, setGroove] = useState<'straight' | 'swing' | 'shuffle'>('swing');

  const {
    layers,
    selectedPreset,
    isGenerating,
    presets,
    applyPreset,
    generateAILayers,
    addLayer,
    removeLayer,
    updateLayer,
    exportMIDI
  } = usePercussionLayering();

  const handleGenerate = () => {
    generateAILayers(density[0], groove, energy[0]);
  };

  return (
    <Card className={className}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Percussion Layering AI</h3>
          <span className="ml-auto text-xs text-muted-foreground">15× faster</span>
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
                    {preset.name} - {preset.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Generation Controls */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <p className="text-sm font-medium">AI Generation</p>
            
            <div className="space-y-2">
              <Label>Density: {density[0]}/10</Label>
              <Slider
                value={density}
                onValueChange={setDensity}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                More layers = fuller sound
              </p>
            </div>

            <div className="space-y-2">
              <Label>Energy: {energy[0]}/10</Label>
              <Slider
                value={energy}
                onValueChange={setEnergy}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Higher velocity and variation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Groove Feel</Label>
              <Select value={groove} onValueChange={(v: any) => setGroove(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight (Quantized)</SelectItem>
                  <SelectItem value="swing">Swing (Amapiano)</SelectItem>
                  <SelectItem value="shuffle">Shuffle (Triplet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Layers
                </>
              )}
            </Button>
          </div>

          {/* Layer List */}
          {layers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Active Layers ({layers.length})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportMIDI}
                  className="h-7"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Export MIDI
                </Button>
              </div>

              <div className="space-y-2">
                {layers.map((layer, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{layer.type}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLayer(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <Slider
                          value={[layer.volume * 100]}
                          onValueChange={(v) => updateLayer(index, { volume: v[0] / 100 })}
                          max={100}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pan:</span>
                        <Slider
                          value={[layer.pan * 50 + 50]}
                          onValueChange={(v) => updateLayer(index, { pan: (v[0] - 50) / 50 })}
                          max={100}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pitch Var:</span>
                        <Slider
                          value={[layer.pitchVariation]}
                          onValueChange={(v) => updateLayer(index, { pitchVariation: v[0] })}
                          max={100}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Humanize:</span>
                        <Slider
                          value={[layer.humanization]}
                          onValueChange={(v) => updateLayer(index, { humanization: v[0] })}
                          max={100}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Layer Button */}
          <Button
            variant="outline"
            onClick={() => addLayer('shaker')}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Layer Manually
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-medium">Features:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• AI-powered pattern generation</li>
            <li>• Authentic Amapiano grooves</li>
            <li>• Automatic phase alignment</li>
            <li>• Smart stereo spreading</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
