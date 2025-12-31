import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Music, Drum, Piano, Waves, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Regional style characteristics derived from ML analysis
const REGIONAL_STYLES = {
  johannesburg: {
    name: 'Johannesburg',
    alias: 'Jozi Deep',
    color: 'bg-violet-500',
    characteristics: {
      bpmRange: [110, 118],
      swingFactor: 0.67,
      logDrumStyle: 'deep-sub',
      pianoStyle: 'jazzy-chords',
      percussionDensity: 0.7,
      basslineStyle: 'walking',
    },
    description: 'Deep, jazzy sound with heavy log drums and sophisticated chord progressions',
    elements: ['Deep log drums', 'Jazz piano', 'Walking basslines', 'Laid-back groove'],
    popularArtists: ['Kabza De Small', 'DJ Maphorisa', 'Vigro Deep'],
  },
  pretoria: {
    name: 'Pretoria',
    alias: 'PTA Bounce',
    color: 'bg-blue-500',
    characteristics: {
      bpmRange: [114, 122],
      swingFactor: 0.62,
      logDrumStyle: 'punchy',
      pianoStyle: 'melodic',
      percussionDensity: 0.85,
      basslineStyle: 'sub',
    },
    description: 'Energetic bounce with punchy drums and melodic piano leads',
    elements: ['Punchy kicks', 'Melodic leads', 'Sub bass', 'High energy'],
    popularArtists: ['Focalistic', 'DBN Gogo', 'Major League DJz'],
  },
  durban: {
    name: 'Durban',
    alias: 'Durban Gqom Fusion',
    color: 'bg-orange-500',
    characteristics: {
      bpmRange: [116, 125],
      swingFactor: 0.58,
      logDrumStyle: 'aggressive',
      pianoStyle: 'minimal',
      percussionDensity: 0.95,
      basslineStyle: 'rolling',
    },
    description: 'Gqom-influenced sound with aggressive drums and minimal melodic elements',
    elements: ['Gqom influence', 'Rolling bass', 'Tribal percussion', 'Raw energy'],
    popularArtists: ['DJ Lag', 'Distruction Boyz', 'Babes Wodumo'],
  },
  'cape-town': {
    name: 'Cape Town',
    alias: 'CT Smooth',
    color: 'bg-teal-500',
    characteristics: {
      bpmRange: [108, 115],
      swingFactor: 0.72,
      logDrumStyle: 'warm',
      pianoStyle: 'soulful',
      percussionDensity: 0.6,
      basslineStyle: 'melodic',
    },
    description: 'Smooth, soulful sound with warm tones and relaxed grooves',
    elements: ['Soulful keys', 'Warm bass', 'Relaxed swing', 'Vocal chops'],
    popularArtists: ['Kyle Watson', 'Dean Fuel', 'Kid Fonque'],
  },
};

type RegionKey = keyof typeof REGIONAL_STYLES;

interface RegionalStyleSelectorProps {
  selectedRegion: RegionKey;
  onRegionChange: (region: RegionKey) => void;
  onApplyStyle?: (style: typeof REGIONAL_STYLES[RegionKey]) => void;
  intensity?: number;
  onIntensityChange?: (intensity: number) => void;
}

export const RegionalStyleSelector: React.FC<RegionalStyleSelectorProps> = ({
  selectedRegion,
  onRegionChange,
  onApplyStyle,
  intensity = 100,
  onIntensityChange,
}) => {
  const [autoApply, setAutoApply] = useState(true);

  const selectedStyle = REGIONAL_STYLES[selectedRegion];

  const handleRegionSelect = (region: RegionKey) => {
    onRegionChange(region);
    if (autoApply && onApplyStyle) {
      onApplyStyle(REGIONAL_STYLES[region]);
    }
  };

  const handleApplyStyle = () => {
    if (onApplyStyle) {
      onApplyStyle(selectedStyle);
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'logDrumStyle': return <Drum className="w-4 h-4" />;
      case 'pianoStyle': return <Piano className="w-4 h-4" />;
      case 'basslineStyle': return <Waves className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Regional Style</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                ML-derived regional characteristics
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Smart
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Region Selection Grid */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(REGIONAL_STYLES) as [RegionKey, typeof REGIONAL_STYLES[RegionKey]][]).map(([key, style]) => (
            <button
              key={key}
              onClick={() => handleRegionSelect(key)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all text-left",
                "hover:border-primary/50 hover:bg-primary/5",
                selectedRegion === key 
                  ? "border-primary bg-primary/10" 
                  : "border-border/50 bg-muted/20"
              )}
            >
              {selectedRegion === key && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("w-3 h-3 rounded-full", style.color)} />
                <span className="font-medium text-sm">{style.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{style.alias}</span>
            </button>
          ))}
        </div>

        {/* Selected Style Details */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded-full", selectedStyle.color)} />
            <span className="font-semibold">{selectedStyle.name}</span>
            <Badge variant="outline" className="text-xs">{selectedStyle.alias}</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {selectedStyle.description}
          </p>

          {/* Key Elements */}
          <div className="flex flex-wrap gap-1.5">
            {selectedStyle.elements.map((element, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {element}
              </Badge>
            ))}
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">BPM Range</span>
              <div className="font-mono text-sm">
                {selectedStyle.characteristics.bpmRange[0]}-{selectedStyle.characteristics.bpmRange[1]}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Swing Factor</span>
              <div className="font-mono text-sm">
                {Math.round(selectedStyle.characteristics.swingFactor * 100)}%
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Log Drum</span>
              <div className="text-sm capitalize">
                {selectedStyle.characteristics.logDrumStyle.replace('-', ' ')}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Piano Style</span>
              <div className="text-sm capitalize">
                {selectedStyle.characteristics.pianoStyle.replace('-', ' ')}
              </div>
            </div>
          </div>

          {/* Popular Artists */}
          <div className="pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground block mb-1.5">Reference Artists</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedStyle.popularArtists.map((artist, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {artist}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Intensity Control */}
        {onIntensityChange && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Style Intensity</Label>
              <span className="text-sm font-mono tabular-nums">{intensity}%</span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={([v]) => onIntensityChange(v)}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtle</span>
              <span>Full</span>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Switch 
              id="auto-apply" 
              checked={autoApply} 
              onCheckedChange={setAutoApply} 
            />
            <Label htmlFor="auto-apply" className="text-sm cursor-pointer">
              Auto-apply on selection
            </Label>
          </div>
        </div>

        {/* Apply Button */}
        {!autoApply && onApplyStyle && (
          <Button className="w-full" onClick={handleApplyStyle}>
            <Sparkles className="w-4 h-4 mr-2" />
            Apply {selectedStyle.name} Style
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RegionalStyleSelector;
