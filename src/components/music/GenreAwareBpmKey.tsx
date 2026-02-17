import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getGenreDefaults, MUSICAL_KEYS } from '@/constants/genreDefaults';

interface GenreAwareBpmKeyProps {
  genre: string;
  bpm: number[];
  onBpmChange: (bpm: number[]) => void;
  musicalKey: string;
  onKeyChange: (key: string) => void;
  /** Auto-apply genre defaults on genre change */
  autoApply?: boolean;
}

export function GenreAwareBpmKey({
  genre,
  bpm,
  onBpmChange,
  musicalKey,
  onKeyChange,
  autoApply = true,
}: GenreAwareBpmKeyProps) {
  const defaults = getGenreDefaults(genre);

  useEffect(() => {
    if (autoApply) {
      onBpmChange([defaults.suggestedBpm]);
      if (defaults.commonKeys.length > 0 && !defaults.commonKeys.includes(musicalKey)) {
        onKeyChange(defaults.commonKeys[0]);
      }
    }
  }, [genre]);

  return (
    <div className="space-y-4">
      {/* BPM with genre context */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm">BPM</Label>
          <span className="text-sm font-medium text-primary">{bpm[0]} BPM</span>
        </div>
        <Slider
          value={bpm}
          onValueChange={onBpmChange}
          min={defaults.bpmRange[0] - 10}
          max={defaults.bpmRange[1] + 10}
          step={1}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {genre} range: {defaults.bpmRange[0]}–{defaults.bpmRange[1]} BPM
          </p>
          {(bpm[0] < defaults.bpmRange[0] || bpm[0] > defaults.bpmRange[1]) && (
            <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30">
              Outside typical range
            </Badge>
          )}
        </div>
      </div>

      {/* Key with genre suggestions */}
      <div className="space-y-2">
        <Label className="text-sm">Key</Label>
        <Select value={musicalKey} onValueChange={onKeyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {defaults.commonKeys.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-primary bg-primary/5">
                  Recommended for {genre}
                </div>
                {defaults.commonKeys.map((k) => (
                  <SelectItem key={`rec-${k}`} value={k}>
                    {k} ★
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  All Keys
                </div>
              </>
            )}
            {MUSICAL_KEYS.filter(k => !defaults.commonKeys.includes(k)).map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{defaults.description}</p>
      </div>
    </div>
  );
}

export default GenreAwareBpmKey;
