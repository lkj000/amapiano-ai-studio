import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AMAPIANO_VOICE_CATEGORIES } from '@/constants/amapianoVoices';

interface VoiceStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
}

export function VoiceStyleSelector({ 
  value, 
  onChange, 
  label = 'Voice Style',
  placeholder = 'Select voice style',
  showLabel = true,
}: VoiceStyleSelectorProps) {
  return (
    <div className="space-y-2">
      {showLabel && <Label className="text-sm">{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {AMAPIANO_VOICE_CATEGORIES.map((cat) => (
            <SelectGroup key={cat.category}>
              <SelectLabel className="text-primary font-semibold text-xs">
                {cat.category}
              </SelectLabel>
              {cat.voices.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  <div className="flex flex-col">
                    <span>{voice.label}</span>
                    <span className="text-xs text-muted-foreground">{voice.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default VoiceStyleSelector;
