import React from 'react';
import { Track } from '@/types/daw';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface MixerPanelProps {
  tracks: Track[];
  onVolumeChange: (trackId: string, volume: number) => void;
  onMuteChange: (trackId: string) => void;
  onSoloChange: (trackId: string) => void;
  onTrackArmChange?: (trackId: string) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
}

export default function MixerPanel({ 
  tracks, 
  onVolumeChange, 
  onMuteChange, 
  onSoloChange,
  onTrackArmChange,
  masterVolume,
  onMasterVolumeChange
}: MixerPanelProps) {
  return (
    <div className="h-full bg-background border-t border-border">
      <div className="flex h-full">
        {/* Track Strips */}
        <div className="flex-1 flex overflow-x-auto">
          {tracks.map((track) => (
            <div key={track.id} className="w-20 h-full border-r border-border bg-card">
              {/* Track Header */}
              <div className="p-2 border-b border-border">
                <div className={`w-4 h-4 rounded mb-1 ${track.color}`} />
                <div className="text-xs font-medium truncate" title={track.name}>
                  {track.name}
                </div>
              </div>

              {/* Controls */}
              <div className="p-2 space-y-2">
                {/* Record Arm Button */}
                {onTrackArmChange && (
                  <Button
                    variant={track.isArmed ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => onTrackArmChange(track.id)}
                    className="w-full h-6 text-xs"
                  >
                    {track.isArmed ? '●' : 'R'}
                  </Button>
                )}

                {/* Mute Button */}
                <Button
                  variant={track.mixer.isMuted ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => onMuteChange(track.id)}
                  className="w-full h-6 text-xs"
                >
                  M
                </Button>

                {/* Solo Button */}
                <Button
                  variant={track.mixer.isSolo ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSoloChange(track.id)}
                  className="w-full h-6 text-xs"
                >
                  S
                </Button>
              </div>

              {/* Volume Fader */}
              <div className="flex-1 px-2 pb-4">
                <div className="h-32 flex items-end">
                  <Slider
                    orientation="vertical"
                    value={[track.mixer.volume * 100]}
                    onValueChange={([value]) => onVolumeChange(track.id, value / 100)}
                    max={100}
                    step={1}
                    className="h-full w-full"
                  />
                </div>
                <div className="text-xs text-center mt-1 text-muted-foreground">
                  {Math.round(track.mixer.volume * 100)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Master Section */}
        <div className="w-24 border-l border-border bg-card">
          <div className="p-2 border-b border-border">
            <div className="text-xs font-medium text-center">Master</div>
          </div>
          
          <div className="flex-1 px-2 pb-4">
            <div className="h-32 flex items-end mt-4">
              <Slider
                orientation="vertical"
                value={[masterVolume * 100]}
                onValueChange={([value]) => onMasterVolumeChange(value / 100)}
                max={100}
                step={1}
                className="h-full w-full"
              />
            </div>
            <div className="text-xs text-center mt-1 text-muted-foreground">
              {Math.round(masterVolume * 100)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
