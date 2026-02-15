import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings2, Layers } from 'lucide-react';
import { SetConfig, DJPreset, SetDuration, PRESET_INFO } from './DJAgentTypes';

interface DJSetConfigProps {
  config: SetConfig;
  onChange: (config: SetConfig) => void;
}

export default function DJSetConfig({ config, onChange }: DJSetConfigProps) {
  const update = <K extends keyof SetConfig>(key: K, value: SetConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Set Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Duration */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Duration</Label>
          <Select
            value={String(config.duration)}
            onValueChange={(v) => update('duration', Number(v) as SetDuration)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preset */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Vibe Preset</Label>
          <div className="grid grid-cols-1 gap-1.5">
            {(Object.entries(PRESET_INFO) as [DJPreset, typeof PRESET_INFO[DJPreset]][]).map(([key, info]) => (
              <button
                key={key}
                className={`text-left p-2.5 rounded-md border transition-all ${
                  config.preset === key
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/40 hover:border-primary/40 text-muted-foreground'
                }`}
                onClick={() => update('preset', key)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs opacity-70">{info.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Risk slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Risk Level</Label>
            <span className="text-xs text-muted-foreground">
              {config.risk <= 0.3 ? 'Safe' : config.risk <= 0.6 ? 'Balanced' : 'Wild'}
            </span>
          </div>
          <Slider
            value={[config.risk * 100]}
            onValueChange={([v]) => update('risk', v / 100)}
            max={100}
            step={5}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Harmonic</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Harmonic strictness */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Harmonic Strictness</Label>
            <span className="text-xs text-muted-foreground">{Math.round(config.harmonicStrictness * 100)}%</span>
          </div>
          <Slider
            value={[config.harmonicStrictness * 100]}
            onValueChange={([v]) => update('harmonicStrictness', v / 100)}
            max={100}
            step={5}
          />
        </div>

        {/* Max BPM delta */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Max BPM Jump</Label>
            <span className="text-xs text-muted-foreground">±{config.maxBpmDelta} BPM</span>
          </div>
          <Slider
            value={[config.maxBpmDelta]}
            onValueChange={([v]) => update('maxBpmDelta', v)}
            max={10}
            min={1}
            step={1}
          />
        </div>

        {/* Vocals toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Allow Vocal Mashups</Label>
          <Switch
            checked={config.allowVocalOverlay}
            onCheckedChange={(v) => update('allowVocalOverlay', v)}
          />
        </div>

        {/* Stem Mode */}
        <div className="space-y-2 border-t border-border/30 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Stem Mode</Label>
              <Badge variant="outline" className="text-[9px] px-1 py-0">4th Variation</Badge>
            </div>
            <Switch
              checked={config.enableStemMode}
              onCheckedChange={(v) => update('enableStemMode', v)}
            />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Separates each track into stems (vocals, drums, bass, etc.) and generates a 4th "Stemmed" variation with per-stem crossfading for professional-grade transitions. Takes 2-4 min per track.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
