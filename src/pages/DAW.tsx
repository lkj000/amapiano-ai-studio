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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Play, Pause, Square, SkipBack, SkipForward, Volume2, Mic, Piano, Drum, Music, Settings, Save, FolderOpen, Wand2, Plus, Minus, RotateCcw, Layers, Sliders, Zap, Download, Upload, Loader2, X, Activity, TrendingUp, Users, Cpu, Gamepad2, AudioWaveform, Cable, BookOpen, Palette, ZoomIn
} from "lucide-react";
import { toast } from 'sonner';
import backend from '@/backend/client';
import type { DawProjectData, DawTrack, MidiNote, DragState, AudioRecording, AutomationLane, DawTrackV2, AudioClip, AudioTrack, MidiClip } from '@/types/daw';
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
import { useVSTPluginSystem } from '@/hooks/useVSTPluginSystem';
import type { VSTPluginManifest } from '@/hooks/useVSTPluginSystem';
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
import { cn } from '@/lib/utils';
import { AudioStartGate } from '@/components/AudioStartGate';
import { useTonePlayback } from '@/hooks/useTonePlayback';
import { MusicAnalysisTools } from '@/components/MusicAnalysisTools';
import { RealtimeCursors } from '@/components/RealtimeCursors';
import type { CursorData } from '@/components/RealtimeCursors';
import { useEnhancedCollaboration } from '@/hooks/useEnhancedCollaboration';
import { UnifiedAnalysisPanel } from '@/components/UnifiedAnalysisPanel';
import { AuraSidebar } from '@/components/aura/AuraSidebar';
import { PluginSidebar } from '@/components/PluginSidebar';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePluginSystem } from '@/hooks/usePluginSystem';
import { Sparkles } from 'lucide-react';
import { HighSpeedDAWEngine } from '@/components/HighSpeedDAWEngine';
import { GhostProducerMode } from '@/components/GhostProducerMode';
import { QuickArrangementAssistant } from '@/components/QuickArrangementAssistant';
import { AutoTimeStretchPanel } from '@/components/AutoTimeStretchPanel';
import { MIDIHumanizationPanel } from '@/components/MIDIHumanizationPanel';
import { WaveformVisualization } from '@/components/WaveformVisualization';
import { PercussionLayeringPanel } from '@/components/PercussionLayeringPanel';
import { BassLayeringPanel } from '@/components/BassLayeringPanel';
import { LogDrumDesignerPanel } from '@/components/LogDrumDesignerPanel';
import { TutorialIntegration } from '@/components/TutorialIntegration';
import FeatureToolbar from '@/components/daw/FeatureToolbar';
import { DAWMasteringPanel } from '@/components/daw/DAWMasteringPanel';
import { DAWModals } from '@/components/daw/DAWModals';
import { DAWAuthGuard } from '@/components/daw/DAWAuthGuard';
import { useDAWState } from '@/hooks/useDAWState';

import type { DawProjectDataV2 } from '@/types/daw';

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

  const defaultProjectData: DawProjectDataV2 = {
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
    automationLanes: [],
    samples: [],
  };

interface DawPageProps {
  user: User | null;
}

