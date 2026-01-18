/**
 * Transport Bar Component
 * Real audio playback controls with level meter
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  Repeat, Circle, Clock, Music, Zap, Activity, Settings2
} from 'lucide-react';
import type { ProducerDNAProfile } from '@/lib/audio/ProducerDNA';

interface TransportBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number;
  currentBar: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  meterLevel: number;
  isInitialized: boolean;
  producerProfile: ProducerDNAProfile;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onLoopToggle: () => void;
  onSeek: (bar: number, step: number) => void;
  onToggleAdvanced: () => void;
  showAdvanced: boolean;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isRecording,
  currentStep,
  currentBar,
  bpm,
  timeSignature,
  loopEnabled,
  loopStart,
  loopEnd,
  meterLevel,
  isInitialized,
  producerProfile,
  onPlay,
  onPause,
  onStop,
  onRecord,
  onBpmChange,
  onLoopToggle,
  onSeek,
  onToggleAdvanced,
  showAdvanced,
}) => {
  // Format time display
  const formatTime = () => {
    const totalBeats = currentBar * 4 + Math.floor(currentStep / 4);
    const minutes = Math.floor(totalBeats / bpm);
    const seconds = Math.floor((totalBeats % bpm) * (60 / bpm));
    const ms = Math.floor(((currentStep % 4) / 4) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Format position display (Bar.Beat.Step)
  const formatPosition = () => {
    const bar = currentBar + 1;
    const beat = Math.floor(currentStep / 4) + 1;
    const step = (currentStep % 4) + 1;
    return `${bar}.${beat}.${step}`;
  };

  // Convert dB to visual meter height (0-100%)
  const getMeterHeight = () => {
    // meterLevel is in dB, typically -60 to 0
    const normalized = Math.max(0, Math.min(100, (meterLevel + 60) / 60 * 100));
    return normalized;
  };

  // Get meter color based on level
  const getMeterColor = () => {
    if (meterLevel > -3) return 'bg-destructive';
    if (meterLevel > -12) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="h-14 md:h-16 bg-card border-t border-border flex items-center px-2 md:px-4 gap-1 md:gap-4 overflow-x-auto scrollbar-hide">
      {/* Transport Controls */}
      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={() => onSeek(0, 0)}
            >
              <SkipBack className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to Start</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={onStop}
            >
              <Square className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop (Space)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPlaying ? 'default' : 'ghost'}
              size="icon"
              className={cn("h-9 w-9 md:h-10 md:w-10", isPlaying && "bg-primary text-primary-foreground animate-pulse")}
              onClick={isPlaying ? onPause : onPlay}
              disabled={!isInitialized}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Play className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPlaying ? 'Pause' : 'Play'} (Space)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isRecording ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                "h-8 w-8 md:h-9 md:w-9 hidden sm:flex",
                isRecording && "bg-destructive text-destructive-foreground animate-pulse"
              )}
              onClick={onRecord}
              disabled={!isInitialized}
            >
              <Circle className={cn(
                "h-3 w-3 md:h-4 md:w-4",
                isRecording ? "fill-current" : "text-destructive"
              )} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isRecording ? 'Stop Recording' : 'Record'} (R)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={loopEnabled ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={onLoopToggle}
            >
              <Repeat className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Loop ({loopStart + 1}-{loopEnd})</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 md:h-8 hidden sm:block" />

      {/* Level Meter - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5 h-6 md:h-8">
            <div className="w-1.5 md:w-2 h-full bg-muted rounded-sm overflow-hidden flex flex-col-reverse">
              <div 
                className={cn("w-full transition-all duration-75", getMeterColor())}
                style={{ height: `${getMeterHeight()}%` }}
              />
            </div>
            <div className="w-1.5 md:w-2 h-full bg-muted rounded-sm overflow-hidden flex flex-col-reverse">
              <div 
                className={cn("w-full transition-all duration-75", getMeterColor())}
                style={{ height: `${getMeterHeight() * 0.95}%` }}
              />
            </div>
          </div>
          <span className="text-[7px] md:text-[8px] text-muted-foreground font-mono">
            {meterLevel > -60 ? meterLevel.toFixed(1) : '-∞'}
          </span>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6 md:h-8" />

      {/* Position Display */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <div className="text-center">
          <div className="text-[8px] md:text-[10px] text-muted-foreground hidden xs:block">POS</div>
          <div className="font-mono text-sm md:text-lg font-bold tracking-wider text-primary">
            {formatPosition()}
          </div>
        </div>

        <div className="text-center hidden md:block">
          <div className="text-[10px] text-muted-foreground">TIME</div>
          <div className="font-mono text-sm text-muted-foreground">
            {formatTime()}
          </div>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6 md:h-8" />

      {/* Tempo - Compact on mobile */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <Music className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground hidden xs:block" />
        <div className="flex flex-col">
          <div className="text-[8px] md:text-[10px] text-muted-foreground hidden sm:block">TEMPO</div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <Input
              type="number"
              value={bpm}
              onChange={(e) => onBpmChange(Math.max(20, Math.min(300, parseInt(e.target.value) || 113)))}
              className="w-12 md:w-16 h-6 md:h-7 text-center font-mono text-xs md:text-sm"
            />
            <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">BPM</span>
          </div>
        </div>
      </div>

      {/* Tempo Slider - Hidden on small screens */}
      <div className="w-16 md:w-24 hidden lg:block">
        <Slider
          value={[bpm]}
          min={60}
          max={180}
          step={1}
          onValueChange={([v]) => onBpmChange(v)}
        />
      </div>

      <Separator orientation="vertical" className="h-6 md:h-8 hidden md:block" />

      {/* Producer DNA Badge - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <Zap className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <div className="text-[10px] text-muted-foreground">DNA</div>
          <Badge variant="outline" className="text-[10px] md:text-xs">
            {producerProfile.name}
          </Badge>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6 md:h-8 hidden lg:block" />

      {/* Time Signature - Hidden on smaller screens */}
      <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">SIG</div>
          <div className="font-mono text-sm">
            {timeSignature.numerator}/{timeSignature.denominator}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-2" />

      {/* Toggle Advanced Panels */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={showAdvanced ? 'default' : 'ghost'} 
            size="icon" 
            className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0"
            onClick={onToggleAdvanced}
          >
            <Settings2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle Advanced Panels</TooltipContent>
      </Tooltip>

      {/* Audio Status - Compact on mobile */}
      <div className="hidden sm:flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-muted-foreground flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className={cn(
            "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full",
            isInitialized 
              ? isPlaying ? "bg-success animate-pulse" : "bg-success" 
              : "bg-warning"
          )} />
          <span className="hidden md:inline">{isInitialized ? (isPlaying ? 'Playing' : 'Ready') : 'Init...'}</span>
        </div>
        <Activity className="h-2.5 w-2.5 md:h-3 md:w-3 hidden lg:block" />
        <span className="hidden lg:inline">Tone.js</span>
      </div>
    </div>
  );
};
