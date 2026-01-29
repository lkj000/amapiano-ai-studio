/**
 * Quick Audio Bar - Bottom toolbar with quick-access sound generation buttons
 * Piano, Drums, Vocals, Pads, Chords, Stems, Loop Rec, MIDI, etc.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Piano,
  Drum,
  Mic2,
  Waves,
  Music4,
  Layers,
  Circle,
  FileMusic,
  ZoomIn,
  ZoomOut,
  Search,
  TestTube,
  CheckCircle,
} from 'lucide-react';

interface QuickAudioBarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onQuickGenerate?: (type: string) => void;
  onLoopRecord?: () => void;
  onMidiImport?: () => void;
  onTestGuide?: () => void;
  onVerify?: () => void;
  isRecording?: boolean;
}

const QUICK_SOUNDS = [
  { id: 'piano', label: 'Piano', icon: Piano, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
  { id: 'drums', label: 'Drums', icon: Drum, color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
  { id: 'vocals', label: 'Vocals', icon: Mic2, color: 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30' },
  { id: 'pads', label: 'Pads', icon: Waves, color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
  { id: 'chords', label: 'Chords', icon: Music4, color: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' },
  { id: 'stems', label: 'Stems', icon: Layers, color: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' },
];

export const QuickAudioBar: React.FC<QuickAudioBarProps> = ({
  zoom,
  onZoomChange,
  onQuickGenerate,
  onLoopRecord,
  onMidiImport,
  onTestGuide,
  onVerify,
  isRecording = false,
}) => {
  return (
    <div className="h-12 bg-gradient-to-r from-background via-card to-background border-t border-border flex items-center px-3 gap-2">
      {/* Quick Audio Label */}
      <div className="flex items-center gap-1.5 mr-2">
        <span className="text-xs text-muted-foreground font-medium">Quick</span>
        <span className="text-xs text-muted-foreground">Audio:</span>
      </div>

      {/* Quick Sound Buttons */}
      <div className="flex items-center gap-1.5">
        {QUICK_SOUNDS.map((sound) => (
          <Tooltip key={sound.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-3 gap-1.5 text-xs rounded-full", sound.color)}
                onClick={() => onQuickGenerate?.(sound.id)}
              >
                <sound.icon className="w-3.5 h-3.5" />
                {sound.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate AI {sound.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Loop Record */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            className={cn(
              "h-8 px-3 gap-1.5 text-xs rounded-full",
              isRecording && "animate-pulse"
            )}
            onClick={onLoopRecord}
          >
            <Circle className={cn("w-3 h-3", isRecording && "fill-current")} />
            Loop Rec
          </Button>
        </TooltipTrigger>
        <TooltipContent>Loop Recording</TooltipContent>
      </Tooltip>

      {/* MIDI */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-1.5 text-xs rounded-full bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border-violet-500/30"
            onClick={onMidiImport}
          >
            <FileMusic className="w-3.5 h-3.5" />
            MIDI
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import MIDI</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-[10px] text-muted-foreground w-10 text-center font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onZoomChange(Math.min(4, zoom + 0.25))}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Test & Verify */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-1.5 text-xs"
            onClick={onTestGuide}
          >
            <TestTube className="w-3.5 h-3.5" />
            Test Guide
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open Testing Guide</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-1.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            onClick={onVerify}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Verify
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verify & Validate Project</TooltipContent>
      </Tooltip>
    </div>
  );
};
