import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Square,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Settings,
  Save,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransportControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bpm: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onLoopToggle: () => void;
  onSave: () => void;
  onOpenProject: () => void;
  onSettings: () => void;
}

export function TransportControls({
  isPlaying,
  currentTime,
  duration,
  bpm,
  volume,
  isMuted,
  isLooping,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onLoopToggle,
  onSave,
  onOpenProject,
  onSettings
}: TransportControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Calculate current beat/bar position
  const beatsPerSecond = bpm / 60;
  const currentBeat = Math.floor(currentTime * beatsPerSecond);
  const currentBar = Math.floor(currentBeat / 4) + 1;
  const beatInBar = (currentBeat % 4) + 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-t">
      {/* Left Section - Project Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onOpenProject}>
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSave}>
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Center Section - Transport */}
      <div className="flex flex-col items-center gap-2">
        {/* Main Transport Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeek(0)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onStop}
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          <Button 
            variant={isLooping ? "secondary" : "ghost"} 
            size="icon"
            onClick={onLoopToggle}
          >
            <Repeat className={cn("h-4 w-4", isLooping && "text-primary")} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSeek(duration)}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Display & Scrubber */}
        <div className="flex items-center gap-4 w-[400px]">
          <span className="text-xs font-mono w-20 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 1}
            step={0.01}
            onValueChange={([v]) => onSeek(v)}
            className="flex-1"
          />
          <span className="text-xs font-mono w-20">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right Section - Info & Volume */}
      <div className="flex items-center gap-4">
        {/* BPM & Position Display */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {bpm} BPM
          </Badge>
          <Badge variant="secondary" className="font-mono">
            {currentBar}.{beatInBar}
          </Badge>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onMuteToggle}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => onVolumeChange(v)}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
