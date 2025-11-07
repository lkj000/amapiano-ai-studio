import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoopRegion {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface LoopRegionsEditorProps {
  audioUrl: string;
  duration: number;
}

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

export const LoopRegionsEditor = ({ audioUrl, duration }: LoopRegionsEditorProps) => {
  const { toast } = useToast();
  const [regions, setRegions] = useState<LoopRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement] = useState(() => new Audio(audioUrl));
  const [currentTime, setCurrentTime] = useState(0);

  const addRegion = () => {
    const newRegion: LoopRegion = {
      id: `region-${Date.now()}`,
      name: `Loop ${regions.length + 1}`,
      startTime: currentTime || 0,
      endTime: Math.min(currentTime + 2, duration),
      color: COLORS[regions.length % COLORS.length]
    };
    setRegions([...regions, newRegion]);
    setSelectedRegion(newRegion.id);
    toast({
      title: "Loop Region Added",
      description: `Created ${newRegion.name}`,
    });
  };

  const removeRegion = (id: string) => {
    setRegions(regions.filter(r => r.id !== id));
    if (selectedRegion === id) {
      setSelectedRegion(null);
    }
  };

  const updateRegion = (id: string, updates: Partial<LoopRegion>) => {
    setRegions(regions.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const playRegion = (region: LoopRegion) => {
    audioElement.currentTime = region.startTime;
    audioElement.play();
    setIsPlaying(true);

    const checkLoop = () => {
      if (audioElement.currentTime >= region.endTime) {
        audioElement.currentTime = region.startTime;
      }
      if (isPlaying) {
        requestAnimationFrame(checkLoop);
      }
    };
    checkLoop();
  };

  const stopPlayback = () => {
    audioElement.pause();
    setIsPlaying(false);
  };

  const selected = regions.find(r => r.id === selectedRegion);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Loop Regions</h3>
          <Button onClick={addRegion} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Region
          </Button>
        </div>

        {/* Waveform with regions */}
        <div className="relative h-32 bg-secondary rounded-lg mb-4 overflow-hidden">
          {/* Visual timeline */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="w-full h-full relative">
              {/* Region markers */}
              {regions.map(region => {
                const startPercent = (region.startTime / duration) * 100;
                const widthPercent = ((region.endTime - region.startTime) / duration) * 100;
                return (
                  <div
                    key={region.id}
                    className="absolute top-0 bottom-0 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: `${region.color}40`,
                      borderLeft: `2px solid ${region.color}`,
                      borderRight: `2px solid ${region.color}`
                    }}
                    onClick={() => setSelectedRegion(region.id)}
                  >
                    <div className="text-xs p-1 text-foreground font-medium">
                      {region.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Region list */}
        <div className="space-y-2">
          {regions.map(region => (
            <div
              key={region.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRegion === region.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => setSelectedRegion(region.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: region.color }}
                  />
                  <span className="font-medium">{region.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {region.startTime.toFixed(2)}s - {region.endTime.toFixed(2)}s
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      playRegion(region);
                    }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRegion(region.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Region editor */}
        {selected && (
          <Card className="p-4 mt-4 bg-secondary/50">
            <h4 className="font-medium mb-3">Edit Region</h4>
            <div className="space-y-4">
              <div>
                <Label>Region Name</Label>
                <Input
                  value={selected.name}
                  onChange={(e) => updateRegion(selected.id, { name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Start Time: {selected.startTime.toFixed(2)}s</Label>
                <Slider
                  value={[selected.startTime]}
                  min={0}
                  max={duration}
                  step={0.01}
                  onValueChange={([value]) => 
                    updateRegion(selected.id, { startTime: Math.min(value, selected.endTime - 0.1) })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label>End Time: {selected.endTime.toFixed(2)}s</Label>
                <Slider
                  value={[selected.endTime]}
                  min={0}
                  max={duration}
                  step={0.01}
                  onValueChange={([value]) => 
                    updateRegion(selected.id, { endTime: Math.max(value, selected.startTime + 0.1) })
                  }
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};
