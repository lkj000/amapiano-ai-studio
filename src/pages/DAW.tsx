import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Play, Pause, Square, SkipBack, SkipForward, Volume2, Mic, Piano, Drum, Music, Settings, Save, FolderOpen, Wand2, Plus, Minus, RotateCcw, Layers, Sliders, Zap, Download, Upload, Loader2, X
} from "lucide-react";
import { toast } from 'sonner';
import backend from '@/backend/client';
import type { DawProjectData, DawTrack, MidiNote } from '@/types/daw';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import OpenProjectModal from '@/components/daw/OpenProjectModal';
import ProjectSettingsModal from '@/components/daw/ProjectSettingsModal';
import { MixerPanel } from '@/components/MixerPanel';
import { PianoRollPanel } from '@/components/PianoRollPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useAudioEngine } from '@/hooks/useAudioEngine';

const AIPromptParser = ({ prompt, className }: { prompt: string, className?: string }) => {
  const [parsed, setParsed] = useState<any>(null);

  useEffect(() => {
    if (!prompt) {
      setParsed(null);
      return;
    }
    const timeoutId = setTimeout(() => {
      const p = prompt.toLowerCase();
      const newParsed: any = {};
      if (p.includes("log drum")) newParsed.instrument = "Log Drum";
      if (p.includes("piano")) newParsed.instrument = "Piano";
      if (p.includes("sax")) newParsed.instrument = "Saxophone";
      if (p.includes("f#m") || p.includes("f sharp minor")) newParsed.key = "F#m";
      if (p.includes("c minor") || p.includes("cm")) newParsed.key = "Cm";
      const bpmMatch = p.match(/(\d+)\s*bpm/);
      if (bpmMatch) newParsed.bpm = parseInt(bpmMatch[1]);
      if (p.includes("private school")) newParsed.genre = "Private School";
      if (p.includes("classic")) newParsed.genre = "Classic";
      setParsed(newParsed);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [prompt]);

  if (!parsed) return null;

  return (
    <Card className={`bg-muted/50 p-3 ${className}`}>
      <h4 className="text-xs font-semibold mb-2 text-muted-foreground">AI Interpretation:</h4>
      <div className="flex flex-wrap gap-2">
        {Object.entries(parsed).map(([key, value]) => (
          <Badge key={key} variant="secondary">{key}: {String(value)}</Badge>
        ))}
      </div>
    </Card>
  );
};

const defaultProjectData: DawProjectData = {
  bpm: 118,
  keySignature: 'F#m',
  tracks: [
    {
      id: `track_${Date.now()}_1`,
      type: 'midi',
      name: 'Log Drums',
      instrument: 'Signature Log Drum',
      clips: [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: ['EQ', 'Compressor'] },
      isArmed: true,
      color: 'bg-red-500',
    },
    {
      id: `track_${Date.now()}_2`,
      type: 'midi',
      name: 'Piano Chords',
      instrument: 'Amapiano Piano',
      clips: [],
      mixer: { volume: 0.7, pan: 0, isMuted: false, isSolo: false, effects: ['Reverb'] },
      isArmed: false,
      color: 'bg-blue-500',
    },
  ],
  masterVolume: 0.8,
};

export default function DawPage() {
  const queryClient = useQueryClient();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [zoom, setZoom] = useState([100]);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOpenProjectOpen, setIsOpenProjectOpen] = useState(false);

  // Project State
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [projectName, setProjectName] = useState("Untitled Project");
  const [projectData, setProjectData] = useState<DawProjectData | null>(null);

  // Audio Engine
  const { isPlaying, currentTime, setCurrentTime, isLooping, setIsLooping, play, pause, stop, setBpm, setTrackVolume, setMasterVolume } = useAudioEngine(projectData);

  // Step 1: Fetch project list
  const { data: projectsList, isLoading: isLoadingList, isError: isListError, error: listError } = useQuery({
    queryKey: ['dawProjectsList'],
    queryFn: () => backend.music.listProjects(),
  });

  // Step 2: Mutation to create a default project if none exist
  const createDefaultProjectMutation = useMutation({
    mutationFn: () => backend.music.saveProject({
      name: "My First Amapiano Project",
      projectData: defaultProjectData,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dawProjectsList'] });
      setActiveProjectId(data.projectId);
      toast.info("Creating your first project...");
    },
  });

  // Step 3: Effect to decide which project to load or create
  useEffect(() => {
    if (isLoadingList || createDefaultProjectMutation.isPending) {
      return; // Wait until loading/creation is finished
    }
    if (projectsList) {
      if (projectsList.projects.length > 0) {
        if (!activeProjectId) {
          setActiveProjectId(projectsList.projects[0].id);
        }
      } else {
        createDefaultProjectMutation.mutate();
      }
    }
  }, [projectsList, isLoadingList, activeProjectId, createDefaultProjectMutation]);

  // Step 4: Query to load the active project's data
  const { data: loadedProject, isLoading: isLoadingProject, isError: isProjectError, error: projectError } = useQuery({
    queryKey: ['dawProject', activeProjectId],
    queryFn: () => backend.music.loadProject({ projectId: activeProjectId! }),
    enabled: !!activeProjectId,
  });

  // Step 5: Sync loaded data into local state for editing
  useEffect(() => {
    if (loadedProject) {
      setProjectData(loadedProject.projectData);
      setProjectName(loadedProject.name);
      if (!selectedTrackId && loadedProject.projectData.tracks.length > 0) {
        setSelectedTrackId(loadedProject.projectData.tracks[0].id);
      }
    }
  }, [loadedProject, selectedTrackId]);

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; projectData: DawProjectData; projectId?: string }) => backend.music.saveProject(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['dawProject', data.projectId], (oldData: any) => ({...oldData, name: data.name, version: data.version, updatedAt: data.lastSaved}));
      queryClient.invalidateQueries({ queryKey: ['dawProjectsList'] });
      toast.success(`Project "${data.name}" saved successfully.`);
    },
    onError: (error: any) => {
      toast.error("Save Failed", { description: error.message });
    },
  });

  const aiGenerateMutation = useMutation({
    mutationFn: (data: { prompt: string; trackType: 'midi' | 'audio' }) => backend.music.generateDawElement(data),
    onSuccess: (data) => {
      setProjectData(prev => {
        if (!prev) return null;
        return { ...prev, tracks: [...prev.tracks, data.newTrack] };
      });
      toast.success(`AI generated a new "${data.newTrack.name}" track!`);
    },
    onError: (error: any) => {
      toast.error("AI Generation Failed", { description: error.message });
    }
  });

  const handleSave = () => {
    if (!projectData || !activeProjectId) {
      toast.error("No project data to save.");
      return;
    }
    saveMutation.mutate({
      name: projectName,
      projectData: projectData,
      projectId: activeProjectId,
    });
  };

  const handleAIGenerate = (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for the AI assistant.");
      return;
    }
    toast.info(`🤖 AI Assistant: Generating content for "${prompt}"`);
    aiGenerateMutation.mutate({ prompt, trackType: 'midi' });
  };

  const updateTrack = (trackId: string, updates: { name?: string; isArmed?: boolean }) => {
    setProjectData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t)
      };
    });
  };

  const updateMixer = (trackId: string, updates: Partial<DawTrack['mixer']>) => {
    setProjectData(prev => {
      if (!prev) return null;
      const newTracks = prev.tracks.map(t => t.id === trackId ? { ...t, mixer: { ...t.mixer, ...updates } } : t);
      
      // Update audio engine volume in real-time
      if (updates.volume !== undefined) {
        setTrackVolume(trackId, updates.volume);
      }

      return { ...prev, tracks: newTracks };
    });
  };

  const handleAddTrack = (instrument?: { name: string, type: string, color: string }) => {
    if (!projectData) return;

    const defaultInstrument = { name: "New Audio Track", type: "audio", color: "bg-gray-500" };
    const inst = instrument || defaultInstrument;

    const isMidiTrack = ['piano', 'synth', 'bass', 'drums'].includes(inst.type);
    
    const newTrack: DawTrack = isMidiTrack ? {
      id: `track_${Date.now()}`,
      type: 'midi' as const,
      name: inst.name,
      instrument: inst.name,
      clips: [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: false,
      color: inst.color,
    } : {
      id: `track_${Date.now()}`,
      type: 'audio' as const,
      name: inst.name,
      clips: [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: false,
      color: inst.color,
    };

    setProjectData({ ...projectData, tracks: [...projectData.tracks, newTrack] });
    toast.success(`Track "${inst.name}" added.`);
  };

  const handleRemoveTrack = (trackId: string) => {
    setProjectData(prev => {
      if (!prev) return null;
      const trackToRemove = prev.tracks.find(t => t.id === trackId);
      if (trackToRemove) {
        toast.info(`Track "${trackToRemove.name}" removed.`);
      }
      return {
        ...prev,
        tracks: prev.tracks.filter(t => t.id !== trackId)
      };
    });
  };

  const handleAddEffectToTrack = (effectName: string) => {
    if (!selectedTrackId) {
      toast.error("No track selected", { description: "Please select a track to add an effect." });
      return;
    }
    setProjectData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.map(t => {
          if (t.id === selectedTrackId && !t.mixer.effects.includes(effectName)) {
            toast.success(`Effect "${effectName}" added to track "${t.name}".`);
            return { ...t, mixer: { ...t.mixer, effects: [...t.mixer.effects, effectName] } };
          }
          if (t.id === selectedTrackId && t.mixer.effects.includes(effectName)) {
            toast.info(`Effect "${effectName}" is already on this track.`);
          }
          return t;
        })
      };
    });
  };

  const handleRemoveEffectFromTrack = (trackId: string, effectName: string) => {
    setProjectData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.map(t => {
          if (t.id === trackId) {
            toast.info(`Effect "${effectName}" removed from track "${t.name}".`);
            return { ...t, mixer: { ...t.mixer, effects: t.mixer.effects.filter(e => e !== effectName) } };
          }
          return t;
        })
      };
    });
  };

  const handleExport = () => {
    if (!projectData) {
      toast.error("No project data to export.");
      return;
    }
    const dataStr = JSON.stringify({ name: projectName, ...projectData }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${projectName.replace(/\s/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success("Project data exported as JSON.");
  };

  const handleUploadAudio = () => {
    toast.info("Upload Audio", {
      description: "This would open a file dialog to import an audio file into a new track."
    });
  };

  const handleUpdateProjectSettings = (updatedData: Partial<DawProjectData>) => {
    if (projectData) {
      setProjectData({ ...projectData, ...updatedData });
      if (updatedData.bpm) {
        setBpm(updatedData.bpm);
      }
      toast.info("Project settings updated. Don't forget to save!");
    }
  };

  const handleUpdateNotes = useCallback((trackId: string, clipId: string, newNotes: MidiNote[]) => {
    setProjectData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.map(t => {
          if (t.id === trackId && t.type === 'midi') {
            return {
              ...t,
              clips: t.clips.map(c => c.id === clipId ? { ...c, notes: newNotes } : c)
            };
          }
          return t;
        })
      };
    });
  }, []);

  const instruments = [
    { name: "Signature Log Drum", type: "drums", icon: Drum, description: "Authentic amapiano log drum synthesizer", color: "bg-red-500" },
    { name: "Amapiano Piano", type: "piano", icon: Piano, description: "Classic M1-style piano with gospel voicings", color: "bg-blue-500" },
    { name: "Deep Bass Synth", type: "bass", icon: Music, description: "Sub-bass synthesizer with rhythmic emphasis", color: "bg-purple-500" },
    { name: "Vocal Sampler", type: "vocals", icon: Mic, description: "Advanced vocal processing and chopping", color: "bg-pink-500" },
    { name: "Shaker Groove Engine", type: "percussion", icon: Drum, description: "AI-powered percussion generator", color: "bg-green-500" },
    { name: "Saxophone VST", type: "lead", icon: Music, description: "Realistic saxophone for Private School style", color: "bg-yellow-500" }
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

  // RENDER LOGIC
  if (isLoadingList) {
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Loading projects..." /></div>;
  }

  if (isListError) {
    return <div className="flex flex-col items-center justify-center h-full"><ErrorMessage error={listError as Error} /></div>;
  }

  if (projectsList && projectsList.projects.length === 0) {
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Creating your first project..." /></div>;
  }

  if (createDefaultProjectMutation.isError) {
    return <div className="flex flex-col items-center justify-center h-full"><ErrorMessage error={createDefaultProjectMutation.error as Error} /></div>;
  }

  if (!activeProjectId || isLoadingProject) {
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Loading project..." /></div>;
  }

  if (isProjectError) {
    return <div className="flex flex-col items-center justify-center h-full"><ErrorMessage error={projectError as Error} /></div>;
  }

  if (!projectData) {
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Initializing DAW..." /></div>;
  }

  const totalDuration = (32 * 4 / projectData.bpm) * 60;
  const selectedTrack = projectData.tracks.find(t => t.id === selectedTrackId) || null;

  return (
    <div className="h-full flex flex-col text-foreground">
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
            <Button variant="outline" size="sm" onClick={() => setIsOpenProjectOpen(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Open
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
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
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${showAIAssistant ? 'w-80' : 'w-64'} bg-muted/10 border-r border-border overflow-y-auto transition-all duration-200`}>
          <Tabs defaultValue="instruments" className="h-full">
            <TabsList className="grid w-full grid-cols-3 m-2 bg-muted/20">
              <TabsTrigger value="instruments" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Instruments</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Effects</TabsTrigger>
              <TabsTrigger value="ai-assistant" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">AI</TabsTrigger>
            </TabsList>

            <TabsContent value="instruments" className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Amapiano Instruments</h3>
                <div className="space-y-2">
                  {instruments.map((instrument) => {
                    const Icon = instrument.icon;
                    return (
                      <Card key={instrument.name} className="p-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm">{instrument.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{instrument.description}</div>
                          </div>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleAddTrack(instrument)}>
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
                          <Card key={effect.name} className="p-2 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{effect.name}</div>
                                <div className="text-xs text-muted-foreground">{effect.description}</div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => handleAddEffectToTrack(effect.name)}>
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
                
                <Card className="p-3 mb-4 bg-muted/20 border-border">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Natural Language Prompt</label>
                      <Input
                        placeholder="Generate a log drum pattern..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="mt-1 bg-background"
                      />
                    </div>
                    <Button size="sm" className="w-full" onClick={() => handleAIGenerate(aiPrompt)} disabled={aiGenerateMutation.isPending}>
                      {aiGenerateMutation.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Zap className="w-3 h-3 mr-2" />}
                      Generate
                    </Button>
                  </div>
                </Card>

                <AIPromptParser prompt={aiPrompt} className="mb-4" />

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
                      <Wand2 className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5 text-primary" />
                      <span className="text-xs">{suggestion}</span>
                    </Button>
                  ))}
                </div>
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
                  <Button variant="outline" size="sm" onClick={isPlaying ? pause : play}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={stop}><Square className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" className={isRecording ? "bg-destructive text-destructive-foreground" : ""} onClick={() => setIsRecording(!isRecording)}>
                    <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-white animate-pulse" : "bg-destructive"}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentTime(t => Math.max(0, t - 5))}><SkipBack className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentTime(t => t + 5)}><SkipForward className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setIsLooping(!isLooping)} className={isLooping ? 'bg-primary/20 text-primary' : ''}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">BPM:</span>
                    <div className="w-20">
                      <Slider value={[projectData.bpm]} onValueChange={([v]) => handleUpdateProjectSettings({ bpm: v })} min={80} max={160} step={1} />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{projectData.bpm}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <div className="w-20">
                      <Slider value={[projectData.masterVolume * 100]} onValueChange={([v]) => {
                        const newVolume = v / 100;
                        setProjectData({ ...projectData, masterVolume: newVolume });
                        setMasterVolume(newVolume);
                      }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{Math.round(projectData.masterVolume * 100)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Zoom:</span>
                    <div className="w-20"><Slider value={zoom} onValueChange={setZoom} min={25} max={400} step={25} /></div>
                    <span className="text-sm text-muted-foreground">{zoom[0]}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-auto bg-background" ref={timelineContainerRef}>
            <div className="h-full flex">
              {/* Track List */}
              <div className="w-80 border-r border-border bg-muted/10 overflow-y-auto">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Tracks</h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleAddTrack()}><Plus className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" onClick={handleUploadAudio}><Upload className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {projectData.tracks.map((track) => (
                    <div key={track.id} className={`p-3 border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer ${selectedTrackId === track.id ? 'bg-primary/10' : ''}`} onClick={() => setSelectedTrackId(track.id)}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${track.color}`} />
                        <Input value={track.name} onChange={(e) => updateTrack(track.id, { name: e.target.value })} className="font-medium text-sm flex-1 border-0 p-0 h-auto bg-transparent focus-visible:ring-0" />
                        <Button size="sm" variant="ghost" className="w-6 h-6 p-0" onClick={() => handleRemoveTrack(track.id)}><Minus className="w-3 h-3 text-red-500" /></Button>
                        <Button size="sm" variant="ghost" className={`w-6 h-6 p-0 ${track.isArmed ? 'text-destructive' : ''}`} onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { isArmed: !track.isArmed }); }}>
                          <div className={`w-2 h-2 rounded-full ${track.isArmed ? 'bg-destructive animate-pulse' : 'bg-muted-foreground'}`} />
                        </Button>
                        <Button size="sm" variant="ghost" className="w-6 h-6 p-0" onClick={() => setShowPianoRoll(!showPianoRoll)}><Piano className="w-3 h-3" /></Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <Button size="sm" variant={track.mixer.isMuted ? "destructive" : "outline"} className="w-8 h-6 text-xs" onClick={() => updateMixer(track.id, { isMuted: !track.mixer.isMuted })}>M</Button>
                        <Button size="sm" variant={track.mixer.isSolo ? "secondary" : "outline"} className="w-8 h-6 text-xs" onClick={() => updateMixer(track.id, { isSolo: !track.mixer.isSolo })}>S</Button>
                        <div className="flex-1"><Slider value={[track.mixer.volume * 100]} onValueChange={([v]) => updateMixer(track.id, { volume: v / 100 })} /></div>
                        <span className="text-xs w-8 text-right text-muted-foreground">{Math.round(track.mixer.volume * 100)}</span>
                      </div>
                      {track.mixer.effects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {track.mixer.effects.map((effect) => (
                            <Badge key={effect} variant="outline" className="text-xs px-1 py-0 relative group">
                              {effect}
                              <button onClick={() => handleRemoveEffectFromTrack(track.id, effect)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-2 h-2 text-white" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Grid */}
              <div className="flex-1 overflow-auto">
                <div className="h-full relative" style={{ width: `${zoom[0]}%` }}>
                  <div className="h-8 bg-muted/20 border-b border-border flex items-center px-4 sticky top-0 z-10">
                    {Array.from({ length: 32 }, (_, i) => (<div key={i} className="flex-1 text-xs text-center border-r border-border/30 py-1 text-muted-foreground">{i + 1}</div>))}
                  </div>
                  <div className="space-y-1">
                    {projectData.tracks.map((track, trackIndex) => (
                      <div key={track.id} className="h-24 border-b border-border/30 relative flex items-center">
                        {track.clips.map(clip => (
                          <div key={clip.id} className={`absolute top-2 bottom-2 ${track.color} rounded opacity-80 flex items-center justify-center`} style={{ left: `${(clip.startTime / 32) * 100}%`, width: `${(clip.duration / 32) * 100}%` }}>
                            <span className="text-xs text-white font-medium">{clip.name}</span>
                          </div>
                        ))}
                        {Array.from({ length: 32 * 4 }, (_, i) => (
                          <div key={i} className={`absolute top-0 bottom-0 border-r ${i % 4 === 0 ? 'border-border/30' : 'border-border/10'}`} style={{ left: `${(i / (32 * 4)) * 100}%` }} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-20" style={{ left: `${(currentTime / totalDuration) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals and Panels */}
      <OpenProjectModal isOpen={isOpenProjectOpen} onClose={() => setIsOpenProjectOpen(false)} onLoadProject={setActiveProjectId} />
      {projectData && <ProjectSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} projectData={projectData} onSave={handleUpdateProjectSettings} />}
      {showMixer && projectData && (
        <MixerPanel 
          tracks={projectData.tracks.map(t => ({
            id: parseInt(t.id.split('_').pop() || '0'),
            name: t.name,
            type: t.type,
            volume: t.mixer.volume * 100,
            muted: t.mixer.isMuted,
            solo: t.mixer.isSolo,
            armed: t.isArmed,
            color: t.color,
            effects: t.mixer.effects,
          }))}
          masterVolume={[projectData.masterVolume * 100]} 
          onClose={() => setShowMixer(false)} 
          onTrackVolumeChange={(trackId, volume) => {
            const dawTrack = projectData.tracks.find(t => parseInt(t.id.split('_').pop() || '0') === trackId);
            if (dawTrack) updateMixer(dawTrack.id, { volume: volume[0] / 100 });
          }} 
          onMasterVolumeChange={(volume) => {
            setProjectData({ ...projectData, masterVolume: volume[0] / 100 });
            setMasterVolume(volume[0] / 100);
          }}
          onTrackAction={(trackId, action) => {
            const dawTrack = projectData.tracks.find(t => parseInt(t.id.split('_').pop() || '0') === trackId);
            if (!dawTrack) return;
            switch (action) {
              case 'mute':
                updateMixer(dawTrack.id, { isMuted: !dawTrack.mixer.isMuted });
                break;
              case 'solo':
                updateMixer(dawTrack.id, { isSolo: !dawTrack.mixer.isSolo });
                break;
              case 'arm':
                updateTrack(dawTrack.id, { isArmed: !dawTrack.isArmed });
                break;
            }
          }}
        />
      )}
      {showPianoRoll && selectedTrack && (
        <PianoRollPanel 
          selectedTrack={parseInt(selectedTrack.id.split('_').pop() || '0')}
          tracks={projectData.tracks.map(t => ({
            id: parseInt(t.id.split('_').pop() || '0'),
            name: t.name,
            type: t.type,
            volume: t.mixer.volume * 100,
            muted: t.mixer.isMuted,
            solo: t.mixer.isSolo,
            armed: t.isArmed,
            color: t.color,
            effects: t.mixer.effects,
          }))}
          onClose={() => setShowPianoRoll(false)}
        />
      )}
    </div>
  );
}