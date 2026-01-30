import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Piano, Activity, Upload, Gamepad2, X } from 'lucide-react';
import type { DawTrack, DawTrackV2 } from '@/types/daw';
import { cn } from '@/lib/utils';

interface DAWTrackListProps {
  tracks: DawTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onUpdateTrack: (trackId: string, updates: { name?: string; isArmed?: boolean }) => void;
  onUpdateMixer: (trackId: string, updates: Partial<DawTrack['mixer']>) => void;
  onRemoveTrack: (trackId: string) => void;
  onAddTrack: () => void;
  onUploadAudio: () => void;
  onImportMIDI: () => void;
  onOpenPianoRoll: (trackId: string) => void;
  onToggleAutomation: () => void;
  onOpenVSTPlugins: (trackId: string) => void;
  onRemoveEffect: (trackId: string, effectName: string) => void;
  showAutomation: boolean;
}

const TRACK_HEIGHT = 120;

export const DAWTrackList: React.FC<DAWTrackListProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onUpdateTrack,
  onUpdateMixer,
  onRemoveTrack,
  onAddTrack,
  onUploadAudio,
  onImportMIDI,
  onOpenPianoRoll,
  onToggleAutomation,
  onOpenVSTPlugins,
  onRemoveEffect,
  showAutomation,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual list for performance with many tracks
  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TRACK_HEIGHT,
    overscan: 3,
  });

  return (
    <div className="w-80 border-r border-border/50 bg-muted/10 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border/50 bg-background/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tracks ({tracks.length})
          </h3>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7" 
              onClick={onAddTrack} 
              title="Add Track"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0" 
              onClick={onUploadAudio} 
              title="Upload Audio"
            >
              <Upload className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0" 
              onClick={onImportMIDI} 
              title="Import MIDI"
            >
              <Piano className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Virtualized Track List */}
      <div 
        ref={parentRef} 
        className="flex-1 overflow-y-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const track = tracks[virtualItem.index];
            const trackV2 = track as DawTrackV2;

            return (
              <div
                key={track.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  className={cn(
                    "p-3 border-b border-border/20 hover:bg-accent/5 transition-colors cursor-pointer group h-full",
                    selectedTrackId === track.id && 'bg-accent/10'
                  )}
                  onClick={() => onSelectTrack(track.id)}
                >
                  {/* Track Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-8 rounded-full bg-gradient-primary" />
                    <div className={`w-2 h-2 rounded-full ${track.color}`} />
                    <Input
                      value={track.name}
                      onChange={(e) => onUpdateTrack(track.id, { name: e.target.value })}
                      className="font-medium text-sm flex-1 border-0 p-0 h-auto bg-transparent focus-visible:ring-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Action Buttons */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                    >
                      <Minus className="w-3 h-3 text-red-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`w-6 h-6 p-0 ${track.isArmed ? 'text-destructive' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack(track.id, { isArmed: !track.isArmed });
                      }}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        track.isArmed ? 'bg-destructive animate-pulse' : 'bg-muted-foreground'
                      )} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPianoRoll(track.id);
                      }}
                    >
                      <Piano className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleAutomation();
                      }}
                      title="Automation"
                    >
                      <Activity className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Instrument Badge */}
                  {track.type === 'midi' && (trackV2 as any).instrument && (
                    <div className="mb-2">
                      <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                        <Gamepad2 className="w-3 h-3" />
                        {(trackV2 as any).instrument}
                      </Badge>
                    </div>
                  )}

                  {/* Mixer Controls */}
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <Button 
                      size="sm" 
                      variant={track.mixer.isMuted ? "destructive" : "outline"} 
                      className="w-8 h-6 text-xs" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateMixer(track.id, { isMuted: !track.mixer.isMuted });
                      }}
                    >
                      M
                    </Button>
                    <Button 
                      size="sm" 
                      variant={track.mixer.isSolo ? "secondary" : "outline"} 
                      className="w-8 h-6 text-xs" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateMixer(track.id, { isSolo: !track.mixer.isSolo });
                      }}
                    >
                      S
                    </Button>
                    
                    {/* Plugin Controls Button */}
                    {track.type === 'midi' && (trackV2 as any).instrument && (trackV2 as any).instrument !== 'New MIDI Track' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-8 h-6 text-xs" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onOpenVSTPlugins(track.id); 
                        }} 
                        title="Plugin Controls"
                      >
                        <Gamepad2 className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <div className="flex-1">
                      <Slider 
                        value={[track.mixer.volume * 100]} 
                        onValueChange={([v]) => onUpdateMixer(track.id, { volume: v / 100 })} 
                      />
                    </div>
                    <span className="text-xs w-8 text-right text-muted-foreground">
                      {Math.round(track.mixer.volume * 100)}
                    </span>
                  </div>

                  {/* Effects Badges */}
                  {track.mixer?.effects && track.mixer.effects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {track.mixer.effects.map((effect) => (
                        <Badge 
                          key={effect} 
                          variant="outline" 
                          className="text-xs px-1 py-0 relative group/effect"
                        >
                          {effect}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveEffect(track.id, effect);
                            }} 
                            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover/effect:opacity-100 transition-opacity"
                          >
                            <X className="w-2 h-2 text-white" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DAWTrackList;
