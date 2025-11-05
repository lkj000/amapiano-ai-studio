import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBassLayering } from '@/hooks/useBassLayering';
import { Waves, Sparkles, AlertCircle, CheckCircle, Play } from 'lucide-react';

interface BassLayeringPanelProps {
  onExport?: (config: any) => void;
  className?: string;
}

export function BassLayeringPanel({ onExport, className }: BassLayeringPanelProps) {
  const {
    subBass,
    midBass,
    topBass,
    stereoWidth,
    selectedPreset,
    isProcessing,
    presets,
    applyPreset,
    analyzePhaseAlignment,
    autoAlignPhase,
    analyzeFrequencyGaps,
    optimizeForGenre,
    updateSubBass,
    updateMidBass,
    updateTopBass,
    setStereoWidth,
    playBassSound
  } = useBassLayering();

  const phaseAnalysis = analyzePhaseAlignment();
  const frequencyAnalysis = analyzeFrequencyGaps();

  return (
    <Card className={className}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Bass Layering System</h3>
          <span className="ml-auto text-xs text-muted-foreground">20× faster</span>
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

          {/* Genre Optimization */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => optimizeForGenre('amapiano')}
              disabled={isProcessing}
            >
              Amapiano
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => optimizeForGenre('deep-house')}
              disabled={isProcessing}
            >
              Deep House
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => optimizeForGenre('afrotech')}
              disabled={isProcessing}
            >
              Afrotech
            </Button>
          </div>

          {/* Sub-Bass Layer */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-blue-400">Sub-Bass (30-60Hz)</p>
            
            <div className="space-y-2">
              <Label className="text-xs">Frequency: {subBass.frequency}Hz</Label>
              <Slider
                value={[subBass.frequency]}
                onValueChange={(v) => updateSubBass({ frequency: v[0] })}
                min={30}
                max={60}
                step={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Volume: {Math.round(subBass.volume * 100)}%</Label>
                <Slider
                  value={[subBass.volume * 100]}
                  onValueChange={(v) => updateSubBass({ volume: v[0] / 100 })}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Filter: {subBass.filter.cutoff}Hz</Label>
                <Slider
                  value={[subBass.filter.cutoff]}
                  onValueChange={(v) => updateSubBass({ filter: { ...subBass.filter, cutoff: v[0] } })}
                  min={50}
                  max={150}
                />
              </div>
            </div>
          </div>

          {/* Mid-Bass Layer */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-green-400">Mid-Bass (60-200Hz)</p>
            
            <div className="space-y-2">
              <Label className="text-xs">Frequency: {midBass.frequency}Hz</Label>
              <Slider
                value={[midBass.frequency]}
                onValueChange={(v) => updateMidBass({ frequency: v[0] })}
                min={60}
                max={200}
                step={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Volume: {Math.round(midBass.volume * 100)}%</Label>
                <Slider
                  value={[midBass.volume * 100]}
                  onValueChange={(v) => updateMidBass({ volume: v[0] / 100 })}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Resonance: {Math.round(midBass.filter.resonance * 100)}%</Label>
                <Slider
                  value={[midBass.filter.resonance * 100]}
                  onValueChange={(v) => updateMidBass({ filter: { ...midBass.filter, resonance: v[0] / 100 } })}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Top-Bass Layer */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-purple-400">Top-Bass (200-500Hz)</p>
            
            <div className="space-y-2">
              <Label className="text-xs">Frequency: {topBass.frequency}Hz</Label>
              <Slider
                value={[topBass.frequency]}
                onValueChange={(v) => updateTopBass({ frequency: v[0] })}
                min={150}
                max={500}
                step={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Volume: {Math.round(topBass.volume * 100)}%</Label>
                <Slider
                  value={[topBass.volume * 100]}
                  onValueChange={(v) => updateTopBass({ volume: v[0] / 100 })}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Attack: {topBass.envelope.attack.toFixed(3)}s</Label>
                <Slider
                  value={[topBass.envelope.attack * 1000]}
                  onValueChange={(v) => updateTopBass({ envelope: { ...topBass.envelope, attack: v[0] / 1000 } })}
                  max={50}
                />
              </div>
            </div>
          </div>

          {/* Stereo Width */}
          <div className="space-y-2">
            <Label>Stereo Width: {Math.round(stereoWidth * 100)}%</Label>
            <Slider
              value={[stereoWidth * 100]}
              onValueChange={(v) => setStereoWidth(v[0] / 100)}
              max={100}
            />
            <p className="text-xs text-muted-foreground">
              Keep sub-bass mono for club systems
            </p>
          </div>

          {/* Analysis & Tools */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              {phaseAnalysis.isAligned ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium">{phaseAnalysis.recommendation}</p>
              </div>
              {!phaseAnalysis.isAligned && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={autoAlignPhase}
                  className="h-7"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Fix
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              {!frequencyAnalysis.hasGaps ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium">{frequencyAnalysis.coverage}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-4">
          <div>
            <p className="text-xs font-medium mb-2">Features:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Automatic phase alignment</li>
              <li>• Frequency gap detection</li>
              <li>• Genre-optimized presets</li>
              <li>• Professional stereo control</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="default"
              onClick={() => playBassSound(60)}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Preview Bass
            </Button>
            <Button 
              variant="outline"
              onClick={() => onExport?.({ subBass, midBass, topBass, stereoWidth })}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Export Config
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
