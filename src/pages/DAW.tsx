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
  Play, Pause, Square, SkipBack, SkipForward, Volume2, Mic, Piano, Drum, Music, Settings, Save, FolderOpen, Wand2, Plus, Minus, RotateCcw, Layers, Sliders, Zap, Download, Upload, Loader2, X, Activity, TrendingUp, Users, Cpu, Gamepad2, AudioWaveform, Cable, BookOpen, Palette
} from "lucide-react";
import { toast } from 'sonner';
import backend from '@/backend/client';
import type { DawProjectData, DawTrack, MidiNote, DragState, AudioRecording, AutomationLane, DawTrackV2, AudioClip, AudioTrack } from '@/types/daw';
import ElasticAudioPanel from '@/components/ElasticAudioPanel';
import MultiTrackRoutingPanel from '@/components/MultiTrackRoutingPanel';
import type { ElasticAudioSettings } from '@/components/ElasticAudioPanel';
import type { AudioRoutingConfig } from '@/components/MultiTrackRoutingPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { User } from '@supabase/supabase-js';
import ErrorMessage from '@/components/ErrorMessage';
import OpenProjectModal from '@/components/daw/OpenProjectModal';
import ProjectSettingsModal from '@/components/daw/ProjectSettingsModal';
import { OptimizedTimeline } from '@/components/OptimizedTimeline';
import { OptimizedMixer } from '@/components/OptimizedMixer';
import PianoRollPanel from '@/components/PianoRollPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import UndoRedoControls from '@/components/UndoRedoControls';
import EffectsPanel from '@/components/EffectsPanel';
import AutomationLanesPanel from '@/components/AutomationLanesPanel';
import AudioRecordingPanel from '@/components/AudioRecordingPanel';
import CommunityPanel from '@/components/CommunityPanel';
import VSTPluginPanel from '@/components/VSTPluginPanel';
import { supabase } from '@/integrations/supabase/client';
import { AIAssistantSidebar } from '@/components/AIAssistantSidebar';
import { VoiceToMusicEngine } from '@/components/VoiceToMusicEngine';
import { AdvancedPatternLibrary } from '@/components/AdvancedPatternLibrary';
import { ArtistStyleTransfer } from '@/components/ArtistStyleTransfer';
import { VirtualInstruments } from '@/components/VirtualInstruments';
import { RealtimeAIAssistant } from '@/components/RealtimeAIAssistant';
import { AIModelRouter } from '@/components/AIModelRouter';
import { VoiceAIGuide } from '@/components/VoiceAIGuide';
import { RAGKnowledgeBase } from '@/components/RAGKnowledgeBase';
import { RealTimeCollaboration } from '@/components/RealTimeCollaboration';
import { AIModelMarketplace } from '@/components/AIModelMarketplace';
import { MusicAnalysisTools } from '@/components/MusicAnalysisTools';
import { AuraSidebar } from '@/components/aura/AuraSidebar';
import { PluginSidebar } from '@/components/PluginSidebar';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePluginSystem } from '@/hooks/usePluginSystem';

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
        mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
        isArmed: true,
        color: 'bg-red-500',
        automationLanes: [],
      } as DawTrackV2,
      {
        id: `track_${Date.now()}_2`,
        type: 'midi',
        name: 'Piano Chords',
        instrument: 'Amapiano Piano',
        clips: [],
        mixer: { volume: 0.7, pan: 0, isMuted: false, isSolo: false, effects: [] },
        isArmed: false,
        color: 'bg-blue-500',
        automationLanes: [],
      } as DawTrackV2,
    ],
    masterVolume: 0.8,
  };

interface DawPageProps {
  user: User | null;
}

