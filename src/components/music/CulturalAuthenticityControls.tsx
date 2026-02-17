import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music } from 'lucide-react';
import { GASP_TIMING_OPTIONS, getGenreDefaults } from '@/constants/genreDefaults';

export interface CulturalSettings {
  swing: number[];
  gaspTiming: string;
  logDrumIntensity: number[];
}

interface CulturalAuthenticityControlsProps {
  settings: CulturalSettings;
  onChange: (settings: CulturalSettings) => void;
  genre?: string;
  compact?: boolean;
}

export function CulturalAuthenticityControls({ 
  settings, 
  onChange, 
  genre = 'Amapiano',
  compact = false 
}: CulturalAuthenticityControlsProps) {
  const genreDefaults = getGenreDefaults(genre);

  const getSwingLabel = (value: number) => {
    if (value < 30) return 'Straight';
    if (value < 50) return 'Light Swing';
    if (value < 70) return 'Amapiano Groove';
    return 'Heavy Swing';
  };

  const getLogDrumLabel = (value: number) => {
    if (value < 25) return 'Subtle';
    if (value < 50) return 'Moderate';
    if (value < 75) return 'Prominent';
    return 'Dominant';
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs">Swing: {settings.swing[0]}%</Label>
            <Badge variant="outline" className="text-[10px]">{getSwingLabel(settings.swing[0])}</Badge>
          </div>
          <Slider
            value={settings.swing}
            onValueChange={(v) => onChange({ ...settings, swing: v })}
            min={0} max={100} step={5}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs">Log Drum: {settings.logDrumIntensity[0]}%</Label>
            <Badge variant="outline" className="text-[10px]">{getLogDrumLabel(settings.logDrumIntensity[0])}</Badge>
          </div>
          <Slider
            value={settings.logDrumIntensity}
            onValueChange={(v) => onChange({ ...settings, logDrumIntensity: v })}
            min={0} max={100} step={5}
          />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Music className="h-4 w-4 text-primary" />
          Cultural Authenticity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Swing Feel */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Swing Feel</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{getSwingLabel(settings.swing[0])}</Badge>
              <span className="text-xs text-muted-foreground">{settings.swing[0]}%</span>
            </div>
          </div>
          <Slider
            value={settings.swing}
            onValueChange={(v) => onChange({ ...settings, swing: v })}
            min={0} max={100} step={5}
          />
          <p className="text-xs text-muted-foreground">
            Typical for {genre}: {genreDefaults.swingRange[0]}–{genreDefaults.swingRange[1]}% swing
          </p>
        </div>

        {/* Gasp Timing */}
        <div className="space-y-2">
          <Label className="text-sm">Gasp Timing</Label>
          <Select value={settings.gaspTiming} onValueChange={(v) => onChange({ ...settings, gaspTiming: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GASP_TIMING_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log Drum Intensity */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Log Drum Intensity</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{getLogDrumLabel(settings.logDrumIntensity[0])}</Badge>
              <span className="text-xs text-muted-foreground">{settings.logDrumIntensity[0]}%</span>
            </div>
          </div>
          <Slider
            value={settings.logDrumIntensity}
            onValueChange={(v) => onChange({ ...settings, logDrumIntensity: v })}
            min={0} max={100} step={5}
          />
          <p className="text-xs text-muted-foreground">
            Recommended for {genre}: ~{genreDefaults.logDrumDefault}% intensity
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default CulturalAuthenticityControls;
