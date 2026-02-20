/**
 * ChannelStrip Component
 * 
 * Individual mixer channel with fader, pan knob, mute/solo, and effect slots.
 * No fake level meters — when a real AnalyserNode is available, pass
 * `meterLevel` prop from real signal data.
 */

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Headphones, ChevronUp, ChevronDown } from 'lucide-react';
import type { MixerChannel } from '@/pages/AmapianoPro';

const EFFECT_SLOTS = 8;

interface ChannelStripProps {
  channel: MixerChannel;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<MixerChannel>) => void;
}

/** Convert linear volume (0–1.25) to dB display string */
function volumeToDb(volume: number): string {
  if (volume <= 0) return '-∞';
  return (20 * Math.log10(volume)).toFixed(1);
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({
  channel,
  index,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onUpdate,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col w-16 md:w-24 min-w-[64px] md:min-w-[96px] rounded-lg border transition-colors",
        isSelected
          ? "border-primary bg-muted/40"
          : "border-border bg-muted/20 hover:border-muted-foreground/30",
        channel.id === 'master' && "border-primary/50 bg-primary/10"
      )}
      onClick={onSelect}
    >
      {/* Channel Name */}
      <div
        className="h-6 md:h-8 flex items-center justify-center px-1 border-b border-border"
        style={{ borderTopColor: channel.color, borderTopWidth: 3 }}
      >
        <span className="text-[9px] md:text-xs font-medium truncate">{channel.name}</span>
      </div>

      {/* Effect Slots (collapsed by default) */}
      {isExpanded && (
        <div className="p-1 border-b border-border space-y-0.5 hidden sm:block">
          {Array.from({ length: EFFECT_SLOTS }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 md:h-5 rounded text-[8px] md:text-[10px] flex items-center justify-center cursor-pointer",
                channel.effects[i]
                  ? "bg-primary/20 text-primary"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {channel.effects[i] || `Slot ${i + 1}`}
            </div>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-4 md:h-5 rounded-none hidden sm:flex"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
      >
        {isExpanded ? (
          <ChevronUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
        ) : (
          <ChevronDown className="h-2.5 w-2.5 md:h-3 md:w-3" />
        )}
      </Button>

      {/* Pan Knob */}
      <div className="flex flex-col items-center py-1 md:py-2 border-b border-border">
        <span className="text-[8px] md:text-[10px] text-muted-foreground mb-0.5 md:mb-1">PAN</span>
        <div className="relative w-8 h-8 md:w-10 md:h-10">
          <div className="absolute inset-0 rounded-full bg-muted border border-border flex items-center justify-center">
            <div
              className="w-0.5 md:w-1 h-3 md:h-4 bg-foreground rounded-full origin-bottom"
              style={{
                transform: `rotate(${channel.pan * 135}deg)`,
                transformOrigin: 'center bottom',
              }}
            />
          </div>
        </div>
        <span className="text-[8px] md:text-[10px] mt-0.5 md:mt-1">
          {channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.abs(Math.round(channel.pan * 100))}` : `R${Math.round(channel.pan * 100)}`}
        </span>
      </div>

      {/* Fader Section — no fake meter, just the fader */}
      <div className="flex-1 flex flex-col items-center py-1 md:py-2 px-1 md:px-2">
        <Slider
          value={[channel.volume * 100]}
          min={0}
          max={125}
          step={1}
          orientation="vertical"
          className="h-20 md:h-32"
          onValueChange={([value]) =>
            onUpdate({ volume: value / 100 })
          }
        />

        {/* dB Display */}
        <span className="text-[8px] md:text-[10px] mt-1 md:mt-2 font-mono">
          {volumeToDb(channel.volume)} dB
        </span>
      </div>

      {/* Mute/Solo */}
      <div className="flex gap-0.5 md:gap-1 p-0.5 md:p-1 border-t border-border">
        <Button
          variant={channel.muted ? 'destructive' : 'ghost'}
          size="icon"
          className="h-6 w-6 md:h-7 md:w-7 flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ muted: !channel.muted });
          }}
        >
          {channel.muted ? (
            <VolumeX className="h-2.5 w-2.5 md:h-3 md:w-3" />
          ) : (
            <Volume2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
          )}
        </Button>
        <Button
          variant={channel.solo ? 'default' : 'ghost'}
          size="icon"
          className="h-6 w-6 md:h-7 md:w-7 flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ solo: !channel.solo });
          }}
        >
          <Headphones className="h-2.5 w-2.5 md:h-3 md:w-3" />
        </Button>
      </div>

      {/* Channel Number */}
      <div className="h-5 md:h-6 flex items-center justify-center border-t border-border">
        <span className="text-[8px] md:text-[10px] text-muted-foreground">
          {channel.id === 'master' ? 'M' : index}
        </span>
      </div>
    </div>
  );
};