// Inner DAW component that uses hooks (only rendered when authenticated)
function DAWContent({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const { isFeatureEnabled } = useFeatureFlags(user);

  // Centralized UI state from Zustand store
  const {
    selectedTrackId, setSelectedTrackId,
    selectedNotes, setSelectedNotes,
    selectedRegion, setSelectedRegion,
    selectedInstruments, setSelectedInstruments,
    showPianoRoll, showMixer, showEffects, showAutomation,
    showAudioRecording, showCommunity, showVSTPlugins, showMIDIController,
    showAIAssistant, showVoiceToMusic, showAdvancedPatterns,
    showArtistStyleTransfer, showVirtualInstruments, showRealtimeAI,
    showAIModelRouter, showVoiceAIGuide, showRAGKnowledge,
    showRealTimeCollab, showAIMarketplace, showMusicAnalysis,
    showUnifiedAnalysis, showAuraSidebar, showPluginSidebar,
    showHighSpeedEngine, showGhostProducer, showTutorials, showMastering,
    showCursorTracking, isAuraSidebarMinimized,
    isRecording, setIsRecording,
    pianoRollIsPlaying, setPianoRollIsPlaying,
    pianoRollTime, setPianoRollTime,
    audioGateVisible, setAudioGateVisible,
    isSettingsOpen, setIsSettingsOpen,
    isOpenProjectOpen, setIsOpenProjectOpen,
    zoom, setZoom,
    aiPrompt, setAiPrompt,
    importAudioUrl, setImportAudioUrl,
    dragState, setDragState, resetDragState,
    togglePanel, setPanel,
    // Panel setters
    setShowPianoRoll, setShowMixer, setShowEffects, setShowAutomation,
    setShowAudioRecording, setShowCommunity, setShowVSTPlugins, setShowMIDIController,
    setShowAIAssistant, setShowVoiceToMusic, setShowAdvancedPatterns,
    setShowArtistStyleTransfer, setShowVirtualInstruments, setShowRealtimeAI,
    setShowAIModelRouter, setShowVoiceAIGuide, setShowRAGKnowledge,
    setShowRealTimeCollab, setShowAIMarketplace, setShowMusicAnalysis,
    setShowUnifiedAnalysis, setShowAuraSidebar, setShowPluginSidebar,
    setShowHighSpeedEngine, setShowGhostProducer, setShowTutorials, setShowMastering,
    setShowCursorTracking, setIsAuraSidebarMinimized,
  } = useDAWState();

  const pianoRollTimerRef = useRef<number | null>(null);
  const dawContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Project State
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [projectName, setProjectName] = useState("Untitled Project");
  const [projectData, setProjectData] = useState<DawProjectData | null>(null);
  const hasInitializedProjectDataRef = useRef(false);

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

  // Tone.js playback for real audio (alongside existing engine for compatibility)
  const tonePlayback = useTonePlayback(projectData);

  useEffect(() => {
    if (sessionStorage.getItem('audioContextStarted') === 'true') {
      setAudioGateVisible(false);
      // Safe to initialize Tone in same session without user gesture
      tonePlayback.initialize().catch(() => {});
    }
  }, [tonePlayback, setAudioGateVisible]);

  // Listen for Suno import events from the generator modal
  useEffect(() => {
    const handleSunoImport = (e: Event) => {
      const { id, title, audioUrl, duration } = (e as CustomEvent).detail;
      if (!projectData) return;
      const newTrack = {
        id: `suno-${id || Date.now()}`,
        type: 'audio' as const,
        name: title || 'Suno Import',
        clips: [{ id: `clip-${Date.now()}`, name: title, startTime: 0, duration: duration || 180, audioUrl }],
        mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
        isArmed: false,
        color: 'bg-amber-500',
        automationLanes: [],
      };
      setProjectData({ ...projectData, tracks: [...projectData.tracks, newTrack] } as any);
      toast.success(`"${title}" added as audio track`);
    };
    window.addEventListener('suno:import-to-daw', handleSunoImport);
    return () => window.removeEventListener('suno:import-to-daw', handleSunoImport);
  }, [projectData, setProjectData]);

  const handleAudioStart = useCallback(async () => {
    try {
      await tonePlayback.initialize();
      setAudioGateVisible(false);
      toast.success('Audio engine started!');
    } catch (error) {
      toast.error('Failed to start audio engine');
      console.error(error);
    }
  }, [tonePlayback]);

  // Real-time automation playback - apply automation values during playback
  useEffect(() => {
    if (!tonePlayback.isPlaying || !projectData) return;
    
    const applyAutomation = () => {
      const currentBeat = tonePlayback.currentTime;
      
      projectData.tracks.forEach((track) => {
        const trackV2 = track as DawTrackV2;
        if (!trackV2.automationLanes) return;
        
        trackV2.automationLanes.forEach((lane) => {
          if (!lane.isEnabled || lane.points.length === 0) return;
          
          const points = [...lane.points].sort((a, b) => a.time - b.time);
          
          // Find interpolated value at current time
          let value = points[0]?.value || 0;
          
          if (currentBeat <= points[0].time) {
            value = points[0].value;
          } else if (currentBeat >= points[points.length - 1].time) {
            value = points[points.length - 1].value;
          } else {
            for (let i = 0; i < points.length - 1; i++) {
              if (currentBeat >= points[i].time && currentBeat < points[i + 1].time) {
                const t = (currentBeat - points[i].time) / (points[i + 1].time - points[i].time);
                value = points[i].value + t * (points[i + 1].value - points[i].value);
                break;
              }
            }
          }
          
          // Apply to Tone.js based on parameter type
          if (lane.parameterType === 'volume') {
            tonePlayback.setTrackVolume(track.id, value);
          } else if (lane.parameterType === 'pan') {
            tonePlayback.setTrackPan(track.id, (value - 0.5) * 2); // Convert 0-1 to -1 to 1
          }
        });
      });
    };
    
    // Apply automation at 30fps for smooth parameter changes
    const intervalId = setInterval(applyAutomation, 33);
    
    return () => clearInterval(intervalId);
  }, [tonePlayback.isPlaying, tonePlayback.currentTime, projectData, tonePlayback]);

  // Plugin System
  const { createPluginInstance, installedPlugins } = usePluginSystem(getAudioContext());
  
  // VST Plugin System
  const vstPluginSystem = useVSTPluginSystem(getAudioContext());

  // Enhanced Collaboration with Cursor Tracking
  const collaboration = useEnhancedCollaboration(
    activeProjectId || 'default-project',
    (projectData || defaultProjectData) as DawProjectDataV2
  );

  // Convert collaboration cursors to RealtimeCursors format
  const cursorMap = new Map<string, CursorData>();
  collaboration.userCursors.forEach(cursor => {
    cursorMap.set(cursor.userId, {
      userId: cursor.userId,
      userName: cursor.userName,
      color: cursor.color,
      position: { x: cursor.position.x, y: cursor.position.y },
      lastUpdate: cursor.position.timestamp,
    });
  });

  // Start cursor tracking when collaboration is active
  React.useEffect(() => {
    if (showCursorTracking && showRealTimeCollab) {
      collaboration.startCursorTracking();
    } else {
      collaboration.stopCursorTracking();
    }
  }, [showCursorTracking, showRealTimeCollab, collaboration]);

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

  // Reset initial load guard when switching projects
  useEffect(() => {
    hasInitializedProjectDataRef.current = false;
  }, [activeProjectId]);

  // Step 5: Sync loaded data into local state for editing
  useEffect(() => {
    console.log('DAW: loadedProject useEffect - loadedProject:', loadedProject);
    if (loadedProject && !hasInitializedProjectDataRef.current) {
      console.log('DAW: loadedProject.projectData:', loadedProject.projectData);
      console.log('DAW: loadedProject.projectData.tracks:', loadedProject.projectData?.tracks);
      
      // Filter out tracks with expired Replicate delivery URLs (they return 404)
      const validTracks = loadedProject.projectData.tracks.filter(track => {
        const clip = (track as any).clips?.[0];
        if (clip?.audioUrl && clip.audioUrl.includes('replicate.delivery')) {
          console.warn(`DAW: Removing track "${(track as any).name}" — expired Replicate URL`);
          return false;
        }
        return true;
      });

      // Migrate old track data to V2 format with automationLanes
      const migratedProjectData = {
        ...loadedProject.projectData,
        tracks: validTracks.map(track => ({
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
      // Prevent overwriting local edits on refetch
      hasInitializedProjectDataRef.current = true;
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
    console.log('[DAW] Track generated:', trackData);
    
    if (!projectData) {
      toast.error("No project loaded", { description: "Create or load a project first." });
      return;
    }

    let newTrack: DawTrackV2;
    
    // Check if this is a MIDI track (from voice-to-music with MIDI data)
    if (trackData.type === 'midi' && trackData.midiData) {
      // Create a MIDI track that Tone.js will synthesize
      const notes = Array.isArray(trackData.midiData) ? trackData.midiData : [];
      const maxEndTime = notes.length > 0 
        ? Math.max(...notes.map((n: any) => (n.startTime || 0) + (n.duration || 1)))
        : 8;
      
      newTrack = {
        id: `track_${Date.now()}`,
        type: 'midi' as const,
        name: trackData.name || 'AI Generated MIDI',
        instrument: 'Piano', // Default to piano, can be changed
        clips: [{
          id: `clip_${Date.now()}`,
          startTime: 0,
          duration: Math.max(maxEndTime, 4),
          name: trackData.name || 'Generated MIDI',
          notes: notes
        }],
        mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
        isArmed: false,
        color: 'bg-cyan-500',
        automationLanes: [],
        recordings: [],
        metadata: trackData.metadata
      } as DawTrackV2;
      
      console.log('[DAW] Created MIDI track with', notes.length, 'notes');
    } else {
      // Create an audio track
      newTrack = {
        id: `track_${Date.now()}`,
        type: 'audio' as const,
        name: trackData.name || 'AI Generated Track',
        clips: trackData.audioUrl ? [{
          id: `clip_${Date.now()}`,
          startTime: 0,
          duration: 16,
          audioUrl: trackData.audioUrl,
          name: trackData.name || 'Generated Audio'
        }] : [],
        mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
        isArmed: false,
        color: trackData.metadata?.genre === 'Amapiano' ? 'bg-purple-500' : 'bg-green-500',
        automationLanes: [],
        recordings: [],
        metadata: trackData.metadata
      } as DawTrackV2;
    }

    const newData = { ...projectData, tracks: [...projectData.tracks, newTrack] };
    undoRedoControls.pushState(newData, `AI Generated: ${newTrack.name}`);
    setProjectData(newData);
    
    // Notify user
    if (newTrack.type === 'midi') {
      const noteCount = newTrack.clips[0] && 'notes' in newTrack.clips[0] 
        ? (newTrack.clips[0] as any).notes?.length || 0 
        : 0;
      toast.success(`🎹 MIDI Track "${newTrack.name}" added!`, {
        description: `${noteCount} notes • ${trackData.metadata?.bpm || 118} BPM • ${trackData.metadata?.key || 'F#m'} • Press Play to hear!`
      });
    } else if (trackData.audioUrl) {
      toast.success(`🎵 Track "${newTrack.name}" added!`, {
        description: `${trackData.metadata?.bpm || 118} BPM • ${trackData.metadata?.key || 'F#m'} • Loading audio...`
      });
      console.log('[DAW] Audio track added with URL, Tone.js will pre-load it:', trackData.audioUrl);
    } else {
      toast.success(`🎵 Track "${newTrack.name}" added to project!`, {
        description: `${trackData.metadata?.bpm || 118} BPM • ${trackData.metadata?.key || 'F#m'}`
      });
    }
  }, [projectData, undoRedoControls]);

  // Check for pending generated tracks on mount
  useEffect(() => {
    const checkPendingTrack = () => {
      console.log('[DAW] Checking for pending track...');
      const pendingTrack = localStorage.getItem('pendingGeneratedTrack');
      console.log('[DAW] pendingGeneratedTrack:', pendingTrack);
      if (pendingTrack) {
        try {
          const trackData = JSON.parse(pendingTrack);
          localStorage.removeItem('pendingGeneratedTrack');
          
          // If no project exists, create a new one first
          if (!projectData) {
            console.log('DAW: Creating new project for pending track from Samples');
            const newProject: DawProjectData = {
              bpm: trackData.metadata?.bpm || 118,
              keySignature: trackData.metadata?.key || 'F#m',
              tracks: [],
              masterVolume: 0.8,
            };
            setProjectData(newProject);
            setProjectName("New Project");
            // Re-queue the pending track to be processed after state update
            setTimeout(() => {
              localStorage.setItem('pendingGeneratedTrack', JSON.stringify(trackData));
            }, 100);
            return;
          }
          
          // Add the track to the current project
          handleTrackGenerated(trackData);
          toast.success(`🎵 Imported "${trackData.name}" from Samples!`);
        } catch (error) {
          console.error('Failed to import pending track:', error);
          localStorage.removeItem('pendingGeneratedTrack');
        }
      }
      
      // Check for pending DAW import from GeneratedTrackPanel
      const pendingDAW = localStorage.getItem('pendingDAWTrack');
      if (pendingDAW) {
        try {
          const data = JSON.parse(pendingDAW);
          localStorage.removeItem('pendingDAWTrack');
          
          // If no project exists, create a new one first
          if (!projectData) {
            console.log('DAW: Creating new project for pending DAW track');
            const newProject: DawProjectData = {
              bpm: data.metadata?.bpm || 118,
              keySignature: data.metadata?.key || 'F#m',
              tracks: [],
              masterVolume: 0.8,
            };
            setProjectData(newProject);
            setProjectName("New Project");
            // Re-queue the pending track
            setTimeout(() => {
              localStorage.setItem('pendingDAWTrack', JSON.stringify(data));
            }, 100);
            return;
          }
          
          handleTrackGenerated({
            name: data.metadata?.style || 'Imported Track',
            audioUrl: data.url,
            metadata: data.metadata,
          });
          toast.success('🎛️ Track loaded into DAW');
        } catch (e) {
          console.error('Failed to import pending DAW track:', e);
          localStorage.removeItem('pendingDAWTrack');
        }
      }

      // Import stems from SourceSeparationEngine
      const pendingImport = localStorage.getItem('pendingDAWImport');
      if (pendingImport) {
        try {
          const data = JSON.parse(pendingImport);
          localStorage.removeItem('pendingDAWImport');

          // Ensure project exists
          if (!projectData) {
            const newProject: DawProjectData = {
              bpm: 118,
              keySignature: 'F#m',
              tracks: [],
              masterVolume: 0.8,
            };
            setProjectData(newProject);
            setProjectName('New Project');
            setTimeout(() => localStorage.setItem('pendingDAWImport', JSON.stringify(data)), 100);
            return;
          }

          console.log('[DAW] Importing stems with audio URLs:', data.stems);

          // Create audio tracks with actual clips containing audioUrl
          const newTracks = data.stems.map((s: any, idx: number) => {
            const trackId = `track_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
            const clips: AudioClip[] = [];

            // If stem has audioUrl, create a clip for it
            if (s.audioUrl) {
              clips.push({
                id: `clip_${Date.now()}_${idx}`,
                name: s.name,
                startTime: 0,
                duration: 16, // Default 16 beats, will adjust on load
                audioUrl: s.audioUrl,
              });
            }

            return {
              id: trackId,
              type: 'audio' as const,
              name: s.name,
              clips,
              mixer: { volume: (s.volume ?? 80) / 100, pan: 0, isMuted: false, isSolo: false, effects: [] },
              isArmed: false,
              color: s.color || 'bg-green-500',
              automationLanes: [],
              recordings: [],
              metadata: { instrument: s.instrument }
            };
          });

          setProjectData(prev => prev ? { ...prev, tracks: [...prev.tracks, ...newTracks] } : prev);
          
          const stemsWithAudio = data.stems.filter((s: any) => s.audioUrl).length;
          toast.success(`🎚️ Imported ${newTracks.length} stems (${stemsWithAudio} with audio) into DAW`);
        } catch (e) {
          console.error('Failed to import stems:', e);
          localStorage.removeItem('pendingDAWImport');
        }
      }

      // Check for pending MIDI import from Voice-to-MIDI
      const pendingMIDI = localStorage.getItem('pendingMIDIImport');
      if (pendingMIDI) {
        try {
          const midiData = JSON.parse(pendingMIDI);
          console.log('DAW: Found pending MIDI import:', midiData);
          localStorage.removeItem('pendingMIDIImport');
          
          // If no project exists, create a new one first
          if (!projectData) {
            console.log('DAW: Creating new project for pending MIDI');
            const newProject: DawProjectData = {
              bpm: 118,
              keySignature: 'F#m',
              tracks: [],
              masterVolume: 0.8,
            };
            setProjectData(newProject);
            setProjectName("New Project");
            // Re-queue the pending MIDI
            setTimeout(() => {
              localStorage.setItem('pendingMIDIImport', JSON.stringify(midiData));
            }, 100);
            return;
          }
          
          // Convert the recorded MIDI notes to DAW format
          const notes: MidiNote[] = midiData.notes.map((note: any, index: number) => ({
            id: `note_${Date.now()}_${index}`,
            pitch: note.note,
            velocity: note.velocity,
            startTime: ((note.timestamp - midiData.notes[0].timestamp) / 1000) * (projectData.bpm / 60), // ms -> sec -> beats
            duration: Math.max(0.25, (note.duration / 1000) * (projectData.bpm / 60)) // ms -> sec -> beats
          }));
          
          console.log(`DAW: Converted ${notes.length} notes from voice recording`);
          
          // Create a new MIDI clip
          const newClip: MidiClip = {
            id: `clip_${Date.now()}`,
            name: midiData.name,
            startTime: 0,
            duration: Math.max(...notes.map(n => n.startTime + n.duration), 4),
            notes
          };
          
          // Create a new track
          const newTrack: DawTrackV2 = {
            id: `track_${Date.now()}`,
            type: 'midi',
            name: midiData.name,
            instrument: 'Piano',
            clips: [newClip],
            mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
            isArmed: false,
            color: 'bg-cyan-500',
            automationLanes: [],
          } as DawTrackV2;
          
          const newData = { 
            ...projectData, 
            tracks: [...projectData.tracks, newTrack]
          };
          undoRedoControls.pushState(newData, `Imported Voice MIDI: ${midiData.name}`);
          setProjectData(newData);
          setSelectedTrackId(newTrack.id);
          
          // Auto-save the track immediately to prevent data loss
          console.log('DAW: Auto-saving voice-to-MIDI track...');
          saveMutation.mutate({
            name: projectName,
            projectData: newData,
            projectId: activeProjectId
          });
          
          toast.success(`🎹 Imported ${notes.length} notes from voice recording!`);
        } catch (error) {
          console.error('Failed to import pending MIDI:', error);
          localStorage.removeItem('pendingMIDIImport');
        }
      }
    };
    
    // Check on mount and when project data becomes available
    console.log('[DAW] useEffect running, projectData:', projectData ? 'exists' : 'null');
    if (projectData) {
      checkPendingTrack();
      
      // Also check for pending layers import from LANDR Layers
      const pendingLayersImport = localStorage.getItem('pendingLayersImport');
      if (pendingLayersImport) {
        try {
          const importData = JSON.parse(pendingLayersImport);
          localStorage.removeItem('pendingLayersImport');
          
          // Check if import is recent (within 5 minutes)
          if (Date.now() - importData.timestamp < 300000) {
            console.log('[DAW] Importing layers from LANDR Layers:', importData);
            
            const newTracks: DawTrackV2[] = [];
            
            // Add original track if available
            if (importData.originalTrack?.audioUrl) {
              const originalTrack: DawTrackV2 = {
                id: `track_${Date.now()}_original`,
                type: 'audio' as const,
                name: importData.originalTrack.name || 'Original',
                clips: [{
                  id: `clip_${Date.now()}_original`,
                  name: importData.originalTrack.name || 'Original',
                  startTime: 0,
                  duration: 60, // Will be updated when audio loads
                  audioUrl: importData.originalTrack.audioUrl
                }] as AudioClip[],
                mixer: { volume: 0.7, pan: 0, isMuted: false, isSolo: false, effects: [] },
                isArmed: false,
                color: 'bg-gray-500',
                automationLanes: [],
                recordings: [],
              } as DawTrackV2;
              newTracks.push(originalTrack);
            }
            
            // Add each layer as an audio track
            for (const layer of importData.layers) {
              if (!layer.audioUrl) continue;
              
              const colorMap: Record<string, string> = {
                drums: 'bg-orange-500',
                bass: 'bg-purple-500',
                harmony: 'bg-blue-500',
                texture: 'bg-green-500',
                melody: 'bg-pink-500',
              };
              
              const layerTrack: DawTrackV2 = {
                id: `track_${Date.now()}_${layer.type}`,
                type: 'audio' as const,
                name: layer.name,
                clips: [{
                  id: `clip_${Date.now()}_${layer.type}`,
                  name: layer.name,
                  startTime: 0,
                  duration: 60,
                  audioUrl: layer.audioUrl
                }] as AudioClip[],
                mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
                isArmed: false,
                color: colorMap[layer.type] || 'bg-cyan-500',
                automationLanes: [],
                recordings: [],
              } as DawTrackV2;
              newTracks.push(layerTrack);
            }
            
            if (newTracks.length > 0) {
              const newData = {
                ...projectData,
                tracks: [...projectData.tracks, ...newTracks]
              };
              undoRedoControls.pushState(newData, `Imported ${newTracks.length} tracks from LANDR Layers`);
              setProjectData(newData);
              
              // Auto-save
              saveMutation.mutate({
                name: projectName,
                projectData: newData,
                projectId: activeProjectId
              });
              
              toast.success(`🎹 Imported ${newTracks.length} tracks from LANDR Layers!`);
            }
          }
        } catch (error) {
          console.error('Failed to import layers:', error);
          localStorage.removeItem('pendingLayersImport');
        }
      }
    }
  }, [projectData]);

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
        tonePlayback.setTrackVolume(trackId, updates.volume);
      }

      // Update Tone.js pan in real-time
      if (updates.pan !== undefined) {
        tonePlayback.setTrackPan(trackId, updates.pan);
        console.log(`[DAW] Track ${trackId} pan: ${updates.pan} (REAL Tone.js)`);
      }

      // Update Tone.js mute/solo in real-time
      if (updates.isMuted !== undefined) {
        tonePlayback.setTrackMute(trackId, updates.isMuted);
        console.log(`[DAW] Track ${trackId} mute: ${updates.isMuted} (REAL Tone.js)`);
      }
      if (updates.isSolo !== undefined) {
        tonePlayback.setTrackSolo(trackId, updates.isSolo);
        console.log(`[DAW] Track ${trackId} solo: ${updates.isSolo} (REAL Tone.js)`);
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
  }, [setTrackVolume, tonePlayback, undoRedoControls]);

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

  const handleUploadAudio = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,.wav,.ogg,.m4a,.aac,.flac,.aiff,.wma';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        toast.info('Loading audio file...');
        
        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
          toast.error('File too large. Maximum size is 100MB.');
          return;
        }
        
        // Create object URL for the audio file
        const audioUrl = URL.createObjectURL(file);
        
        // Create an audio element to get duration
        const audio = new Audio(audioUrl);
        
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener('loadedmetadata', () => resolve());
          audio.addEventListener('error', (err) => {
            reject(new Error('Failed to load audio'));
          });
        });
        
        const durationInBeats = (audio.duration / 60) * projectData.bpm * 4; // Convert seconds to beats
        
        // Create a new audio clip
        const newClip: AudioClip = {
          id: `audio-clip-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          startTime: 0,
          duration: durationInBeats,
          audioUrl: audioUrl
        };
        
        // Create a new audio track
        const newTrack: AudioTrack = {
          id: `track-${Date.now()}`,
          type: 'audio',
          name: file.name.replace(/\.[^/.]+$/, ''),
          clips: [newClip],
          mixer: {
            volume: 0.75,
            pan: 0,
            isMuted: false,
            isSolo: false,
            effects: []
          },
          isArmed: false,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        };
        
        // Add track to project
        setProjectData(prev => ({
          ...prev,
          tracks: [...prev.tracks, newTrack]
        }));
        
        toast.success(`Audio file "${file.name}" imported successfully!`, {
          description: `Duration: ${audio.duration.toFixed(2)}s`
        });
        
      } catch (error) {
        console.error('Audio import error:', error);
        toast.error('Failed to import audio file', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
    
    input.click();
  };

  const handleImportMIDI = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mid,.midi,.project,.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        console.log('DAW: Importing file:', file.name);
        
        // Check if it's an audio file (WAV, FLAC, MP3, etc.)
        if (file.name.match(/\.(wav|flac|mp3|ogg|aac)$/i)) {
          toast.info('This is an audio file. Use "Upload Audio" instead.');
          console.log('DAW: Audio file detected, use audio upload instead');
          return;
        }
        
        // Check if it's a JSON file (possibly from audio-to-midi converter)
        if (file.name.endsWith('.json')) {
          toast.info('Loading converted MIDI data...');
          const text = await file.text();
          const jsonData = JSON.parse(text);
          
          console.log('DAW: Loaded JSON MIDI data:', jsonData);
          
          // Check if this is our converted MIDI format
          // Handle both: direct array of notes OR object with notes property
          const notesArray = Array.isArray(jsonData) ? jsonData : jsonData.notes;
          
          if (notesArray && Array.isArray(notesArray) && notesArray.length > 0 && 
              (notesArray[0].pitch !== undefined || notesArray[0].note !== undefined)) {
            const notes = notesArray.map((n: any, idx: number) => ({
              id: n.id || `note_${Date.now()}_${idx}`,
              pitch: n.pitch ?? n.note ?? 60,
              velocity: n.velocity ?? 100,
              startTime: n.startTime ?? (n.timestamp ? n.timestamp / 1000 : 0),
              duration: n.duration ?? 0.5
            }));
            
            const maxTime = notes.length > 0 
              ? Math.max(...notes.map((n: any) => n.startTime + n.duration))
              : 4;
            
            const newClip: MidiClip = {
              id: `clip_${Date.now()}`,
              name: file.name.replace('.json', ''),
              startTime: 0,
              duration: maxTime,
              notes: notes as MidiNote[]
            };
            
            const newTrack: DawTrackV2 = {
              id: `track_${Date.now()}`,
              name: `Converted MIDI`,
              type: 'midi',
              instrument: 'Piano',
              clips: [newClip],
              mixer: {
                volume: 0.8,
                pan: 0,
                isMuted: false,
                isSolo: false,
                effects: []
              },
              isArmed: false,
              color: `hsl(${Math.random() * 360}, 70%, 50%)`,
              automationLanes: []
            };
            
            const updatedProjectData = {
              ...projectData,
              tracks: [...projectData.tracks, newTrack]
            };
            
            setProjectData(updatedProjectData);
            undoRedoControls.pushState(updatedProjectData, 'Imported converted MIDI');
            
            toast.success(`Imported ${notes.length} notes from converted MIDI`);
            console.log('DAW: Imported converted MIDI with', notes.length, 'notes');
            return;
          }
          
          // Otherwise treat as project file
          const projectJson = jsonData;
          if (projectJson.tracks) {
            const newProjectData: DawProjectData = {
              bpm: projectJson.bpm || 120,
              keySignature: projectJson.key || 'C',
              timeSignature: '4/4',
              masterVolume: 0.8,
              tracks: projectJson.tracks?.map((t: any, idx: number) => ({
                id: t.id || `track_${Date.now()}_${idx}`,
                name: t.name || `Track ${idx + 1}`,
                type: t.type || 'audio',
                clips: t.clips || [],
                mixer: {
                  volume: t.volume ?? 0.8,
                  pan: t.pan ?? 0,
                  isMuted: false,
                  isSolo: false,
                  effects: []
                },
                isArmed: false,
                color: t.color || `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
                automationLanes: [],
                ...(t.type === 'midi' ? { instrument: t.instrument || 'Piano' } : { recordings: [] })
              })) || []
            };
            
            setProjectData(newProjectData);
            undoRedoControls.pushState(newProjectData, 'Imported JSON project');
            
            toast.success(`Project loaded successfully`);
            return;
          }
          
          toast.error('Unrecognized JSON format');
          return;
        }
        
        // Check if it's a project file
        if (file.name.endsWith('.project')) {
          toast.info('Loading project file...');
          const text = await file.text();
          const projectJson = JSON.parse(text);
          
          console.log('DAW: Loaded project data:', projectJson);
          
          // Convert project JSON to DAW format with proper mixer structure
          const newProjectData: DawProjectData = {
            bpm: projectJson.bpm || 120,
            keySignature: projectJson.key || 'C',
            timeSignature: '4/4',
            masterVolume: 0.8,
            tracks: projectJson.tracks?.map((t: any, idx: number) => {
              const baseTrack = {
                id: t.id || `track_${Date.now()}_${idx}`,
                name: t.name || `Track ${idx + 1}`,
                type: t.type || 'audio',
                clips: [],
                mixer: {
                  volume: t.volume ?? 0.8,
                  pan: t.pan ?? 0,
                  isMuted: false,
                  isSolo: false,
                  effects: []
                },
                isArmed: false,
                color: t.color || `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
                automationLanes: []
              };
              
              // Add type-specific properties
              if (t.type === 'midi') {
                return {
                  ...baseTrack,
                  instrument: t.instrument || 'Piano'
                } as DawTrackV2;
              } else {
                return {
                  ...baseTrack,
                  recordings: []
                } as DawTrackV2;
              }
            }) || []
          };
          
          setProjectData(newProjectData);
          undoRedoControls.pushState(newProjectData, 'Imported project file');
          
          toast.success(`Project "${projectJson.name}" loaded successfully`);
          return;
        }
        
        // Otherwise parse as MIDI
        toast.info('Parsing MIDI file...');
        
        const { parseMIDIFile, convertToDAWFormat } = await import('@/lib/midiParser');
        const parsedMIDI = await parseMIDIFile(file);
        
        console.log('DAW: Parsed MIDI:', parsedMIDI);
        
        if (parsedMIDI.tracks.length === 0) {
          toast.error('No MIDI data found in file');
          return;
        }
        
        // Collect all new tracks to add at once
        const newTracks: DawTrackV2[] = [];
        let totalNotes = 0;
        
        // Import each track that has notes
        for (let i = 0; i < parsedMIDI.tracks.length; i++) {
          if (parsedMIDI.tracks[i].length === 0) {
            console.log(`DAW: Skipping empty track ${i}`);
            continue;
          }
          
          const { notes, bpm: detectedBpm } = convertToDAWFormat(parsedMIDI, i);
          console.log(`DAW: Track ${i} has ${notes.length} notes`);
          totalNotes += notes.length;
          
          // Create a new MIDI clip
          const newClip: MidiClip = {
            id: `clip_${Date.now()}_${i}`,
            name: `${file.name} - Track ${i + 1}`,
            startTime: 0,
            duration: Math.max(...notes.map(n => n.startTime + n.duration)),
            notes: notes as MidiNote[]
          };
          
          // Create new track
          const newTrack: DawTrackV2 = {
            id: `track_${Date.now()}_${i}`,
            type: 'midi',
            name: `${file.name.replace('.mid', '').replace('.midi', '')} ${parsedMIDI.tracks.length > 1 ? `- Track ${i + 1}` : ''}`.trim(),
            instrument: 'Piano',
            clips: [newClip],
            mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
            isArmed: false,
            color: `bg-purple-${500 + (i % 3) * 100}`,
            automationLanes: [],
          } as DawTrackV2;
          
          newTracks.push(newTrack);
        }
        
        if (newTracks.length === 0) {
          toast.error('No valid MIDI tracks found');
          return;
        }
        
        console.log(`DAW: Adding ${newTracks.length} tracks with ${totalNotes} total notes`);
        
        // Add all tracks at once
        const newData = { 
          ...projectData!, 
          tracks: [...projectData!.tracks, ...newTracks],
          ...(parsedMIDI.bpm && { bpm: parsedMIDI.bpm })
        };
        
        // Use the proper setter that handles both state and undo/redo
        setProjectDataWithHistory(newData, `Imported MIDI: ${file.name}`);
        
        if (parsedMIDI.bpm) {
          setBpm(parsedMIDI.bpm);
        }
        
        // Select the first imported track
        if (newTracks.length > 0) {
          setSelectedTrackId(newTracks[0].id);
        }
        
        toast.success(`🎹 Imported ${newTracks.length} track(s) with ${totalNotes} notes`);
        
      } catch (error) {
        console.error('DAW: MIDI import error:', error);
        toast.error('Failed to import MIDI file', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
    
    input.click();
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
    
    // Apply automation values to Tone.js in real-time
    lanes.forEach(lane => {
      if (!lane.isEnabled || lane.points.length === 0) return;
      
      // Get interpolated value at current time
      const currentBeat = currentTime;
      const points = lane.points.sort((a, b) => a.time - b.time);
      
      // Find the two points surrounding current time
      let value = points[0]?.value || 0;
      for (let i = 0; i < points.length - 1; i++) {
        if (currentBeat >= points[i].time && currentBeat < points[i + 1].time) {
          // Linear interpolation between points
          const t = (currentBeat - points[i].time) / (points[i + 1].time - points[i].time);
          value = points[i].value + t * (points[i + 1].value - points[i].value);
          break;
        } else if (currentBeat >= points[points.length - 1].time) {
          value = points[points.length - 1].value;
        }
      }
      
      // Apply to Tone.js based on parameter type
      if (lane.parameterType === 'volume') {
        tonePlayback.setTrackVolume(trackId, value);
        console.log(`[DAW Automation] Track ${trackId} volume: ${value.toFixed(2)} (REAL Tone.js)`);
      } else if (lane.parameterType === 'pan') {
        tonePlayback.setTrackPan(trackId, (value - 0.5) * 2); // Convert 0-1 to -1 to 1
        console.log(`[DAW Automation] Track ${trackId} pan: ${((value - 0.5) * 2).toFixed(2)} (REAL Tone.js)`);
      }
    });
    
    toast.success('Automation updated');
  }, [undoRedoControls, currentTime, tonePlayback]);

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
  const handlePluginDrop = useCallback(async (pluginId: string, trackId: string) => {
    if (!projectData) return;

    const track = projectData.tracks.find(t => t.id === trackId);
    if (!track) return;

    try {
      // Create plugin instance in regular plugin system
      const pluginInstance = createPluginInstance(pluginId, trackId);
      if (!pluginInstance) {
        toast.error('Failed to create plugin instance');
        return;
      }

      // Bridge: ensure the VST system knows about this plugin ID
      const existingVst = vstPluginSystem.getVSTPlugin(pluginId);
      if (!existingVst) {
        const webPlugin = installedPlugins.find(p => p.id === pluginId);
        if (webPlugin) {
          const mappedParams = (webPlugin.parameters || []).map((p: any) => {
            const toFormat = (unit?: string) => {
              if (!unit) return 'raw';
              const u = String(unit).toLowerCase();
              if (u.includes('hz')) return 'hz';
              if (u.includes('db')) return 'db';
              if (u.includes('%')) return 'percentage';
              if (u.includes('s')) return 'seconds';
              return 'raw';
            };
            return {
              id: p.id,
              name: p.name,
              label: p.name,
              type: p.type === 'boolean' ? 'bool' : p.type,
              min: p.minValue ?? 0,
              max: p.maxValue ?? 1,
              default: p.defaultValue,
              unit: p.unit,
              options: p.options,
              automatable: Boolean(p.automatable),
              displayFormat: toFormat(p.unit),
            } as VSTPluginManifest['parameters'][number];
          });

          const mappedPresets = (webPlugin.presets || []).map((pr: any) => ({
            id: pr.id,
            name: pr.name,
            author: pr.author || webPlugin.author || 'Community',
            category: webPlugin.category || 'General',
            parameters: pr.parameters || {},
            tags: pr.tags || [],
          }));

          const mappedManifest: VSTPluginManifest = {
            id: webPlugin.id,
            name: webPlugin.name,
            vendor: webPlugin.author || 'Community',
            version: webPlugin.version || '1.0.0',
            type: 'VST3',
            format: webPlugin.type === 'instrument' ? 'instrument' : 'effect',
            latency: 64,
            parameters: mappedParams,
            presets: mappedPresets,
            category: webPlugin.category || 'General',
            description: webPlugin.description || webPlugin.name,
            website: webPlugin.website,
            price: typeof webPlugin.price === 'number' ? webPlugin.price : 0,
            rating: typeof webPlugin.rating === 'number' ? webPlugin.rating : undefined,
            downloads: typeof webPlugin.downloadCount === 'number' ? webPlugin.downloadCount : undefined,
            tags: webPlugin.tags || [],
            screenshots: webPlugin.screenshots || [],
            pluginPath: undefined,
            isNative: true,
            supportsWebAudio: true,
          };

          // Register with VST system
          vstPluginSystem.registerExternalPlugin(mappedManifest);
        }
      }

      // Also create VST plugin instance for advanced controls
      console.log('Creating VST instance for plugin:', pluginId, 'on track:', trackId);
      const vstInstanceId = await vstPluginSystem.createVSTInstance(pluginId, trackId);
      if (vstInstanceId) {
        console.log('VST instance created:', vstInstanceId);
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
  }, [projectData, createPluginInstance, installedPlugins, vstPluginSystem, undoRedoControls]);

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
    <>
      {/* Audio Start Gate - Required for autoplay policy */}
      {audioGateVisible && (
        <AudioStartGate onStart={handleAudioStart} />
      )}

      <div className="h-full flex flex-col text-foreground">
      {/* Header */}
      <div className="border-b border-border p-3 md:p-4">
        {/* Top row - Project info and essential actions */}
        <div className="flex items-center justify-between gap-2 mb-3 md:mb-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <Music className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
              <Input 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-base md:text-xl font-bold bg-transparent border-0 p-0 h-auto focus-visible:ring-0 min-w-0"
              />
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex">Professional DAW</Badge>
          </div>
          
          {/* Essential buttons - always visible */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="h-8 md:h-9">
              {saveMutation.isPending ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4" />}
              <span className="hidden sm:inline ml-2">Save</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="h-8 md:h-9">
              <Settings className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>

        {/* Second row - Tool buttons (wrapped on small screens) */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsOpenProjectOpen(true)} className="h-8">
            <FolderOpen className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Open</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8">
            <Download className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Export</span>
          </Button>
          
          <Separator orientation="vertical" className="h-6 hidden md:block" />
          
          {/* Feature Toolbar - responsive on all screens */}
          <div className="overflow-x-auto">
            <FeatureToolbar
              currentProject={projectData as DawProjectDataV2}
              onProjectUpdate={(data) => setProjectDataWithHistory(data as DawProjectData, 'Cloud update')}
              onLoadProject={(data) => setProjectDataWithHistory(data as DawProjectData, 'Project loaded from cloud')}
              onMidiGenerated={(midiNotes) => {
                if (projectData && selectedTrackId) {
                  const track = projectData.tracks.find(t => t.id === selectedTrackId);
                  if (track && track.type === 'midi') {
                    const updatedData = {
                      ...projectData,
                      tracks: projectData.tracks.map(t =>
                        t.id === selectedTrackId && t.type === 'midi'
                          ? { 
                              ...t, 
                              clips: [
                                ...t.clips, 
                                { 
                                  id: Date.now().toString(), 
                                  name: 'Generated MIDI',
                                  notes: midiNotes, 
                                  startTime: 0, 
                                  duration: 4 
                                }
                              ] 
                            }
                          : t
                      ),
                    };
                    setProjectDataWithHistory(updatedData, 'MIDI generated from audio');
                  }
                }
              }}
              projectId={activeProjectId}
              projectName={projectName}
              currentUser={{
                id: 'user-1',
                name: 'Producer',
                avatar: undefined,
              }}
              selectedNotes={selectedNotes}
              onNotesUpdate={(notes) => {
                setSelectedNotes(notes);
                toast.success('Notes updated with ML processing');
              }}
              selectedRegion={selectedRegion}
              onRegionChange={(region) => {
                setSelectedRegion(region);
                toast.info(`Regional style set to ${region}`);
              }}
              selectedInstruments={selectedInstruments}
              onInstrumentsChange={(instruments) => {
                setSelectedInstruments(instruments);
                toast.success(`${instruments.length} instrument(s) selected`);
              }}
            />
          </div>
          
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          
          {/* Primary tool buttons */}
          <Button variant="outline" size="sm" onClick={() => setShowMixer(!showMixer)} className="h-8">
            <Sliders className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Mixer</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPianoRoll(!showPianoRoll)} disabled={!selectedTrackId} className="h-8">
            <Piano className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Piano Roll</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEffects(!showEffects)} disabled={!selectedTrackId} className="h-8 hidden sm:inline-flex">
            <Zap className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Effects</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAudioRecording(!showAudioRecording)} disabled={!selectedTrackId} className="h-8 hidden sm:inline-flex">
            <Mic className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Record</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setShowMastering(!showMastering)} 
            className="h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          >
            <Wand2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Master</span>
          </Button>
          
          {/* More tools dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background z-50">
              <DropdownMenuItem onClick={() => setShowAutomation(!showAutomation)} disabled={!selectedTrackId}>
                <Activity className="w-4 h-4 mr-2" />
                Automation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCommunity(!showCommunity)}>
                <Users className="w-4 h-4 mr-2" />
                Community
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPluginSidebar(!showPluginSidebar)}>
                <Gamepad2 className="w-4 h-4 mr-2" />
                Plugins
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowGhostProducer(!showGhostProducer)}>
                <Zap className="w-4 h-4 mr-2" />
                Ghost Producer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTutorials(!showTutorials)}>
                <BookOpen className="w-4 h-4 mr-2" />
                Tutorials
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowMastering(!showMastering)}>
                <Wand2 className="w-4 h-4 mr-2" />
                Master & Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Sidebar - hidden on mobile, adjustable width on desktop */}
        <div className={cn(
          "hidden lg:block bg-muted/10 border-r border-border overflow-y-auto transition-all duration-200",
          showAIAssistant ? 'lg:w-80 xl:w-96' : 'lg:w-64 xl:w-72'
        )}>
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
                {/* High-Speed C++ Engine Status */}
                {showHighSpeedEngine && (
                  <div className="mb-4">
                    <HighSpeedDAWEngine 
                      onInitialized={() => console.log('✓ High-speed C++ engine ready')}
                      showMetrics={true}
                    />
                  </div>
                )}

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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowUnifiedAnalysis(!showUnifiedAnalysis)}
                    >
                      <Sparkles className="w-3 h-3 mr-2" />
                      AI Track Analysis
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Transport Controls - Premium Design */}
          <div className="border-b border-border/50 bg-gradient-to-r from-background via-muted/30 to-background">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 py-3 md:py-4 overflow-x-auto scrollbar-hide">
              {/* Left: Playback Controls */}
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <div className="flex items-center gap-1 sm:gap-1.5 bg-muted/40 rounded-xl p-1.5 sm:p-2 shadow-sm border border-border/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-background/80 rounded-lg"
                    onClick={() => setCurrentTime(t => Math.max(0, t - 5))}
                  >
                    <SkipBack className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-destructive/20 rounded-lg"
                    onClick={() => {
                      console.log('DAW Transport: Stop clicked (Tone.js)');
                      tonePlayback.stop();
                      stop(); // Keep legacy for levels/time display
                    }}
                  >
                    <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className={cn(
                      "h-9 w-9 sm:h-10 sm:w-10 rounded-lg shadow-md transition-all",
                      tonePlayback.isPlaying 
                        ? "bg-muted hover:bg-muted/80" 
                        : "bg-gradient-to-br from-primary via-primary to-primary/80 hover:shadow-lg hover:scale-105",
                      tonePlayback.isAudioLoading && "opacity-75"
                    )}
                    onClick={async () => {
                      console.log('DAW Transport: Play/Pause clicked (Tone.js)', { 
                        isPlaying: tonePlayback.isPlaying,
                        isAudioLoading: tonePlayback.isAudioLoading,
                        audioPlayerCount: tonePlayback.audioPlayerCount
                      });
                      if (tonePlayback.isPlaying) {
                        tonePlayback.pause();
                        pause(); // Keep legacy for levels/time display
                      } else {
                        if (tonePlayback.isAudioLoading) {
                          toast.info('⏳ Audio files are still loading...', { duration: 2000 });
                        }
                        await tonePlayback.play();
                        play(); // Keep legacy for levels/time display
                      }
                    }}
                    disabled={!tonePlayback.isReady && !audioGateVisible}
                  >
                    {tonePlayback.isAudioLoading ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    ) : tonePlayback.isPlaying ? (
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                    )}
                  </Button>
                  <Button 
                    variant={isRecording ? "destructive" : "ghost"}
                    size="icon"
                    className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-lg", isRecording && "animate-pulse")}
                    onClick={() => {
                      if (selectedTrackId) {
                        setShowAudioRecording(true);
                      } else {
                        toast.error("Select a track first");
                      }
                    }}
                    disabled={!selectedTrackId}
                  >
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isRecording ? "bg-white animate-pulse" : "bg-current"}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-background/80 rounded-lg"
                    onClick={() => setCurrentTime(t => t + 5)}
                  >
                    <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                <Button
                  variant={isLooping ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 sm:h-9 px-2 sm:px-4 rounded-lg",
                    isLooping && "bg-primary/20 hover:bg-primary/30 border border-primary/30"
                  )}
                  onClick={() => setIsLooping(!isLooping)}
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Loop</span>
                </Button>
              </div>

              {/* Center: Undo/Redo + Right: Controls */}
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Undo/Redo Controls - Hidden on mobile */}
                <div className="hidden md:block">
                  <UndoRedoControls 
                    undoRedoState={undoRedoControls.getState()} 
                    onUndo={handleUndo} 
                    onRedo={handleRedo} 
                  />
                </div>

                <Separator orientation="vertical" className="hidden md:block h-8" />

                <div className="flex items-center gap-2 sm:gap-2.5 bg-background/60 rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 border border-border/30 backdrop-blur-sm shadow-sm">
                  <Music className="h-3 w-3 sm:h-4 sm:w-4 text-primary/70" />
                  <span className="hidden sm:inline text-[10px] text-muted-foreground font-medium uppercase tracking-wide">BPM</span>
                  <div className="w-16 sm:w-24">
                    <Slider value={[projectData.bpm]} onValueChange={([v]) => handleUpdateProjectSettings({ bpm: v })} min={80} max={160} step={1} />
                  </div>
                  <span className="text-xs font-bold tabular-nums min-w-[32px]">{projectData.bpm}</span>
                </div>
                <div className="flex items-center gap-3 bg-background/60 rounded-xl px-4 py-2 border border-border/30 backdrop-blur-sm shadow-sm min-w-[140px]">
                  <Volume2 className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <Slider value={[projectData.masterVolume * 100]} onValueChange={([v]) => {
                      const newVolume = v / 100;
                      setProjectData({ ...projectData, masterVolume: newVolume });
                      setMasterVolume(newVolume);
                    }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums min-w-[28px]">{Math.round(projectData.masterVolume * 100)}</span>
                </div>
                <div className="flex items-center gap-3 bg-background/60 rounded-xl px-4 py-2 border border-border/30 backdrop-blur-sm shadow-sm min-w-[140px]">
                  <ZoomIn className="h-4 w-4 text-primary/70" />
                  <div className="flex-1"><Slider value={zoom} onValueChange={setZoom} min={25} max={400} step={25} /></div>
                  <span className="text-xs font-bold tabular-nums min-w-[36px]">{zoom[0]}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-auto bg-background" ref={timelineContainerRef}>
            <div className="h-full flex">
              {/* Track List */}
              <div className="w-80 border-r border-border/50 bg-muted/10 overflow-y-auto">
                <div className="p-3 border-b border-border/50 bg-background/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tracks ({projectData?.tracks.length || 0})
                    </h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7" onClick={() => handleAddTrack()} title="Add Track">
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleUploadAudio} title="Upload Audio"><Upload className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleImportMIDI} title="Import MIDI"><Piano className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {projectData.tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`p-3 border-b border-border/20 hover:bg-accent/5 transition-colors cursor-pointer group ${
                        selectedTrackId === track.id ? 'bg-accent/10' : ''
                      }`}
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-8 rounded-full bg-gradient-primary" />
                        <div className={`w-2 h-2 rounded-full ${track.color}`} />
                        <Input
                          value={track.name}
                          onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                          className="font-medium text-sm flex-1 border-0 p-0 h-auto bg-transparent focus-visible:ring-0"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(track.id);
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
                            updateTrack(track.id, { isArmed: !track.isArmed });
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full ${track.isArmed ? 'bg-destructive animate-pulse' : 'bg-muted-foreground'}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrackId(track.id);
                            setShowPianoRoll(true);
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
                            setShowAutomation(!showAutomation);
                          }}
                          title="Automation"
                        >
                          <Activity className="w-3 h-3" />
                        </Button>
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
      {/* Cursor Overlay Visualization */}
      {showCursorTracking && showRealTimeCollab && (
        <RealtimeCursors
          cursors={cursorMap}
          containerRef={dawContainerRef}
          showLabels={true}
        />
      )}

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
          onTrackPanChange={(trackId, pan) => {
            updateMixer(trackId, { pan });
          }}
          onMasterVolumeChange={(volume) => {
            setProjectData({ ...projectData, masterVolume: volume });
            setMasterVolume(volume);
            tonePlayback.setMasterVolume(volume);
          }}
          onMuteToggle={(trackId) => {
            const track = projectData.tracks.find(t => t.id === trackId);
            if (track) {
              updateMixer(trackId, { isMuted: !track.mixer.isMuted });
            }
          }}
          onSoloToggle={(trackId) => {
            const track = projectData.tracks.find(t => t.id === trackId);
            if (track) {
              updateMixer(trackId, { isSolo: !track.mixer.isSolo });
            }
          }}
          audioLevels={audioLevels}
          masterLevels={masterLevels}
        />
      )}
      {showPianoRoll && selectedTrack && (
        <> 
          {console.log('DAW: Opening PianoRollPanel for', { id: selectedTrack?.id, name: selectedTrack?.name, clips: selectedTrack?.clips?.map((c: any) => ('notes' in c ? (c.notes?.length || 0) : 0)) })}
          <PianoRollPanel 
            selectedTrack={selectedTrack}
            onClose={() => {
              if (pianoRollTimerRef.current) {
                clearInterval(pianoRollTimerRef.current);
                pianoRollTimerRef.current = null;
              }
              setPianoRollIsPlaying(false);
              setPianoRollTime(0);
              setShowPianoRoll(false);
            }}
            onUpdateNotes={handleUpdateNotes}
            audioContext={getAudioContext()}
            onPlayNote={(pitch, velocity, duration) => tonePlayback.playNote(pitch, velocity || 80, duration || 0.5, selectedTrack?.id)}
            onPlay={() => {
              if (selectedTrack?.type === 'midi') {
                const clip = selectedTrack.clips.find((c: any) => 'notes' in c && c.notes && c.notes.length > 0) as MidiClip | undefined;
                if (clip && 'notes' in clip) {
                  console.log('🎹 PianoRoll: onPlay START', { 
                    clipStartTime: clip.startTime,
                    notesCount: clip.notes.length,
                    trackInstrument: selectedTrack.instrument
                  });
                  
                  const endBeats = clip.notes.length > 0 ? Math.max(...clip.notes.map((n: any) => n.startTime + n.duration)) : 0;
                  const clipEndTime = (clip.startTime || 0) + endBeats;
                  
                  // Auto-solo selected track FIRST
                  setProjectData((prev: any) => {
                    if (!prev) return prev;
                    console.log('🎹 PianoRoll: Setting solo on track', selectedTrack.id);
                    return {
                      ...prev,
                      tracks: prev.tracks.map((t: any) => 
                        t.id === selectedTrack.id 
                          ? { ...t, mixer: { ...t.mixer, isSolo: true } }
                          : t
                      )
                    };
                  });
                  
                  // Wait for solo state update, then start transport
                  setTimeout(() => {
                    const startBeat = clip.startTime || 0;
                    console.log('🎹 PianoRoll: Starting transport at beat', startBeat);

                    setCurrentTime(startBeat);
                    tonePlayback.setPositionBeats(startBeat);

                    // Give a tick before starting transport
                    setTimeout(() => {
                      tonePlayback.play();
                      console.log('🎹 PianoRoll: Transport tonePlayback.play() called');
                    }, 10);
                    
                    // Clear any existing timer
                    if (pianoRollTimerRef.current) {
                      clearInterval(pianoRollTimerRef.current);
                    }
                    
                    // Use time-based stop
                    const startTimeMs = Date.now();
                    const durationMs = (endBeats / ((projectData?.bpm || 120) / 60)) * 1000;
                    
                    console.log('🎹 PianoRoll: Will stop after', durationMs, 'ms');
                    
                    pianoRollTimerRef.current = window.setInterval(() => {
                      const elapsedMs = Date.now() - startTimeMs;
                      if (elapsedMs >= durationMs) {
                        console.log('🎹 PianoRoll: Clip end reached, stopping');
                        tonePlayback.stop();
                        
                        // Unsolo track
                        setProjectData((prev: any) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            tracks: prev.tracks.map((t: any) => 
                              t.id === selectedTrack.id 
                                ? { ...t, mixer: { ...t.mixer, isSolo: false } }
                                : t
                            )
                          };
                        });
                        
                        if (pianoRollTimerRef.current) {
                          clearInterval(pianoRollTimerRef.current);
                          pianoRollTimerRef.current = null;
                        }
                      }
                    }, 100);
                  }, 50);
                }
              }
            }}
            onStop={() => {
              tonePlayback.stop();
              // Unsolo track on stop
              setProjectData((prev: any) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  tracks: prev.tracks.map((t: any) => 
                    t.id === selectedTrack?.id 
                      ? { ...t, mixer: { ...t.mixer, isSolo: false } }
                      : t
                  )
                };
              });
              if (pianoRollTimerRef.current) {
                clearInterval(pianoRollTimerRef.current);
                pianoRollTimerRef.current = null;
              }
              setPianoRollIsPlaying(false);
              setPianoRollTime(0);
            }}
            isPlaying={tonePlayback.isPlaying}
            currentTime={tonePlayback.currentTime}
          />
        </>
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
          vstPluginSystem={vstPluginSystem}
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
      
      {/* Unified AI Analysis Panel */}
      {showUnifiedAnalysis && (
        <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Music Analysis</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowUnifiedAnalysis(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <UnifiedAnalysisPanel 
              onAnalysisComplete={(result) => {
                console.log('✅ DAW track analysis complete:', result);
                toast.success('✨ AI analysis complete!');
              }}
              className="max-w-3xl mx-auto"
            />
          </div>
        </div>
      )}
      
      {/* Ghost Producer Mode */}
      {showGhostProducer && (
        <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Ghost Producer Mode</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowGhostProducer(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <GhostProducerMode
              onQuickGenerate={(preset, clientInfo) => {
                console.log('🚀 Ghost Producer: Quick generate', preset, clientInfo);
                toast.success(`Started ${preset.name} production`, {
                  description: `Client: ${clientInfo.name} | Delivery: ${clientInfo.deliveryTime}`
                });
                
                // Apply FULL preset settings to current project
                if (projectData && preset.settings) {
                  const updatedProject = {
                    ...projectData,
                    bpm: preset.settings.bpm,
                    keySignature: preset.settings.key || projectData.keySignature || 'Am',
                    timeSignature: preset.settings.timeSignature || projectData.timeSignature || '4/4'
                  };
                  
                  setProjectData(updatedProject);
                  setBpm(preset.settings.bpm);
                  
                  // Show detailed application feedback
                  toast.info('⚙️ Applying preset settings...', {
                    description: `BPM: ${preset.settings.bpm} | Key: ${preset.settings.key || 'Default'}`
                  });
                  
                  // Log all applied settings for debugging
                  console.log('📊 Applied preset settings:', {
                    bpm: preset.settings.bpm,
                    key: preset.settings.key,
                    logDrumPattern: preset.settings.logDrumPattern,
                    pianoStyle: preset.settings.pianoStyle,
                    bassType: preset.settings.bassType,
                    effects: preset.settings.effects,
                    clientInfo: clientInfo
                  });
                }
              }}
              onSaveTemplate={(template) => {
                console.log('💾 Template saved:', template);
                toast.success('Template saved to library');
              }}
              onExportStems={(stems) => {
                console.log('📦 Exporting stems:', stems);
                toast.success(`Exported ${stems.length} stems`);
              }}
              onSendToClient={(packageData) => {
                console.log('📧 Sending to client:', packageData);
                toast.success(`Package sent to ${packageData.clientName}`);
              }}
              currentProject={projectData}
              className="max-w-4xl mx-auto"
            />
            
            <div className="mt-6 space-y-6 max-w-4xl mx-auto">
              <WaveformVisualization />

              <QuickArrangementAssistant 
                onApplyArrangement={(template, intensity) => {
                  console.log('🎵 Applying arrangement:', template.name, 'Intensity:', intensity);
                  toast.success('Arrangement Applied', {
                    description: `${template.name} loaded with ${intensity}% intensity`
                  });
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <PercussionLayeringPanel 
                  onExport={(layers) => {
                    console.log('🥁 Exporting percussion:', layers);
                    toast.success('Percussion Exported');
                  }}
                />
                <BassLayeringPanel 
                  onExport={(config) => {
                    console.log('🔊 Exporting bass:', config);
                    toast.success('Bass Configuration Saved');
                  }}
                />
              </div>

              <LogDrumDesignerPanel 
                onExport={(settings) => {
                  console.log('🪘 Exporting log drum:', settings);
                  toast.success('Log Drum Preset Saved');
                }}
              />
              
              <AutoTimeStretchPanel 
                audioContext={getAudioContext()}
                onStretchComplete={(buffer, originalBPM, targetBPM, trackName) => {
                  console.log('⏱️ Time-stretch complete:', trackName, originalBPM, '->', targetBPM);
                  toast.success('Added to Timeline', {
                    description: `${trackName}: ${originalBPM}→${targetBPM} BPM`
                  });
                }}
                onAddToTimeline={(trackId, buffer, bpm) => {
                  console.log('🎵 Timeline track:', trackId, bpm);
                }}
              />
              
              <MIDIHumanizationPanel 
                audioContext={getAudioContext()}
                onHumanize={(settings) => {
                  console.log('🎹 MIDI humanized:', settings);
                  toast.success('MIDI Humanized');
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Tutorial Integration */}
      {showTutorials && (
        <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Tutorial Library</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowTutorials(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <TutorialIntegration
              contextHints={[
                selectedTrack?.type === 'midi' ? (selectedTrack as any).instrument || '' : '',
                selectedTrack?.name || '',
                'amapiano',
                'production'
              ]}
              className="max-w-4xl mx-auto"
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
      {/* Plugin Sidebar - hidden on mobile, right sidebar on desktop */}
      {showPluginSidebar && (
        <div className="hidden lg:block fixed right-4 top-20 bottom-4 z-40">
          <PluginSidebar
            audioContext={getAudioContext()}
            onClose={() => setShowPluginSidebar(false)}
          />
        </div>
      )}
      
      {/* Mastering Panel - Complete end-to-end workflow */}
      {showMastering && (
        <DAWMasteringPanel
          projectData={projectData}
          projectName={projectName}
          onClose={() => setShowMastering(false)}
          onMasterComplete={(masteredUrl) => {
            console.log('Master complete:', masteredUrl);
            toast.success('Mastering complete! Ready for release.');
          }}
        />
      )}
      
      {/* Central Modal Renderer */}
      <DAWModals />
    </div>
    </>
  );
}

// Wrapper component with auth guard - this fixes the React Hooks violation
// (hooks were previously called after a conditional return)
interface DawPageProps {
  user: User | null;
}

export default function DawPage({ user }: DawPageProps) {
  return (
    <DAWAuthGuard user={user}>
      <DAWContent user={user!} />
    </DAWAuthGuard>
  );
}