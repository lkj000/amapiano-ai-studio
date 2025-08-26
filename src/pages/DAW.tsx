import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  Mic,
  Piano,
  Drum,
  Music,
  Settings,
  Save,
  FolderOpen,
  Wand2,
  Plus,
  Minus
} from "lucide-react";

const DAW = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState([118]);
  const [masterVolume, setMasterVolume] = useState([75]);

  const tracks = [
    { id: 1, name: "Log Drums", type: "drums", volume: 80, muted: false, solo: false, color: "bg-primary" },
    { id: 2, name: "Piano Chords", type: "piano", volume: 70, muted: false, solo: false, color: "bg-secondary" },
    { id: 3, name: "Bass Line", type: "bass", volume: 85, muted: false, solo: false, color: "bg-accent" },
    { id: 4, name: "Percussion", type: "percussion", volume: 60, muted: false, solo: false, color: "bg-success" },
    { id: 5, name: "Lead Synth", type: "synth", volume: 65, muted: true, solo: false, color: "bg-info" }
  ];

  const instruments = [
    { name: "Signature Log Drum", type: "drums", icon: Drum },
    { name: "Amapiano Piano", type: "piano", icon: Piano },
    { name: "Deep Bass Synth", type: "bass", icon: Music },
    { name: "Vocal Sampler", type: "vocals", icon: Mic }
  ];

  const aiSuggestions = [
    "Generate log drum pattern for current key",
    "Suggest chord progression for bar 16-32",
    "Add percussion layer to enhance groove",
    "Analyze track and suggest mixing improvements"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gradient-primary">Amapiano DAW</h1>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                Open
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-border bg-sidebar overflow-y-auto">
            <Tabs defaultValue="instruments" className="h-full">
              <TabsList className="grid w-full grid-cols-2 m-2">
                <TabsTrigger value="instruments">Instruments</TabsTrigger>
                <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
              </TabsList>

              <TabsContent value="instruments" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Virtual Instruments</h3>
                  <div className="space-y-2">
                    {instruments.map((instrument) => {
                      const Icon = instrument.icon;
                      return (
                        <Card key={instrument.name} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{instrument.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">{instrument.type}</div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Effects</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["EQ", "Compressor", "Reverb", "Delay", "Saturator", "3D Imager"].map((effect) => (
                      <Button key={effect} variant="outline" size="sm" className="text-xs">
                        {effect}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai-assistant" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" />
                    AI Assistant
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get AI-powered suggestions for your amapiano production
                  </p>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left h-auto p-3 justify-start whitespace-normal"
                      >
                        <Wand2 className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-xs">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Card className="p-3">
                  <h4 className="font-medium text-sm mb-2">Quick Generate</h4>
                  <div className="space-y-2">
                    <Button size="sm" className="w-full btn-glow">
                      <Music className="w-3 h-3 mr-2" />
                      Generate Loop
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Drum className="w-3 h-3 mr-2" />
                      Create Beat
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main DAW Area */}
          <div className="flex-1 flex flex-col">
            {/* Transport Controls */}
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">BPM:</span>
                    <div className="w-20">
                      <Slider
                        value={bpm}
                        onValueChange={setBpm}
                        min={80}
                        max={160}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{bpm[0]}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <div className="w-20">
                      <Slider
                        value={masterVolume}
                        onValueChange={setMasterVolume}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{masterVolume[0]}</span>
                  </div>
                </div>

                <div className="ml-auto text-sm font-mono">
                  00:00:00
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex">
                {/* Track List */}
                <div className="w-64 border-r border-border bg-muted/20">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Tracks</h3>
                      <Button size="sm" variant="outline">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {tracks.map((track) => (
                      <div key={track.id} className="p-3 border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${track.color}`} />
                          <span className="font-medium text-sm flex-1">{track.name}</span>
                          <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Button size="sm" variant={track.muted ? "default" : "outline"} className="w-8 h-6 text-xs">
                            M
                          </Button>
                          <Button size="sm" variant={track.solo ? "default" : "outline"} className="w-8 h-6 text-xs">
                            S
                          </Button>
                          <div className="flex-1">
                            <Slider
                              defaultValue={[track.volume]}
                              min={0}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 bg-background overflow-auto">
                  <div className="h-full relative">
                    {/* Time Ruler */}
                    <div className="h-8 bg-muted border-b border-border flex items-center px-4">
                      {Array.from({ length: 32 }, (_, i) => (
                        <div key={i} className="flex-1 text-xs text-center border-r border-border/30 py-1">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Track Lanes */}
                    <div className="space-y-1">
                      {tracks.map((track, trackIndex) => (
                        <div key={track.id} className="h-16 border-b border-border/30 relative flex items-center">
                          {/* Sample clips */}
                          {trackIndex < 3 && (
                            <>
                              <div className={`absolute left-4 top-2 bottom-2 w-32 ${track.color} rounded opacity-80 flex items-center justify-center`}>
                                <span className="text-xs text-white font-medium">Clip {trackIndex + 1}</span>
                              </div>
                              {trackIndex < 2 && (
                                <div className={`absolute left-40 top-2 bottom-2 w-24 ${track.color} rounded opacity-60 flex items-center justify-center`}>
                                  <span className="text-xs text-white font-medium">Loop</span>
                                </div>
                              )}
                            </>
                          )}
                          {/* Grid lines */}
                          {Array.from({ length: 32 }, (_, i) => (
                            <div key={i} className="absolute top-0 bottom-0 border-r border-border/10" style={{ left: `${(i / 32) * 100}%` }} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Playhead */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10" style={{ left: `${(currentTime / 100) * 25}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DAW;