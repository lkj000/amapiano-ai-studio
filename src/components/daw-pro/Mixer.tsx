/**
 * Mixer Component
 * Channel strips with faders, panning, and effect slots
 */

import React, { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Headphones, ChevronUp, ChevronDown, Plus, Settings } from 'lucide-react';
import type { MixerChannel } from '@/pages/AmapianoPro';

interface MixerProps {
  channels: MixerChannel[];
  masterVolume: number;
  onUpdateChannel: (channelId: string, updates: Partial<MixerChannel>) => void;
  onUpdateMasterVolume: (volume: number) => void;
}

const EFFECT_SLOTS = 8;

export const Mixer: React.FC<MixerProps> = ({
  channels,
  masterVolume,
  onUpdateChannel,
  onUpdateMasterVolume,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  // Convert linear volume to dB display
  const volumeToDb = (volume: number) => {
    if (volume <= 0) return '-∞';
    const db = 20 * Math.log10(volume);
    return db.toFixed(1);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Mixer Header */}
      <div className="h-8 flex items-center px-3 border-b border-border bg-muted/30">
        <span className="text-sm font-medium">Mixer</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-6">
          <Plus className="h-3 w-3 mr-1" /> Add Insert
        </Button>
      </div>

      {/* Channel Strips */}
      <ScrollArea className="flex-1">
        <div className="flex h-full min-h-[400px] p-2 gap-1">
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              className={cn(
                "flex flex-col w-24 min-w-[96px] rounded-lg border transition-colors",
                selectedChannelId === channel.id 
                  ? "border-primary bg-muted/40" 
                  : "border-border bg-muted/20 hover:border-muted-foreground/30",
                channel.id === 'master' && "border-primary/50 bg-primary/10"
              )}
              onClick={() => setSelectedChannelId(channel.id)}
            >
              {/* Channel Name */}
              <div 
                className="h-8 flex items-center justify-center px-1 border-b border-border"
                style={{ borderTopColor: channel.color, borderTopWidth: 3 }}
              >
                <span className="text-xs font-medium truncate">{channel.name}</span>
              </div>

              {/* Effect Slots (collapsed by default) */}
              {expandedChannel === channel.id && (
                <div className="p-1 border-b border-border space-y-0.5">
                  {Array.from({ length: EFFECT_SLOTS }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-5 rounded text-[10px] flex items-center justify-center cursor-pointer",
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
                className="h-5 rounded-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedChannel(expandedChannel === channel.id ? null : channel.id);
                }}
              >
                {expandedChannel === channel.id ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>

              {/* Pan Knob */}
              <div className="flex flex-col items-center py-2 border-b border-border">
                <span className="text-[10px] text-muted-foreground mb-1">PAN</span>
                <div className="relative w-10 h-10">
                  <div 
                    className="absolute inset-0 rounded-full bg-muted border border-border flex items-center justify-center"
                  >
                    <div
                      className="w-1 h-4 bg-foreground rounded-full origin-bottom"
                      style={{ 
                        transform: `rotate(${channel.pan * 135}deg)`,
                        transformOrigin: 'center bottom'
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] mt-1">
                  {channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.abs(Math.round(channel.pan * 100))}` : `R${Math.round(channel.pan * 100)}`}
                </span>
              </div>

              {/* Fader Section */}
              <div className="flex-1 flex flex-col items-center py-2 px-2">
                {/* Level Meter */}
                <div className="flex gap-0.5 h-full w-full mb-2">
                  <div className="flex-1 bg-muted rounded-sm overflow-hidden flex flex-col-reverse">
                    <div 
                      className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all"
                      style={{ height: `${channel.volume * 100}%` }}
                    />
                  </div>
                  <div className="flex-1 bg-muted rounded-sm overflow-hidden flex flex-col-reverse">
                    <div 
                      className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all"
                      style={{ height: `${channel.volume * 100}%` }}
                    />
                  </div>
                </div>

                {/* Volume Fader */}
                <Slider
                  value={[channel.volume * 100]}
                  min={0}
                  max={125}
                  step={1}
                  orientation="vertical"
                  className="h-32"
                  onValueChange={([value]) => 
                    onUpdateChannel(channel.id, { volume: value / 100 })
                  }
                />

                {/* dB Display */}
                <span className="text-[10px] mt-2 font-mono">
                  {volumeToDb(channel.volume)} dB
                </span>
              </div>

              {/* Mute/Solo */}
              <div className="flex gap-1 p-1 border-t border-border">
                <Button
                  variant={channel.muted ? 'destructive' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateChannel(channel.id, { muted: !channel.muted });
                  }}
                >
                  {channel.muted ? (
                    <VolumeX className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant={channel.solo ? 'default' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateChannel(channel.id, { solo: !channel.solo });
                  }}
                >
                  <Headphones className="h-3 w-3" />
                </Button>
              </div>

              {/* Channel Number */}
              <div className="h-6 flex items-center justify-center border-t border-border">
                <span className="text-[10px] text-muted-foreground">
                  {channel.id === 'master' ? 'M' : index}
                </span>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