export default function DawPage({ user }: DawPageProps) {
  const queryClient = useQueryClient();
  const { isFeatureEnabled } = useFeatureFlags(user);

  // Redirect unauthenticated users
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <Music className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-6">
              You need to sign in to access the DAW and create projects.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Sign In / Sign Up
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showAudioRecording, setShowAudioRecording] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showVSTPlugins, setShowVSTPlugins] = useState(false);
  const [showMIDIController, setShowMIDIController] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [showVoiceToMusic, setShowVoiceToMusic] = useState(false);
  const [importAudioUrl, setImportAudioUrl] = useState<string | null>(null);
  const [showAdvancedPatterns, setShowAdvancedPatterns] = useState(false);
  const [showArtistStyleTransfer, setShowArtistStyleTransfer] = useState(false);
  const [showVirtualInstruments, setShowVirtualInstruments] = useState(false);
  const [showRealtimeAI, setShowRealtimeAI] = useState(false);
  const [showAIModelRouter, setShowAIModelRouter] = useState(false);
  const [showVoiceAIGuide, setShowVoiceAIGuide] = useState(false);
  const [showRAGKnowledge, setShowRAGKnowledge] = useState(false);
  const [showRealTimeCollab, setShowRealTimeCollab] = useState(false);
  const [showAIMarketplace, setShowAIMarketplace] = useState(false);
  const [showMusicAnalysis, setShowMusicAnalysis] = useState(false);
  const [showAuraSidebar, setShowAuraSidebar] = useState(true);
  const [isAuraSidebarMinimized, setIsAuraSidebarMinimized] = useState(false);
  const [showPluginSidebar, setShowPluginSidebar] = useState(false);
  const [zoom, setZoom] = useState([100]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    clipId: null,
    trackId: null,
    startX: 0,
    startTime: 0,
  });
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOpenProjectOpen, setIsOpenProjectOpen] = useState(false);

  // Project State
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [projectName, setProjectName] = useState("Untitled Project");
  const [projectData, setProjectData] = useState<DawProjectData | null>(null);

  // Undo/Redo System
  const undoRedoControls = useUndoRedo(projectData, 50);

  // Enhanced project data setter with undo/redo support
  const setProjectDataWithHistory = useCallback((newData: DawProjectData | null, description?: string) => {
    if (newData) {
      undoRedoControls.pushState(newData, description);
    }
    setProjectData(newData);
  }, [undoRedoControls]);

  // Audio Engine with Effects
  const { 
    isPlaying, 
    currentTime, 
    setCurrentTime, 
    isLooping, 
    setIsLooping, 
    play, 
    pause, 
    stop, 
    setBpm, 
    setTrackVolume, 
    setMasterVolume,
    playNote,
    playClip,
    getAudioContext,
    audioLevels,
    masterLevels,
    addTrackEffect,
    removeTrackEffect,
    updateEffectParam,
    getTrackEffects
  } = useAudioEngine(projectData);

  // Plugin System
  const { createPluginInstance, installedPlugins } = usePluginSystem(getAudioContext());

  // Step 1: Fetch project list
  const { data: projectsList, isLoading: isLoadingList, isError: isListError, error: listError } = useQuery({
    queryKey: ['dawProjectsList'],
    queryFn: () => {
      console.log('DAW: Fetching projects list...');
      return backend.music.listProjects();
    },
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
    console.log('DAW: useEffect - projectsList:', projectsList);
    console.log('DAW: useEffect - isLoadingList:', isLoadingList);
    console.log('DAW: useEffect - activeProjectId:', activeProjectId);
    
    if (isLoadingList) {
      return; // Wait until loading is finished
    }
    
    if (createDefaultProjectMutation.isPending) {
      return; // Wait until creation is finished
    }
    
    if (projectsList) {
      console.log('DAW: projectsList.projects:', projectsList.projects);
      if (projectsList.projects && projectsList.projects.length > 0) {
        if (!activeProjectId) {
          setActiveProjectId(projectsList.projects[0].id);
        }
      } else if (!createDefaultProjectMutation.isPending && !createDefaultProjectMutation.isSuccess) {
        // Only create if we haven't already started creating
        createDefaultProjectMutation.mutate();
      }
    }
  }, [projectsList, isLoadingList, activeProjectId]);

  // Step 4: Query to load the active project's data
  const { data: loadedProject, isLoading: isLoadingProject, isError: isProjectError, error: projectError } = useQuery({
    queryKey: ['dawProject', activeProjectId],
    queryFn: () => {
      console.log('DAW: Loading project with ID:', activeProjectId);
      return backend.music.loadProject({ projectId: activeProjectId! });
    },
    enabled: !!activeProjectId,
  });

  // Step 5: Sync loaded data into local state for editing
  useEffect(() => {
    console.log('DAW: loadedProject useEffect - loadedProject:', loadedProject);
    if (loadedProject) {
      console.log('DAW: loadedProject.projectData:', loadedProject.projectData);
      console.log('DAW: loadedProject.projectData.tracks:', loadedProject.projectData?.tracks);
      
      // Migrate old track data to V2 format with automationLanes
      const migratedProjectData = {
        ...loadedProject.projectData,
        tracks: loadedProject.projectData.tracks.map(track => ({
          ...track,
          automationLanes: (track as any).automationLanes || [],
          ...((track as any).type === 'audio' && { recordings: (track as any).recordings || [] })
        } as DawTrackV2))
      };
      
      setProjectDataWithHistory(migratedProjectData, 'Project loaded');
      setProjectName(loadedProject.name);
      if (!selectedTrackId && loadedProject.projectData?.tracks && loadedProject.projectData.tracks.length > 0) {
        setSelectedTrackId(loadedProject.projectData.tracks[0].id);
      }
    }
  }, [loadedProject, selectedTrackId, setProjectDataWithHistory]);

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
    mutationFn: async (data: { prompt: string; trackType: 'midi' | 'audio' }) => {
      const { data: result, error } = await supabase.functions.invoke('ai-music-generation', {
        body: data
      });
      
      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'AI generation failed');
      
      return result;
    },
    onSuccess: (data) => {
      setProjectData(prev => {
        if (!prev) return null;
        const newData = { ...prev, tracks: [...prev.tracks, data.newTrack] };
        undoRedoControls.pushState(newData, `AI generated track: ${data.newTrack.name}`);
        return newData;
      });
      toast.success(data.message || `AI generated a new track!`);
    },
    onError: (error: any) => {
      console.error('AI Generation Error:', error);
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

  // Track Generation Handler
  const handleTrackGenerated = useCallback((trackData: any) => {
    console.log('Track generated in DAW:', trackData);
    
    if (!projectData) {
      toast.error("No project loaded", { description: "Create or load a project first." });
      return;
    }

    // Create a new track from the generated data
    const newTrack: DawTrackV2 = {
      id: `track_${Date.now()}`,
      type: 'audio' as const, // Voice-generated tracks are audio
      name: trackData.name || 'AI Generated Track',
      clips: trackData.audioUrl ? [{
        id: `clip_${Date.now()}`,
        startTime: 0,
        duration: 4, // Default duration, will be updated when audio loads
        audioUrl: trackData.audioUrl,
        name: trackData.name || 'Generated Audio'
      }] : [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: false,
      color: trackData.metadata?.genre === 'Amapiano' ? 'bg-purple-500' : 'bg-green-500',
      automationLanes: [],
      recordings: [],
      metadata: trackData.metadata // Store BPM, key, etc.
    } as DawTrackV2;

    const newData = { ...projectData, tracks: [...projectData.tracks, newTrack] };
    undoRedoControls.pushState(newData, `AI Generated: ${newTrack.name}`);
    setProjectData(newData);
    
    toast.success(`🎵 Track "${newTrack.name}" added to project!`, {
      description: `${trackData.metadata?.bpm || 118} BPM • ${trackData.metadata?.key || 'F#m'}`
    });
  }, [projectData, undoRedoControls]);

  // Check for pending generated tracks on mount
  useEffect(() => {
    const checkPendingTrack = () => {
      const pendingTrack = localStorage.getItem('pendingGeneratedTrack');
      if (pendingTrack && projectData) {
        try {
          const trackData = JSON.parse(pendingTrack);
          localStorage.removeItem('pendingGeneratedTrack');
          
          // Add the track to the current project
          handleTrackGenerated(trackData);
          toast.success(`🎵 Imported "${trackData.name}" from Generator!`);
        } catch (error) {
          console.error('Failed to import pending track:', error);
          localStorage.removeItem('pendingGeneratedTrack');
        }
      }
    };
    
    // Check on mount and when project data changes
    checkPendingTrack();
  }, [projectData, handleTrackGenerated]);

  const handleAIGenerate = (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for the AI assistant.");
      return;
    }
    toast.info(`🤖 AI Assistant: Generating content for "${prompt}"`);
    aiGenerateMutation.mutate({ prompt, trackType: 'midi' });
  };

  const updateTrack = useCallback((trackId: string, updates: { name?: string; isArmed?: boolean }) => {
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, ...updates } as DawTrackV2 : t)
      };
      if (updates.name) {
        undoRedoControls.pushState(newData, `Renamed track to "${updates.name}"`);
      }
      return newData;
    });
  }, [undoRedoControls]);

  const updateMixer = useCallback((trackId: string, updates: Partial<DawTrack['mixer']>) => {
    setProjectData(prev => {
      if (!prev) return null;
      const newTracks = prev.tracks.map(t => t.id === trackId ? { ...t, mixer: { ...t.mixer, ...updates } } as DawTrackV2 : t);
      
      // Update audio engine volume in real-time
      if (updates.volume !== undefined) {
        setTrackVolume(trackId, updates.volume);
      }

      const newData = { ...prev, tracks: newTracks };
      // Only push state for significant changes (not volume adjustments)
      if (updates.isMuted !== undefined || updates.isSolo !== undefined) {
        const track = prev.tracks.find(t => t.id === trackId);
        if (track) {
          const action = updates.isMuted ? 'muted' : updates.isSolo ? 'soloed' : 'unmuted';
          undoRedoControls.pushState(newData, `Track "${track.name}" ${action}`);
        }
      }
      return newData;
    });
  }, [setTrackVolume, undoRedoControls]);

  const handleAddTrack = (instrument?: { name: string, type: string, color: string }) => {
    if (!projectData) return;

    const defaultInstrument = { name: "New Audio Track", type: "audio", color: "bg-gray-500" };
    const inst = instrument || defaultInstrument;

    // All instruments can be MIDI tracks in Amapiano production
    const isMidiTrack = true;
    
    console.log('DAW: Adding track with instrument:', inst);
    
    const newTrack: DawTrackV2 = isMidiTrack ? {
      id: `track_${Date.now()}`,
      type: 'midi' as const,
      name: inst.name,
      instrument: inst.name,
      clips: [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: false,
      color: inst.color,
      automationLanes: [],
    } as DawTrackV2 : {
      id: `track_${Date.now()}`,
      type: 'audio' as const,
      name: inst.name,
      clips: [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: false,
      color: inst.color,
      automationLanes: [],
      recordings: [],
    } as DawTrackV2;

    console.log('DAW: Created new track:', newTrack);

    const newData = { ...projectData, tracks: [...projectData.tracks, newTrack] };
    undoRedoControls.pushState(newData, `Added track: ${inst.name}`);
    setProjectData(newData);
    toast.success(`Track "${inst.name}" added.`);
  };

  const handleRemoveTrack = useCallback((trackId: string) => {
    setProjectData(prev => {
      if (!prev) return null;
      const trackToRemove = prev.tracks.find(t => t.id === trackId);
      if (trackToRemove) {
        toast.info(`Track "${trackToRemove.name}" removed.`);
        const newData = {
          ...prev,
          tracks: prev.tracks.filter(t => t.id !== trackId)
        };
        undoRedoControls.pushState(newData, `Removed track: ${trackToRemove.name}`);
        return newData;
      }
      return prev;
    });
  }, [undoRedoControls]);

  const handleAddEffectToTrack = useCallback(async (effectName: string) => {
    if (!selectedTrackId) {
      toast.error("No track selected", { description: "Please select a track to add an effect." });
      return;
    }
    
    // Add effect to audio engine
    await addTrackEffect(selectedTrackId, effectName as any);
    
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
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
      const track = prev.tracks.find(t => t.id === selectedTrackId);
      if (track && !track.mixer.effects.includes(effectName)) {
        undoRedoControls.pushState(newData, `Added ${effectName} to "${track.name}"`);
      }
      return newData;
    });
  }, [selectedTrackId, addTrackEffect, undoRedoControls]);

  const handleRemoveEffectFromTrack = useCallback((trackId: string, effectName: string) => {
    // Remove effect from audio engine
    const trackEffects = getTrackEffects(trackId);
    const effect = trackEffects.find(e => e.type === effectName);
    if (effect) {
      removeTrackEffect(trackId, effect.id);
    }
    
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => {
          if (t.id === trackId) {
            toast.info(`Effect "${effectName}" removed from track "${t.name}".`);
            return { ...t, mixer: { ...t.mixer, effects: t.mixer.effects.filter(e => e !== effectName) } };
          }
          return t;
        })
      };
      const track = prev.tracks.find(t => t.id === trackId);
      if (track) {
        undoRedoControls.pushState(newData, `Removed ${effectName} from "${track.name}"`);
      }
      return newData;
    });
  }, [getTrackEffects, removeTrackEffect, undoRedoControls]);

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

  const handleUpdateProjectSettings = useCallback((updatedData: Partial<DawProjectData>) => {
    if (projectData) {
      const newData = { ...projectData, ...updatedData };
      undoRedoControls.pushState(newData, 'Updated project settings');
      setProjectData(newData);
      if (updatedData.bpm) {
        setBpm(updatedData.bpm);
      }
      toast.info("Project settings updated. Don't forget to save!");
    }
  }, [projectData, setBpm, undoRedoControls]);

  // Audio Recording and Automation handlers
  const [trackRecordings, setTrackRecordings] = useState<{ [trackId: string]: AudioRecording[] }>({});
  
  const handleUpdateAutomation = useCallback((trackId: string, lanes: AutomationLane[]) => {
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId ? { ...t, automationLanes: lanes } as any : t
        )
      };
      undoRedoControls.pushState(newData, `Updated automation for track`);
      return newData;
    });
    toast.success('Automation updated');
  }, [undoRedoControls]);

  const handleRecording = useCallback((recording: AudioRecording) => {
    if (!projectData || !selectedTrackId) return;

    const selectedTrack = projectData.tracks.find(t => t.id === selectedTrackId) as DawTrackV2;
    if (!selectedTrack || selectedTrack.type !== 'audio') return;

    const newTrack = {
      ...selectedTrack,
      recordings: [...(selectedTrack.recordings || []), recording]
    };

    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => t.id === selectedTrackId ? newTrack : t)
    };

    undoRedoControls.pushState(newData, `Added recording to ${selectedTrack.name}`);
    setProjectData(newData);
    
    toast.success(`🎤 Recording added to "${selectedTrack.name}"`);
  }, [projectData, selectedTrackId, undoRedoControls]);

  // Plugin drop handler
  const handlePluginDrop = useCallback((pluginId: string, trackId: string) => {
    if (!projectData) return;

    const track = projectData.tracks.find(t => t.id === trackId);
    if (!track) return;

    try {
      // Create plugin instance
      const pluginInstance = createPluginInstance(pluginId, trackId);
      if (!pluginInstance) {
        toast.error('Failed to create plugin instance');
        return;
      }

      // For instrument plugins, update the track's instrument (only for MIDI tracks)
      if (track.type === 'midi') {
        let instrumentName = (track as any).instrument || 'Unknown';
        let trackName = track.name;
        
        // Get plugin manifest to get the name
        const plugin = installedPlugins.find(p => p.id === pluginId);
        const pluginName = plugin?.name || pluginId || 'Unknown Plugin';
        
        // Map specific plugins to instruments
        if (pluginId === 'aura-808-log-drum') {
          instrumentName = 'Aura 808 Log Drum';
          trackName = track.name === 'New MIDI Track' ? 'Aura 808 Log Drums' : track.name;
        } else if (pluginId === 'builtin-synthesizer') {
          instrumentName = 'PolyWave Synthesizer';
          trackName = track.name === 'New MIDI Track' ? 'PolyWave Synth' : track.name;
        } else {
          // For approved plugins, use the plugin name
          instrumentName = pluginName;
          trackName = track.name === 'New MIDI Track' ? pluginName : track.name;
        }

        const updatedTrack = {
          ...track,
          instrument: instrumentName,
          name: trackName
        } as DawTrackV2;

        const newData = {
          ...projectData,
          tracks: projectData.tracks.map(t => t.id === trackId ? updatedTrack : t)
        };

        undoRedoControls.pushState(newData, `Added ${pluginName} to ${track.name}`);
        setProjectData(newData);
      }
      
      const plugin = installedPlugins.find(p => p.id === pluginId);
      const pluginDisplayName = plugin?.name || pluginId || 'Unknown Plugin';
      toast.success(`🔌 ${pluginDisplayName} added to ${track.name}!`);
    } catch (error) {
      console.error('Failed to create plugin instance:', error);
      toast.error('Failed to add plugin to track');
    }
  }, [projectData, createPluginInstance, undoRedoControls]);

  const handleAddAutomationLane = useCallback((trackId: string, parameterName: string, parameterType: string) => {
    setProjectData(prev => {
      if (!prev) return null;
      const track = prev.tracks.find(t => t.id === trackId);
      if (!track) return prev;

      const newLane: AutomationLane = {
        id: `lane_${Date.now()}`,
        parameterName,
        parameterType,
        isEnabled: true,
        points: [],
        color: '#3b82f6',
        projectId: '', // Will be set when saved to database
        trackId
      };

      const updatedTrack = { 
        ...track, 
        automationLanes: [...((track as any).automationLanes || []), newLane]
      } as any;

      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? updatedTrack : t)
      };
      undoRedoControls.pushState(newData, `Added ${parameterName} automation lane`);
      return newData;
    });
    toast.success(`Added ${parameterName} automation lane`);
  }, [undoRedoControls]);

  const handleRemoveAutomationLane = useCallback((trackId: string, laneId: string) => {
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId ? { 
            ...t, 
            automationLanes: ((t as any).automationLanes || []).filter((lane: any) => lane.id !== laneId)
          } as any : t
        )
      };
      undoRedoControls.pushState(newData, `Removed automation lane`);
      return newData;
    });
    toast.success('Automation lane removed');
  }, [undoRedoControls]);

  const handleSaveRecording = useCallback(async (trackId: string, recording: AudioRecording) => {
    // Save recording to local state
    setTrackRecordings(prev => ({
      ...prev,
      [trackId]: [...(prev[trackId] || []), recording]
    }));

    // Add recording as an audio clip to the track (only for audio tracks)
    setProjectData(prev => {
      if (!prev) return null;
      
      const track = prev.tracks.find(t => t.id === trackId);
      if (!track || track.type !== 'audio') return prev; // Only add to audio tracks
      
      const audioClip = {
        id: recording.id,
        name: recording.name,
        startTime: 0, // Place at beginning, user can move it
        duration: recording.duration,
        audioUrl: recording.audioUrl,
        volume: 1,
        fadeIn: 0,
        fadeOut: 0
      };

      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId && t.type === 'audio' ? { ...t, clips: [...t.clips, audioClip] } : t
        )
      };
      undoRedoControls.pushState(newData, `Added recording "${recording.name}"`);
      return newData;
    });

    toast.success(`Recording "${recording.name}" added to track`);
  }, [undoRedoControls]);

  const handleDeleteRecording = useCallback((trackId: string, recordingId: string) => {
    setTrackRecordings(prev => ({
      ...prev,
      [trackId]: (prev[trackId] || []).filter(r => r.id !== recordingId)
    }));
    
    // Also remove the clip from the track if it exists
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => {
          if (t.id === trackId) {
            return { ...t, clips: t.clips.filter(c => c.id !== recordingId) } as DawTrack;
          }
          return t;
        })
      };
      undoRedoControls.pushState(newData, `Removed recording`);
      return newData;
    });
    
    toast.success('Recording deleted');
  }, [undoRedoControls]);

  const getTrackRecordings = useCallback((trackId: string): AudioRecording[] => {
    return trackRecordings[trackId] || [];
  }, [trackRecordings]);
  const handleClipDuplicate = useCallback((clipId: string) => {
    const track = projectData?.tracks.find(t => t.clips.some(c => c.id === clipId));
    if (!track) return;
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const duplicatedClip = {
      ...clip,
      id: `clip_${Date.now()}`,
      name: `${clip.name} Copy`,
      startTime: clip.startTime + clip.duration
    } as any;
    
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === track.id ? { ...t, clips: [...t.clips, duplicatedClip] } as DawTrack : t
        )
      };
      undoRedoControls.pushState(newData, `Duplicated clip "${clip.name}"`);
      return newData;
    });
    toast.success(`Clip "${clip.name}" duplicated`);
  }, [projectData, undoRedoControls]);

  const handleClipSplit = useCallback((clipId: string, position: number) => {
    const track = projectData?.tracks.find(t => t.clips.some(c => c.id === clipId));
    if (!track) return;
    
    const clipIndex = track.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return;
    
    const clip = track.clips[clipIndex];
    const splitPoint = position - clip.startTime;
    
    if (splitPoint <= 0 || splitPoint >= clip.duration) return;
    
    const firstPart = { ...clip, duration: splitPoint };
    const secondPart = {
      ...clip,
      id: `clip_${Date.now()}`,
      name: `${clip.name} (2)`,
      startTime: position,
      duration: clip.duration - splitPoint,
      ...('notes' in clip ? {
        notes: (clip as any).notes.filter((note: any) => note.startTime >= splitPoint)
          .map((note: any) => ({ ...note, startTime: note.startTime - splitPoint }))
      } : {})
    } as any;
    
    setProjectData(prev => {
      if (!prev) return null;
      const newClips = [...track.clips];
      newClips[clipIndex] = firstPart;
      newClips.push(secondPart);
      
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === track.id ? { ...t, clips: newClips } as DawTrack : t
        )
      };
      undoRedoControls.pushState(newData, `Split clip "${clip.name}"`);
      return newData;
    });
    toast.success(`Clip "${clip.name}" split`);
  }, [projectData, undoRedoControls]);

  const handleClipDelete = useCallback((clipId: string) => {
    const track = projectData?.tracks.find(t => t.clips.some(c => c.id === clipId));
    if (!track) return;
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;
    
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === track.id ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } as DawTrack : t
        )
      };
      undoRedoControls.pushState(newData, `Deleted clip "${clip.name}"`);
      return newData;
    });
    toast.success(`Clip "${clip.name}" deleted`);
  }, [projectData, undoRedoControls]);

  const handleUpdateClip = useCallback((trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => {
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
        ...prev,
        tracks: prev.tracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
            };
          }
          return t;
        })
      };
      // Only push state on final update (not during drag)
      if (!dragState.isDragging) {
        const track = prev.tracks.find(t => t.id === trackId);
        const clip = track?.clips.find(c => c.id === clipId);
        if (track && clip) {
          undoRedoControls.pushState(newData, `Updated clip "${clip.name}" in "${track.name}"`);
        }
      }
      return newData;
    });
  }, [dragState.isDragging, undoRedoControls]);

  const handleUpdateNotes = useCallback((trackId: string, clipId: string, newNotes: MidiNote[]) => {
    setProjectData(prev => {
      if (!prev) return null;
      const newData = {
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
      
      const track = prev.tracks.find(t => t.id === trackId);
      const clip = track?.clips.find(c => c.id === clipId);
      if (track && clip) {
        undoRedoControls.pushState(newData, `Updated notes in "${clip.name}"`);
      }
      return newData;
    });
  }, [undoRedoControls]);

  const onClipMouseDown = useCallback((e: React.MouseEvent, trackId: string, clipId: string, clip: any) => {
    const rect = timelineContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const resizeMargin = 8; // pixels from edge to trigger resize
    const edgeX = e.clientX - rect.left;
    const clipElement = e.currentTarget as HTMLElement;
    const clipRect = clipElement.getBoundingClientRect();
    const relativeX = e.clientX - clipRect.left;
    
    let dragType: 'move' | 'resize-left' | 'resize-right' = 'move';
    
    if (relativeX < resizeMargin) {
      dragType = 'resize-left';
    } else if (relativeX > clipRect.width - resizeMargin) {
      dragType = 'resize-right';
    }
    
    setDragState({
      isDragging: true,
      dragType,
      clipId,
      trackId,
      startX: edgeX,
      startTime: clip.startTime,
      startDuration: clip.duration
    });
    
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !timelineContainerRef.current) return;
    
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const deltaX = currentX - dragState.startX;
    const deltaTime = (deltaX / rect.width) * (32 * 100 / zoom[0]);
    
    if (dragState.dragType === 'move') {
      const newStartTime = Math.max(0, dragState.startTime + deltaTime);
      const snappedTime = Math.round(newStartTime * 4) / 4; // Snap to 16th notes
      handleUpdateClip(dragState.trackId!, dragState.clipId!, { startTime: snappedTime });
    } else if (dragState.dragType === 'resize-right' && dragState.startDuration) {
      const newDuration = Math.max(0.25, dragState.startDuration + deltaTime);
      const snappedDuration = Math.round(newDuration * 4) / 4;
      handleUpdateClip(dragState.trackId!, dragState.clipId!, { duration: snappedDuration });
    } else if (dragState.dragType === 'resize-left' && dragState.startDuration) {
      const newStartTime = Math.max(0, dragState.startTime + deltaTime);
      const deltaStartTime = newStartTime - dragState.startTime;
      const newDuration = Math.max(0.25, dragState.startDuration - deltaStartTime);
      
      const snappedStartTime = Math.round(newStartTime * 4) / 4;
      const snappedDuration = Math.round(newDuration * 4) / 4;
      
      handleUpdateClip(dragState.trackId!, dragState.clipId!, { 
        startTime: snappedStartTime, 
        duration: snappedDuration 
      });
    }
  }, [dragState, zoom, handleUpdateClip]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      clipId: null,
      trackId: null,
      startX: 0,
      startTime: 0,
    });
  }, []);


  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const previousState = undoRedoControls.undo();
    if (previousState) {
      setProjectData(previousState);
      toast.info("Undid last action");
    }
  }, [undoRedoControls]);

  const handleRedo = useCallback(() => {
    const nextState = undoRedoControls.redo();
    if (nextState) {
      setProjectData(nextState);
      toast.info("Redid last action");
    }
  }, [undoRedoControls]);

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

  if (projectsList && projectsList.projects && projectsList.projects.length === 0 && createDefaultProjectMutation.isPending) {
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Creating your first project..." /></div>;
  }

  if (createDefaultProjectMutation.isError) {
    return <div className="flex flex-col items-center justify-center h-full"><ErrorMessage error={createDefaultProjectMutation.error as Error} /></div>;
  }

  if (!activeProjectId || isLoadingProject || createDefaultProjectMutation.isPending) {
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Loading project..." /></div>;
  }

  if (isProjectError) {
    return <div className="flex flex-col items-center justify-center h-full"><ErrorMessage error={projectError as Error} /></div>;
  }

  if (!projectData) {
    console.log('DAW: No project data available, showing loading spinner');
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Initializing DAW..." /></div>;
  }

  if (!projectData.tracks || !Array.isArray(projectData.tracks)) {
    console.error('DAW: Invalid project data - tracks is not an array:', projectData);
    return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner message="Loading project data..." /></div>;
  }

  const totalDuration = (32 * 4 / projectData.bpm) * 60;
  const selectedTrack = projectData.tracks.find(t => t.id === selectedTrackId) as DawTrackV2 || null;

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
        <Button variant="outline" size="sm" onClick={() => setShowPianoRoll(!showPianoRoll)} disabled={!selectedTrackId}>
              <Piano className="w-4 h-4 mr-2" />
              Piano Roll
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEffects(!showEffects)} disabled={!selectedTrackId}>
              <Zap className="w-4 h-4 mr-2" />
              Effects
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAutomation(!showAutomation)} disabled={!selectedTrackId}>
              <Activity className="w-4 h-4 mr-2" />
              Automation
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAudioRecording(!showAudioRecording)} disabled={!selectedTrackId}>
              <Mic className="w-4 h-4 mr-2" />
              Record
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCommunity(!showCommunity)}>
              <Users className="w-4 h-4 mr-2" />
              Community
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPluginSidebar(!showPluginSidebar)} className={showPluginSidebar ? 'bg-primary/20 text-primary' : ''}>
              <Gamepad2 className="w-4 h-4 mr-2" />
              Plugins
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
              <TabsTrigger value="ai-assistant" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">AI Tools</TabsTrigger>
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

                {/* Voice-to-Music Engine */}
                <Card className="p-3 mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AudioWaveform className="w-4 h-4 text-purple-500" />
                      <h4 className="text-sm font-medium">Voice-to-Music Engine</h4>
                      <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-600 border-purple-500/30">
                        New
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Hum melodies, beatbox rhythms, or give voice commands to generate amapiano tracks instantly
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0" 
                    onClick={() => setShowVoiceToMusic(true)}
                  >
                    <Mic className="w-3 h-3 mr-2" />
                    Open Voice Engine ⚡
                  </Button>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={isRecording ? "bg-destructive text-destructive-foreground" : ""} 
                    onClick={() => {
                      if (selectedTrackId) {
                        setShowAudioRecording(true);
                      } else {
                        toast.error("Select a track first");
                      }
                    }}
                    disabled={!selectedTrackId}
                  >
                    <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-white animate-pulse" : "bg-destructive"}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentTime(t => Math.max(0, t - 5))}><SkipBack className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentTime(t => t + 5)}><SkipForward className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setIsLooping(!isLooping)} className={isLooping ? 'bg-primary/20 text-primary' : ''}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Undo/Redo Controls */}
                <UndoRedoControls 
                  undoRedoState={undoRedoControls.getState()} 
                  onUndo={handleUndo} 
                  onRedo={handleRedo} 
                />

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
                    <h3 className="font-semibold">Tracks ({projectData?.tracks.length || 0})</h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleAddTrack()} title={`Add Track (${projectData?.tracks.length || 0} tracks currently)`}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add ({projectData?.tracks.length || 0})
                      </Button>
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
                         <Button size="sm" variant="ghost" className="w-6 h-6 p-0" onClick={() => setShowAutomation(!showAutomation)} title="Automation"><Activity className="w-3 h-3" /></Button>
                       </div>
                       
                       {/* Show current instrument/plugin */}
                       {track.type === 'midi' && (track as any).instrument && (
                         <div className="mb-2">
                           <Badge variant="secondary" className="text-xs flex items-center gap-1">
                             <Gamepad2 className="w-3 h-3" />
                             {(track as any).instrument}
                           </Badge>
                         </div>
                       )}
                       <div className="flex items-center gap-2 text-xs mb-2">
                         <Button size="sm" variant={track.mixer.isMuted ? "destructive" : "outline"} className="w-8 h-6 text-xs" onClick={() => updateMixer(track.id, { isMuted: !track.mixer.isMuted })}>M</Button>
                         <Button size="sm" variant={track.mixer.isSolo ? "secondary" : "outline"} className="w-8 h-6 text-xs" onClick={() => updateMixer(track.id, { isSolo: !track.mixer.isSolo })}>S</Button>
                         {/* Plugin Controls Button */}
                         {track.type === 'midi' && (track as any).instrument && (track as any).instrument !== 'New MIDI Track' && (
                           <Button size="sm" variant="outline" className="w-8 h-6 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedTrackId(track.id); setShowVSTPlugins(true); }} title="Plugin Controls">
                             <Gamepad2 className="w-3 h-3" />
                           </Button>
                         )}
                         <div className="flex-1"><Slider value={[track.mixer.volume * 100]} onValueChange={([v]) => updateMixer(track.id, { volume: v / 100 })} /></div>
                         <span className="text-xs w-8 text-right text-muted-foreground">{Math.round(track.mixer.volume * 100)}</span>
                       </div>
                      {track.mixer?.effects && track.mixer.effects.length > 0 && (
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
                      {track.type === 'audio' && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = (track as any).clips?.find((c: any) => c.audioUrl)?.audioUrl || null;
                              if (!url) {
                                toast.error("No audio clip found on this track.");
                                return;
                              }
                              setImportAudioUrl(url);
                              setShowVoiceToMusic(true);
                            }}
                          >
                            Generate Amapiano Track
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline with Context Menu Integration */}
              <div 
                className="bg-muted/30 rounded-lg border overflow-hidden relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = e.dataTransfer.getData('application/json');
                  if (data) {
                    try {
                      const dropData = JSON.parse(data);
                      if (dropData.type === 'plugin' && selectedTrackId) {
                        handlePluginDrop(dropData.pluginId, selectedTrackId);
                      }
                    } catch (error) {
                      console.error('Failed to parse drop data:', error);
                    }
                  }
                }}
              >
                <OptimizedTimeline
                  tracks={projectData.tracks}
                  zoom={zoom[0]}
                  currentTime={currentTime}
                  dragState={dragState}
                  selectedTrackId={selectedTrackId}
                  onTrackSelect={setSelectedTrackId}
                  onClipUpdate={handleUpdateClip}
                  onClipDuplicate={handleClipDuplicate}
                  onClipSplit={handleClipSplit}
                  onClipDelete={handleClipDelete}
                  onDragStart={(e, trackId, clipId) => onClipMouseDown(e, trackId, clipId, {})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals and Panels */}
      <OpenProjectModal isOpen={isOpenProjectOpen} onClose={() => setIsOpenProjectOpen(false)} onLoadProject={setActiveProjectId} />
      {projectData && <ProjectSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} projectData={projectData} onSave={handleUpdateProjectSettings} />}
      {showMixer && projectData && (
        <OptimizedMixer 
          tracks={projectData.tracks} 
          masterVolume={projectData.masterVolume} 
          onClose={() => setShowMixer(false)} 
          onTrackVolumeChange={(trackId, volume) => {
            updateMixer(trackId, { volume });
          }} 
          onMasterVolumeChange={(volume) => {
            setProjectData({ ...projectData, masterVolume: volume });
            setMasterVolume(volume);
          }}
          audioLevels={audioLevels}
          masterLevels={masterLevels}
        />
      )}
      {showPianoRoll && selectedTrack && (
        <PianoRollPanel 
          selectedTrack={selectedTrack}
          onClose={() => setShowPianoRoll(false)}
          onUpdateNotes={handleUpdateNotes}
          audioContext={getAudioContext()}
          onPlayNote={playNote}
        />
      )}
      {showEffects && selectedTrackId && projectData && (
        <EffectsPanel
          trackId={selectedTrackId}
          trackName={projectData.tracks.find(t => t.id === selectedTrackId)?.name || 'Unknown Track'}
          effects={getTrackEffects(selectedTrackId)}
          onClose={() => setShowEffects(false)}
          onAddEffect={async (effectType) => {
            await handleAddEffectToTrack(effectType);
          }}
          onRemoveEffect={(effectId) => {
            const trackEffects = getTrackEffects(selectedTrackId);
            const effect = trackEffects.find(e => e.id === effectId);
            if (effect) {
              handleRemoveEffectFromTrack(selectedTrackId, effect.type);
            }
          }}
          onUpdateParam={(effectId, paramName, value) => {
            updateEffectParam(selectedTrackId, effectId, paramName, value);
          }}
        />
      )}
      
      {/* Automation Panel */}
      {showAutomation && selectedTrack && (
        <AutomationLanesPanel
          track={selectedTrack}
          currentTime={currentTime}
          zoom={zoom[0]}
          onClose={() => setShowAutomation(false)}
          onUpdateAutomation={handleUpdateAutomation}
          onAddAutomationLane={handleAddAutomationLane}
          onRemoveAutomationLane={handleRemoveAutomationLane}
        />
      )}
      
      {/* Audio Recording Panel */}
      {showAudioRecording && selectedTrackId && (
        <AudioRecordingPanel
          trackId={selectedTrackId}
          trackName={projectData.tracks.find(t => t.id === selectedTrackId)?.name || 'Unknown Track'}
          onClose={() => setShowAudioRecording(false)}
          onSaveRecording={handleSaveRecording}
          onDeleteRecording={handleDeleteRecording}
          recordings={getTrackRecordings(selectedTrackId)}
        />
      )}
      
      {/* Community Panel */}
      {showCommunity && (
        <CommunityPanel onClose={() => setShowCommunity(false)} />
      )}
      
      {/* VST Plugin Panel */}
      {showVSTPlugins && (
        <VSTPluginPanel
          audioContext={getAudioContext()}
          trackId={selectedTrackId || undefined}
          onClose={() => setShowVSTPlugins(false)}
        />
      )}
      
      {/* Virtual Instruments Panel */}
      {showVirtualInstruments && (
        <VirtualInstruments
          selectedInstrument={selectedTrackId ? (projectData?.tracks.find(t => t.id === selectedTrackId) as any)?.instrument : undefined}
          onInstrumentChange={(instrument) => {
            if (selectedTrackId) {
              updateTrack(selectedTrackId, { name: instrument });
            }
          }}
          onNotePlay={(note: string, velocity: number) => {
            const pitch = note === 'C4' ? 60 : 60; // Convert note to MIDI pitch
            playNote(pitch, velocity);
          }}
          className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg"
        />
      )}
      
      {/* Voice-to-Music Engine Modal */}
      {showVoiceToMusic && (
        <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold">Voice-to-Music Engine</h3>
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                AI-Powered
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setShowVoiceToMusic(false); setImportAudioUrl(null); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <VoiceToMusicEngine
              onTrackGenerated={handleTrackGenerated}
              className="max-w-4xl mx-auto"
              initialAudioUrl={importAudioUrl ?? undefined}
            />
          </div>
        </div>
      )}

      {/* MIDI Controller Panel */}
      {showMIDIController && (
        <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">MIDI Controller Setup</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowMIDIController(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground" />
              <h4 className="text-xl font-medium">MIDI Controller Integration</h4>
              <p className="text-muted-foreground max-w-md">
                Connect your MIDI controllers for hands-on control of your DAW. 
                Support for popular controllers like Akai MPK, Novation Launchkey, and more.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Auto-Detection</h5>
                  <p className="text-sm text-muted-foreground">Automatically detects connected MIDI devices</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Custom Mapping</h5>
                  <p className="text-sm text-muted-foreground">Map controls to any DAW parameter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Plugin Sidebar */}
      {showPluginSidebar && (
        <div className="fixed right-4 top-20 bottom-4 z-40">
          <PluginSidebar
            audioContext={getAudioContext()}
            onClose={() => setShowPluginSidebar(false)}
          />
        </div>
      )}
    </div>
  );
}