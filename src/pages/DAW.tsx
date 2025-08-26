import { useState, useCallback } from "react";
import { useSaveDawProject, useDawProjects } from "@/hooks/useDawProjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Minus,
  RotateCcw,
  Copy,
  Scissors,
  Layers,
  Headphones,
  Sliders,
  Zap,
  Download,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { AIPromptParser } from "@/components/AIPromptParser";
import { MixerPanel } from "@/components/MixerPanel";
import { PianoRollPanel } from "@/components/PianoRollPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { supabase } from "@/integrations/supabase/client";
import type { DawProjectData, TrackData } from "@/types/daw";

const DAW = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState([118]);
  const [masterVolume, setMasterVolume] = useState([75]);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [zoom, setZoom] = useState([100]);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const [keySignature, setKeySignature] = useState("F#m");
  const [showSettings, setShowSettings] = useState(false);
  const [tracks, setTracks] = useState<TrackData[]>([
    { id: 1, name: "Log Drums", type: "drums", volume: 80, muted: false, solo: false, armed: false, color: "bg-primary", effects: ["EQ", "Compressor"] },
    { id: 2, name: "Piano Chords", type: "piano", volume: 70, muted: false, solo: false, armed: false, color: "bg-secondary", effects: ["Reverb"] },
    { id: 3, name: "Bass Line", type: "bass", volume: 85, muted: false, solo: false, armed: false, color: "bg-accent", effects: ["Log Drum Saturator"] },
    { id: 4, name: "Percussion", type: "percussion", volume: 60, muted: false, solo: false, armed: false, color: "bg-success", effects: [] },
    { id: 5, name: "Lead Synth", type: "synth", volume: 65, muted: true, solo: false, armed: false, color: "bg-info", effects: ["3D Imager"] },
    { id: 6, name: "Vocals", type: "vocals", volume: 75, muted: false, solo: false, armed: true, color: "bg-warning", effects: ["EQ", "Compressor", "Reverb"] }
  ]);

  const { data: projects, isLoading: projectsLoading } = useDawProjects();
  const saveMutation = useSaveDawProject();


  const instruments = [
    { name: "Signature Log Drum", type: "drums", icon: Drum, description: "Authentic amapiano log drum synthesizer with pitch glide control" },
    { name: "Amapiano Piano", type: "piano", icon: Piano, description: "Classic M1-style piano with gospel voicings" },
    { name: "Deep Bass Synth", type: "bass", icon: Music, description: "Sub-bass synthesizer with rhythmic emphasis" },
    { name: "Vocal Sampler", type: "vocals", icon: Mic, description: "Advanced vocal processing and chopping" },
    { name: "Shaker Groove Engine", type: "percussion", icon: Drum, description: "AI-powered percussion generator" },
    { name: "Saxophone VST", type: "lead", icon: Music, description: "Realistic saxophone for Private School style" }
  ];

  const effects = [
    { name: "EQ", category: "Core", description: "Professional 8-band parametric EQ" },
    { name: "Compressor", category: "Core", description: "Vintage-style compressor with amapiano preset" },
    { name: "Reverb", category: "Core", description: "Spatial reverb with hall and room settings" },
    { name: "Delay", category: "Core", description: "Tempo-synced delay with feedback control" },
    { name: "Limiter", category: "Core", description: "Transparent peak limiting" },
    { name: "Log Drum Saturator", category: "Amapiano", description: "Enhance log drum character" },
    { name: "Shaker Groove Engine", category: "Amapiano", description: "Intelligent percussion enhancement" },
    { name: "3D Imager", category: "Amapiano", description: "Spatial width and depth control" },
    { name: "Gospel Harmonizer", category: "Amapiano", description: "Authentic chord voicing enhancement" }
  ];

  const aiSuggestions = [
    "Generate log drum pattern in F# minor for bars 1-8",
    "Suggest chord progression for Private School style",
    "Add percussion layer to enhance the groove",
    "Analyze track structure and suggest arrangement",
    "Create bass line that complements the log drums", 
    "Generate saxophone melody for the bridge section"
  ];

  const handleAIGenerate = useCallback(async (suggestion: string) => {
    toast.info(`🤖 AI Assistant: ${suggestion}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-music-generation', {
        body: {
          prompt: suggestion,
          context: {
            bpm: bpm[0],
            keySignature,
            projectName,
          },
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("✨ AI content generated and added to timeline!");
        console.log("Generated AI content:", data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error("Failed to generate AI content");
    }
  }, [bpm, keySignature, projectName]);

  // Transport controls
  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Start playback timer
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 0.1);
      }, 100);
      // Store interval ID to clear later
      (window as any).playbackInterval = interval;
    } else {
      clearInterval((window as any).playbackInterval);
    }
    toast.info(isPlaying ? "Playback stopped" : "Playback started");
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    clearInterval((window as any).playbackInterval);
    toast.info("Stopped and reset to beginning");
  }, []);

  const handleRewind = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    toast.info(`Rewind to ${Math.floor(newTime)}s`);
  }, [currentTime]);

  const handleFastForward = useCallback(() => {
    const newTime = currentTime + 10;
    setCurrentTime(newTime);
    toast.info(`Fast forward to ${Math.floor(newTime)}s`);
  }, [currentTime]);

  // Track management
  const handleTrackAction = useCallback((trackId: number, action: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        switch (action) {
          case 'mute':
            return { ...track, muted: !track.muted };
          case 'solo':
            return { ...track, solo: !track.solo };
          case 'arm':
            return { ...track, armed: !track.armed };
          default:
            return track;
        }
      }
      return track;
    }));
    toast.info(`${action} track ${trackId}`);
  }, []);

  const handleTrackNameChange = useCallback((trackId: number, newName: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, name: newName } : track
    ));
  }, []);

  const handleTrackVolumeChange = useCallback((trackId: number, volume: number[]) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, volume: volume[0] } : track
    ));
  }, []);

  const addNewTrack = useCallback(() => {
    const newTrack: TrackData = {
      id: Math.max(...tracks.map(t => t.id)) + 1,
      name: `Track ${tracks.length + 1}`,
      type: "synth",
      volume: 75,
      muted: false,
      solo: false,
      armed: false,
      color: "bg-accent",
      effects: []
    };
    setTracks(prev => [...prev, newTrack]);
    toast.success(`Added new track: ${newTrack.name}`);
  }, [tracks]);

  const addInstrumentToTrack = useCallback((instrument: typeof instruments[0]) => {
    if (!selectedTrack) {
      toast.error("Please select a track first");
      return;
    }
    
    setTracks(prev => prev.map(track => 
      track.id === selectedTrack 
        ? { ...track, type: instrument.type, name: `${track.name} (${instrument.name})` }
        : track
    ));
    toast.success(`Added ${instrument.name} to track ${selectedTrack}`);
  }, [selectedTrack]);

  const addEffectToTrack = useCallback((effect: typeof effects[0]) => {
    if (!selectedTrack) {
      toast.error("Please select a track first");
      return;
    }
    
    setTracks(prev => prev.map(track => 
      track.id === selectedTrack 
        ? { ...track, effects: [...track.effects, effect.name] }
        : track
    ));
    toast.success(`Added ${effect.name} to track ${selectedTrack}`);
  }, [selectedTrack]);

  const handleExport = useCallback(() => {
    toast.info("🎵 Exporting project...");
    
    // Create export data
    const exportData = {
      projectName,
      bpm: bpm[0],
      keySignature,
      tracks: tracks.map(track => ({
        name: track.name,
        type: track.type,
        volume: track.volume,
        effects: track.effects,
        muted: track.muted,
        solo: track.solo
      })),
      masterVolume: masterVolume[0],
      timestamp: new Date().toISOString()
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setTimeout(() => {
      toast.success("✅ Project exported successfully!");
    }, 1000);
  }, [projectName, bpm, keySignature, tracks, masterVolume]);

  const handleLoadProject = useCallback((projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (project) {
      setProjectName(project.name);
      setBpm([project.bpm]);
      setKeySignature(project.key_signature);
      setCurrentProjectId(project.id);
      toast.success(`Loaded project: ${project.name}`);
    }
  }, [projects]);

  const handleSaveProject = useCallback(() => {
    const projectData: DawProjectData = {
      bpm: bpm[0],
      keySignature,
      timeSignature: "4/4",
      tracks: tracks.map(track => ({
        type: 'midi' as const,
        name: track.name,
        instrument: track.type,
        startTime: 0,
        duration: 8,
        notes: [],
      })),
      mixer: {
        masterVolume: masterVolume[0] / 100,
        channels: tracks.map(track => ({
          volume: track.volume / 100,
          pan: 0,
          isMuted: track.muted,
          isSolo: track.solo,
          effects: track.effects,
        })),
      },
    };

    saveMutation.mutate({
      name: projectName,
      projectData,
      projectId: currentProjectId,
      bpm: bpm[0],
      keySignature,
    });
  }, [bpm, keySignature, tracks, masterVolume, projectName, currentProjectId, saveMutation]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                <Input 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-xl font-bold bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <Badge variant="outline">Professional DAW</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select onValueChange={handleLoadProject}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={
                    <div className="flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Open Project
                    </div>
                  } />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveProject}
                disabled={saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Project"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={() => setShowMixer(!showMixer)}>
                <Sliders className="w-4 h-4 mr-2" />
                Mixer
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPianoRoll(!showPianoRoll)}>
                <Piano className="w-4 h-4 mr-2" />
                Piano Roll
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`${showAIAssistant ? 'w-80' : 'w-64'} border-r border-border bg-sidebar overflow-y-auto transition-all duration-200`}>
            <Tabs defaultValue="instruments" className="h-full">
              <TabsList className="grid w-full grid-cols-3 m-2">
                <TabsTrigger value="instruments" className="text-xs">Instruments</TabsTrigger>
                <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
                <TabsTrigger value="ai-assistant" className="text-xs">AI</TabsTrigger>
              </TabsList>

              <TabsContent value="instruments" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Amapiano Instruments</h3>
                  <div className="space-y-2">
                    {instruments.map((instrument) => {
                      const Icon = instrument.icon;
                      return (
                        <Card key={instrument.name} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors group">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">{instrument.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">{instrument.description}</div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => addInstrumentToTrack(instrument)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="effects" className="p-4 space-y-4">
                <div className="space-y-4">
                  {["Core", "Amapiano"].map((category) => (
                    <div key={category}>
                      <h4 className="font-semibold mb-2 text-sm">{category} Effects</h4>
                      <div className="space-y-1">
                        {effects
                          .filter(effect => effect.category === category)
                          .map((effect) => (
                            <Card key={effect.name} className="p-2 cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{effect.name}</div>
                                  <div className="text-xs text-muted-foreground">{effect.description}</div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => addEffectToTrack(effect)}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ai-assistant" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" />
                    AI Assistant
                  </h3>
                  
                  <Card className="p-3 mb-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Natural Language Prompt</label>
                        <Input
                          placeholder="Generate a log drum pattern in F# minor..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full btn-glow"
                        onClick={() => aiPrompt && handleAIGenerate(aiPrompt)}
                        disabled={!aiPrompt}
                      >
                        <Zap className="w-3 h-3 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </Card>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Quick Actions</h4>
                    {aiSuggestions.map((suggestion, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAIGenerate(suggestion)}
                        className="w-full text-left h-auto p-3 justify-start whitespace-normal"
                      >
                        <Wand2 className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-xs">{suggestion}</span>
                      </Button>
                    ))}
                  </div>

                  {aiPrompt && (
                    <AIPromptParser
                      prompt={aiPrompt}
                      onParsedChange={(parsed) => console.log("AI parsed:", parsed)}
                      className="border-0 shadow-none p-0 mt-4"
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main DAW Area */}
          <div className="flex-1 flex flex-col">
            {/* Transport Controls */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlay}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleStop}>
                      <Square className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={isRecording ? "bg-destructive text-destructive-foreground" : ""}
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-white animate-pulse" : "bg-destructive"}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRewind}>
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleFastForward}>
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4" />
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

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Zoom:</span>
                      <div className="w-20">
                        <Slider
                          value={zoom}
                          onValueChange={setZoom}
                          min={25}
                          max={400}
                          step={25}
                          className="w-full"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{zoom[0]}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Key:</span>
                      <Select value={keySignature} onValueChange={setKeySignature}>
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="C#">C#</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="D#">D#</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                          <SelectItem value="F#">F#</SelectItem>
                          <SelectItem value="F#m">F#m</SelectItem>
                          <SelectItem value="G">G</SelectItem>
                          <SelectItem value="G#">G#</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="A#">A#</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {String(Math.floor(currentTime / 60)).padStart(2, '0')}:
                      {String(Math.floor(currentTime % 60)).padStart(2, '0')}:
                      {String(Math.floor((currentTime % 1) * 100)).padStart(2, '0')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Headphones className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-hidden">
              {showMixer ? (
                <MixerPanel
                  tracks={tracks}
                  masterVolume={masterVolume}
                  onMasterVolumeChange={setMasterVolume}
                  onTrackVolumeChange={handleTrackVolumeChange}
                  onTrackAction={handleTrackAction}
                  onClose={() => setShowMixer(false)}
                />
              ) : showPianoRoll ? (
                <PianoRollPanel
                  selectedTrack={selectedTrack}
                  tracks={tracks}
                  onClose={() => setShowPianoRoll(false)}
                />
              ) : (
                <div className="h-full flex">
                  {/* Track List */}
                  <div className="w-80 border-r border-border bg-muted/20">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Tracks</h3>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={addNewTrack}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toast.info("Audio import coming soon!")}>
                          <Upload className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {tracks.map((track) => (
                      <div 
                        key={track.id} 
                        className={`p-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${selectedTrack === track.id ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedTrack(track.id)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${track.color}`} />
                          <Input 
                            value={track.name}
                            onChange={(e) => handleTrackNameChange(track.id, e.target.value)}
                            className="font-medium text-sm flex-1 border-0 p-0 h-auto bg-transparent focus-visible:ring-0"
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`w-6 h-6 p-0 ${track.armed ? 'text-destructive' : ''}`}
                            onClick={(e) => {e.stopPropagation(); handleTrackAction(track.id, 'arm')}}
                          >
                            <div className={`w-2 h-2 rounded-full ${track.armed ? 'bg-destructive animate-pulse' : 'bg-muted-foreground'}`} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="w-6 h-6 p-0"
                            onClick={() => setShowPianoRoll(!showPianoRoll)}
                          >
                            <Piano className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <Button 
                            size="sm" 
                            variant={track.muted ? "default" : "outline"} 
                            className="w-8 h-6 text-xs"
                            onClick={() => handleTrackAction(track.id, 'mute')}
                          >
                            M
                          </Button>
                          <Button 
                            size="sm" 
                            variant={track.solo ? "default" : "outline"} 
                            className="w-8 h-6 text-xs"
                            onClick={() => handleTrackAction(track.id, 'solo')}
                          >
                            S
                          </Button>
                          <div className="flex-1">
                            <Slider
                              value={[track.volume]}
                              onValueChange={(value) => handleTrackVolumeChange(track.id, value)}
                              min={0}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          <span className="text-xs w-8 text-right">{track.volume}</span>
                        </div>
                        {track.effects.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {track.effects.map((effect) => (
                              <Badge key={effect} variant="outline" className="text-xs px-1 py-0">
                                {effect}
                              </Badge>
                            ))}
                          </div>
                        )}
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
            )}
            </div>
          </div>
        </div>
        
        <SettingsPanel
          isOpen={showSettings}
          onOpenChange={setShowSettings}
        />
      </div>
    </div>
  );
};

export default DAW;