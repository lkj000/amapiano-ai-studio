import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { DawTrack, AudioLevels } from '@/types/daw';

interface MixerPanelProps {
  tracks: DawTrack[];
  masterVolume: number;
  onClose: () => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  audioLevels?: Map<string, AudioLevels>;
  masterLevels?: AudioLevels;
}

export default function MixerPanel({ tracks, masterVolume, onClose, onTrackVolumeChange, onMasterVolumeChange, audioLevels, masterLevels }: MixerPanelProps) {
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
              <Card key={track.id} className="w-80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${track.color}`} />
                    {track.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={track.mixer.isMuted ? "destructive" : "outline"} onClick={() => onTrackVolumeChange(track.id, track.mixer.volume)}>M</Button>
                    <Button size="sm" variant={track.mixer.isSolo ? "secondary" : "outline"}>S</Button>
                  </div>
                  
                  {/* Audio Level Meters */}
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col gap-1">
                      <div className="w-2 h-32 bg-muted rounded-sm relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                          style={{ height: `${trackLevel?.left || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-center">L</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="w-2 h-32 bg-muted rounded-sm relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                          style={{ height: `${trackLevel?.right || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-center">R</span>
                    </div>
                    
                    <div className="flex-1 space-y-2 ml-2">
                      <label className="text-xs">Volume</label>
                      <Slider
                        value={[track.mixer.volume * 100]}
                        onValueChange={([value]) => onTrackVolumeChange(track.id, value / 100)}
                        max={100}
                        step={1}
                        orientation="vertical"
                        className="h-24"
                      />
                      <span className="text-xs text-center block">{Math.round(track.mixer.volume * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs">Pan</label>
                    <Slider
                      value={[track.mixer.pan * 100]}
                      onValueChange={([value]) => {/* Handle pan change */}}
                      min={-100}
                      max={100}
                      step={1}
                    />
                    <span className="text-xs text-center block">{track.mixer.pan > 0 ? 'R' : track.mixer.pan < 0 ? 'L' : 'C'}{Math.abs(Math.round(track.mixer.pan * 100))}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Master Section */}
          <Card className="w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Master</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Master Level Meters */}
              <div className="flex items-center gap-1">
                <div className="flex flex-col gap-1">
                  <div className="w-3 h-40 bg-muted rounded-sm relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                      style={{ height: `${masterLevels?.left || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-center">L</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="w-3 h-40 bg-muted rounded-sm relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                      style={{ height: `${masterLevels?.right || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-center">R</span>
                </div>
                
                <div className="flex-1 space-y-2 ml-4">
                  <label className="text-xs">Master Volume</label>
                  <Slider
                    value={[masterVolume * 100]}
                    onValueChange={([value]) => onMasterVolumeChange(value / 100)}
                    max={100}
                    step={1}
                    orientation="vertical"
                    className="h-32"
                  />
                  <span className="text-xs text-center block">{Math.round(masterVolume * 100)}%</span>
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
        </div>
      </CardContent>
    </Card>
  );
}