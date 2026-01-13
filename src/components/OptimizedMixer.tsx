import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { DawTrack, AudioLevels } from '@/types/daw';

interface OptimizedMixerProps {
  tracks: DawTrack[];
  masterVolume: number;
  onClose: () => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackPanChange?: (trackId: string, pan: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
  audioLevels?: Map<string, AudioLevels>;
  masterLevels?: AudioLevels;
}

const MeterBar = memo<{
  level: number;
  height: string;
  width: string;
}>(({ level, height, width }) => {
  const meterStyle = useMemo(() => ({
    height: `${Math.min(level || 0, 100)}%`,
    background: level > 90 ? '#ef4444' : level > 70 ? '#f59e0b' : '#10b981'
  }), [level]);

  return (
    <div className={`${width} ${height} bg-muted rounded-sm relative overflow-hidden`}>
      <div 
        className="absolute bottom-0 w-full transition-all duration-75 ease-out"
        style={meterStyle}
      />
      {/* Peak indicators */}
      {level > 95 && (
        <div className="absolute top-0 w-full h-1 bg-red-500 animate-pulse" />
      )}
    </div>
  );
});

const TrackChannel = memo<{
  track: DawTrack;
  audioLevel?: AudioLevels;
  onVolumeChange: (trackId: string, volume: number) => void;
  onPanChange?: (trackId: string, pan: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
}>(({ track, audioLevel, onVolumeChange, onPanChange, onMuteToggle, onSoloToggle }) => {
  const handleVolumeChange = useCallback(([value]: number[]) => {
    onVolumeChange(track.id, value / 100);
  }, [onVolumeChange, track.id]);

  const handlePanChange = useCallback(([value]: number[]) => {
    onPanChange?.(track.id, value / 100);
  }, [onPanChange, track.id]);

  const handleMute = useCallback(() => {
    onMuteToggle(track.id);
  }, [onMuteToggle, track.id]);

  const handleSolo = useCallback(() => {
    onSoloToggle(track.id);
  }, [onSoloToggle, track.id]);

  return (
    <Card className="w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${track.color}`} />
          {track.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={track.mixer.isMuted ? "destructive" : "outline"} 
            onClick={handleMute}
            className="font-bold"
          >
            M
          </Button>
          <Button 
            size="sm" 
            variant={track.mixer.isSolo ? "secondary" : "outline"}
            onClick={handleSolo}
            className="font-bold"
          >
            S
          </Button>
        </div>
        
        {/* Optimized Audio Level Meters */}
        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-1">
            <MeterBar level={audioLevel?.left || 0} height="h-32" width="w-2" />
            <span className="text-xs text-center">L</span>
          </div>
          <div className="flex flex-col gap-1">
            <MeterBar level={audioLevel?.right || 0} height="h-32" width="w-2" />
            <span className="text-xs text-center">R</span>
          </div>
          
          <div className="flex-1 space-y-2 ml-2">
            <label className="text-xs">Volume</label>
            <Slider
              value={[track.mixer.volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              orientation="vertical"
              className="h-24"
            />
            <span className="text-xs text-center block">
              {Math.round(track.mixer.volume * 100)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs">Pan</label>
          <Slider
            value={[track.mixer.pan * 100]}
            onValueChange={handlePanChange}
            min={-100}
            max={100}
            step={1}
          />
          <span className="text-xs text-center block">
            {track.mixer.pan > 0 ? 'R' : track.mixer.pan < 0 ? 'L' : 'C'}
            {Math.abs(Math.round(track.mixer.pan * 100))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

const MasterChannel = memo<{
  masterVolume: number;
  masterLevels?: AudioLevels;
  onMasterVolumeChange: (volume: number) => void;
}>(({ masterVolume, masterLevels, onMasterVolumeChange }) => {
  const handleVolumeChange = useCallback(([value]: number[]) => {
    onMasterVolumeChange(value / 100);
  }, [onMasterVolumeChange]);

  return (
    <Card className="w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Master</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Master Level Meters */}
        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-1">
            <MeterBar level={masterLevels?.left || 0} height="h-40" width="w-3" />
            <span className="text-xs text-center">L</span>
          </div>
          <div className="flex flex-col gap-1">
            <MeterBar level={masterLevels?.right || 0} height="h-40" width="w-3" />
            <span className="text-xs text-center">R</span>
          </div>
          
          <div className="flex-1 space-y-2 ml-4">
            <label className="text-xs">Master Volume</label>
            <Slider
              value={[masterVolume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              orientation="vertical"
              className="h-32"
            />
            <span className="text-xs text-center block">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>
        
        {masterLevels && (
          <div className="text-xs space-y-1">
            <div>Peak: {Math.round(masterLevels.peak)}%</div>
            <div className="flex justify-between">
              <span>L: {Math.round(masterLevels.left)}%</span>
              <span>R: {Math.round(masterLevels.right)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export const OptimizedMixer: React.FC<OptimizedMixerProps> = memo(({
  tracks,
  masterVolume,
  onClose,
  onTrackVolumeChange,
  onTrackPanChange,
  onMasterVolumeChange,
  onMuteToggle,
  onSoloToggle,
  audioLevels,
  masterLevels
}) => {
  return (
    <Card className="fixed inset-4 z-50 bg-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mixer</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex gap-4 p-4">
          {tracks.map((track) => {
            const trackLevel = audioLevels?.get(track.id);
            return (
              <TrackChannel
                key={track.id}
                track={track}
                audioLevel={trackLevel}
                onVolumeChange={onTrackVolumeChange}
                onPanChange={onTrackPanChange}
                onMuteToggle={onMuteToggle}
                onSoloToggle={onSoloToggle}
              />
            );
          })}
          
          <MasterChannel
            masterVolume={masterVolume}
            masterLevels={masterLevels}
            onMasterVolumeChange={onMasterVolumeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
});
