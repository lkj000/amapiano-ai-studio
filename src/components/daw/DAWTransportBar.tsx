import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Music, ZoomIn } from 'lucide-react';
import UndoRedoControls from '@/components/UndoRedoControls';
import type { DawProjectData } from '@/types/daw';

interface DAWTransportBarProps {
  projectData: DawProjectData;
  isPlaying: boolean;
  currentTime: number;
  zoom: number[];
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onBpmChange: (bpm: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onZoomChange: (zoom: number[]) => void;
  undoRedoState: {
    canUndo: boolean;
    canRedo: boolean;
    historyLength: number;
    currentIndex: number;
  };
  onUndo: () => void;
  onRedo: () => void;
}

export const DAWTransportBar: React.FC<DAWTransportBarProps> = ({
  projectData,
  isPlaying,
  currentTime,
  zoom,
  onPlay,
  onPause,
  onStop,
  onSkipBack,
  onSkipForward,
  onBpmChange,
  onMasterVolumeChange,
  onZoomChange,
  undoRedoState,
  onUndo,
  onRedo,
}) => {
  const currentBar = Math.floor(currentTime / 4) + 1;
  const currentBeat = Math.floor(currentTime % 4) + 1;
  const currentTick = Math.floor((currentTime % 1) * 960);

  return (
    <div className="border-b border-border bg-muted/50 p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Transport Controls */}
        <div className="flex items-center gap-1 sm:gap-2 bg-background/80 rounded-xl px-2 sm:px-4 py-1.5 sm:py-2.5 border border-border/50 backdrop-blur-sm shadow-md">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSkipBack} 
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
          >
            <SkipBack className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant={isPlaying ? "secondary" : "default"} 
            size="icon" 
            onClick={isPlaying ? onPause : onPlay}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-lg hover:shadow-primary/25 transition-all"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onStop}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <Square className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSkipForward}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
          >
            <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-3 bg-background/80 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2.5 border border-border/50 backdrop-blur-sm shadow-md font-mono">
          <span className="text-xs text-muted-foreground hidden sm:inline">Position</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-bold tabular-nums text-primary">{String(currentBar).padStart(3, '0')}</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-base sm:text-lg font-bold tabular-nums">{String(currentBeat).padStart(2, '0')}</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">{String(currentTick).padStart(3, '0')}</span>
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="hidden sm:block">
          <UndoRedoControls undoRedoState={undoRedoState} onUndo={onUndo} onRedo={onRedo} />
        </div>

        <Separator orientation="vertical" className="hidden md:block h-8" />

        {/* BPM Control */}
        <div className="flex items-center gap-2 sm:gap-2.5 bg-background/60 rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 border border-border/30 backdrop-blur-sm shadow-sm">
          <Music className="h-3 w-3 sm:h-4 sm:w-4 text-primary/70" />
          <span className="hidden sm:inline text-[10px] text-muted-foreground font-medium uppercase tracking-wide">BPM</span>
          <div className="w-16 sm:w-24">
            <Slider 
              value={[projectData.bpm]} 
              onValueChange={([v]) => onBpmChange(v)} 
              min={80} 
              max={160} 
              step={1} 
            />
          </div>
          <span className="text-xs font-bold tabular-nums min-w-[32px]">{projectData.bpm}</span>
        </div>

        {/* Master Volume */}
        <div className="flex items-center gap-3 bg-background/60 rounded-xl px-4 py-2 border border-border/30 backdrop-blur-sm shadow-sm min-w-[140px]">
          <Volume2 className="h-4 w-4 text-primary/70" />
          <div className="flex-1">
            <Slider 
              value={[projectData.masterVolume * 100]} 
              onValueChange={([v]) => onMasterVolumeChange(v / 100)} 
            />
          </div>
          <span className="text-xs font-bold tabular-nums min-w-[28px]">
            {Math.round(projectData.masterVolume * 100)}
          </span>
        </div>

        {/* Zoom Control */}
        <div className="flex items-center gap-3 bg-background/60 rounded-xl px-4 py-2 border border-border/30 backdrop-blur-sm shadow-sm min-w-[140px]">
          <ZoomIn className="h-4 w-4 text-primary/70" />
          <div className="flex-1">
            <Slider 
              value={zoom} 
              onValueChange={onZoomChange} 
              min={25} 
              max={400} 
              step={25} 
            />
          </div>
          <span className="text-xs font-bold tabular-nums min-w-[36px]">{zoom[0]}%</span>
        </div>
      </div>
    </div>
  );
};

export default DAWTransportBar;
