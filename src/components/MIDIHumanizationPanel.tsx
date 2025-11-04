import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMIDIHumanization } from '@/hooks/useMIDIHumanization';
import { User, Sparkles } from 'lucide-react';

interface MIDIHumanizationPanelProps {
  onHumanize?: (settings: any) => void;
  className?: string;
}

export function MIDIHumanizationPanel({ 
  onHumanize,
  className 
}: MIDIHumanizationPanelProps) {
  const { settings, updateSettings, applyGrooveTemplate } = useMIDIHumanization();

  return (
    <Card className={className}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">MIDI Humanization</h3>
          <span className="ml-auto text-xs text-muted-foreground">Natural feel</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Timing Variation: {settings.timingVariation}ms</Label>
            <Slider
              value={[settings.timingVariation]}
              onValueChange={(v) => updateSettings({ timingVariation: v[0] })}
              min={0}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Random timing offsets for natural feel
            </p>
          </div>

          <div className="space-y-2">
            <Label>Velocity Variation: {settings.velocityVariation}%</Label>
            <Slider
              value={[settings.velocityVariation]}
              onValueChange={(v) => updateSettings({ velocityVariation: v[0] })}
              min={0}
              max={40}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Subtle velocity changes per note
            </p>
          </div>

          <div className="space-y-2">
            <Label>Duration Variation: {settings.durationVariation}%</Label>
            <Slider
              value={[settings.durationVariation]}
              onValueChange={(v) => updateSettings({ durationVariation: v[0] })}
              min={0}
              max={30}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Note length humanization
            </p>
          </div>

          <div className="space-y-2">
            <Label>Groove Intensity: {settings.grooveIntensity}%</Label>
            <Slider
              value={[settings.grooveIntensity]}
              onValueChange={(v) => updateSettings({ grooveIntensity: v[0] })}
              min={0}
              max={100}
              step={10}
            />
            <p className="text-xs text-muted-foreground">
              Swing and rhythmic feel
            </p>
          </div>

          <div className="space-y-2">
            <Label>Groove Template</Label>
            <Select defaultValue="amapiano">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amapiano">Amapiano</SelectItem>
                <SelectItem value="swing">Swing</SelectItem>
                <SelectItem value="shuffle">Shuffle</SelectItem>
                <SelectItem value="straight">Straight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => onHumanize?.(settings)}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Apply Humanization
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-medium">Benefits:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Eliminates robotic quantization</li>
            <li>• Genre-specific groove templates</li>
            <li>• Subtle, natural variations</li>
            <li>• Professional-sounding performances</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
