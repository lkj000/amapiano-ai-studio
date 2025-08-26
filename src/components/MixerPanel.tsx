import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Headphones, RotateCcw, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { TrackData } from '@/types/daw';

interface MixerPanelProps {
  tracks: TrackData[];
  masterVolume: number[];
  onMasterVolumeChange: (volume: number[]) => void;
  onTrackVolumeChange: (trackId: number, volume: number[]) => void;
  onTrackAction: (trackId: number, action: string) => void;
  onClose: () => void;
}

export const MixerPanel: React.FC<MixerPanelProps> = ({
  tracks,
  masterVolume,
  onMasterVolumeChange,
  onTrackVolumeChange,
  onTrackAction,
  onClose
}) => {
  return (
    <Card className="w-full h-full border-0 rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Mixer</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-4 overflow-x-auto">
          {/* Master Channel */}
          <div className="flex-shrink-0 w-20">
            <div className="bg-primary/10 p-3 rounded-lg">
              <div className="text-center mb-2">
                <div className="text-xs font-medium text-primary mb-2">MASTER</div>
                <div className="h-32 relative">
                  <Slider
                    value={masterVolume}
                    onValueChange={onMasterVolumeChange}
                    min={0}
                    max={100}
                    step={1}
                    orientation="vertical"
                    className="h-full"
                  />
                </div>
                <div className="text-xs mt-2 font-mono">{masterVolume[0]}</div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button size="sm" variant="outline" className="w-full">
                  <VolumeX className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <Headphones className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Track Channels */}
          {tracks.map((track) => (
            <div key={track.id} className="flex-shrink-0 w-20">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-center mb-2">
                  <div className="text-xs font-medium mb-1 truncate" title={track.name}>
                    {track.name}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${track.color} mx-auto mb-2`} />
                  
                  <div className="h-32 relative">
                    <Slider
                      value={[track.volume]}
                      onValueChange={(value) => onTrackVolumeChange(track.id, value)}
                      min={0}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-full"
                    />
                  </div>
                  <div className="text-xs mt-2 font-mono">{track.volume}</div>
                </div>

                <div className="flex flex-col gap-1 mt-4">
                  <Button 
                    size="sm" 
                    variant={track.muted ? "default" : "outline"} 
                    className="w-full text-xs h-6"
                    onClick={() => onTrackAction(track.id, 'mute')}
                  >
                    M
                  </Button>
                  <Button 
                    size="sm" 
                    variant={track.solo ? "default" : "outline"} 
                    className="w-full text-xs h-6"
                    onClick={() => onTrackAction(track.id, 'solo')}
                  >
                    S
                  </Button>
                  <Button 
                    size="sm" 
                    variant={track.armed ? "destructive" : "outline"} 
                    className="w-full text-xs h-6"
                    onClick={() => onTrackAction(track.id, 'arm')}
                  >
                    R
                  </Button>
                </div>

                {track.effects.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {track.effects.slice(0, 2).map((effect) => (
                      <Badge key={effect} variant="outline" className="text-xs px-1 py-0 w-full">
                        {effect.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};