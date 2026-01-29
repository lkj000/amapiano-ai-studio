/**
 * DAW Transport Bar - Enhanced transport with time display and BPM quick-select
 * Matches reference design with centered controls and visual time display
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Circle,
  Minus,
  Plus,
} from 'lucide-react';

interface DAWTransportBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number;
  currentBar: number;
  bpm: number;
  loopEnabled: boolean;
  isInitialized: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onLoopToggle: () => void;
  onSeek: (bar: number, step: number) => void;
}

const BPM_PRESETS = [110, 115, 120, 125];

export const DAWTransportBar: React.FC<DAWTransportBarProps> = ({
  isPlaying,
  isRecording,
  currentStep,
  currentBar,
  bpm,
  loopEnabled,
  isInitialized,
  onPlay,
  onPause,
  onStop,
  onRecord,
  onBpmChange,
  onLoopToggle,
  onSeek,
}) => {
  // Format time display (MM:SS.MS)
  const formatTime = () => {
    const totalBeats = currentBar * 4 + Math.floor(currentStep / 4);
    const minutes = Math.floor(totalBeats / bpm);
    const seconds = Math.floor((totalBeats % bpm) * (60 / bpm));
    const ms = Math.floor(((currentStep % 4) / 4) * 100);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Format position display
  const formatPosition = () => {
    const bar = currentBar + 1;
    const beat = Math.floor(currentStep / 4) + 1;
    return `BAR ${bar} : BEAT ${beat}`;
  };

  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-4 gap-4">
      {/* Time Display */}
      <div className="flex flex-col items-center min-w-[100px]">
        <div className="font-mono text-2xl font-bold text-primary tracking-wider">
          {formatTime()}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {formatPosition()}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onSeek(0, 0)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to Start</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onStop}
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full",
                isPlaying && "bg-primary text-primary-foreground"
              )}
              onClick={isPlaying ? onPause : onPlay}
              disabled={!isInitialized}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={loopEnabled ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9"
              onClick={onLoopToggle}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Loop</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onSeek(currentBar + 1, 0)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Skip Forward</TooltipContent>
        </Tooltip>
      </div>

      {/* BPM Controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">BPM</span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onBpmChange(bpm - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>

        <Input
          type="number"
          value={bpm}
          onChange={(e) => onBpmChange(Math.max(40, Math.min(300, parseInt(e.target.value) || 113)))}
          className="w-16 h-8 text-center font-mono text-lg font-bold bg-primary/10 border-primary/30"
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onBpmChange(bpm + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>

        {/* BPM Presets */}
        <div className="flex items-center gap-1 ml-2">
          {BPM_PRESETS.map((preset) => (
            <Button
              key={preset}
              variant={bpm === preset ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 px-2 text-xs font-mono",
                bpm === preset && "bg-primary text-primary-foreground"
              )}
              onClick={() => onBpmChange(preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Time Signature */}
      <div className="text-xs text-muted-foreground font-mono">
        4/4
      </div>
    </div>
  );
};
