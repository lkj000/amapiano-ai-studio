/**
 * Channel Rack Component
 * FL Studio-style step sequencer with pattern management
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  Plus, Volume2, VolumeX, Headphones, MoreVertical,
  Trash2, Copy, ChevronDown, Music, Drum, Piano
} from 'lucide-react';
import type { DAWPattern, DAWChannel } from '@/pages/AmapianoPro';

interface ChannelRackProps {
  pattern: DAWPattern | undefined;
  patterns: DAWPattern[];
  selectedPatternId: string;
  selectedChannelId: string | null;
  currentStep: number;
  isPlaying: boolean;
  onSelectPattern: (id: string) => void;
  onSelectChannel: (id: string | null) => void;
  onAddPattern: () => void;
  onUpdatePattern: (id: string, updates: Partial<DAWPattern>) => void;
  onAddChannel: (type: 'sampler' | 'synth') => void;
  onUpdateChannel: (channelId: string, updates: Partial<DAWChannel>) => void;
  onToggleStep: (channelId: string, stepIndex: number) => void;
}

export const ChannelRack: React.FC<ChannelRackProps> = ({
  pattern,
  patterns,
  selectedPatternId,
  selectedChannelId,
  currentStep,
  isPlaying,
  onSelectPattern,
  onSelectChannel,
  onAddPattern,
  onUpdatePattern,
  onAddChannel,
  onUpdateChannel,
  onToggleStep,
}) => {
  const [hoveredStep, setHoveredStep] = useState<{ channelId: string; step: number } | null>(null);

  return (
    <div className="h-full flex flex-col bg-card border-b border-border">
      {/* Pattern Selector */}
      <div className="h-10 px-2 flex items-center gap-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground">Pattern:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-7">
              <div 
                className="w-3 h-3 rounded-sm mr-1" 
                style={{ backgroundColor: pattern?.color }} 
              />
              {pattern?.name || 'Select Pattern'}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {patterns.map(p => (
              <DropdownMenuItem 
                key={p.id}
                onClick={() => onSelectPattern(p.id)}
              >
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: p.color }} 
                />
                {p.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddPattern}>
          <Plus className="h-4 w-4" />
        </Button>

        {pattern && (
          <Input
            value={pattern.name}
            onChange={(e) => onUpdatePattern(pattern.id, { name: e.target.value })}
            className="w-32 h-7 text-xs"
          />
        )}

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-7">
              <Plus className="h-3 w-3" /> Add Channel
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAddChannel('sampler')}>
              <Drum className="h-4 w-4 mr-2" /> Sampler
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddChannel('synth')}>
              <Piano className="h-4 w-4 mr-2" /> Synth
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Step Sequencer */}
      <ScrollArea className="flex-1">
        <div className="min-w-fit">
          {/* Step Numbers Header */}
          <div className="flex h-6 border-b border-border sticky top-0 bg-card z-10">
            <div className="w-48 flex-shrink-0" />
            <div className="flex">
              {Array.from({ length: 16 }, (_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-8 h-6 flex items-center justify-center text-[10px] text-muted-foreground border-r border-border",
                    i % 4 === 0 && "bg-muted/30 font-medium",
                    currentStep === i && isPlaying && "bg-primary/20 text-primary"
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Channels */}
          {pattern?.channels.map((channel) => (
            <div 
              key={channel.id}
              className={cn(
                "flex h-10 border-b border-border hover:bg-muted/20 transition-colors",
                selectedChannelId === channel.id && "bg-muted/40"
              )}
              onClick={() => onSelectChannel(channel.id)}
            >
              {/* Channel Info */}
              <div className="w-48 flex-shrink-0 flex items-center gap-1 px-2 border-r border-border">
                <div 
                  className="w-2 h-full mr-1" 
                  style={{ backgroundColor: channel.color }} 
                />
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateChannel(channel.id, { muted: !channel.muted });
                  }}
                >
                  {channel.muted ? (
                    <VolumeX className="h-3 w-3 text-destructive" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>

                <Button 
                  variant={channel.solo ? 'default' : 'ghost'} 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateChannel(channel.id, { solo: !channel.solo });
                  }}
                >
                  <Headphones className="h-3 w-3" />
                </Button>

                <span className="text-xs font-medium truncate flex-1">{channel.name}</span>

                {channel.type === 'synth' && (
                  <Music className="h-3 w-3 text-muted-foreground" />
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Steps Grid */}
              <div className="flex">
                {channel.steps.map((active, stepIndex) => (
                  <button
                    key={stepIndex}
                    className={cn(
                      "w-8 h-10 border-r border-border transition-all",
                      stepIndex % 4 === 0 && "border-l-2 border-l-border",
                      active 
                        ? "bg-primary hover:bg-primary/80" 
                        : "bg-muted/20 hover:bg-muted/40",
                      currentStep === stepIndex && isPlaying && "ring-2 ring-accent ring-inset",
                      hoveredStep?.channelId === channel.id && 
                        hoveredStep?.step === stepIndex && !active && 
                        "bg-muted/60"
                    )}
                    style={active ? { backgroundColor: channel.color } : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStep(channel.id, stepIndex);
                    }}
                    onMouseEnter={() => setHoveredStep({ channelId: channel.id, step: stepIndex })}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    {active && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-background/30" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
