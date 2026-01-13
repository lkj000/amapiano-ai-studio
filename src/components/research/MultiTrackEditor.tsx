import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Plus, Volume2, VolumeX, Trash2, Play, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTonePlayback } from "@/hooks/useTonePlayback";
import { DawProjectData, DawTrack, AudioTrack, MidiTrack } from "@/types/daw";

interface MultiTrackEditorProps {
  onProjectUpdate?: (data: DawProjectData) => void;
}

export const MultiTrackEditor = ({ onProjectUpdate }: MultiTrackEditorProps) => {
  const { toast } = useToast();
  const [projectData, setProjectData] = useState<DawProjectData>({
    bpm: 120,
    keySignature: "C",
    timeSignature: "4/4",
    tracks: [],
    masterVolume: 100
  });

  // Use real Tone.js playback instead of legacy audio engine
  const { 
    isPlaying, 
    currentTime, 
    isReady,
    initialize,
    play, 
    pause, 
    stop,
    setMasterVolume,
    setTrackVolume
  } = useTonePlayback(projectData);

  const addTrack = (type: 'audio' | 'midi') => {
    let newTrack: DawTrack;
    
    if (type === 'audio') {
      const audioTrack: AudioTrack = {
        id: `track-${Date.now()}`,
        type: 'audio',
        name: `Audio ${projectData.tracks.length + 1}`,
        clips: [],
        mixer: {
          volume: 100,
          pan: 0,
          isMuted: false,
          isSolo: false,
          effects: []
        },
        isArmed: false,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };
      newTrack = audioTrack;
    } else {
      const midiTrack: MidiTrack = {
        id: `track-${Date.now()}`,
        type: 'midi',
        name: `MIDI ${projectData.tracks.length + 1}`,
        instrument: 'synth',
        clips: [],
        mixer: {
          volume: 100,
          pan: 0,
          isMuted: false,
          isSolo: false,
          effects: []
        },
        isArmed: false,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };
      newTrack = midiTrack;
    }

    const updated: DawProjectData = { ...projectData, tracks: [...projectData.tracks, newTrack] };
    setProjectData(updated);
    onProjectUpdate?.(updated);

    toast({
      title: "Track Added",
      description: `Added ${type} track: ${newTrack.name}`,
    });
  };

  const removeTrack = (trackId: string) => {
    const updated: DawProjectData = { 
      ...projectData, 
      tracks: projectData.tracks.filter(t => t.id !== trackId) 
    };
    setProjectData(updated);
    onProjectUpdate?.(updated);
  };

  const updateTrack = (trackId: string, updates: Partial<DawTrack>) => {
    const updated: DawProjectData = {
      ...projectData,
      tracks: projectData.tracks.map(t => 
        t.id === trackId ? { ...t, ...updates } as DawTrack : t
      )
    };
    setProjectData(updated);
    onProjectUpdate?.(updated);
  };

  const toggleMute = (trackId: string) => {
    const track = projectData.tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, {
        mixer: { ...track.mixer, isMuted: !track.mixer.isMuted }
      });
    }
  };

  const toggleSolo = (trackId: string) => {
    const track = projectData.tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, {
        mixer: { ...track.mixer, isSolo: !track.mixer.isSolo }
      });
    }
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    const track = projectData.tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, {
        mixer: { ...track.mixer, volume }
      });
      setTrackVolume(trackId, volume / 100); // Convert to 0-1 range
    }
  };

  const handlePlay = async () => {
    if (!isReady) {
      await initialize();
    }
    await play();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
            <h3 className="text-lg font-semibold">Multi-Track Editor</h3>
            <div className="text-sm text-muted-foreground">
              {projectData.bpm} BPM | {projectData.timeSignature} | {currentTime.toFixed(2)}s
            </div>
          </div>
          <div className="flex gap-2">
            {!isPlaying ? (
              <Button onClick={handlePlay} size="sm">
                <Play className="mr-2 h-4 w-4" />
                Play
              </Button>
            ) : (
              <Button onClick={pause} size="sm" variant="secondary">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            <Button onClick={stop} size="sm" variant="outline">
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        </div>

        {/* Master controls */}
        <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">Master Volume</div>
              <Slider
                value={[projectData.masterVolume]}
                min={0}
                max={150}
                step={1}
                onValueChange={([value]) => {
                  setProjectData({ ...projectData, masterVolume: value });
                  setMasterVolume(value / 100); // Convert to 0-1 range
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {projectData.masterVolume}%
            </div>
          </div>
        </div>

        {/* Add track buttons */}
        <div className="flex gap-2 mb-4">
          <Button onClick={() => addTrack('audio')} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Audio Track
          </Button>
          <Button onClick={() => addTrack('midi')} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            MIDI Track
          </Button>
        </div>

        {/* Tracks list */}
        <div className="space-y-2">
          {projectData.tracks.map(track => (
            <Card key={track.id} className="p-4 bg-secondary/30">
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-12 rounded"
                  style={{ backgroundColor: track.color }}
                />
                
                <div className="flex-1">
                  <Input
                    value={track.name}
                    onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                    className="mb-2 bg-background"
                  />
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">
                      {track.type.toUpperCase()}
                    </span>
                    <Slider
                      value={[track.mixer.volume]}
                      min={0}
                      max={150}
                      step={1}
                      onValueChange={([value]) => handleVolumeChange(track.id, value)}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-12">
                      {track.mixer.volume}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={track.mixer.isMuted ? "default" : "ghost"}
                    onClick={() => toggleMute(track.id)}
                  >
                    {track.mixer.isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={track.mixer.isSolo ? "default" : "ghost"}
                    onClick={() => toggleSolo(track.id)}
                  >
                    S
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTrack(track.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {projectData.tracks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tracks yet. Add audio or MIDI tracks to get started.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};