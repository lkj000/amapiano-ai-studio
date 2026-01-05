/**
 * Instrument Card Component
 * Individual instrument display with processing controls
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp,
  Volume2,
  Waves,
  Zap,
  Thermometer
} from 'lucide-react';

export interface InstrumentSpec {
  instrument_id: string;
  name: string;
  category: string;
  description: string;
  presence: number;
  style: string;
  processing: {
    reverb: number;
    warmth: number;
    distortion: number;
    humanization: number;
  };
  is_core: boolean;
  icon: React.ReactNode;
}

interface InstrumentCardProps {
  instrument: InstrumentSpec;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<InstrumentSpec>) => void;
}

const STYLE_OPTIONS: Record<string, string[]> = {
  bass: ['soft', 'punchy', 'aggressive', 'mellow', 'deep'],
  percussion: ['tight', 'loose', 'driving', 'subtle', 'tribal'],
  keys: ['jazzy', 'soulful', 'bright', 'warm', 'electric'],
  strings: ['legato', 'pizzicato', 'tremolo', 'expressive', 'cinematic'],
  brass: ['smooth', 'punchy', 'mellow', 'bright', 'muted'],
  synth: ['pad', 'lead', 'pluck', 'arp', 'ambient'],
  vocal: ['chops', 'chants', 'adlibs', 'harmonies', 'whispers']
};

const CATEGORY_COLORS: Record<string, string> = {
  bass: 'bg-violet-500/20 text-violet-500 border-violet-500/30',
  percussion: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  keys: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  strings: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  brass: 'bg-red-500/20 text-red-500 border-red-500/30',
  synth: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
  vocal: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30'
};

export function InstrumentCard({ 
  instrument, 
  isSelected, 
  onSelect, 
  onChange 
}: InstrumentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const styles = STYLE_OPTIONS[instrument.category] || ['default'];
  const categoryColor = CATEGORY_COLORS[instrument.category] || 'bg-muted';

  const handleProcessingChange = (key: keyof InstrumentSpec['processing'], value: number) => {
    onChange({
      processing: {
        ...instrument.processing,
        [key]: value
      }
    });
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'hover:border-muted-foreground/30'
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3" onClick={onSelect}>
          <div className={`flex-shrink-0 p-2 rounded-lg ${categoryColor}`}>
            {instrument.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm leading-tight">
                {instrument.name}
              </h4>
              {instrument.is_core && (
                <Badge variant="secondary" className="text-[10px] px-1">Core</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {instrument.description}
            </p>
          </div>
        </div>

        {isSelected && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 h-7"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide Controls
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show Controls
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-3">
              {/* Presence Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    Presence
                  </span>
                  <span className="font-medium">{(instrument.presence * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[instrument.presence]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => onChange({ presence: v })}
                />
              </div>

              {/* Style Selector */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Style</label>
                <Select 
                  value={instrument.style} 
                  onValueChange={v => onChange({ style: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map(style => (
                      <SelectItem key={style} value={style} className="text-xs">
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Processing Controls */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground">Processing</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Waves className="h-3 w-3" />
                      Reverb
                    </span>
                    <span>{(instrument.processing.reverb * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[instrument.processing.reverb]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => handleProcessingChange('reverb', v)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      Warmth
                    </span>
                    <span>{(instrument.processing.warmth * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[instrument.processing.warmth]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => handleProcessingChange('warmth', v)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Drive
                    </span>
                    <span>{(instrument.processing.distortion * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[instrument.processing.distortion]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => handleProcessingChange('distortion', v)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Humanization</span>
                    <span>{(instrument.processing.humanization * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[instrument.processing.humanization]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => handleProcessingChange('humanization', v)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
