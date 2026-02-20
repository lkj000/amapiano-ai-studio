/**
 * Mixer Component
 * Channel strips with faders, panning, and effect slots.
 * 
 * Level meters are REMOVED — they were fake (mirroring volume, not signal).
 * When a real AnalyserNode-backed audio engine is connected, real meters
 * should be added via a useLevelMeter hook that reads actual frequency data.
 */

import React, { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MixerChannel } from '@/pages/AmapianoPro';
import { ChannelStrip } from './ChannelStrip';

interface MixerProps {
  channels: MixerChannel[];
  masterVolume: number;
  onUpdateChannel: (channelId: string, updates: Partial<MixerChannel>) => void;
  onUpdateMasterVolume: (volume: number) => void;
}

export const Mixer: React.FC<MixerProps> = ({
  channels,
  masterVolume,
  onUpdateChannel,
  onUpdateMasterVolume,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Mixer Header */}
      <div className="h-7 md:h-8 flex items-center px-2 md:px-3 border-b border-border bg-muted/30">
        <span className="text-xs md:text-sm font-medium">Mixer</span>
      </div>

      {/* Channel Strips */}
      <ScrollArea className="flex-1">
        <div className="flex h-full min-h-[300px] md:min-h-[400px] p-1 md:p-2 gap-0.5 md:gap-1">
          {channels.map((channel, index) => (
            <ChannelStrip
              key={channel.id}
              channel={channel}
              index={index}
              isSelected={selectedChannelId === channel.id}
              isExpanded={expandedChannel === channel.id}
              onSelect={() => setSelectedChannelId(channel.id)}
              onToggleExpand={() => setExpandedChannel(expandedChannel === channel.id ? null : channel.id)}
              onUpdate={(updates) => onUpdateChannel(channel.id, updates)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
